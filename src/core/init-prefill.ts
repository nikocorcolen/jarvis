import { readdir } from 'node:fs/promises';
import type { DetectedStack } from './detect-stack.js';

/**
 * Pure helpers used by `jarvis init` to inject detected values into
 * the steering templates. No I/O except `listTopLevelFolders`, which
 * only reads directory entries (no file contents).
 */

const IGNORED_FOLDERS: ReadonlySet<string> = new Set([
  'node_modules',
  'dist',
  'build',
  'target',
  'out',
  '.git',
]);

/**
 * Returns alphabetically sorted top-level folder names, excluding
 * the standard ignore list and any folder whose name starts with `.`.
 *
 * Bounded by NFR-001: callers can rely on this completing fast for
 * directories with up to 1000 top-level entries.
 */
export async function listTopLevelFolders(repoRoot: string): Promise<string[]> {
  let entries;
  try {
    entries = await readdir(repoRoot, { withFileTypes: true });
  } catch {
    return [];
  }

  const folders = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .filter((name) => !name.startsWith('.') && !IGNORED_FOLDERS.has(name));

  folders.sort((a, b) => a.localeCompare(b));
  return folders;
}

/**
 * Replaces a `<!-- TODO -->` marker that appears under a specific
 * heading prefix with the given replacement. If the heading or the
 * marker is not found, returns the input unchanged (graceful drift).
 *
 * Anchors are matched on the heading text plus the FIRST `<!-- TODO -->`
 * that appears after it. This keeps templates readable and lets us
 * pin behaviour with snapshot tests.
 */
function replaceTodoUnder(
  source: string,
  headingPrefix: string,
  replacement: string,
): string {
  const headingIdx = source.indexOf(headingPrefix);
  if (headingIdx === -1) return source;

  const todoIdx = source.indexOf('<!-- TODO -->', headingIdx);
  if (todoIdx === -1) return source;

  return source.slice(0, todoIdx) + replacement + source.slice(todoIdx + '<!-- TODO -->'.length);
}

/**
 * Replaces a single bullet whose label matches `bulletLabel` with a
 * pre-filled value. Format expected: `- **Label**: <!-- TODO -->`.
 * Used for tech.md section 1 (Stack), where each item is its own bullet.
 */
function replaceLabeledBullet(
  source: string,
  bulletLabel: string,
  value: string,
): string {
  // Match the line `- **Label**: <!-- TODO -->`, allowing arbitrary spacing.
  const pattern = new RegExp(
    `(- \\*\\*${escapeRegex(bulletLabel)}\\*\\*:)\\s*<!-- TODO -->`,
  );
  return source.replace(pattern, `$1 ${value}`);
}

function escapeRegex(literal: string): string {
  return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Pre-fills `tech.md` with detected stack info.
 *
 *  - Section 1 (Stack): bullets for Language, Runtime, Framework.
 *    Framework stays as TODO; we don't infer frameworks.
 *  - Section 2 (Key dependencies): up to 10 detected packages, each
 *    tagged "(detected, classify as load-bearing or replaceable)".
 *    The tag is deliberate friction: the human must revisit each entry.
 */
export function prefillTechMd(template: string, stack: DetectedStack): string {
  let out = template;

  if (stack.language) {
    out = replaceLabeledBullet(out, 'Language', stack.language);
  }
  if (stack.runtime) {
    out = replaceLabeledBullet(out, 'Runtime', stack.runtime);
  }
  // Framework: intentionally not pre-filled.

  if (stack.dependencies.length > 0) {
    const lines = stack.dependencies.map(
      (name) =>
        `- **${name}**: (detected, classify as load-bearing or replaceable)`,
    );
    const block = lines.join('\n');
    out = replaceTodoUnder(out, '## 2. Key dependencies', block);
  }

  return out;
}

/**
 * Pre-fills `structure.md` section 1 (Folder layout) with the
 * provided folder names as bullets. Each bullet starts the description
 * empty so the human fills it in.
 */
export function prefillStructureMd(
  template: string,
  topLevelFolders: string[],
): string {
  if (topLevelFolders.length === 0) return template;

  const lines = topLevelFolders.map((name) => `- \`${name}/\` — `);
  const block = lines.join('\n');
  return replaceTodoUnder(template, '## 1. Folder layout', block);
}

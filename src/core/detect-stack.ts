import { existsSync } from 'node:fs';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

export interface DetectedStack {
  language: string | null;
  runtime: string | null;
  /** Manifests found, in detection order (precedence-sorted). */
  manifests: string[];
  /** Up to 10 dependency names from the highest-precedence manifest. */
  dependencies: string[];
}

/**
 * Manifest precedence (FR-001). When multiple manifests exist, the first
 * match in this list determines `language` and `runtime`. The full list
 * of all matching manifests is still returned in `manifests`.
 */
interface ManifestRule {
  file: string;
  language: string;
  runtime: string;
  /** Optional reader for dependencies — only package.json supports this. */
  readDependencies?: (raw: string) => string[];
}

const MANIFEST_RULES: ManifestRule[] = [
  {
    file: 'package.json',
    language: 'TypeScript/JavaScript',
    runtime: 'Node.js',
    readDependencies: (raw) => {
      try {
        const parsed = JSON.parse(raw) as {
          dependencies?: Record<string, string>;
          devDependencies?: Record<string, string>;
        };
        return [
          ...Object.keys(parsed.dependencies ?? {}),
          ...Object.keys(parsed.devDependencies ?? {}),
        ];
      } catch {
        return [];
      }
    },
  },
  { file: 'pyproject.toml', language: 'Python', runtime: 'Python' },
  { file: 'go.mod', language: 'Go', runtime: 'Go' },
  { file: 'Cargo.toml', language: 'Rust', runtime: 'Rust' },
];

export const MAX_DEPENDENCIES = 10;

/**
 * Inspects `repoRoot` and returns a best-effort guess of its stack.
 * Only reads well-known manifests; never executes code.
 *
 * Precedence (FR-001): package.json > pyproject.toml > go.mod > Cargo.toml.
 * The first matching rule sets `language`/`runtime`; lower-precedence
 * matches still appear in `manifests` for visibility.
 */
export async function detectStack(repoRoot: string): Promise<DetectedStack> {
  const manifests: string[] = [];
  let language: string | null = null;
  let runtime: string | null = null;
  let dependencies: string[] = [];

  for (const rule of MANIFEST_RULES) {
    const path = join(repoRoot, rule.file);
    if (!existsSync(path)) continue;

    manifests.push(rule.file);

    // First match wins for language/runtime/deps.
    if (language === null) {
      language = rule.language;
      runtime = rule.runtime;
      if (rule.readDependencies) {
        try {
          const raw = await readFile(path, 'utf8');
          dependencies = rule.readDependencies(raw).slice(0, MAX_DEPENDENCIES);
        } catch {
          // Unreadable manifest: continue with empty deps.
        }
      }
    }
  }

  return { language, runtime, manifests, dependencies };
}

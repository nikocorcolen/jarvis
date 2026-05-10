import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * Loads a template shipped with the package.
 *
 * Templates live in `templates/` at the package root. We walk up from
 * the current module's directory until we find a folder containing
 * `templates/`. This is robust to different output layouts (dist/,
 * dist-tests/src/, etc.) so tests and the published package both work.
 */
function findTemplatesDir(): string {
  let current = dirname(fileURLToPath(import.meta.url));
  while (true) {
    const candidate = join(current, 'templates');
    if (existsSync(candidate)) return candidate;
    const parent = dirname(current);
    if (parent === current) {
      throw new Error(
        'Could not locate the templates/ directory. Expected it at the package root.',
      );
    }
    current = parent;
  }
}

const TEMPLATES_DIR = findTemplatesDir();

export type TemplateKind = 'spec' | 'steering';

/**
 * Reads a template file as a string.
 * @example loadTemplate('spec', 'requirements.md')
 */
export async function loadTemplate(
  kind: TemplateKind,
  name: string,
): Promise<string> {
  const path = join(TEMPLATES_DIR, kind, name);
  return readFile(path, 'utf8');
}

/** Exposed for tests and edge cases. */
export const __TEMPLATES_DIR__ = TEMPLATES_DIR;

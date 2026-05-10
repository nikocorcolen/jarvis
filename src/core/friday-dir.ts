import { existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';

/**
 * Walks up from `startDir` looking for a `.friday/` directory.
 * Returns its absolute path, or `null` if none is found before reaching root.
 *
 * Pure-ish: only reads `existsSync`. No mutation, no logging.
 */
export function locateFridayDir(startDir: string = process.cwd()): string | null {
  let current = resolve(startDir);

  while (true) {
    const candidate = join(current, '.friday');
    if (existsSync(candidate)) {
      return candidate;
    }
    const parent = dirname(current);
    if (parent === current) {
      // Reached filesystem root.
      return null;
    }
    current = parent;
  }
}

/**
 * Like `locateFridayDir` but throws a user-friendly error when missing.
 * Use from commands that require an existing Friday project.
 */
export function requireFridayDir(startDir?: string): string {
  const dir = locateFridayDir(startDir);
  if (!dir) {
    throw new FridayNotFoundError();
  }
  return dir;
}

export class FridayNotFoundError extends Error {
  override readonly name = 'FridayNotFoundError';
  constructor() {
    super('not in a Friday project. Run `friday init` at the repo root.');
  }
}

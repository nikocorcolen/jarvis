import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import type { JarvisConfig } from './types.js';

/**
 * Walks up from `startDir` looking for a `.jarvis/` directory.
 * Returns its absolute path, or `null` if none is found before reaching root.
 *
 * Pure-ish: only reads `existsSync`. No mutation, no logging.
 */
export function locateJarvisDir(startDir: string = process.cwd()): string | null {
  let current = resolve(startDir);

  while (true) {
    const candidate = join(current, '.jarvis');
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
 * Like `locateJarvisDir` but throws a user-friendly error when missing.
 * Use from commands that require an existing Jarvis project.
 */
export function requireJarvisDir(startDir?: string): string {
  const dir = locateJarvisDir(startDir);
  if (!dir) {
    throw new JarvisNotFoundError();
  }
  return dir;
}

export class JarvisNotFoundError extends Error {
  override readonly name = 'JarvisNotFoundError';
  constructor() {
    super('not in a Jarvis project. Run `jarvis init` at the repo root.');
  }
}

/**
 * Reads and parses the config.json file inside the Jarvis directory.
 * Safely falls back to defaults (e.g., lang: 'es') if the file is missing or malformed.
 */
export function readJarvisConfig(jarvisDir: string): JarvisConfig & { lang: 'en' | 'es' } {
  const configPath = join(jarvisDir, 'config.json');
  let lang: 'en' | 'es' = 'es'; // default

  if (!existsSync(configPath)) {
    return { formatVersion: 1, createdAt: '', createdBy: '', lang };
  }

  try {
    const raw = readFileSync(configPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<JarvisConfig>;
    if (parsed.lang === 'en' || parsed.lang === 'es') {
      lang = parsed.lang;
    }
    return {
      formatVersion: parsed.formatVersion ?? 1,
      createdAt: parsed.createdAt ?? '',
      createdBy: parsed.createdBy ?? '',
      lang,
    };
  } catch {
    return { formatVersion: 1, createdAt: '', createdBy: '', lang };
  }
}

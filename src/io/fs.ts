import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname } from 'node:path';

/**
 * Thin wrappers over `node:fs/promises`. Their job is to give the
 * rest of the code a single import surface and to add a couple of
 * convenience behaviours (auto-mkdir on write, exist checks).
 */

export async function readText(path: string): Promise<string> {
  return readFile(path, 'utf8');
}

export async function writeText(path: string, content: string): Promise<void> {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, content, 'utf8');
}

export async function ensureDir(path: string): Promise<void> {
  await mkdir(path, { recursive: true });
}

export function pathExists(path: string): boolean {
  return existsSync(path);
}

export async function readJson<T>(path: string): Promise<T> {
  const raw = await readText(path);
  return JSON.parse(raw) as T;
}

export async function writeJson(path: string, value: unknown): Promise<void> {
  await writeText(path, JSON.stringify(value, null, 2) + '\n');
}

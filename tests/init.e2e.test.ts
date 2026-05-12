import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, readFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../src/cli/commands/init.js';
import type { JarvisConfig } from '../src/core/types.js';

/**
 * Captures stdout/stderr while running an async block. We swap the
 * `write` methods on the underlying streams since the command writes
 * via `process.stdout.write` / `process.stderr.write` directly.
 */
async function capture<T>(
  block: () => Promise<T>,
): Promise<{ result: T; stdout: string; stderr: string }> {
  const originalOut = process.stdout.write.bind(process.stdout);
  const originalErr = process.stderr.write.bind(process.stderr);
  let stdout = '';
  let stderr = '';
  process.stdout.write = ((chunk: string | Uint8Array) => {
    stdout += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
    return true;
  }) as typeof process.stdout.write;
  process.stderr.write = ((chunk: string | Uint8Array) => {
    stderr += typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();
    return true;
  }) as typeof process.stderr.write;
  try {
    const result = await block();
    return { result, stdout, stderr };
  } finally {
    process.stdout.write = originalOut;
    process.stderr.write = originalErr;
  }
}

const FIXED_NOW = '2026-05-10T12:00:00.000Z';
const FIXED_CREATED_BY = 'jarvis-cli@test';

describe('jarvis init — empty project (T-007a, US-001)', () => {
  it('creates .jarvis/ with steering and config, no prompt on stdout', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-init-empty-'));
    try {
      const { result, stdout, stderr } = await capture(() =>
        run({
          cwd: dir,
          now: () => FIXED_NOW,
          createdBy: FIXED_CREATED_BY,
          lang: 'en',
        }),
      );

      assert.equal(result, 0);

      // Files exist.
      const jarvisDir = join(dir, '.jarvis');
      const steeringDir = join(jarvisDir, 'steering');
      for (const file of ['product.md', 'tech.md', 'structure.md']) {
        const content = await readFile(join(steeringDir, file), 'utf8');
        assert.match(content, /<!-- TODO -->/, `${file} should keep TODO markers`);
      }

      // config.json shape and values.
      const configRaw = await readFile(
        join(jarvisDir, 'config.json'),
        'utf8',
      );
      const config = JSON.parse(configRaw) as JarvisConfig;
      assert.equal(config.formatVersion, 1);
      assert.equal(config.createdAt, FIXED_NOW);
      assert.equal(config.createdBy, FIXED_CREATED_BY);

      // No bootstrap prompt on stdout.
      assert.equal(stdout, '', 'stdout should be empty for empty repos');

      // Stderr has success summary.
      assert.match(stderr, /Created/);
      assert.match(stderr, /No code detected/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('jarvis init — repo with package.json (T-007b, US-002)', () => {
  it('pre-fills tech.md, structure.md, prints bootstrap prompt to stdout', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-init-pkg-'));
    try {
      await writeFile(
        join(dir, 'package.json'),
        JSON.stringify({
          name: 'demo',
          dependencies: { commander: '^12', kleur: '^4' },
        }),
        'utf8',
      );
      await mkdir(join(dir, 'src'));
      await mkdir(join(dir, 'docs'));
      await mkdir(join(dir, 'node_modules')); // must be ignored

      const { result, stdout, stderr } = await capture(() =>
        run({
          cwd: dir,
          now: () => FIXED_NOW,
          createdBy: FIXED_CREATED_BY,
          lang: 'en',
        }),
      );

      assert.equal(result, 0);

      // tech.md was pre-filled.
      const tech = await readFile(
        join(dir, '.jarvis/steering/tech.md'),
        'utf8',
      );
      assert.match(tech, /\*\*Language\*\*: TypeScript\/JavaScript/);
      assert.match(tech, /\*\*Runtime\*\*: Node\.js/);
      assert.match(
        tech,
        /\*\*commander\*\*: \(detected, classify as load-bearing or replaceable\)/,
      );
      assert.match(tech, /\*\*kleur\*\*: \(detected, classify as load-bearing or replaceable\)/);

      // structure.md was pre-filled with the visible folders only.
      const structure = await readFile(
        join(dir, '.jarvis/steering/structure.md'),
        'utf8',
      );
      assert.match(structure, /- `docs\/` —/);
      assert.match(structure, /- `src\/` —/);
      assert.ok(
        !structure.includes('node_modules/'),
        'node_modules must not appear in structure.md',
      );

      // product.md was NOT pre-filled (asymmetry rule).
      const product = await readFile(
        join(dir, '.jarvis/steering/product.md'),
        'utf8',
      );
      assert.match(product, /<!-- TODO -->/);

      // Bootstrap prompt on stdout, success summary on stderr.
      assert.match(stdout, /You are helping me draft Jarvis steering files/);
      assert.match(stdout, /TypeScript\/JavaScript/);
      assert.match(stderr, /Detected:/);
      assert.match(stderr, /Pre-filled tech\.md/);
      assert.match(stderr, /Pre-filled structure\.md/);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

describe('jarvis init — refuses when .jarvis/ exists (T-007c, US-003)', () => {
  it('exits 1 and writes nothing', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-init-exists-'));
    try {
      await mkdir(join(dir, '.jarvis'));
      // Put a sentinel file inside; it must remain untouched.
      await writeFile(join(dir, '.jarvis', 'SENTINEL'), 'do-not-touch', 'utf8');

      const { result, stdout, stderr } = await capture(() =>
        run({
          cwd: dir,
          now: () => FIXED_NOW,
          createdBy: FIXED_CREATED_BY,
          lang: 'en',
        }),
      );

      assert.equal(result, 1);
      assert.equal(stdout, '');
      assert.match(stderr, /\.jarvis already exists/);

      // Sentinel survived; no steering or config was written.
      const sentinel = await readFile(
        join(dir, '.jarvis', 'SENTINEL'),
        'utf8',
      );
      assert.equal(sentinel, 'do-not-touch');
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});

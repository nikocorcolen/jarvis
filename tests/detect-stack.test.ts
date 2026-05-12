import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { detectStack, MAX_DEPENDENCIES } from '../src/core/detect-stack.js';

async function makeTmp(): Promise<string> {
  return mkdtemp(join(tmpdir(), 'jarvis-detect-'));
}

async function writePkg(dir: string, body: object): Promise<void> {
  await writeFile(join(dir, 'package.json'), JSON.stringify(body), 'utf8');
}

describe('detectStack — manifest precedence (T-001, FR-001)', () => {
  let dir: string;

  before(async () => {
    dir = await makeTmp();
  });

  after(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it('returns nulls when no manifest is present', async () => {
    const empty = await mkdtemp(join(tmpdir(), 'jarvis-detect-empty-'));
    try {
      const result = await detectStack(empty);
      assert.equal(result.language, null);
      assert.equal(result.runtime, null);
      assert.deepEqual(result.manifests, []);
      assert.deepEqual(result.dependencies, []);
    } finally {
      await rm(empty, { recursive: true, force: true });
    }
  });

  it('package.json wins over pyproject.toml', async () => {
    const d = await makeTmp();
    try {
      await writePkg(d, { dependencies: { commander: '^12' } });
      await writeFile(join(d, 'pyproject.toml'), '[project]\nname = "x"\n');
      const result = await detectStack(d);
      assert.equal(result.language, 'TypeScript/JavaScript');
      assert.equal(result.runtime, 'Node.js');
      assert.deepEqual(result.manifests, ['package.json', 'pyproject.toml']);
      assert.deepEqual(result.dependencies, ['commander']);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });

  it('pyproject.toml wins over go.mod', async () => {
    const d = await makeTmp();
    try {
      await writeFile(join(d, 'pyproject.toml'), '[project]\nname = "x"\n');
      await writeFile(join(d, 'go.mod'), 'module x\n');
      const result = await detectStack(d);
      assert.equal(result.language, 'Python');
      assert.equal(result.runtime, 'Python');
      assert.deepEqual(result.manifests, ['pyproject.toml', 'go.mod']);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });

  it('go.mod wins over Cargo.toml', async () => {
    const d = await makeTmp();
    try {
      await writeFile(join(d, 'go.mod'), 'module x\n');
      await writeFile(join(d, 'Cargo.toml'), '[package]\nname = "x"\n');
      const result = await detectStack(d);
      assert.equal(result.language, 'Go');
      assert.deepEqual(result.manifests, ['go.mod', 'Cargo.toml']);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });

  it('caps dependencies at MAX_DEPENDENCIES', async () => {
    const d = await makeTmp();
    try {
      const deps: Record<string, string> = {};
      for (let i = 0; i < MAX_DEPENDENCIES + 5; i++) {
        deps[`dep-${i}`] = '1.0.0';
      }
      await writePkg(d, { dependencies: deps });
      const result = await detectStack(d);
      assert.equal(result.dependencies.length, MAX_DEPENDENCIES);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });

  it('handles malformed package.json without throwing', async () => {
    const d = await makeTmp();
    try {
      await writeFile(join(d, 'package.json'), '{ broken json', 'utf8');
      const result = await detectStack(d);
      assert.equal(result.language, 'TypeScript/JavaScript');
      assert.deepEqual(result.dependencies, []);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });
});

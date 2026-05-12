import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listSpecs, readSpecState } from '../src/core/spec-store.js';

interface Fixture {
  jarvisDir: string;
  cleanup: () => Promise<void>;
}

async function setupJarvisDir(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'jarvis-store-'));
  const jarvisDir = join(root, '.jarvis');
  await mkdir(join(jarvisDir, 'specs'), { recursive: true });
  return {
    jarvisDir,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

async function writeSpecFile(
  jarvisDir: string,
  spec: string,
  file: string,
  body: string,
): Promise<void> {
  const dir = join(jarvisDir, 'specs', spec);
  await mkdir(dir, { recursive: true });
  await writeFile(join(dir, file), body, 'utf8');
}

const validFM = (status: string, updated: string) =>
  `---
spec: x
phase: requirements
status: ${status}
created: 2026-01-01
updated: ${updated}
---

# body
`;

describe('readSpecState (T-002)', () => {
  it('returns null for a missing spec', async () => {
    const f = await setupJarvisDir();
    try {
      assert.equal(await readSpecState(f.jarvisDir, 'ghost'), null);
    } finally {
      await f.cleanup();
    }
  });

  it('reflects exists/status/updated for each phase file present', async () => {
    const f = await setupJarvisDir();
    try {
      await writeSpecFile(
        f.jarvisDir,
        'login',
        'requirements.md',
        validFM('approved', '2026-05-10'),
      );
      await writeSpecFile(
        f.jarvisDir,
        'login',
        'design.md',
        validFM('draft', '2026-05-11'),
      );
      // tasks.md missing on purpose.

      const state = await readSpecState(f.jarvisDir, 'login');
      assert.ok(state);
      assert.equal(state.requirements.exists, true);
      assert.equal(state.requirements.status, 'approved');
      assert.equal(state.requirements.updated, '2026-05-10');

      assert.equal(state.design.exists, true);
      assert.equal(state.design.status, 'draft');

      assert.equal(state.tasks.exists, false);
      assert.equal(state.tasks.status, null);
      assert.equal(state.tasks.updated, null);
    } finally {
      await f.cleanup();
    }
  });

  it('returns status: null for malformed front-matter without throwing', async () => {
    const f = await setupJarvisDir();
    try {
      await writeSpecFile(
        f.jarvisDir,
        'broken',
        'requirements.md',
        '---\nnot: valid: yaml: ::: \n---\nbody',
      );
      const state = await readSpecState(f.jarvisDir, 'broken');
      assert.ok(state);
      assert.equal(state.requirements.exists, true);
      assert.equal(state.requirements.status, null);
    } finally {
      await f.cleanup();
    }
  });

  it('treats unknown status values as null', async () => {
    const f = await setupJarvisDir();
    try {
      await writeSpecFile(
        f.jarvisDir,
        'odd',
        'requirements.md',
        validFM('finalized', '2026-05-10'),
      );
      const state = await readSpecState(f.jarvisDir, 'odd');
      assert.equal(state?.requirements.status, null);
    } finally {
      await f.cleanup();
    }
  });
});

describe('listSpecs (T-002)', () => {
  it('returns empty array when .jarvis/specs/ has no entries', async () => {
    const f = await setupJarvisDir();
    try {
      assert.deepEqual(await listSpecs(f.jarvisDir), []);
    } finally {
      await f.cleanup();
    }
  });

  it('returns specs alphabetically with their phase states', async () => {
    const f = await setupJarvisDir();
    try {
      await writeSpecFile(
        f.jarvisDir,
        'beta',
        'requirements.md',
        validFM('draft', '2026-05-10'),
      );
      await writeSpecFile(
        f.jarvisDir,
        'alpha',
        'requirements.md',
        validFM('approved', '2026-05-09'),
      );
      await writeSpecFile(
        f.jarvisDir,
        'alpha',
        'design.md',
        validFM('draft', '2026-05-09'),
      );

      const specs = await listSpecs(f.jarvisDir);
      assert.deepEqual(
        specs.map((s) => s.name),
        ['alpha', 'beta'],
      );
      assert.equal(specs[0]!.requirements.status, 'approved');
      assert.equal(specs[0]!.design.status, 'draft');
      assert.equal(specs[0]!.tasks.exists, false);
    } finally {
      await f.cleanup();
    }
  });

  it('returns empty array when .jarvis/specs/ does not exist', async () => {
    const root = await mkdtemp(join(tmpdir(), 'jarvis-store-no-specs-'));
    try {
      const jarvisDir = join(root, '.jarvis');
      await mkdir(jarvisDir);
      assert.deepEqual(await listSpecs(jarvisDir), []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { listSpecs, readSpecState } from '../src/core/spec-store.js';

interface Fixture {
  fridayDir: string;
  cleanup: () => Promise<void>;
}

async function setupFridayDir(): Promise<Fixture> {
  const root = await mkdtemp(join(tmpdir(), 'friday-store-'));
  const fridayDir = join(root, '.friday');
  await mkdir(join(fridayDir, 'specs'), { recursive: true });
  return {
    fridayDir,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

async function writeSpecFile(
  fridayDir: string,
  spec: string,
  file: string,
  body: string,
): Promise<void> {
  const dir = join(fridayDir, 'specs', spec);
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
    const f = await setupFridayDir();
    try {
      assert.equal(await readSpecState(f.fridayDir, 'ghost'), null);
    } finally {
      await f.cleanup();
    }
  });

  it('reflects exists/status/updated for each phase file present', async () => {
    const f = await setupFridayDir();
    try {
      await writeSpecFile(
        f.fridayDir,
        'login',
        'requirements.md',
        validFM('approved', '2026-05-10'),
      );
      await writeSpecFile(
        f.fridayDir,
        'login',
        'design.md',
        validFM('draft', '2026-05-11'),
      );
      // tasks.md missing on purpose.

      const state = await readSpecState(f.fridayDir, 'login');
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
    const f = await setupFridayDir();
    try {
      await writeSpecFile(
        f.fridayDir,
        'broken',
        'requirements.md',
        '---\nnot: valid: yaml: ::: \n---\nbody',
      );
      const state = await readSpecState(f.fridayDir, 'broken');
      assert.ok(state);
      assert.equal(state.requirements.exists, true);
      assert.equal(state.requirements.status, null);
    } finally {
      await f.cleanup();
    }
  });

  it('treats unknown status values as null', async () => {
    const f = await setupFridayDir();
    try {
      await writeSpecFile(
        f.fridayDir,
        'odd',
        'requirements.md',
        validFM('finalized', '2026-05-10'),
      );
      const state = await readSpecState(f.fridayDir, 'odd');
      assert.equal(state?.requirements.status, null);
    } finally {
      await f.cleanup();
    }
  });
});

describe('listSpecs (T-002)', () => {
  it('returns empty array when .friday/specs/ has no entries', async () => {
    const f = await setupFridayDir();
    try {
      assert.deepEqual(await listSpecs(f.fridayDir), []);
    } finally {
      await f.cleanup();
    }
  });

  it('returns specs alphabetically with their phase states', async () => {
    const f = await setupFridayDir();
    try {
      await writeSpecFile(
        f.fridayDir,
        'beta',
        'requirements.md',
        validFM('draft', '2026-05-10'),
      );
      await writeSpecFile(
        f.fridayDir,
        'alpha',
        'requirements.md',
        validFM('approved', '2026-05-09'),
      );
      await writeSpecFile(
        f.fridayDir,
        'alpha',
        'design.md',
        validFM('draft', '2026-05-09'),
      );

      const specs = await listSpecs(f.fridayDir);
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

  it('returns empty array when .friday/specs/ does not exist', async () => {
    const root = await mkdtemp(join(tmpdir(), 'friday-store-no-specs-'));
    try {
      const fridayDir = join(root, '.friday');
      await mkdir(fridayDir);
      assert.deepEqual(await listSpecs(fridayDir), []);
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
});

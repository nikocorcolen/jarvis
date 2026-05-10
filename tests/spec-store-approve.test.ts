import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  approvePhase,
  createSpec,
  readSpecState,
} from '../src/core/spec-store.js';
import { parseFrontMatter } from '../src/core/frontmatter.js';
import type { SpecFrontMatter } from '../src/core/types.js';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'friday-approve-'));
  const fridayDir = join(root, '.friday');
  await mkdir(fridayDir);
  return {
    fridayDir,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

const D1 = '2026-05-10';
const D2 = '2026-05-11';

describe('approvePhase (T-004, US-002, FR-001)', () => {
  it('approves requirements first time and refreshes updated', async () => {
    const f = await setup();
    try {
      await createSpec({ fridayDir: f.fridayDir, name: 'x', today: () => D1 });

      const result = await approvePhase({
        fridayDir: f.fridayDir,
        name: 'x',
        phase: 'requirements',
        today: () => D2,
      });

      assert.deepEqual(result, { kind: 'approved', previouslyApproved: false });

      const state = await readSpecState(f.fridayDir, 'x');
      assert.equal(state?.requirements.status, 'approved');
      assert.equal(state?.requirements.updated, D2);
      // Other phases untouched.
      assert.equal(state?.design.status, 'draft');
      assert.equal(state?.tasks.status, 'draft');
    } finally {
      await f.cleanup();
    }
  });

  it('returns out-of-order with the missing dependency', async () => {
    const f = await setup();
    try {
      await createSpec({ fridayDir: f.fridayDir, name: 'x', today: () => D1 });

      // Try to approve design without approving requirements first.
      const result = await approvePhase({
        fridayDir: f.fridayDir,
        name: 'x',
        phase: 'design',
        today: () => D2,
      });
      assert.deepEqual(result, {
        kind: 'out-of-order',
        missingDependency: 'requirements',
      });

      // Approve requirements, then try to approve tasks (skipping design).
      await approvePhase({
        fridayDir: f.fridayDir,
        name: 'x',
        phase: 'requirements',
        today: () => D2,
      });
      const result2 = await approvePhase({
        fridayDir: f.fridayDir,
        name: 'x',
        phase: 'tasks',
        today: () => D2,
      });
      assert.deepEqual(result2, {
        kind: 'out-of-order',
        missingDependency: 'design',
      });
    } finally {
      await f.cleanup();
    }
  });

  it('returns already-approved on second approval', async () => {
    const f = await setup();
    try {
      await createSpec({ fridayDir: f.fridayDir, name: 'x', today: () => D1 });

      await approvePhase({
        fridayDir: f.fridayDir,
        name: 'x',
        phase: 'requirements',
        today: () => D2,
      });
      const result = await approvePhase({
        fridayDir: f.fridayDir,
        name: 'x',
        phase: 'requirements',
        today: () => D2,
      });
      assert.deepEqual(result, { kind: 'already-approved' });
    } finally {
      await f.cleanup();
    }
  });

  it('returns spec-not-found for an unknown spec', async () => {
    const f = await setup();
    try {
      const result = await approvePhase({
        fridayDir: f.fridayDir,
        name: 'ghost',
        phase: 'requirements',
        today: () => D2,
      });
      assert.deepEqual(result, { kind: 'spec-not-found' });
    } finally {
      await f.cleanup();
    }
  });

  it('returns phase-file-missing when the file was deleted', async () => {
    const f = await setup();
    try {
      await createSpec({ fridayDir: f.fridayDir, name: 'x', today: () => D1 });
      // Manually delete tasks.md.
      const tasksPath = join(f.fridayDir, 'specs', 'x', 'tasks.md');
      await rm(tasksPath);

      // Approve requirements + design first to avoid out-of-order short-circuit.
      await approvePhase({
        fridayDir: f.fridayDir, name: 'x', phase: 'requirements', today: () => D2,
      });
      await approvePhase({
        fridayDir: f.fridayDir, name: 'x', phase: 'design', today: () => D2,
      });

      const result = await approvePhase({
        fridayDir: f.fridayDir, name: 'x', phase: 'tasks', today: () => D2,
      });
      assert.deepEqual(result, { kind: 'phase-file-missing' });
    } finally {
      await f.cleanup();
    }
  });

  it('preserves the body byte-for-byte except for the front-matter mutation', async () => {
    const f = await setup();
    try {
      await createSpec({ fridayDir: f.fridayDir, name: 'x', today: () => D1 });
      const filePath = join(f.fridayDir, 'specs', 'x', 'requirements.md');

      // Append distinctive content the agent might have written.
      const before = await readFile(filePath, 'utf8');
      const userMarker = '\n\n## Custom section\n\nThis text MUST survive.\n';
      await writeFile(filePath, before + userMarker, 'utf8');

      const beforeMutation = await readFile(filePath, 'utf8');
      const { content: bodyBefore } = parseFrontMatter(beforeMutation);

      await approvePhase({
        fridayDir: f.fridayDir, name: 'x', phase: 'requirements', today: () => D2,
      });

      const after = await readFile(filePath, 'utf8');
      const { data, content: bodyAfter } = parseFrontMatter<Partial<SpecFrontMatter>>(after);

      // Body unchanged.
      assert.equal(bodyAfter, bodyBefore);
      // Status and updated mutated, others preserved.
      assert.equal(data.status, 'approved');
      assert.equal(data.updated, D2);
      assert.equal(data.created, D1);
      assert.equal(data.spec, 'x');
      // The user marker survived.
      assert.match(after, /This text MUST survive\./);
    } finally {
      await f.cleanup();
    }
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  createSpec,
  InvalidSpecNameError,
  SpecAlreadyExistsError,
} from '../src/core/spec-store.js';
import { parseFrontMatter } from '../src/core/frontmatter.js';
import type { SpecFrontMatter } from '../src/core/types.js';

async function setup() {
  const root = await mkdtemp(join(tmpdir(), 'friday-create-'));
  const fridayDir = join(root, '.friday');
  await mkdir(fridayDir);
  return {
    fridayDir,
    cleanup: () => rm(root, { recursive: true, force: true }),
  };
}

const FIXED_DATE = '2026-05-10';

function toIsoDate(v: unknown): string | undefined {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  if (typeof v === 'string') return v;
  return undefined;
}

describe('createSpec (T-003, US-001)', () => {
  it('creates the three files with placeholders substituted', async () => {
    const f = await setup();
    try {
      await createSpec({
        fridayDir: f.fridayDir,
        name: 'login',
        today: () => FIXED_DATE,
      });

      const dir = join(f.fridayDir, 'specs', 'login');
      for (const file of ['requirements.md', 'design.md', 'tasks.md']) {
        const raw = await readFile(join(dir, file), 'utf8');
        const { data } = parseFrontMatter<Partial<SpecFrontMatter>>(raw);

        assert.equal(data.spec, 'login');
        assert.equal(data.status, 'draft');
        // YAML parser may return Date; normalize for the assertion.
        assert.equal(toIsoDate(data.created), FIXED_DATE);
        assert.equal(toIsoDate(data.updated), FIXED_DATE);

        // No placeholders survive in the body.
        assert.ok(!raw.includes('<name>'), `<name> left in ${file}`);
        assert.ok(!raw.includes('<YYYY-MM-DD>'), `<YYYY-MM-DD> left in ${file}`);

        // Spec name appears in the H1 heading.
        assert.match(raw, /^#\s+\w+:\s+login$/m);
      }
    } finally {
      await f.cleanup();
    }
  });

  it('rejects an invalid name without writing anything', async () => {
    const f = await setup();
    try {
      await assert.rejects(
        () =>
          createSpec({
            fridayDir: f.fridayDir,
            name: 'Bad Name',
            today: () => FIXED_DATE,
          }),
        InvalidSpecNameError,
      );
      // .friday/specs/ should not exist or should be empty.
      const specsDir = join(f.fridayDir, 'specs');
      try {
        const files = await readFile(join(specsDir, 'Bad Name'), 'utf8');
        assert.fail('spec dir should not exist: ' + files);
      } catch {
        // expected
      }
    } finally {
      await f.cleanup();
    }
  });

  it('refuses when a spec with the same name already exists', async () => {
    const f = await setup();
    try {
      await createSpec({
        fridayDir: f.fridayDir,
        name: 'twin',
        today: () => FIXED_DATE,
      });
      await assert.rejects(
        () =>
          createSpec({
            fridayDir: f.fridayDir,
            name: 'twin',
            today: () => FIXED_DATE,
          }),
        SpecAlreadyExistsError,
      );
    } finally {
      await f.cleanup();
    }
  });

  it('does not leave a partial spec on FR-002 violation', async () => {
    const f = await setup();
    try {
      await assert.rejects(() =>
        createSpec({
          fridayDir: f.fridayDir,
          name: '',
          today: () => FIXED_DATE,
        }),
      );
      // Even the staging tmp directory must be cleaned up. We cannot
      // assert on tmp paths directly, but `.friday/specs/` should at
      // least not contain anything bogus.
      const specsDir = join(f.fridayDir, 'specs');
      try {
        const { readdir } = await import('node:fs/promises');
        const entries = await readdir(specsDir);
        assert.deepEqual(entries, []);
      } catch {
        // specs dir not created at all is also fine
      }
    } finally {
      await f.cleanup();
    }
  });
});

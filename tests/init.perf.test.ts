import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../src/cli/commands/init.js';

const PERF_BUDGET_MS = 500;
const TOP_LEVEL_ENTRIES = 1000;

/**
 * Captures stdout/stderr while running an async block.
 * Local copy to keep this perf test self-contained.
 */
async function silent<T>(block: () => Promise<T>): Promise<T> {
  const oo = process.stdout.write.bind(process.stdout);
  const oe = process.stderr.write.bind(process.stderr);
  process.stdout.write = (() => true) as typeof process.stdout.write;
  process.stderr.write = (() => true) as typeof process.stderr.write;
  try {
    return await block();
  } finally {
    process.stdout.write = oo;
    process.stderr.write = oe;
  }
}

const SKIP = process.env['JARVIS_SKIP_PERF'] === '1';

describe('jarvis init — performance (T-008, NFR-001)', () => {
  it(
    `completes under ${PERF_BUDGET_MS}ms with ${TOP_LEVEL_ENTRIES} entries`,
    { skip: SKIP },
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'jarvis-init-perf-'));
      try {
        // Seed a package.json so detection runs (worst case: pre-fill enabled).
        await writeFile(
          join(dir, 'package.json'),
          JSON.stringify({ name: 'demo', dependencies: { x: '1' } }),
          'utf8',
        );
        // Create N top-level entries (mix folders + files).
        const work: Promise<unknown>[] = [];
        for (let i = 0; i < TOP_LEVEL_ENTRIES; i++) {
          if (i % 2 === 0) {
            work.push(mkdir(join(dir, `folder-${i}`)));
          } else {
            work.push(writeFile(join(dir, `file-${i}.txt`), '', 'utf8'));
          }
        }
        await Promise.all(work);

        const start = process.hrtime.bigint();
        const exitCode = await silent(() => run({ cwd: dir }));
        const elapsedMs = Number(process.hrtime.bigint() - start) / 1_000_000;

        assert.equal(exitCode, 0);
        assert.ok(
          elapsedMs < PERF_BUDGET_MS,
          `init took ${elapsedMs.toFixed(0)}ms; budget is ${PERF_BUDGET_MS}ms`,
        );
      } finally {
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
});

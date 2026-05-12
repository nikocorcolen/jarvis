import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createSpec } from '../src/core/spec-store.js';
import { run as runSpecStatus } from '../src/cli/commands/spec-status.js';

/**
 * Captures stdout/stderr by replacing the underlying writes with
 * no-ops. We want to measure the command, not the cost of writing
 * 50 rows to the terminal.
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

const PERF_BUDGET_MS = 100;
const NUM_SPECS = 50;
const SKIP = process.env['JARVIS_SKIP_PERF'] === '1';

describe('jarvis spec status — performance (T-010, NFR-001)', () => {
  it(
    `completes under ${PERF_BUDGET_MS}ms with ${NUM_SPECS} specs`,
    { skip: SKIP },
    async () => {
      const dir = await mkdtemp(join(tmpdir(), 'jarvis-status-perf-'));
      const originalCwd = process.cwd();
      try {
        // Lay down .jarvis/ then 50 specs in parallel. Setup is not
        // measured; we just need a realistic NFR-001 workload on disk.
        const jarvisDir = join(dir, '.jarvis');
        await mkdir(jarvisDir);
        const today = (): string => '2026-05-11';
        await Promise.all(
          Array.from({ length: NUM_SPECS }, (_, i) =>
            createSpec({
              jarvisDir,
              name: `spec-${String(i).padStart(2, '0')}`,
              today,
            }),
          ),
        );

        // spec-status reads `.jarvis/` via process.cwd().
        process.chdir(dir);

        const start = process.hrtime.bigint();
        const exitCode = await silent(() => runSpecStatus({}));
        const elapsedMs =
          Number(process.hrtime.bigint() - start) / 1_000_000;

        assert.equal(exitCode, 0);
        assert.ok(
          elapsedMs < PERF_BUDGET_MS,
          `spec status took ${elapsedMs.toFixed(1)}ms with ${NUM_SPECS} specs; ` +
            `NFR-001 budget is ${PERF_BUDGET_MS}ms`,
        );
      } finally {
        process.chdir(originalCwd);
        await rm(dir, { recursive: true, force: true });
      }
    },
  );
});

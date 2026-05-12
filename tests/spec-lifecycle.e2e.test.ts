import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run as runInit } from '../src/cli/commands/init.js';
import { run as runSpecNew } from '../src/cli/commands/spec-new.js';
import { run as runSpecApprove } from '../src/cli/commands/spec-approve.js';
import { run as runSpecStatus } from '../src/cli/commands/spec-status.js';

/**
 * Captures stdout/stderr of an async block by swapping the underlying
 * stream `write` methods. Mirrors the helper in tests/init.e2e.test.ts.
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

/**
 * Strips ANSI color escapes so assertions remain stable regardless of
 * whether kleur autodetects a TTY in the test process.
 */
function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

/**
 * Creates a temp dir, runs `init` to lay down `.jarvis/`, chdirs into
 * it, and guarantees cleanup + cwd restoration even when the block
 * throws. Each `it()` calls this — no shared fixture between tests
 * (the gray-matter cache bug taught us why).
 */
async function inJarvisProject<T>(
  block: (dir: string) => Promise<T>,
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'jarvis-e2e-'));
  const originalCwd = process.cwd();
  try {
    // Lay down .jarvis/ inside the temp dir (init uses its own cwd arg).
    await capture(() =>
      runInit({
        cwd: dir,
        now: () => '2026-05-11T00:00:00.000Z',
        createdBy: 'jarvis-cli@test',
      }),
    );
    // Now chdir so spec-* commands (which read process.cwd) see it.
    process.chdir(dir);
    return await block(dir);
  } finally {
    process.chdir(originalCwd);
    await rm(dir, { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// Happy path
// ---------------------------------------------------------------------------

describe('jarvis spec lifecycle — happy path (T-009)', () => {
  it('walks new → status → edit → approve × 3 → status, end to end', async () => {
    await inJarvisProject(async (dir) => {
      // 1. spec new login
      let r = await capture(() => runSpecNew({ name: 'login' }));
      assert.equal(r.result, 0);
      assert.match(stripAnsi(r.stderr), /creado/i);
      assert.match(r.stdout, /owner de producto/i);

      // 2. status
      r = await capture(() => runSpecStatus({}));
      assert.equal(r.result, 0);
      assert.match(stripAnsi(r.stdout), /login\s+R· D· T·/);
      assert.match(stripAnsi(r.stderr), /\[1 specs?\]/);

      // 3. Simulate human/agent editing...
      const reqPath = join(dir, '.jarvis/specs/login/requirements.md');
      const original = await readFile(reqPath, 'utf8');
      const sentinel = '\n\n## US-001: Demo\n\nWHEN user logs in THE SYSTEM SHALL accept it.\n';
      await writeFile(reqPath, original + sentinel, 'utf8');

      // 4. approve requirements
      r = await capture(() =>
        runSpecApprove({ spec: 'login', phase: 'requirements' }),
      );
      assert.equal(r.result, 0);
      assert.match(stripAnsi(r.stderr), /Requerimientos aprobados/i);
      assert.match(r.stdout, /arquitecto de software/i);

      // 4a. Body preserved
      const afterApprove = await readFile(reqPath, 'utf8');
      assert.match(afterApprove, /## US-001: Demo/, 'body must survive approve');
      assert.match(afterApprove, /WHEN user logs in THE SYSTEM SHALL/);
      assert.match(afterApprove, /^status: approved$/m);
      assert.match(afterApprove, /^created: \d{4}-\d{2}-\d{2}$/m,
        'created date stays plain YYYY-MM-DD');
      assert.match(afterApprove, /^updated: \d{4}-\d{2}-\d{2}$/m,
        'updated date stays plain YYYY-MM-DD');
      assert.doesNotMatch(afterApprove, /T\d{2}:\d{2}:\d{2}/,
        'no ISO timestamps should leak into front-matter');

      // 5. status
      r = await capture(() => runSpecStatus({}));
      assert.equal(r.result, 0);
      assert.match(stripAnsi(r.stdout), /login\s+R✓ D· T·/);

      // 6. approve design
      r = await capture(() =>
        runSpecApprove({ spec: 'login', phase: 'design' }),
      );
      assert.equal(r.result, 0);
      assert.match(stripAnsi(r.stderr), /Diseño aprobado/i);
      assert.match(r.stdout, /tech lead/i);

      // 7. status
      r = await capture(() => runSpecStatus({}));
      assert.equal(r.result, 0);
      assert.match(stripAnsi(r.stdout), /login\s+R✓ D✓ T·/);

      // 8. approve tasks
      r = await capture(() =>
        runSpecApprove({ spec: 'login', phase: 'tasks' }),
      );
      assert.equal(r.result, 0);
      assert.equal(r.stdout, '', 'no prompt should follow tasks approval');
      assert.match(stripAnsi(r.stderr), /Tareas aprobadas/i);
      assert.match(stripAnsi(r.stderr), /listo para su implementación/i);

      // 9. final status
      r = await capture(() => runSpecStatus({}));
      assert.equal(r.result, 0);
      assert.match(stripAnsi(r.stdout), /login\s+R✓ D✓ T✓/);
    });
  });
});

// ---------------------------------------------------------------------------
// Failure paths
// ---------------------------------------------------------------------------

describe('jarvis spec lifecycle — failure paths (T-009)', () => {
  it('spec new "Bad Name" exits 1 with the regex visible on stderr', async () => {
    await inJarvisProject(async () => {
      const r = await capture(() => runSpecNew({ name: 'Bad Name' }));
      assert.equal(r.result, 1);
      assert.equal(r.stdout, '');
      const err = stripAnsi(r.stderr);
      assert.match(err, /invalid spec name/i);
      assert.match(err, /\[a-z0-9\]\[a-z0-9-\]\{0,49\}/, 'regex shown to user');
      assert.match(err, /magic-link-auth/, 'example shown to user');
    });
  });

  it('spec new <name> twice exits 1 the second time, first attempt intact', async () => {
    await inJarvisProject(async (dir) => {
      const first = await capture(() => runSpecNew({ name: 'login' }));
      assert.equal(first.result, 0);

      const second = await capture(() => runSpecNew({ name: 'login' }));
      assert.equal(second.result, 1);
      assert.equal(second.stdout, '', 'duplicate prints no prompt');
      assert.match(stripAnsi(second.stderr), /ya existe/i);

      // First spec still has draft state — duplicate refusal didn't mutate it.
      const reqRaw = await readFile(
        join(dir, '.jarvis/specs/login/requirements.md'),
        'utf8',
      );
      assert.match(reqRaw, /^status: draft$/m);
    });
  });

  it('spec approve <name> design without requirements approved exits 1 (out-of-order)', async () => {
    await inJarvisProject(async () => {
      await capture(() => runSpecNew({ name: 'login' }));

      const r = await capture(() =>
        runSpecApprove({ spec: 'login', phase: 'design' }),
      );
      assert.equal(r.result, 1);
      assert.equal(r.stdout, '', 'out-of-order prints no prompt');
      const err = stripAnsi(r.stderr);
      assert.match(err, /No se puede aprobar design/i);
    });
  });

  it('spec approve on a non-existent spec exits 1 (spec-not-found)', async () => {
    await inJarvisProject(async () => {
      const r = await capture(() =>
        runSpecApprove({ spec: 'ghost', phase: 'requirements' }),
      );
      assert.equal(r.result, 1);
      assert.equal(r.stdout, '');
      const err = stripAnsi(r.stderr);
      assert.match(err, /no encontrado/i);
    });
  });
});

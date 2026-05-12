import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run as runInit } from '../src/cli/commands/init.js';
import { run as runSpecApprove } from '../src/cli/commands/spec-approve.js';
import { run as runSpecNew } from '../src/cli/commands/spec-new.js';
import { run as runSpecStatus } from '../src/cli/commands/spec-status.js';

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

function stripAnsi(s: string): string {
  // eslint-disable-next-line no-control-regex
  return s.replace(/\x1b\[[0-9;]*m/g, '');
}

async function inJarvisProject<T>(
  block: (dir: string) => Promise<T>,
): Promise<T> {
  const dir = await mkdtemp(join(tmpdir(), 'jarvis-status-next-step-'));
  const originalCwd = process.cwd();
  try {
    await capture(() =>
      runInit({
        cwd: dir,
        now: () => '2026-05-11T00:00:00.000Z',
        createdBy: 'jarvis-cli@test',
      }),
    );
    process.chdir(dir);
    return await block(dir);
  } finally {
    process.chdir(originalCwd);
    await rm(dir, { recursive: true, force: true });
  }
}

async function createSpec(name: string): Promise<void> {
  const r = await capture(() => runSpecNew({ name }));
  assert.equal(r.result, 0);
}

async function approve(spec: string, phase: 'requirements' | 'design' | 'tasks'): Promise<void> {
  const r = await capture(() => runSpecApprove({ spec, phase }));
  assert.equal(r.result, 0);
}

async function approveAll(spec: string): Promise<void> {
  await approve(spec, 'requirements');
  await approve(spec, 'design');
  await approve(spec, 'tasks');
}

function phasePath(
  dir: string,
  spec: string,
  phase: 'requirements' | 'design' | 'tasks',
): string {
  return join(dir, '.jarvis', 'specs', spec, `${phase}.md`);
}

function nextStepActions(stdout: string): string[] {
  const lines = stripAnsi(stdout).trimEnd().split('\n');
  const start = lines.indexOf('Siguientes pasos:');
  return start === -1 ? [] : lines.slice(start + 1);
}

function parseStatusJson(stdout: string): Array<{
  name: string;
  nextStep: null | { kind: string; phase: string; action: string };
}> {
  return JSON.parse(stdout) as Array<{
    name: string;
    nextStep: null | { kind: string; phase: string; action: string };
  }>;
}

describe('Next steps: human output', () => {
  it('does not print Next steps for an empty project', async () => {
    await inJarvisProject(async () => {
      const r = await capture(() => runSpecStatus({}));

      assert.equal(r.result, 0);
      assert.equal(r.stdout, '');
      assert.match(stripAnsi(r.stderr), /No se encontraron specs/);
      assert.doesNotMatch(stripAnsi(r.stdout), /Siguientes pasos:/);
      assert.doesNotMatch(stripAnsi(r.stderr), /Siguientes pasos:/);
    });
  });

  it('prints a requirements approval next step for a new spec', async () => {
    await inJarvisProject(async () => {
      await createSpec('sample');

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.equal(r.result, 0);
      assert.match(stdout, /sample\s+R· D· T·/);
      assert.match(stdout, /Siguientes pasos:/);
      assert.match(
        stdout,
        /sample\s+→ edita requirements\.md, luego ejecuta: jarvis spec approve sample requirements/,
      );
    });
  });

  it('prints a design approval next step after requirements approval', async () => {
    await inJarvisProject(async () => {
      await createSpec('sample');
      await approve('sample', 'requirements');

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.equal(r.result, 0);
      assert.match(stdout, /sample\s+R✓ D· T·/);
      assert.match(stdout, /Siguientes pasos:/);
      assert.match(
        stdout,
        /sample\s+→ edita design\.md, luego ejecuta: jarvis spec approve sample design/,
      );
    });
  });

  it('does not print Next steps for a fully approved spec', async () => {
    await inJarvisProject(async () => {
      await createSpec('sample');
      await approveAll('sample');

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.equal(r.result, 0);
      assert.match(stdout, /sample\s+R✓ D✓ T✓/);
      assert.doesNotMatch(stdout, /Siguientes pasos:/);
    });
  });

  it('omits complete specs and orders incomplete specs alphabetically', async () => {
    await inJarvisProject(async () => {
      await createSpec('gamma');
      await createSpec('beta');
      await createSpec('alpha');
      await approveAll('beta');

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.match(stdout, /alpha\s+R· D· T·/);
      assert.match(stdout, /beta\s+R✓ D✓ T✓/);
      assert.match(stdout, /gamma\s+R· D· T·/);
      assert.deepEqual(nextStepActions(stdout), [
        'alpha  → edita requirements.md, luego ejecuta: jarvis spec approve alpha requirements',
        'gamma  → edita requirements.md, luego ejecuta: jarvis spec approve gamma requirements',
      ]);
    });
  });
});

describe('Next steps: anomalies', () => {
  it('reports a missing tasks file and does not suggest approve', async () => {
    await inJarvisProject(async (dir) => {
      await createSpec('sample');
      await approve('sample', 'requirements');
      await approve('sample', 'design');
      await rm(phasePath(dir, 'sample', 'tasks'));

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.match(stdout, /sample\s+R✓ D✓ T-/);
      assert.match(
        stdout,
        /sample\s+→ tasks\.md missing, restore from git or re-scaffold\./,
      );
      assert.doesNotMatch(stdout, /jarvis spec approve sample tasks/);
    });
  });

  it('reports malformed design front-matter', async () => {
    await inJarvisProject(async (dir) => {
      await createSpec('sample');
      await approve('sample', 'requirements');
      await writeFile(
        phasePath(dir, 'sample', 'design'),
        '---\nstatus: not-a-valid-yaml-{\n---\nbody',
        'utf8',
      );

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.match(stdout, /sample\s+R✓ D\? T·/);
      assert.match(
        stdout,
        /sample\s+→ fix front-matter in design\.md \(status field unreadable\)\./,
      );
    });
  });

  it('reports only the earliest missing phase in canonical order', async () => {
    await inJarvisProject(async (dir) => {
      await createSpec('sample');
      await rm(phasePath(dir, 'sample', 'requirements'));
      await rm(phasePath(dir, 'sample', 'design'));

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.match(
        stdout,
        /sample\s+→ requirements\.md missing, restore from git or re-scaffold\./,
      );
      assert.doesNotMatch(stdout, /design\.md missing/);
      assert.doesNotMatch(stdout, /tasks\.md missing/);
    });
  });

  it('reports missing before malformed before approve', async () => {
    await inJarvisProject(async (dir) => {
      await createSpec('sample');
      await writeFile(
        phasePath(dir, 'sample', 'design'),
        '---\nstatus: not-a-valid-yaml-{\n---\nbody',
        'utf8',
      );
      await rm(phasePath(dir, 'sample', 'tasks'));

      const r = await capture(() => runSpecStatus({}));
      const stdout = stripAnsi(r.stdout);

      assert.match(
        stdout,
        /sample\s+→ tasks\.md missing, restore from git or re-scaffold\./,
      );
      assert.doesNotMatch(stdout, /fix front-matter/);
      assert.doesNotMatch(stdout, /jarvis spec approve sample requirements/);
    });
  });
});

describe('Next steps: --json output', () => {
  it('prints parseable empty array for an empty project', async () => {
    await inJarvisProject(async () => {
      const r = await capture(() => runSpecStatus({ json: true }));

      assert.equal(r.result, 0);
      assert.equal(r.stdout, '[]\n');
      assert.deepEqual(parseStatusJson(r.stdout), []);
      assert.equal(r.stderr, '');
    });
  });

  it('includes null and populated nextStep values per spec', async () => {
    await inJarvisProject(async () => {
      await createSpec('complete');
      await createSpec('incomplete');
      await approveAll('complete');
      await approve('incomplete', 'requirements');

      const r = await capture(() => runSpecStatus({ json: true }));
      const parsed = parseStatusJson(r.stdout);

      assert.equal(r.result, 0);
      assert.equal(r.stderr, '');
      assert.equal(parsed.length, 2);
      assert.equal(parsed[0]!.name, 'complete');
      assert.equal(parsed[0]!.nextStep, null);
      assert.deepEqual(parsed[1]!.nextStep, {
        kind: 'approve',
        phase: 'design',
        action: 'edita design.md, luego ejecuta: jarvis spec approve incomplete design',
      });
    });
  });

  it('keeps JSON action identical to the human text after the arrow', async () => {
    await inJarvisProject(async () => {
      await createSpec('sample');
      await approve('sample', 'requirements');

      const human = await capture(() => runSpecStatus({}));
      const json = await capture(() => runSpecStatus({ json: true }));
      const humanAction = nextStepActions(human.stdout)[0]!.split('→ ')[1];
      const jsonAction = parseStatusJson(json.stdout)[0]!.nextStep!.action;

      assert.equal(jsonAction, humanAction);
    });
  });

  it('emits only valid nextStep kind values or null', async () => {
    await inJarvisProject(async (dir) => {
      await createSpec('approve-case');
      await createSpec('missing-case');
      await createSpec('malformed-case');
      await createSpec('complete-case');
      await rm(phasePath(dir, 'missing-case', 'tasks'));
      await writeFile(
        phasePath(dir, 'malformed-case', 'design'),
        '---\nstatus: not-a-valid-yaml-{\n---\nbody',
        'utf8',
      );
      await approveAll('complete-case');

      const r = await capture(() => runSpecStatus({ json: true }));
      const parsed = parseStatusJson(r.stdout);
      const kinds = parsed.map((spec) => spec.nextStep?.kind ?? null);

      assert.deepEqual(kinds.sort(), [
        'approve',
        'fix-malformed',
        'restore-missing',
        null,
      ].sort());
      for (const kind of kinds) {
        assert.ok(
          kind === null ||
            kind === 'approve' ||
            kind === 'restore-missing' ||
            kind === 'fix-malformed',
        );
      }
    });
  });
});

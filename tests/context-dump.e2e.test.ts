import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { run } from '../src/cli/commands/context.js';

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

describe('jarvis context e2e (T-009)', () => {
  it('verifies dump ordering, section headings, overview, omitted other specs, and empty stderr on success', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'jarvis-context-e2e-'));
    const cwd = process.cwd();
    process.chdir(dir);

    try {
      // Setup steering
      await mkdir('.jarvis/steering', { recursive: true });
      await writeFile('.jarvis/config.json', '{}');
      await writeFile('.jarvis/steering/product.md', 'Product content\n');
      await writeFile('.jarvis/steering/tech.md', 'Tech content\n');
      await writeFile('.jarvis/steering/structure.md', 'Structure content\n');

      // Setup target spec (alpha)
      await mkdir('.jarvis/specs/alpha', { recursive: true });
      await writeFile('.jarvis/specs/alpha/requirements.md', '---\nstatus: approved\n---\nReqs for alpha\n');
      await writeFile('.jarvis/specs/alpha/design.md', '---\nstatus: draft\n---\nDesign for alpha\n');

      // Setup other spec (beta)
      await mkdir('.jarvis/specs/beta', { recursive: true });
      await writeFile('.jarvis/specs/beta/requirements.md', '---\nstatus: approved\n---\nReqs for beta\n');

      const { result, stdout, stderr } = await capture(() => run({ spec: 'alpha' }));

      // Exit code 0 and no stderr
      assert.equal(result, 0);
      assert.equal(stderr, '', 'Stderr should be empty on success');

      // Check section headings and ordering
      const indexOfTitle = stdout.indexOf('# Jarvis Context Dump');
      const indexOfProduct = stdout.indexOf('### product.md');
      const indexOfTech = stdout.indexOf('### tech.md');
      const indexOfStructure = stdout.indexOf('### structure.md');
      const indexOfOverview = stdout.indexOf('## Specs Overview');
      const indexOfActive = stdout.indexOf('## Active Spec: alpha');
      const indexOfReq = stdout.indexOf('### requirements.md');
      const indexOfDesign = stdout.indexOf('### design.md');
      const indexOfTasks = stdout.indexOf('### tasks.md');

      assert.ok(indexOfTitle > -1, 'Must contain title');
      assert.ok(
        indexOfTitle < indexOfProduct &&
        indexOfProduct < indexOfTech &&
        indexOfTech < indexOfStructure &&
        indexOfStructure < indexOfOverview &&
        indexOfOverview < indexOfActive &&
        indexOfActive < indexOfReq &&
        indexOfReq < indexOfDesign &&
        indexOfDesign < indexOfTasks,
        'Sections must be strictly ordered'
      );

      // Check overview lines
      assert.match(stdout, /alpha\s+R✓ D· T-/);
      assert.match(stdout, /beta\s+R✓ D- T-/);

      // Selected spec contents are included
      assert.match(stdout, /Reqs for alpha/);
      assert.match(stdout, /Design for alpha/);
      assert.match(stdout, /<!-- phase file missing -->/); // For tasks.md

      // Omission of other spec bodies
      assert.doesNotMatch(stdout, /Reqs for beta/);

    } finally {
      process.chdir(cwd);
      await rm(dir, { recursive: true, force: true });
    }
  });
});

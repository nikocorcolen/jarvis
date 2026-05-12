import { describe, it, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { mkdtemp, rm } from 'node:fs/promises';
import { run } from '../src/cli/commands/context.js';
import { ensureDir, writeText } from '../src/io/fs.js';

describe('jarvis context command (T-008, T-009)', () => {
  let tmpRoot: string;
  let cwd: string;

  beforeEach(async () => {
    tmpRoot = await mkdtemp(join(tmpdir(), 'jarvis-test-context-'));
    cwd = process.cwd();
    process.chdir(tmpRoot);
  });

  afterEach(async () => {
    process.chdir(cwd);
    await rm(tmpRoot, { recursive: true, force: true });
  });

  it('does not fail on malformed front-matter in a non-selected spec and includes malformed raw contents', async () => {
    // Setup a Jarvis project
    await ensureDir('.jarvis/steering');
    await writeText('.jarvis/config.json', '{}');
    await writeText('.jarvis/steering/product.md', 'product');
    await writeText('.jarvis/steering/tech.md', 'tech');
    await writeText('.jarvis/steering/structure.md', 'structure');

    // Create a malformed spec
    await ensureDir('.jarvis/specs/malformed');
    await writeText('.jarvis/specs/malformed/requirements.md', '---\ninvalid: yaml:\n---\nmalformed body');
    await writeText('.jarvis/specs/malformed/design.md', 'no frontmatter');

    // Create a valid spec
    await ensureDir('.jarvis/specs/valid');
    await writeText('.jarvis/specs/valid/requirements.md', '---\nstatus: approved\n---\nvalid body');

    // Override process.stdout.write to capture output
    let stdoutData = '';
    const originalWrite = process.stdout.write;
    process.stdout.write = (chunk: string | Uint8Array) => {
      stdoutData += chunk.toString();
      return true;
    };

    try {
      const exitCode = await run({ spec: 'malformed' });
      assert.strictEqual(exitCode, 0, 'Command should succeed');
      
      // Check specs overview rendering '?'
      assert.match(stdoutData, /malformed\s+R\? D\? T-/);
      assert.match(stdoutData, /valid\s+R✓ D- T-/);

      // Check raw malformed content is present
      assert.match(stdoutData, /invalid: yaml:/);
      assert.match(stdoutData, /malformed body/);
      assert.match(stdoutData, /no frontmatter/);
      
      // The other spec body shouldn't be here
      assert.doesNotMatch(stdoutData, /valid body/);
    } finally {
      process.stdout.write = originalWrite;
    }
  });
});

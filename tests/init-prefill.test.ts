import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile, mkdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readFile } from 'node:fs/promises';
import {
  listTopLevelFolders,
  prefillTechMd,
  prefillStructureMd,
} from '../src/core/init-prefill.js';
import { loadTemplate } from '../src/core/templates.js';

describe('listTopLevelFolders (T-002)', () => {
  it('returns alphabetically sorted folders, ignoring noise', async () => {
    const d = await mkdtemp(join(tmpdir(), 'jarvis-folders-'));
    try {
      // Folders that should appear, in unsorted order.
      await mkdir(join(d, 'src'));
      await mkdir(join(d, 'tests'));
      await mkdir(join(d, 'docs'));
      // Folders that should be ignored.
      await mkdir(join(d, 'node_modules'));
      await mkdir(join(d, 'dist'));
      await mkdir(join(d, 'build'));
      await mkdir(join(d, '.git'));
      await mkdir(join(d, '.idea'));
      // Files (not folders) should be ignored.
      await writeFile(join(d, 'README.md'), '');
      await writeFile(join(d, 'package.json'), '{}');

      const folders = await listTopLevelFolders(d);
      assert.deepEqual(folders, ['docs', 'src', 'tests']);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });

  it('returns empty array when directory cannot be read', async () => {
    const folders = await listTopLevelFolders('/nonexistent-jarvis-test-path');
    assert.deepEqual(folders, []);
  });

  it('returns empty array for an empty directory', async () => {
    const d = await mkdtemp(join(tmpdir(), 'jarvis-empty-folders-'));
    try {
      assert.deepEqual(await listTopLevelFolders(d), []);
    } finally {
      await rm(d, { recursive: true, force: true });
    }
  });
});

describe('prefillTechMd (T-003)', () => {
  it('replaces Language and Runtime bullets when stack is detected', async () => {
    const template = await loadTemplate('steering', 'tech.md');
    const out = prefillTechMd(template, {
      language: 'TypeScript/JavaScript',
      runtime: 'Node.js',
      manifests: ['package.json'],
      dependencies: ['commander', 'gray-matter'],
    });

    assert.match(out, /- \*\*Language\*\*: TypeScript\/JavaScript/);
    assert.match(out, /- \*\*Runtime\*\*: Node\.js/);
    // Framework is intentionally not pre-filled.
    assert.match(out, /- \*\*Framework\*\*: <!-- TODO -->/);
    // Dependencies block injected with the friction tag.
    assert.match(out, /- \*\*commander\*\*: \(detected, classify as load-bearing or replaceable\)/);
    assert.match(out, /- \*\*gray-matter\*\*: \(detected, classify as load-bearing or replaceable\)/);
    // Section 2 TODO must be gone after replacement.
    const section2 = out.split('## 2. Key dependencies')[1] ?? '';
    const section3 = section2.split('## 3.')[0] ?? '';
    assert.ok(!section3.includes('<!-- TODO -->'));
  });

  it('leaves untouched fields with TODO when stack is empty', async () => {
    const template = await loadTemplate('steering', 'tech.md');
    const out = prefillTechMd(template, {
      language: null,
      runtime: null,
      manifests: [],
      dependencies: [],
    });
    assert.equal(out, template);
  });
});

describe('prefillStructureMd (T-004)', () => {
  it('injects folder bullets under section 1', async () => {
    const template = await loadTemplate('steering', 'structure.md');
    const out = prefillStructureMd(template, ['docs', 'src', 'tests']);

    assert.match(out, /- `docs\/` — /);
    assert.match(out, /- `src\/` — /);
    assert.match(out, /- `tests\/` — /);
    // Section 1 TODO replaced; section 2 still has its TODO.
    const section1 = out.split('## 1. Folder layout')[1]?.split('## 2.')[0] ?? '';
    assert.ok(!section1.includes('<!-- TODO -->'));
    assert.match(out, /## 2\. Where things go[\s\S]*<!-- TODO -->/);
  });

  it('returns template unchanged when folder list is empty', async () => {
    const template = await loadTemplate('steering', 'structure.md');
    const out = prefillStructureMd(template, []);
    assert.equal(out, template);
  });
});

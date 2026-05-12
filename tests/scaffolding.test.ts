import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('scaffolding smoke test', () => {
  it('imports core types without errors', async () => {
    const types = await import('../src/core/types.js');
    assert.equal(types.FORMAT_VERSION, 1);
  });

  it('locateJarvisDir returns null in a tmp dir without .jarvis/', async () => {
    const { locateJarvisDir } = await import('../src/core/jarvis-dir.js');
    const result = locateJarvisDir('/tmp');
    // /tmp is unlikely to have a .jarvis ancestor.
    assert.equal(result, null);
  });
});

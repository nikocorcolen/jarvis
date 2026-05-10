import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('scaffolding smoke test', () => {
  it('imports core types without errors', async () => {
    const types = await import('../src/core/types.js');
    assert.equal(types.FORMAT_VERSION, 1);
  });

  it('locateFridayDir returns null in a tmp dir without .friday/', async () => {
    const { locateFridayDir } = await import('../src/core/friday-dir.js');
    const result = locateFridayDir('/tmp');
    // /tmp is unlikely to have a .friday ancestor.
    assert.equal(result, null);
  });
});

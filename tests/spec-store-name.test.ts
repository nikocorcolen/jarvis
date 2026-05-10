import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { isValidSpecName } from '../src/core/spec-store.js';

describe('isValidSpecName (T-001, FR-002)', () => {
  it('accepts canonical kebab-case', () => {
    assert.equal(isValidSpecName('login'), true);
    assert.equal(isValidSpecName('magic-link-auth'), true);
    assert.equal(isValidSpecName('v2-rewrite'), true);
    assert.equal(isValidSpecName('a'), true); // single char
    assert.equal(isValidSpecName('123'), true); // pure digits
    assert.equal(isValidSpecName('feature-2'), true);
  });

  it('rejects uppercase', () => {
    assert.equal(isValidSpecName('Login'), false);
    assert.equal(isValidSpecName('magicLinkAuth'), false);
  });

  it('rejects leading hyphen or digit-with-hyphen-prefix', () => {
    assert.equal(isValidSpecName('-login'), false);
    assert.equal(isValidSpecName('--double'), false);
  });

  it('rejects path traversal and slashes', () => {
    assert.equal(isValidSpecName('..'), false);
    assert.equal(isValidSpecName('../etc'), false);
    assert.equal(isValidSpecName('foo/bar'), false);
    assert.equal(isValidSpecName('foo\\bar'), false);
  });

  it('rejects underscores, dots, spaces, and other special chars', () => {
    assert.equal(isValidSpecName('foo_bar'), false);
    assert.equal(isValidSpecName('foo.bar'), false);
    assert.equal(isValidSpecName('foo bar'), false);
    assert.equal(isValidSpecName('foo!bar'), false);
  });

  it('rejects empty string', () => {
    assert.equal(isValidSpecName(''), false);
  });

  it('respects the 50-char length boundary', () => {
    const fifty = 'a' + 'b'.repeat(49); // 50 chars total
    assert.equal(fifty.length, 50);
    assert.equal(isValidSpecName(fifty), true);

    const fiftyOne = 'a' + 'b'.repeat(50); // 51 chars total
    assert.equal(fiftyOne.length, 51);
    assert.equal(isValidSpecName(fiftyOne), false);
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert';
import { formatSpecsOverview } from '../src/core/spec-format.js';
import type { SpecState } from '../src/core/spec-store.js';

describe('formatSpecsOverview', () => {
  it('formats sorted specs with proper padding and markers', () => {
    const states: SpecState[] = [
      {
        name: 'zeta',
        requirements: { exists: true, status: 'approved', updated: '2026-05-11' },
        design: { exists: true, status: 'draft', updated: '2026-05-11' },
        tasks: { exists: false, status: null, updated: null },
      },
      {
        name: 'alpha-spec',
        requirements: { exists: true, status: 'approved', updated: '2026-05-11' },
        design: { exists: true, status: 'approved', updated: '2026-05-11' },
        tasks: { exists: true, status: 'approved', updated: '2026-05-11' },
      },
    ];

    const result = formatSpecsOverview(states);
    const lines = result.split('\n');
    assert.strictEqual(lines.length, 2);
    assert.strictEqual(lines[0], 'alpha-spec  R✓ D✓ T✓');
    assert.strictEqual(lines[1], 'zeta        R✓ D· T-');
  });

  it('renders ? for malformed files', () => {
    const states: SpecState[] = [
      {
        name: 'malformed',
        requirements: { exists: true, status: null, updated: null },
        design: { exists: true, status: null, updated: null },
        tasks: { exists: true, status: null, updated: null },
      },
    ];

    const result = formatSpecsOverview(states);
    assert.strictEqual(result, 'malformed  R? D? T?');
  });

  it('handles empty state', () => {
    assert.strictEqual(formatSpecsOverview([]), '');
  });
});

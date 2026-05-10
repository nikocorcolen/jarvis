import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderSteeringBootstrapPrompt } from '../src/prompts/steering-bootstrap.js';

describe('renderSteeringBootstrapPrompt (T-005)', () => {
  it('encodes the hard rules: ask for product, observe-then-ask for tech/structure', () => {
    const out = renderSteeringBootstrapPrompt({
      detectedLanguage: 'TypeScript/JavaScript',
      manifests: ['package.json'],
    });

    // Rule 1 (product.md): ASK, NEVER INFER.
    assert.match(out, /product\.md.*ASK,? NEVER INFER/i);

    // Rule 2 (tech.md / structure.md): intentional or accidental.
    assert.match(out, /intentional or accidental/i);

    // Detected metadata is surfaced.
    assert.match(out, /TypeScript\/JavaScript/);
    assert.match(out, /package\.json/);

    // Behavioural guards.
    assert.match(out, /one section at a time/i);
    assert.match(out, /wait for my approval/i);
    assert.match(out, /do not invent new sections/i);

    // Ordering: starts with product.md.
    assert.match(out, /Start with product\.md/);
  });

  it('handles unknown language gracefully', () => {
    const out = renderSteeringBootstrapPrompt({
      detectedLanguage: null,
      manifests: [],
    });
    assert.match(out, /Detected language: <unknown>/);
    assert.match(out, /Detected manifests: <none>/);
  });

  it('renders identically for the same input (deterministic)', () => {
    const args = {
      detectedLanguage: 'Python',
      manifests: ['pyproject.toml'],
    };
    assert.equal(
      renderSteeringBootstrapPrompt(args),
      renderSteeringBootstrapPrompt(args),
    );
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { t } from '../src/core/i18n.js';

describe('i18n module', () => {
  it('returns english translation when lang is en', () => {
    assert.equal(t('en', 'init.noCodeDetected'), 'No code detected. Open {path} and fill the TODO sections by hand.');
  });

  it('returns spanish translation when lang is es', () => {
    assert.equal(t('es', 'init.noCodeDetected'), 'No se detectó código. Abre {path} y completa las secciones TODO manualmente.');
  });

  it('interpolates arguments', () => {
    assert.equal(
      t('en', 'init.prefilledTech', { count: 3 }),
      'Pre-filled tech.md with 3 dependencies.'
    );
    assert.equal(
      t('es', 'spec.created', { name: 'auth' }),
      "✓ Spec 'auth' creado"
    );
  });

  it('falls back to english if key missing in spanish (if any)', () => {
    // We mock a missing key by casting
    assert.equal(t('es', 'non.existent.key' as any), 'non.existent.key');
  });
});

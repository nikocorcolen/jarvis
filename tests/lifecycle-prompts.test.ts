import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderRequirementsPrompt } from '../src/prompts/requirements.js';
import { renderDesignPrompt } from '../src/prompts/design.js';
import { renderTasksPrompt } from '../src/prompts/tasks.js';

describe('renderRequirementsPrompt (T-005)', () => {
  it('encodes the product-owner rules', () => {
    // With Spanish default
    const out = renderRequirementsPrompt('login');

    // Role.
    assert.match(out, /owner de producto/i);
    // Reads steering and the spec template first.
    assert.match(out, /\.jarvis\/steering\/product\.md/);
    assert.match(out, /\.jarvis\/specs\/login\/requirements\.md/);
    // No tech.
    assert.match(out, /NO propongas tecnología/);
    // EARS notation required.
    assert.match(out, /CUANDO <disparador> EL SISTEMA DEBE/);
    // Identifier scheme present.
    assert.match(out, /US-001/);
    assert.match(out, /FR-001/);
    assert.match(out, /NFR-001/);
    // Out of scope is mandatory.
    assert.match(out, /Fuera de alcance/);
    // Ask before writing.
    assert.match(out, /preguntas aclaratorias\s+ANTES/);
    assert.match(out, /hasta 5 preguntas/);
  });

  it('inlines the spec name', () => {
    const out = renderRequirementsPrompt('magic-link-auth');
    assert.match(out, /\.jarvis\/specs\/magic-link-auth\/requirements\.md/);
    assert.match(out, /"magic-link-auth"/);
  });
});

describe('renderDesignPrompt (T-005)', () => {
  it('encodes the architect rules', () => {
    // With Spanish default
    const out = renderDesignPrompt('login');

    // Role.
    assert.match(out, /arquitecto de software/i);
    // Reads requirements (approved, do not modify).
    assert.match(out, /requirements\.md \(APPROVED, do not modify\)/);
    // Traceability format spelled out.
    assert.match(out, /Addresses: US-001/);
    // Tech.md is binding.
    assert.match(out, /tech\.md is binding/i);
    // Flag conflicts, never silently violate.
    assert.match(out, /MÁRCALO explícitamente/);
    // No implementation code.
    assert.match(out, /NO escribas código de implementación/);
    // Decisions list alternatives considered.
    assert.match(out, /alternativa considerada/i);
    // Ask before writing.
    assert.match(out, /ANTES de escribir/);
  });
});

describe('renderTasksPrompt (T-005)', () => {
  it('encodes the tech-lead rules and Steering Impact section', () => {
    const out = renderTasksPrompt('login');

    // Role.
    assert.match(out, /tech lead/i);
    // Reads approved requirements and design.
    assert.match(out, /requirements\.md \(APPROVED\)/);
    assert.match(out, /design\.md \(APPROVED\)/);
    // 1-day budget.
    assert.match(out, /≤ 1 día/);
    // Tests are tasks.
    assert.match(out, /Las pruebas son tareas, NO reflexiones posteriores/);
    // Task format with traceability.
    assert.match(out, /Addresses: US-001/);
    // Steering Impact mandatory.
    assert.match(out, /REVISIÓN DE IMPACTO EN STEERING/);
    assert.match(out, /Los cambios de steering son RAROS/);
    assert.match(out, /None\. This feature is self-contained/);
    // Propose, don't apply.
    assert.match(out, /NO modifiques los archivos de steering directamente/);
  });

  it('is deterministic for the same spec name', () => {
    assert.equal(renderTasksPrompt('x'), renderTasksPrompt('x'));
  });
});

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { deriveNextStep } from '../src/core/spec-next-step.js';
import type { SpecPhase, SpecStatus } from '../src/core/types.js';
import type { SpecPhaseState, SpecState } from '../src/core/spec-store.js';

function phaseState(
  status: SpecStatus | null,
  exists = true,
): SpecPhaseState {
  return {
    exists,
    status,
    updated: exists && status ? '2026-05-11' : null,
  };
}

function specState(
  phases: Record<SpecPhase, SpecPhaseState>,
): SpecState {
  return {
    name: 'login',
    ...phases,
  };
}

describe('deriveNextStep', () => {
  it('returns null when all phases are approved', () => {
    const state = specState({
      requirements: phaseState('approved'),
      design: phaseState('approved'),
      tasks: phaseState('approved'),
    });

    assert.equal(deriveNextStep(state), null);
  });

  it('approves design when requirements are approved and design is draft', () => {
    const state = specState({
      requirements: phaseState('approved'),
      design: phaseState('draft'),
      tasks: phaseState('draft'),
    });

    assert.deepEqual(deriveNextStep(state), {
      kind: 'approve',
      phase: 'design',
      action: 'edit design.md, then run: jarvis spec approve login design',
    });
  });

  it('approves requirements when all phases are draft', () => {
    const state = specState({
      requirements: phaseState('draft'),
      design: phaseState('draft'),
      tasks: phaseState('draft'),
    });

    assert.deepEqual(deriveNextStep(state), {
      kind: 'approve',
      phase: 'requirements',
      action: 'edit requirements.md, then run: jarvis spec approve login requirements',
    });
  });

  it('reports a missing phase before approving a later draft phase', () => {
    const state = specState({
      requirements: phaseState('approved'),
      design: phaseState(null, false),
      tasks: phaseState('draft'),
    });

    assert.deepEqual(deriveNextStep(state), {
      kind: 'restore-missing',
      phase: 'design',
      action: 'design.md missing, restore from git or re-scaffold.',
    });
  });

  it('reports the earliest missing phase in canonical order', () => {
    const state = specState({
      requirements: phaseState('approved'),
      design: phaseState(null, false),
      tasks: phaseState(null, false),
    });

    assert.deepEqual(deriveNextStep(state), {
      kind: 'restore-missing',
      phase: 'design',
      action: 'design.md missing, restore from git or re-scaffold.',
    });
  });

  it('reports the earliest malformed phase in canonical order', () => {
    const state = specState({
      requirements: phaseState('approved'),
      design: phaseState(null),
      tasks: phaseState(null),
    });

    assert.deepEqual(deriveNextStep(state), {
      kind: 'fix-malformed',
      phase: 'design',
      action: 'fix front-matter in design.md (status field unreadable).',
    });
  });

  it('applies precedence missing before malformed before approve', () => {
    const state = specState({
      requirements: phaseState('draft'),
      design: phaseState(null),
      tasks: phaseState(null, false),
    });

    assert.deepEqual(deriveNextStep(state), {
      kind: 'restore-missing',
      phase: 'tasks',
      action: 'tasks.md missing, restore from git or re-scaffold.',
    });
  });
});

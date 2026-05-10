import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { renderRequirementsPrompt } from '../src/prompts/requirements.js';
import { renderDesignPrompt } from '../src/prompts/design.js';
import { renderTasksPrompt } from '../src/prompts/tasks.js';

describe('renderRequirementsPrompt (T-005)', () => {
  it('encodes the product-owner rules', () => {
    const out = renderRequirementsPrompt('login');

    // Role.
    assert.match(out, /product owner/i);
    // Reads steering and the spec template first.
    assert.match(out, /\.friday\/steering\/product\.md/);
    assert.match(out, /\.friday\/specs\/login\/requirements\.md/);
    // No tech.
    assert.match(out, /Do NOT propose technology/);
    // EARS notation required.
    assert.match(out, /WHEN <trigger> THE SYSTEM SHALL/);
    // Identifier scheme present.
    assert.match(out, /US-001/);
    assert.match(out, /FR-001/);
    assert.match(out, /NFR-001/);
    // Out of scope is mandatory.
    assert.match(out, /Out of scope/);
    // Ask before writing.
    assert.match(out, /ASK clarifying questions\s+BEFORE writing/);
    assert.match(out, /up to 5 clarifying questions/);
  });

  it('inlines the spec name', () => {
    const out = renderRequirementsPrompt('magic-link-auth');
    assert.match(out, /\.friday\/specs\/magic-link-auth\/requirements\.md/);
    assert.match(out, /"magic-link-auth"/);
  });
});

describe('renderDesignPrompt (T-005)', () => {
  it('encodes the architect rules', () => {
    const out = renderDesignPrompt('login');

    // Role.
    assert.match(out, /software architect/i);
    // Reads requirements (approved, do not modify).
    assert.match(out, /requirements\.md \(APPROVED, do not modify\)/);
    // Traceability format spelled out.
    assert.match(out, /Addresses: US-001/);
    // Tech.md is binding.
    assert.match(out, /tech\.md is binding/i);
    // Flag conflicts, never silently violate.
    assert.match(out, /FLAG IT explicitly/);
    // No implementation code.
    assert.match(out, /Do NOT write implementation code/);
    // Decisions list alternatives considered.
    assert.match(out, /alternative considered/i);
    // Ask before writing.
    assert.match(out, /BEFORE writing/);
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
    assert.match(out, /≤ 1 day/);
    // Tests are tasks.
    assert.match(out, /Tests are tasks, NOT afterthoughts/);
    // Task format with traceability.
    assert.match(out, /Addresses: US-001/);
    // Steering Impact mandatory.
    assert.match(out, /STEERING IMPACT CHECK/);
    assert.match(out, /Steering changes are RARE/);
    assert.match(out, /None\. This feature is self-contained/);
    // Propose, don't apply.
    assert.match(out, /DO NOT modify steering files directly/);
  });

  it('is deterministic for the same spec name', () => {
    assert.equal(renderTasksPrompt('x'), renderTasksPrompt('x'));
  });
});

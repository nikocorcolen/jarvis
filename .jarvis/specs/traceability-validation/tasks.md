---
spec: traceability-validation
phase: tasks
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Tasks: traceability-validation

## Task list

- [ ] **T-001**: Implement ID extraction with code-block and
      comment stripping.
      Files: src/core/traceability.ts
      Done when: `extractDefinedIds` and `extractReferencedIds` pass
      unit tests including fenced blocks and HTML-comment fixtures.
      Addresses: FR-001

- [ ] **T-002**: Implement `validateSpec` returning errors and warnings.
      Files: src/core/traceability.ts
      Done when: given fixture inputs, returns the expected Issue
      arrays for orphans and missing coverage.
      Addresses: US-001 (criteria 2, 3, 4)

- [ ] **T-003**: Implement the `spec validate` command for a single spec.
      Files: src/cli/commands/spec-validate.ts
      Done when: e2e test with a temp .jarvis/ runs the command and
      asserts exit code and stderr report shape.
      Addresses: US-001 (criteria 1, 5, 6)

- [ ] **T-004**: Extend the command to validate all specs when no name
      is given.
      Files: src/cli/commands/spec-validate.ts
      Done when: e2e test with two specs (one clean, one with errors)
      reports both and exits with code 1.
      Addresses: US-002

- [ ] **T-005**: Implement `renderValidateFixPrompt` and integrate it
      into the command output.
      Files: src/prompts/validate-fix.ts, src/cli/commands/spec-validate.ts
      Done when: snapshot tests pass for: errors-only, warnings-only,
      mixed, and clean (no prompt).
      Addresses: US-003

- [ ] **T-006**: Add NFR-001 performance test.
      Files: tests/traceability.perf.test.ts
      Done when: validating a synthetic spec with 50 IDs completes
      under 200 ms on CI.
      Addresses: NFR-001

- [ ] **T-007**: Document the command in README.
      Files: README.md
      Done when: README has a "Validation" section with a usage
      example and an example fix prompt.
      Addresses: US-001, US-003

## Steering Impact

None. This feature is self-contained: no new dependencies, no new
folder conventions, no cross-cutting changes.

## Notes

The regex-based approach assumes IDs always appear as standalone
tokens (`US-001`, not `aUS-001b`). The extractor uses word boundaries
to enforce this. If future IDs adopt different shapes (longer numbers,
new kinds), only the regex constants need to change.

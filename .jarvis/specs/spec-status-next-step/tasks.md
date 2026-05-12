---
spec: spec-status-next-step
phase: tasks
status: approved
created: 2026-05-11
updated: 2026-05-11
---

# Tasks: spec-status-next-step

<!--
Ordered, actionable breakdown of the approved design.
Each task ≤ 1 day, independently verifiable, linked to user stories
or requirements. Tests are tasks, not afterthoughts.
-->

## Task list

- [x] **T-001**: Add a pure next-step derivation module
      Files: `src/core/spec-next-step.ts`, `src/core/types.ts` if shared type exports are needed
      Done when: A pure `deriveNextStep(state)` contract exists, returns `approve`, `restore-missing`, `fix-malformed`, or `null`, and performs no filesystem, stdout, stderr, network, or process access.
      Addresses: US-001 (criteria 2, 4, 5, 6, 8, 10, 11), US-002 (criteria 2, 3, 4, 5, 6, 7), FR-002, NFR-001, NFR-002, NFR-003

- [x] **T-002**: Cover next-step derivation with unit tests
      Files: `tests/spec-next-step.test.ts`, `src/core/spec-next-step.ts`
      Done when: Unit tests verify complete specs return `null`, normal draft flow returns the correct approve command action, missing files take precedence over malformed and draft states, malformed front-matter is reported, multiple missing phases choose the earliest canonical phase, and multiple malformed phases choose the earliest canonical phase.
      Addresses: US-001 (criteria 2, 4, 5, 6, 7, 8, 9, 10, 11), US-002 (criteria 2, 3, 4, 5, 6, 7), FR-002, NFR-002, NFR-003

- [x] **T-003**: Extend human `spec status` output with `Next steps:`
      Files: `src/cli/commands/spec-status.ts`
      Done when: Human output preserves the existing status table rows unchanged, appends `Next steps:` only when at least one listed spec has a non-null next step, renders lines as `<spec>  → <action>` with literal U+2192, omits complete specs, and keeps line order aligned with the status table.
      Addresses: US-001 (criteria 1, 2, 3, 4, 6, 8, 12, 13), FR-001, FR-002, FR-003, NFR-002, NFR-003

- [x] **T-004**: Extend JSON `spec status --json` output with `nextStep`
      Files: `src/cli/commands/spec-status.ts`, `src/core/spec-next-step.ts`
      Done when: JSON output remains an array of per-spec objects with existing phase fields preserved and a `nextStep` field set to `null` for complete specs or to an object with `kind`, `phase`, and `action` for incomplete or blocked specs.
      Addresses: US-002, FR-001, FR-002, FR-003, NFR-002, NFR-003

- [x] **T-005**: Add human-output integration coverage for next steps
      Files: `tests/spec-lifecycle.e2e.test.ts` or `tests/spec-status-next-step.test.ts`
      Done when: Integration tests verify normal next-step lines after each approval stage, no `Next steps:` block for an empty project, no `Next steps:` block when all listed specs are complete, complete specs are omitted from mixed output, and multiple lines are alphabetically ordered like the table.
      Addresses: US-001 (criteria 1, 2, 3, 4, 5, 12, 13), FR-001, FR-002, FR-003, NFR-002

- [x] **T-006**: Add anomaly integration coverage for missing and malformed phases
      Files: `tests/spec-lifecycle.e2e.test.ts` or `tests/spec-status-next-step.test.ts`
      Done when: Integration tests verify missing phase files report `<phase>.md missing, restore from git or re-scaffold.`, malformed phase files report `fix front-matter in <phase>.md (status field unreadable).`, no approval command is suggested for either anomaly, and canonical precedence is honored when multiple anomalies exist.
      Addresses: US-001 (criteria 6, 7, 8, 9, 10, 11), US-002 (criteria 4, 5), FR-002, NFR-002

- [x] **T-007**: Add JSON integration coverage for `nextStep`
      Files: `tests/spec-lifecycle.e2e.test.ts` or `tests/spec-status-next-step.test.ts`
      Done when: Integration tests parse `jarvis spec status --json` and verify `nextStep: null` for complete specs, `approve` with exact action text for normal flow, `restore-missing` for missing files, `fix-malformed` for malformed front-matter, and identical `action` wording to the corresponding human output.
      Addresses: US-002, NFR-002, NFR-003

- [x] **T-008**: Update user-facing documentation for status next steps
      Files: `README.md`
      Done when: The documented `jarvis spec status` behavior mentions the optional `Next steps:` block for incomplete specs and the `nextStep` field in `--json`, without documenting a new command, active spec, or single-spec filter.
      Addresses: US-001, US-002, FR-001, FR-003

## Steering Impact

None. This feature is self-contained.

## Notes

- Implement this spec before `context-dump` T-002 to minimize conflicts in `src/cli/commands/spec-status.ts`.
- Keep the literal `→` glyph in human output. PowerShell may display mojibake in some reads, but the file and tests should assert the actual U+2192 character.
- Do not add a new command, active-spec state, single-spec filter, dependency, external service, or migration.

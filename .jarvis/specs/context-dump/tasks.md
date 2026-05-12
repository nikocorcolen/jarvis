---
spec: context-dump
phase: tasks
status: approved
created: 2026-05-11
updated: 2026-05-11
---

# Tasks: context-dump

## Task list

- [x] **T-001**: Add shared specs overview formatter
      Files: `src/core/spec-format.ts`, `tests/spec-format.test.ts`
      Done when: `formatSpecsOverview()` formats sorted `SpecState[]` rows with padded names and canonical `R`, `D`, `T` markers for approved, draft, missing, and malformed states.
      Addresses: US-001 (criterion 6), FR-002, NFR-002

- [x] **T-002**: Refactor spec status to use shared formatter
      Files: `src/cli/commands/spec-status.ts`, `tests/spec-lifecycle.e2e.test.ts`
      Done when: `jarvis spec status` output remains unchanged for existing happy-path and marker scenarios; `tests/spec-lifecycle.e2e.test.ts` and any spec-status snapshot tests pass without modification. Only `tests/spec-format.test.ts` is added in this task.
      Addresses: US-001 (criterion 6), NFR-002

- [x] **T-003**: Add deterministic context dump renderer
      Files: `src/prompts/context-dump.ts`, `tests/context-dump-prompt.test.ts`
      Done when: `renderContextDump()` produces the approved markdown structure with the agent instruction preface, `# Jarvis Context Dump`, steering sections, specs overview, active spec sections, markdown file headings, raw contents, and missing-file placeholders.
      Addresses: US-001 (criteria 1, 2, 3, 4, 5, 7, 8, 9, 10), FR-001, FR-002, FR-003, FR-004, NFR-002, NFR-003

- [x] **T-004**: Implement target spec resolution in context command
      Files: `src/cli/commands/context.ts`, `tests/context-command.test.ts`
      Done when: the private resolver handles explicit existing specs, explicit missing specs, no specs, one inferred spec, and multiple specs without reading implicit active state.
      Addresses: US-001 (criterion 12), US-002, US-003 (criterion 2), NFR-002, NFR-004

- [x] **T-005**: Read required context files with correct fatal and recoverable behavior
      Files: `src/cli/commands/context.ts`, `tests/context-command.test.ts`
      Done when: the command reads all three steering files as fatal requirements, reads the selected spec's three phase files as raw content, and substitutes `<!-- phase file missing -->` only for missing active phase files.
      Addresses: US-001 (criteria 4, 7, 9, 10, 11), US-003 (criterion 3), FR-002, NFR-001, NFR-003, NFR-004

- [x] **T-006**: Wire successful context command output
      Files: `src/cli/commands/context.ts`, `tests/context-command.test.ts`
      Done when: `jarvis context <name>` returns exit code `0`, writes exactly one complete markdown dump to stdout, writes nothing to stderr on success, excludes `.jarvis/config.json`, and excludes full contents of non-selected specs.
      Addresses: US-001 (criterion 1), FR-001, FR-002, FR-003, NFR-001, NFR-003, NFR-004

- [x] **T-007**: Implement user-facing context command errors
      Files: `src/cli/commands/context.ts`, `tests/context-command.test.ts`
      Done when: expected failures return exit code `1` with clear stderr messages for not a Jarvis project, requested spec not found with available names, no specs with `jarvis spec new` hint, multiple specs with available names, and missing steering file with the approved message.
      Addresses: US-001 (criterion 12), US-002 (criteria 2, 3), US-003 (criteria 1, 2), NFR-004

- [x] **T-008**: Cover malformed front-matter and overview markers
      Files: `tests/spec-format.test.ts`, `tests/context-command.test.ts`
      Done when: a malformed phase file renders `?` in the specs overview, raw malformed file contents are still included for the selected spec, and malformed front-matter in a non-selected spec does not fail `jarvis context`.
      Addresses: US-001 (criteria 6, 11), US-003 (criterion 3), NFR-002, NFR-003

- [x] **T-009**: Add end-to-end context command coverage
      Files: `tests/context-dump.e2e.test.ts`
      Done when: an e2e test initializes or constructs a Jarvis project with multiple specs and verifies the named-spec dump ordering, section headings, overview lines, selected-spec contents, omission of other spec bodies, and empty stderr on success.
      Addresses: US-001, FR-001, FR-002, FR-003, FR-004, NFR-001, NFR-002, NFR-003, NFR-004

- [x] **T-010**: Document the context command
      Files: `README.md`
      Done when: user-facing documentation describes `jarvis context <name>`, no-argument behavior for zero, one, and multiple specs, the paste-ready markdown output, and the fact that no LLM or network call is made.
      Addresses: US-001, US-002, FR-001, FR-002, NFR-001

## Steering Impact

None. This feature is self-contained.

## Notes

- `src/cli/index.ts` already registers `jarvis context [spec]`; implementation should replace the existing `context.ts` stub rather than add another command file.
- Keep `resolveContextTarget()` private to `src/cli/commands/context.ts` unless a second caller appears.
- Read all fatal inputs before writing stdout so failures never produce partial dumps.

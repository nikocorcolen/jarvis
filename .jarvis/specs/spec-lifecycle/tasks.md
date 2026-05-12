---
spec: spec-lifecycle
phase: tasks
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Tasks: spec-lifecycle

## Task list

- [x] **T-001**: Implement `isValidSpecName` (FR-002) and unit tests.
      Files: src/core/spec-store.ts (new)
      Done when: pure function returns true/false for the regex
      `^[a-z0-9][a-z0-9-]{0,49}$`. Unit tests cover: valid kebab,
      uppercase rejection, leading hyphen rejection, slash/path
      traversal rejection, empty string, length boundary.
      Addresses: FR-002

- [x] **T-002**: Implement `readSpecState` and `listSpecs`.
      Files: src/core/spec-store.ts
      Done when: given a fixture `.jarvis/` with two specs (one
      complete, one missing tasks.md), returns `SpecState[]` reflecting
      reality. Reads of the three phase files run in parallel via
      `Promise.all`. Malformed front-matter yields `status: null`
      without throwing.
      Addresses: US-003 (criteria 1, 2)

- [x] **T-003**: Implement `createSpec` with template substitution and
      atomic rename.
      Files: src/core/spec-store.ts
      Done when: writes the three files into a tmp dir and renames it
      into place. Throws `InvalidSpecNameError` on invalid name and
      `SpecAlreadyExistsError` on duplicate. Placeholders `<name>`,
      `<YYYY-MM-DD>` are replaced. `status: draft` set in front-matter.
      Addresses: US-001 (criteria 1, 2, 3, 5), FR-002

- [x] **T-004**: Implement `approvePhase` with FR-001 ordering check
      and front-matter mutation preserving the body.
      Files: src/core/spec-store.ts
      Done when: returns the documented `ApproveResult` variants for
      each scenario (approved, already-approved, out-of-order,
      spec-not-found, phase-file-missing). Body of the file is
      byte-identical to the original except for the front-matter
      `status` and `updated` fields. Round-trip snapshot test pins
      this.
      Addresses: US-002 (criteria 1, 4, 5, 6), FR-001

- [x] **T-005**: Replace the three lifecycle prompt stubs
      (requirements, design, tasks) with the real prompts agreed
      during product design.
      Files: src/prompts/requirements.ts, design.ts, tasks.ts
      Done when: each renderer returns the prompt with the rules
      we agreed: read steering first, EARS format for criteria,
      Addresses: US-XXX trace, Steering Impact for tasks. Snapshot
      tests pin each output.
      Addresses: US-001 (criterion 4), US-002 (criteria 2, 3)

- [x] **T-006**: Implement the `jarvis spec new <name>` command body.
      Files: src/cli/commands/spec-new.ts
      Done when: validates name, calls `createSpec`, prints
      requirements prompt to stdout and a one-line success summary to
      stderr. Refuses cleanly on duplicate (exit 1, no prompt).
      Refuses on invalid name with the regex shown.
      Addresses: US-001 (all), FR-002

- [x] **T-007**: Implement the `jarvis spec approve <name> <phase>`
      command body.
      Files: src/cli/commands/spec-approve.ts
      Done when: pattern-matches on `ApproveResult`. Out-of-order and
      not-found exit 1 with helpful messages. Already-approved exits 0
      with notice on stderr, no prompt. Successful approve prints the
      next phase's prompt to stdout, except after `tasks` which prints
      a "ready for implementation" message to stderr only.
      Addresses: US-002 (all), FR-001

- [x] **T-008**: Implement the `jarvis spec status [--json]` command.
      Files: src/cli/commands/spec-status.ts
      Done when: human format prints one line per spec with three
      compact phase markers (e.g. `R✓ D✓ T·` for approved/approved/
      draft; `R✓ D· T-` for missing tasks). `--json` emits the
      `SpecState[]` array verbatim. Empty project prints a friendly
      pointer to `spec new`.
      Addresses: US-003 (all), NFR-003

- [x] **T-009**: End-to-end tests for the three commands across a
      shared fixture project.
      Files: tests/spec-lifecycle.e2e.test.ts (new)
      Done when: a single test file walks the full happy path:
      `spec new login` → `spec status` shows draft × 3 → simulate
      file edits → `spec approve requirements` → status reflects it
      → repeat for design and tasks → final approve emits the
      "ready for implementation" message and no prompt. A second
      block covers the failure paths (invalid name, duplicate spec,
      out-of-order approve, missing spec).
      Addresses: US-001, US-002, US-003, FR-001, FR-002

- [x] **T-010**: Performance check for NFR-001.
      Files: tests/spec-status.perf.test.ts (new)
      Done when: a synthetic project with 50 specs runs
      `spec status` under 100ms on CI. Skippable via
      `JARVIS_SKIP_PERF=1`.
      Addresses: NFR-001

- [x] **T-011**: Update README to mark `spec new`, `spec approve`,
      `spec status` as implemented; add a "Quick tour" section that
      walks through the full lifecycle on a tiny example.
      Files: README.md
      Done when: command table reflects three new ✅ entries; a new
      section shows `init` → `spec new` → editing markdown → 
      `spec approve` × 3 → `spec status`.
      Addresses: US-001, US-002, US-003

## Steering Impact

None. This spec adds one new module (`core/spec-store.ts`) that fits
existing import boundaries (core, no I/O outside `io/fs.ts`). It
turns three existing stubs into real prompts, but does not change
any structural convention. No new dependencies.

## Notes

- T-005 (the three real prompts) is the highest-judgment task in
  this spec because the product hinges on prompt quality. Re-read
  the "design of prompts" section from product decisions before
  drafting.
- The `ApproveResult` tagged union is deliberate: pattern-matching
  on it in the command keeps the orchestrator small and removes the
  need for `try/catch` around expected outcomes.
- `--json` on `spec status` is in scope for the MVP because CI
  integration is one of the early use cases (running 
  `jarvis spec validate` in pipelines).

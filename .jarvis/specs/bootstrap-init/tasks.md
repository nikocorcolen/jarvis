---
spec: bootstrap-init
phase: tasks
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Tasks: bootstrap-init

## Task list

- [x] **T-001**: Apply manifest precedence rule in `detectStack`.
      Files: src/core/detect-stack.ts
      Done when: given a fixture directory with both package.json and
      pyproject.toml, `language` and `runtime` reflect package.json;
      `manifests` array still contains both. Unit test covers all
      pairwise combinations.
      Addresses: FR-001, US-002 (criterion 1)

- [x] **T-002**: Implement `listTopLevelFolders` with the ignore list.
      Files: src/core/init-prefill.ts (new)
      Done when: returns alphabetically sorted folder names, excluding
      `node_modules`, `.git`, `dist`, `build`, and any folder whose
      name starts with `.`. Unit test with a fixture covers each
      ignore case.
      Addresses: US-002 (criterion 3), NFR-001

- [x] **T-003**: Implement `prefillTechMd`.
      Files: src/core/init-prefill.ts
      Done when: given the shipped tech.md template plus a
      `DetectedStack`, returns a string where section 1 has the
      detected language/runtime and section 2 lists up to 10
      dependencies tagged "(detected, classify as load-bearing or
      replaceable)". Snapshot test pins the output.
      Addresses: US-002 (criteria 1, 2)

- [x] **T-004**: Implement `prefillStructureMd`.
      Files: src/core/init-prefill.ts
      Done when: given the shipped structure.md template plus a
      list of folder names, returns a string where section 1 lists
      them as bullets. Snapshot test pins the output.
      Addresses: US-002 (criterion 3)

- [x] **T-005**: Replace the steering bootstrap prompt stub with the
      real content.
      Files: src/prompts/steering-bootstrap.ts
      Done when: snapshot test of `renderSteeringBootstrapPrompt`
      with two fixtures (Node project, Python project) matches the
      committed snapshots. The prompt enforces "ask, do not infer"
      for product.md and "intentional or accidental?" for tech /
      structure sections.
      Addresses: US-002 (criterion 4)

- [x] **T-006**: Implement the `init` command body.
      Files: src/cli/commands/init.ts
      Done when:
      - Refuses cleanly when `.jarvis/` already exists (exit 1, no
        partial writes).
      - Creates `.jarvis/{steering,specs}` and copies all six
        templates.
      - Writes `.jarvis/config.json` with formatVersion, createdAt,
        createdBy.
      - Calls `detectStack`; if anything is detected, runs the two
        prefill functions and prints the bootstrap prompt to stdout.
      - Prints a success summary to stderr.
      Addresses: US-001 (all), US-002 (all), US-003 (all)

- [x] **T-007**: End-to-end tests for `jarvis init`.
      Files: tests/init.e2e.test.ts (new)
      Done when: three e2e cases pass against a temp directory:
      (a) empty dir → .jarvis/ created, no prompt on stdout.
      (b) dir with package.json → .jarvis/ created, tech.md and
          structure.md pre-filled, bootstrap prompt on stdout.
      (c) dir with existing .jarvis/ → exit 1, no writes.
      Tests assert exit codes, file presence, and prompt presence
      via stdout/stderr separation.
      Addresses: US-001, US-002, US-003

- [x] **T-008**: Performance check for NFR-001.
      Files: tests/init.perf.test.ts (new)
      Done when: a synthetic directory with 1000 top-level entries
      completes init under 500 ms on CI. Test is skipped on slow CI
      hardware via an env flag, but runs locally by default.
      Addresses: NFR-001

- [x] **T-009**: Update README to reflect that `init` is implemented
      and remove the "stub" tag from the command table.
      Files: README.md
      Done when: README's Status section and command table reflect
      `init` as the first implemented command. A short usage example
      is added under "Quick start".
      Addresses: US-001, US-002

## Steering Impact

None. This spec uses only modules that already exist in the
scaffolding (core, io, prompts, cli) and adds one new module
(`core/init-prefill.ts`) that fits the existing import boundaries
without changing them. No new dependencies.

## Notes

- The "(detected, classify as load-bearing or replaceable)" suffix
  is deliberate friction: it forces the human to revisit the
  pre-filled list rather than rubber-stamping it.
- T-001 is small but isolated; doing it first removes a hidden
  coupling between detection and pre-fill that would otherwise
  leak into T-003.
- T-005 (the bootstrap prompt) is the highest-judgment task. The
  agent writing it should re-read the steering principle "propose,
  don't apply" before drafting.

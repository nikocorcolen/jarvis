---
spec: spec-lifecycle
phase: requirements
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Requirements: spec-lifecycle

## 1. Overview

`spec-lifecycle` covers the three commands that drive Jarvis's
day-to-day flow: creating a new spec, advancing it through phases by
explicit approval, and inspecting the state of all specs at a glance.
Together they enforce the Requirements → Design → Tasks ordering and
emit the right prompt at the right moment so an AI agent never lacks
context.

## 2. User stories

### US-001: Create a new spec

**As a** developer with a feature idea
**I want to** run `jarvis spec new <name>` to scaffold the three
spec files
**So that** I can immediately start the requirements phase with my
AI agent

**Acceptance criteria:**
- WHEN the user runs `jarvis spec new <name>` and no spec with that
  name exists THE SYSTEM SHALL create
  `.jarvis/specs/<name>/{requirements.md,design.md,tasks.md}`
  from the shipped templates
- WHEN creating each file THE SYSTEM SHALL replace the template
  placeholders `<name>`, `<YYYY-MM-DD>` (created), and
  `<YYYY-MM-DD>` (updated) with the actual spec name and the current
  date
- WHEN creating each file THE SYSTEM SHALL set `status: draft` in the
  front-matter of all three files
- WHEN the spec is created THE SYSTEM SHALL print the requirements
  prompt to stdout, scoped to the new spec
- WHEN a spec with the same name already exists THE SYSTEM SHALL
  exit with code 1 and write nothing
- WHEN the user is not in a Jarvis project THE SYSTEM SHALL exit with
  the standard "not a Jarvis project" error

### US-002: Approve a phase and advance

**As a** developer who has finished a phase with my agent
**I want to** mark it approved and get the next phase prompt
**So that** I do not have to remember which prompt comes next

**Acceptance criteria:**
- WHEN the user runs `jarvis spec approve <name> <phase>` and the spec
  exists THE SYSTEM SHALL update the front-matter of `<phase>.md` to
  `status: approved` and refresh the `updated` date
- WHEN approving `requirements` THE SYSTEM SHALL print the design prompt
  to stdout
- WHEN approving `design` THE SYSTEM SHALL print the tasks prompt to
  stdout
- WHEN approving `tasks` THE SYSTEM SHALL print a short message to
  stderr indicating the spec is ready for implementation, and SHALL
  NOT print any prompt
- WHEN approving a phase whose previous phase is still `draft`
  THE SYSTEM SHALL exit with code 1 and a message explaining the order
  (you cannot approve `design` until `requirements` is approved)
- WHEN approving a phase that is already `approved` THE SYSTEM SHALL
  exit with code 0, print a notice to stderr, and not print any prompt
- WHEN the spec does not exist THE SYSTEM SHALL exit with code 1 and a
  clear message

### US-003: See the state of every spec

**As a** developer juggling multiple specs
**I want to** see at a glance which specs exist and which phase each
one is in
**So that** I know what is in progress, what is blocked, and what is
done

**Acceptance criteria:**
- WHEN the user runs `jarvis spec status` THE SYSTEM SHALL print one
  line per spec listing the spec name and the status of each of its
  three phases
- WHEN a spec directory is missing one of the three files THE SYSTEM
  SHALL mark the missing phase as "missing" and continue with the rest
- WHEN no specs exist yet THE SYSTEM SHALL print a friendly message
  pointing the user to `jarvis spec new`
- WHEN the user is not in a Jarvis project THE SYSTEM SHALL exit with
  the standard "not a Jarvis project" error

## 3. Functional requirements

### FR-001: Phase ordering is strict
**Priority:** P0
**Persona:** developer

WHEN approving any phase THE SYSTEM SHALL verify that all earlier
phases are already `approved`, where the canonical order is
`requirements` → `design` → `tasks`.

**Rationale:** the value of spec-driven workflow comes from not
skipping phases. The CLI is the one place where this discipline can
be enforced cheaply.

### FR-002: Spec name validity
**Priority:** P0
**Persona:** developer

WHEN creating a spec THE SYSTEM SHALL accept names matching
`^[a-z0-9][a-z0-9-]{0,49}$` (lowercase kebab-case, 1-50 chars,
starting with alphanumeric); any other name SHALL be rejected with
exit code 1 and a message showing the rule.

**Rationale:** spec names become folder names and identifiers in
prompts. Enforcing kebab-case keeps the format portable across
filesystems and consistent across projects.

## 4. Non-functional requirements

- **NFR-001**: `jarvis spec status` SHALL complete in under 100 ms in
  a project with up to 50 specs.
- **NFR-002**: All three commands SHALL operate without network access.
- **NFR-003**: Status output SHALL be machine-parseable through
  `--json`, so CI can consume it without parsing terminal formatting.
  (Default output is human-readable; `--json` is opt-in.)

## 5. Out of scope

- Renaming or deleting specs (`spec rename`, `spec delete`). v1.x.
- Reverting an approved phase back to draft (`spec unapprove`). v1.x.
- Branching specs or multi-author conflict resolution.
- Linking specs to issues or pull requests.
- Editing spec content via the CLI; specs are edited by the human and
  the agent in markdown directly.
- Auto-detecting "the active spec" — `jarvis context` will handle that
  separately when implemented.

## 6. Open questions

- [x] Should `spec new` open the editor automatically? → No. Editor
      integration is too platform-dependent for v0.1; the user opens
      the file with their own tool. Out of scope.
- [x] Should `spec approve` block on unresolved `Open questions`
      checkboxes in `requirements.md`? → No for the MVP. Validation
      of structural rules belongs to a future `spec validate`
      enhancement; the lifecycle commands focus on phase ordering only.
- [x] What happens if the user manually edits a status field in the
      front-matter? → That is allowed. The CLI reads what is on disk;
      manual edits are a power-user escape hatch. Documented as such.

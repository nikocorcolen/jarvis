---
spec: spec-status-next-step
phase: requirements
status: approved
created: 2026-05-11
updated: 2026-05-11
---

# Requirements: spec-status-next-step

<!--
This file answers WHAT and FOR WHOM, never HOW.
No technology, libraries, endpoints, or implementation details.
-->

## 1. Overview

`jarvis spec status` already tells users which spec phases are present
and approved, but it leaves them to infer the next concrete action.
This feature keeps the existing status view intact and adds an actionable
"Next steps:" section for incomplete specs, so developers can immediately
see the exact command or manual repair needed to move each spec forward.

## 2. User stories

<!--
Each user story groups its own acceptance criteria in EARS notation.
EARS pattern: WHEN <trigger> THE SYSTEM SHALL <response>.
Cover happy path, errors, and edge cases inside each story.
-->

### US-001: Human next-step guidance

**As a** developer using Jarvis's spec workflow
**I want to** see the next concrete action underneath the existing spec status table
**So that** I can advance incomplete specs without mentally translating phase markers into commands

**Acceptance criteria:**
- WHEN a user runs `jarvis spec status` and at least one listed spec is incomplete THE SYSTEM SHALL preserve the existing status table output and print a `Next steps:` block beneath it.
- WHEN a listed spec is fully complete with requirements, design, and tasks all approved THE SYSTEM SHALL omit that spec from the `Next steps:` block.
- WHEN all listed specs are fully complete THE SYSTEM SHALL not print the `Next steps:` block.
- WHEN an incomplete spec is in the normal approval flow THE SYSTEM SHALL show one line in the form `<spec>  → edit <phase>.md, then run: jarvis spec approve <spec> <phase>`.
- WHEN a spec has an approved earlier phase and the next required phase is in draft status THE SYSTEM SHALL identify that draft phase as the next step.
- WHEN a spec has a missing phase file before the last approved phase THE SYSTEM SHALL show one line in the form `<spec>  → <phase>.md missing, restore from git or re-scaffold.`
- WHEN multiple phases of a spec are missing THE SYSTEM SHALL report only the earliest missing phase in canonical order.
- WHEN a spec has unreadable or malformed front-matter in any phase file THE SYSTEM SHALL show one line in the form `<spec>  → fix front-matter in <phase>.md (status field unreadable).`
- WHEN multiple phases of a spec have malformed front-matter THE SYSTEM SHALL report only the earliest affected phase in canonical order (requirements before design before tasks).
- WHEN more than one abnormal state could apply to a spec THE SYSTEM SHALL choose the first matching state by precedence: fully complete, missing file, malformed front-matter, normal flow.
- WHEN a missing-file or malformed-front-matter state is reported THE SYSTEM SHALL not suggest an approval command for that spec.
- WHEN no specs exist in the project THE SYSTEM SHALL not print the `Next steps:` block (the existing no-specs-yet message remains the only output).
- WHEN the `Next steps:` block contains multiple lines THE SYSTEM SHALL order them alphabetically by spec name, matching the order of the status table above.

### US-002: Machine-readable next-step data

**As a** developer or CI system consuming `jarvis spec status --json`
**I want to** receive structured next-step data for each listed spec
**So that** scripts can filter, report, or fail on blocked specs without re-parsing human text

**Acceptance criteria:**
- WHEN a user runs `jarvis spec status --json` THE SYSTEM SHALL include a `nextStep` field for each listed spec.
- WHEN a listed spec is fully complete THE SYSTEM SHALL set `nextStep` to `null`.
- WHEN a listed spec has an approvable next step THE SYSTEM SHALL set `nextStep.kind` to `approve`, `nextStep.phase` to the applicable phase, and `nextStep.action` to the exact action phrase used in the human `Next steps:` block after the arrow.
- WHEN a listed spec has a missing phase file before the last approved phase THE SYSTEM SHALL set `nextStep.kind` to `restore-missing`, `nextStep.phase` to the affected phase, and `nextStep.action` to the exact repair phrase used in the human `Next steps:` block after the arrow.
- WHEN a listed spec has malformed front-matter in a phase file THE SYSTEM SHALL set `nextStep.kind` to `fix-malformed`, `nextStep.phase` to the affected phase, and `nextStep.action` to the exact repair phrase used in the human `Next steps:` block after the arrow.
- WHEN `nextStep` is not `null` THE SYSTEM SHALL use only `approve`, `fix-malformed`, or `restore-missing` as the `kind` value.
- WHEN `nextStep` is not `null` THE SYSTEM SHALL set `phase` to the phase associated with the action.

## 3. Functional requirements

<!--
Cross-cutting requirements that don't belong to a single user story
(e.g. shared validation rules, system-wide behaviors).
Skip this section if all requirements fit cleanly inside user stories.
-->

### FR-001: Existing status behavior remains stable
**Priority:** P0
**Persona:** Developer using Jarvis's CLI

WHEN `jarvis spec status` is run THE SYSTEM SHALL preserve the existing requirements, design, and tasks status markers and their current meaning.

**Rationale:** The feature adds guidance to status output; it must not make the established status table harder to read or break existing user expectations.

### FR-002: Complete-spec filtering
**Priority:** P0
**Persona:** Developer using Jarvis's CLI

WHEN next-step guidance is generated THE SYSTEM SHALL include only specs that require a next action or manual repair.

**Rationale:** Fully complete specs do not have a useful next step and including them would add noise.

### FR-003: No active-spec assumption
**Priority:** P1
**Persona:** Developer using Jarvis's CLI

WHEN next-step guidance is generated THE SYSTEM SHALL evaluate all listed specs rather than choosing or requiring a single active spec.

**Rationale:** Jarvis does not maintain an active-spec concept, and status should remain an honest project-wide view.

## 4. Non-functional requirements

<!--
Performance, security, accessibility, observability, compliance.
Use NFR-XXX format. Only include those with specific thresholds.
-->

- **NFR-001**: WHEN `jarvis spec status` is run in human or JSON mode THE SYSTEM SHALL perform only local filesystem reads and SHALL NOT make network calls or call external services.
- **NFR-002**: WHEN next-step guidance is rendered THE SYSTEM SHALL keep output deterministic for the same `.jarvis/` file state.
- **NFR-003**: WHEN action text is rendered in human output and JSON output THE SYSTEM SHALL use identical wording for the action phrase so tooling and users see the same instruction.

## 5. Out of scope

<!--
Explicit list of things this spec does NOT cover.
-->

- Creating a new CLI command for next-step guidance.
- Adding a single-spec status mode or accepting a spec name as a filter.
- Introducing an active-spec concept.
- Generating, editing, restoring, or re-scaffolding missing spec files.
- Automatically repairing malformed front-matter.
- Emitting agent prompts or abstract phase recommendations as the next step.
- Changing the existing status table markers or their meanings.
- Changing approval behavior, phase ordering rules, or spec validation behavior.

## 6. Open questions

<!--
Each question must be answered (or moved to "Out of scope")
before this spec can be approved.
-->

- None.

---
spec: traceability-validation
phase: requirements
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Requirements: traceability-validation

## 1. Overview

Jarvis relies on stable identifiers (US-XXX, FR-XXX, NFR-XXX) to link
requirements, design and tasks across files. Without automated checks,
those links degrade silently as specs evolve. This feature provides a
single command that verifies link integrity and emits a fix prompt when
issues are found.

## 2. User stories

### US-001: Validate a single spec

**As a** developer maintaining a Jarvis spec
**I want to** run a command that checks traceability in one spec
**So that** I catch broken or missing links before approving a phase

**Acceptance criteria:**
- WHEN the user runs `jarvis spec validate <name>` THE SYSTEM SHALL
  read requirements.md, design.md and tasks.md of that spec
- WHEN any reference in design.md or tasks.md points to an ID that does
  not exist in requirements.md THE SYSTEM SHALL report it as an error
- WHEN any ID defined in requirements.md is not referenced in design.md
  THE SYSTEM SHALL report it as a warning
- WHEN any ID defined in requirements.md is not referenced in tasks.md
  THE SYSTEM SHALL report it as a warning
- WHEN there are errors THE SYSTEM SHALL exit with code 1
- WHEN there are only warnings or none THE SYSTEM SHALL exit with code 0

### US-002: Validate all specs at once

**As a** developer with several specs in a project
**I want to** validate every spec in a single command
**So that** I can use it in CI without scripting per-spec invocations

**Acceptance criteria:**
- WHEN the user runs `jarvis spec validate` without a name THE SYSTEM
  SHALL validate every spec under .jarvis/specs/
- WHEN any spec has errors THE SYSTEM SHALL exit with code 1
- WHEN every spec is clean or only has warnings THE SYSTEM SHALL exit
  with code 0

### US-003: Get a fix prompt when validation fails

**As a** developer who just got a validation failure
**I want to** receive a ready-to-paste prompt that guides an AI agent
to fix the issues
**So that** I can resolve them without writing the prompt myself

**Acceptance criteria:**
- WHEN validation reports at least one error or warning THE SYSTEM SHALL
  print a fix prompt to stdout, scoped to the issues found
- WHEN the fix prompt is generated THE SYSTEM SHALL include for each
  issue the file, the ID involved and the type of issue (orphan or
  missing coverage)
- WHEN validation finds no issues THE SYSTEM SHALL NOT print any fix
  prompt

## 3. Functional requirements

### FR-001: ID extraction
**Priority:** P0
**Persona:** developer

WHEN scanning a spec file THE SYSTEM SHALL extract IDs matching the
pattern `(US|FR|NFR)-\d{3,}`, ignoring matches inside fenced code blocks
and HTML comments.

**Rationale:** template comments and code examples contain example IDs
that must not be treated as real definitions or references.

## 4. Non-functional requirements

- **NFR-001**: Validation of a spec with up to 50 IDs across the three
  files SHALL complete in under 200 ms on a modern laptop.
- **NFR-002**: The command SHALL operate without network access.

## 5. Out of scope

- Validation of EARS syntax inside acceptance criteria.
- Validation of front-matter structure or required sections.
- Validation of phase ordering or status coherence.
- Auto-fix of validation issues by the CLI itself.

## 6. Open questions

- [x] Should orphan references be errors or warnings? → Errors. Decided.
- [x] Should missing coverage block approval? → No, warnings only.

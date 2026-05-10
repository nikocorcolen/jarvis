---
spec: <name>
phase: requirements
status: draft
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
---

# Requirements: <name>

<!--
This file answers WHAT and FOR WHOM, never HOW.
No technology, libraries, endpoints, or implementation details.
-->

## 1. Overview

<!-- 2-3 sentences. What problem this feature solves and for whom. -->

## 2. User stories

<!--
Each user story groups its own acceptance criteria in EARS notation.
EARS pattern: WHEN <trigger> THE SYSTEM SHALL <response>.
Cover happy path, errors, and edge cases inside each story.
-->

### US-001: <Story title>

**As a** <persona>
**I want to** <capability>
**So that** <benefit>

**Acceptance criteria:**
- WHEN <trigger> THE SYSTEM SHALL <response>
- WHEN <invalid trigger> THE SYSTEM SHALL <error handling>
- WHEN <edge case> THE SYSTEM SHALL <response>

### US-002: <Story title>

**As a** ...
**I want to** ...
**So that** ...

**Acceptance criteria:**
- WHEN ... THE SYSTEM SHALL ...

## 3. Functional requirements

<!--
Cross-cutting requirements that don't belong to a single user story
(e.g. shared validation rules, system-wide behaviors).
Skip this section if all requirements fit cleanly inside user stories.
-->

### FR-001: <Title>
**Priority:** P0 | P1 | P2
**Persona:** <primary user>

WHEN <trigger> THE SYSTEM SHALL <behavior>

**Rationale:** <why this requirement exists>

## 4. Non-functional requirements

<!--
Performance, security, accessibility, observability, compliance.
Use NFR-XXX format. Only include those with specific thresholds.
-->

- **NFR-001**: ...

## 5. Out of scope

<!--
Explicit list of things this spec does NOT cover.
-->

- ...

## 6. Open questions

<!--
Each question must be answered (or moved to "Out of scope")
before this spec can be approved.
-->

- [ ] ...

---
spec: <name>
phase: design
status: draft
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
---

# Design: <name>

<!--
This file answers HOW. Every decision must trace to one or more
user stories (US-XXX), functional requirements (FR-XXX), or
non-functional requirements (NFR-XXX) from requirements.md.
No full implementation code. Pseudocode and interface signatures are fine.
Respect tech.md constraints; flag conflicts instead of silently violating them.
-->

## 1. Overview

<!--
A paragraph describing the technical approach at a high level.
What changes, where, and why.
-->

## 2. Architecture

<!--
How this feature fits into the existing system.
A diagram (mermaid, ascii) or a clear narrative is fine.
Mention which existing components are touched and which are new.
-->

## 3. Components

<!--
For each new or modified component:
- Name and responsibility
- Inputs and outputs
- Where it lives (file/folder)
- Addresses: US-XXX, FR-XXX, NFR-XXX (cite specific criteria when partial)
-->

### 3.1 <Component name>
- **Responsibility**: ...
- **Location**: ...
- **Addresses**: US-001 (criteria 1, 3), FR-001

## 4. Data model

<!--
New tables, collections, schemas, or modifications to existing ones.
Include field names, types, constraints, indices, relationships.
Note which user stories or requirements drive each entity.
-->

## 5. Contracts

<!--
APIs, events, message formats, function signatures that cross boundaries.
Be explicit about request/response shapes and error codes.
Cite the user story or FR each contract serves.
-->

## 6. Error handling

<!--
What can fail, how it's detected, how it's surfaced, and recovery paths.
Map each error scenario to the EARS criterion that covers it
(typically the "WHEN <invalid> THE SYSTEM SHALL ..." lines).
-->

## 7. Security & privacy

<!--
Auth, authorization, input validation, sensitive data handling,
audit logging. Skip if truly N/A and state why.
Cite NFR-XXX entries that drive these decisions.
-->

## 8. Key decisions

<!--
For each significant choice:
- The decision
- The alternative considered
- Why the alternative was rejected
- Addresses: US-XXX / FR-XXX / NFR-XXX (when applicable)
-->

### 8.1 <Decision title>
- **Decision**: ...
- **Alternative considered**: ...
- **Rejected because**: ...
- **Addresses**: ...

## 9. Risks & mitigations

<!--
Technical risks introduced by this design and how they will be handled.
-->

- **Risk**: ... → **Mitigation**: ...

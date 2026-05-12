---
spec: context-dump
phase: requirements
status: approved
created: 2026-05-11
updated: 2026-05-11
---

# Requirements: context-dump

## 1. Overview

Context dump gives a developer a single markdown output that can be pasted into any AI coding agent at the start of a session. It packages the project's steering context, a concise overview of all specs, and the full files for one selected spec so the agent can orient itself before receiving implementation instructions.

## 2. User stories

### US-001: Dump a named spec

**As a** developer using an AI coding agent
**I want to** generate a complete context dump for a specific spec
**So that** I can paste the relevant project context into the agent without manually gathering files

**Acceptance criteria:**
- WHEN the user requests context for an existing spec by name THE SYSTEM SHALL write one markdown document to stdout.
- WHEN the system writes the context dump THE SYSTEM SHALL begin with instructions telling the AI agent to read the context, not act yet, summarize it in three bullets, and then wait for further instructions.
- WHEN the system writes the context dump THE SYSTEM SHALL include the heading `# Jarvis Context Dump` after the initial agent instructions.
- WHEN the system writes the context dump THE SYSTEM SHALL include a `## Steering` section containing the complete contents of `product.md`, `tech.md`, and `structure.md`.
- WHEN the system writes each steering file THE SYSTEM SHALL label it with a markdown heading using its filename.
- WHEN the system writes the context dump THE SYSTEM SHALL include a `## Specs Overview` section with one summary line per project spec using the same status marker style as `jarvis spec status`.
- WHEN the system writes the context dump THE SYSTEM SHALL include a `## Active Spec: <name>` section containing the complete contents of `requirements.md`, `design.md`, and `tasks.md` for the selected spec.
- WHEN the system writes each active spec file THE SYSTEM SHALL label it with a markdown heading using its filename.
- WHEN an active spec phase file is draft or empty THE SYSTEM SHALL include that file in its corresponding section.
- WHEN an active spec phase file is missing THE SYSTEM SHALL include `<!-- phase file missing -->` in that file's corresponding section and continue producing the dump.
- WHEN front-matter is malformed in an included spec file THE SYSTEM SHALL include the raw file contents and continue producing the dump.
- WHEN the user requests context for a spec that does not exist THE SYSTEM SHALL exit with a user-facing error and list the specs that do exist.

### US-002: Infer the spec only when unambiguous

**As a** developer working in a project with a small number of specs
**I want to** omit the spec name only when there is exactly one possible spec
**So that** I avoid repeated typing without introducing implicit active state

**Acceptance criteria:**
- WHEN the user requests context without a spec name and the project has exactly one spec THE SYSTEM SHALL generate the context dump for that spec.
- WHEN the user requests context without a spec name and the project has no specs THE SYSTEM SHALL exit with a user-facing error and include a hint to run `jarvis spec new`.
- WHEN the user requests context without a spec name and the project has multiple specs THE SYSTEM SHALL exit with a user-facing error listing the available spec names.
- WHEN the user requests context without a spec name THE SYSTEM SHALL NOT rely on implicit active state.

### US-003: Receive predictable project errors

**As a** developer
**I want to** receive clear errors when context cannot be produced
**So that** I know how to recover without reading implementation details

**Acceptance criteria:**
- WHEN the user requests context outside a Jarvis project THE SYSTEM SHALL exit with code 1 and report "not a Jarvis project, run `jarvis init`".
- WHEN the user requests context and Jarvis cannot determine a valid target spec THE SYSTEM SHALL exit with code 1.
- WHEN the user requests context and recoverable spec file problems are present THE SYSTEM SHALL continue producing the dump with explicit placeholders where needed.

## 3. Functional requirements

### FR-001: Single-output contract
**Priority:** P0
**Persona:** developer using an AI coding agent

WHEN the context dump succeeds THE SYSTEM SHALL write the complete dump as a single markdown output to stdout.

**Rationale:** The feature exists to produce one paste-ready artifact for an AI agent.

### FR-002: Dump scope
**Priority:** P0
**Persona:** developer using an AI coding agent

WHEN the context dump succeeds THE SYSTEM SHALL include steering files, a project-wide specs overview, and the selected spec's three phase files.

**Rationale:** The agent needs durable product context, awareness of the wider spec landscape, and the full active spec context.

### FR-003: Excluded project data
**Priority:** P0
**Persona:** developer using an AI coding agent

WHEN the context dump succeeds THE SYSTEM SHALL NOT include project configuration data or the full contents of specs other than the selected spec.

**Rationale:** The dump should contain enough context for the agent without exposing unrelated project internals or creating excessive output.

### FR-004: Markdown delimiters
**Priority:** P1
**Persona:** developer using an AI coding agent

WHEN the context dump includes multiple files THE SYSTEM SHALL separate them with clear markdown headings rather than XML-style file tags.

**Rationale:** Included files are already markdown, and markdown headings keep the combined output readable when pasted into an agent.

## 4. Non-functional requirements

- **NFR-001**: WHEN the context dump succeeds THE SYSTEM SHALL operate entirely on local project files without network calls, telemetry, account access, or calls to an LLM.
- **NFR-002**: WHEN the same project files and target spec are provided THE SYSTEM SHALL produce deterministic markdown output.
- **NFR-003**: WHEN the context dump succeeds THE SYSTEM SHALL preserve included file contents exactly, except for surrounding dump headings and missing-file placeholders.
- **NFR-004**: WHEN the context dump command reports user-facing errors THE SYSTEM SHALL use the standard Jarvis error behavior and exit-code contract.

## 5. Out of scope

- Dumping the entire `.jarvis/` directory.
- Dumping every spec's full contents.
- Dumping a single phase by itself.
- Maintaining or reading implicit active spec state.
- Including `.jarvis/config.json`.
- Calling an LLM or generating an AI response.
- Editing, validating, approving, or repairing spec files.
- Changing steering files.
- Adding alternate output formats.
- Adding interactive selection.

## 6. Open questions

- None.

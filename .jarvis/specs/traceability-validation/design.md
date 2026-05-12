---
spec: traceability-validation
phase: design
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Design: traceability-validation

## 1. Overview

Validation reads the three spec files, extracts ID definitions and
references using regex over content stripped of code blocks and HTML
comments, then performs set operations to find orphans and missing
coverage. The fix prompt is rendered from a template populated with
the issue list.

## 2. Architecture

```
cli/commands/spec-validate.ts
        │
        ▼
core/traceability.ts ──► reads files via io/fs.ts
        │
        ▼
prompts/validate-fix.ts (only if issues found)
        │
        ▼
io/output.ts (stdout for prompt, stderr for report)
```

No new external dependencies. All logic in `core/traceability.ts`.

## 3. Components

### 3.1 `core/traceability.ts`
- **Responsibility**: extract IDs from a markdown string, compute the
  diff between defined and referenced IDs.
- **Location**: src/core/traceability.ts
- **Addresses**: US-001 (criteria 2, 3, 4), US-002, FR-001

### 3.2 `cli/commands/spec-validate.ts`
- **Responsibility**: orchestrate validation for one or all specs,
  produce exit code, trigger prompt rendering.
- **Location**: src/cli/commands/spec-validate.ts
- **Addresses**: US-001 (criteria 1, 5, 6), US-002

### 3.3 `prompts/validate-fix.ts`
- **Responsibility**: render the fix prompt from a structured issue
  list. Pure function: input → string.
- **Location**: src/prompts/validate-fix.ts
- **Addresses**: US-003

## 4. Data model

```typescript
type IdKind = 'US' | 'FR' | 'NFR';
type Id = `${IdKind}-${string}`;

type Issue =
  | { kind: 'orphan'; file: 'design.md' | 'tasks.md'; id: Id }
  | { kind: 'missing-coverage'; in: 'design.md' | 'tasks.md'; id: Id };

type ValidationResult = {
  spec: string;
  errors: Issue[];     // orphans
  warnings: Issue[];   // missing coverage
};
```

## 5. Contracts

```typescript
// core/traceability.ts
export function extractDefinedIds(requirementsMd: string): Set<Id>;
export function extractReferencedIds(md: string): Set<Id>;
export function validateSpec(files: {
  requirements: string;
  design: string;
  tasks: string;
}): { errors: Issue[]; warnings: Issue[] };

// prompts/validate-fix.ts
export function renderValidateFixPrompt(
  spec: string,
  result: { errors: Issue[]; warnings: Issue[] }
): string;
```

## 6. Error handling

- WHEN a spec folder is missing one of the three files THE SYSTEM SHALL
  report it as a structural error (not a traceability error) and skip
  the spec. Maps to US-001 implicitly: traceability checks require all
  three files.
- WHEN .jarvis/ is not found THE SYSTEM SHALL fail with exit code 1 and
  the standard "not a Jarvis project" message.

## 7. Security & privacy

N/A. Local filesystem reads only. No network, no credentials.

## 8. Key decisions

### 8.1 Regex over markdown parsing
- **Decision**: extract IDs with regex on plain text stripped of fenced
  code blocks and HTML comments.
- **Alternative considered**: full AST parsing with remark.
- **Rejected because**: adds 2 MB of dependencies for a problem regex
  solves with 30 lines. ID syntax is strict enough that regex is robust.
- **Addresses**: NFR-001 (performance), and aligns with tech.md "minimal
  dependencies".

### 8.2 Errors vs warnings split
- **Decision**: orphans are errors (block CI), missing coverage is
  warnings (informational).
- **Alternative considered**: both as errors.
- **Rejected because**: missing coverage has legitimate cases (a
  requirement deferred to a later spec). Forcing coverage would push
  users to fake references.
- **Addresses**: US-001 (criteria 2, 3, 4)

## 9. Risks & mitigations

- **Risk**: false positives from IDs inside template comments shipped
  with the package. → **Mitigation**: HTML-comment stripping in
  extraction, plus snapshot tests on the shipped templates.

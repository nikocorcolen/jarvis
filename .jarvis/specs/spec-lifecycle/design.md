---
spec: spec-lifecycle
phase: design
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Design: spec-lifecycle

## 1. Overview

The three commands share most of their machinery: locating `.jarvis/`,
parsing front-matter, validating phase ordering, and printing the right
prompt. The shared logic lives in a new module `core/spec-store.ts`,
which exposes a small typed API over the spec directory tree. Each
command is a thin orchestrator on top of it.

## 2. Architecture

```
cli/commands/spec-new.ts ────┐
cli/commands/spec-approve.ts ┼──► core/spec-store.ts ──► io/fs.ts
cli/commands/spec-status.ts ─┘            │
                                          ├─► core/frontmatter.ts
                                          ├─► core/templates.ts
                                          └─► core/types.ts

prompts/requirements.ts (real)
prompts/design.ts        (real)  ──► used by spec-new and spec-approve
prompts/tasks.ts         (real)
```

Two new things: `core/spec-store.ts` (the API) and the real bodies of
the three lifecycle prompts that are currently stubs.

## 3. Components

### 3.1 `core/spec-store.ts` (new)
- **Responsibility**: the only module that knows how a spec is laid
  out on disk. Exposes typed read/write operations and never throws
  for "expected" outcomes (missing spec, missing file) — it returns
  status objects the commands inspect.
- **Location**: `src/core/spec-store.ts`
- **Addresses**: US-001 (criteria 1, 2, 3, 5), US-002 (all),
  US-003 (criteria 1, 2), FR-001, FR-002

### 3.2 `cli/commands/spec-new.ts`
- **Responsibility**: validate the name (FR-002), call `spec-store`
  to create the spec, print the requirements prompt to stdout.
- **Location**: `src/cli/commands/spec-new.ts`
- **Addresses**: US-001 (all), FR-002

### 3.3 `cli/commands/spec-approve.ts`
- **Responsibility**: validate the phase order (FR-001) by reading
  the spec, mutate the corresponding front-matter via `spec-store`,
  print the next-phase prompt or the implementation-ready message.
- **Location**: `src/cli/commands/spec-approve.ts`
- **Addresses**: US-002 (all), FR-001

### 3.4 `cli/commands/spec-status.ts`
- **Responsibility**: list specs, format the table for humans or as
  JSON when `--json` is passed.
- **Location**: `src/cli/commands/spec-status.ts`
- **Addresses**: US-003 (all), NFR-001, NFR-003

### 3.5 `prompts/requirements.ts`, `prompts/design.ts`, `prompts/tasks.ts`
- **Responsibility**: pure renderers, one per phase. Replace the
  current stubs with the prompts agreed during product design
  (rules: read steering first, ask before writing, format constraints,
  Steering Impact section in tasks).
- **Location**: `src/prompts/{requirements,design,tasks}.ts`
- **Addresses**: US-001 (criterion 4), US-002 (criteria 2, 3)

## 4. Data model

```typescript
// core/spec-store.ts

export interface SpecPhaseState {
  /** Phase file exists on disk. */
  exists: boolean;
  /** Status read from front-matter; null when the file is missing or invalid. */
  status: 'draft' | 'approved' | null;
  /** ISO date from front-matter `updated`; null when unavailable. */
  updated: string | null;
}

export interface SpecState {
  name: string;
  requirements: SpecPhaseState;
  design: SpecPhaseState;
  tasks: SpecPhaseState;
}

export interface CreateSpecOptions {
  jarvisDir: string;
  name: string;
  /** Defaults to `() => new Date().toISOString().slice(0, 10)`. */
  today?: () => string;
}

export type ApproveResult =
  | { kind: 'approved'; previouslyApproved: false }
  | { kind: 'already-approved' }
  | { kind: 'out-of-order'; missingDependency: SpecPhase }
  | { kind: 'spec-not-found' }
  | { kind: 'phase-file-missing' };
```

## 5. Contracts

```typescript
// core/spec-store.ts

/** Validates an incoming name against FR-002. */
export function isValidSpecName(name: string): boolean;

/** Lists all spec directories under .jarvis/specs/. */
export async function listSpecs(jarvisDir: string): Promise<SpecState[]>;

/** Reads the state of a single spec. */
export async function readSpecState(
  jarvisDir: string,
  name: string,
): Promise<SpecState | null>;

/**
 * Creates a new spec directory with the three templates.
 * Throws SpecAlreadyExistsError if the directory exists.
 * Throws InvalidSpecNameError if the name fails FR-002.
 */
export async function createSpec(opts: CreateSpecOptions): Promise<void>;

/**
 * Approves a phase, enforcing FR-001 ordering.
 * Returns a result variant; the command decides what to print.
 */
export async function approvePhase(args: {
  jarvisDir: string;
  name: string;
  phase: SpecPhase;
  today?: () => string;
}): Promise<ApproveResult>;

// prompts/{requirements,design,tasks}.ts

export function renderRequirementsPrompt(specName: string): string;
export function renderDesignPrompt(specName: string): string;
export function renderTasksPrompt(specName: string): string;
```

## 6. Error handling

- **Spec not found** (US-002, US-003 implicitly): `spec-store` returns
  a result variant; the command translates it to exit code 1 with a
  clear message that includes the available spec names.
- **Phase file missing** (mid-approve): the spec exists but the phase
  file was deleted or never created. Returned as `phase-file-missing`;
  the command prints a recovery hint ("re-run `spec new <name>` to
  re-scaffold, or restore from git").
- **Invalid name** (FR-002): rejected synchronously, before any disk
  read. The error message includes the regex and one valid example.
- **Spec already exists** (US-001 criterion 5): caught in `spec-store`
  and surfaced as `SpecAlreadyExistsError`; the command exits 1 with a
  message pointing to the existing path.
- **Out-of-order approval** (FR-001): returned as `out-of-order` with
  the missing dependency; the command prints which phase to approve
  first.
- **Front-matter unparseable**: treated as `status: null` for status
  display; for `approve`, treated as a hard error with a message
  pointing to the malformed file.

## 7. Security & privacy

- All operations are confined to `.jarvis/specs/<name>/`. Path
  traversal via crafted names is prevented by FR-002 (regex disallows
  `..`, slashes, and other special characters).
- No external services are contacted (NFR-002).
- The CLI does not log spec content anywhere outside the project.

## 8. Key decisions

### 8.1 A single `spec-store` module instead of per-command file ops
- **Decision**: centralise the disk layout knowledge in
  `core/spec-store.ts`.
- **Alternative considered**: each command does its own filesystem
  reads and writes.
- **Rejected because**: three commands all need to know "how is a
  spec laid out, and how do I read its phase status?". Without a
  shared module, that knowledge duplicates and drifts.
- **Addresses**: US-001, US-002, US-003

### 8.2 Result variants instead of exceptions for expected outcomes
- **Decision**: `approvePhase` returns a tagged union; the command
  pattern-matches on it.
- **Alternative considered**: throw typed errors and catch them per
  command.
- **Rejected because**: "the previous phase is not approved yet" is
  not exceptional, it is the second-most-common outcome. Exceptions
  reserved for truly unexpected errors (FS permissions, malformed
  files).
- **Addresses**: FR-001, US-002

### 8.3 `spec status --json` instead of always-human output
- **Decision**: human-readable by default, `--json` flag for CI.
- **Alternative considered**: always machine-readable, render in a
  wrapper.
- **Rejected because**: the default user runs the command in a
  terminal and wants a glance, not JSON. CI is a secondary case
  served by the flag.
- **Addresses**: US-003 (criterion 1), NFR-003

### 8.4 Front-matter mutation, not template re-render
- **Decision**: `approvePhase` reads the current file, parses
  front-matter, mutates only `status` and `updated`, and writes back.
  The body is preserved exactly.
- **Alternative considered**: regenerate the file from a template +
  user content.
- **Rejected because**: the user and agent have edited the body
  freely. Any approach that re-renders risks losing content. The
  only safe operation is targeted front-matter mutation.
- **Addresses**: US-002 (criterion 1)

### 8.5 No automatic "active spec" tracking
- **Decision**: the lifecycle commands take an explicit `<name>`.
  No global "current spec" pointer.
- **Alternative considered**: track the last touched spec and let
  commands omit the name.
- **Rejected because**: implicit state is footgun-prone in a CLI
  used across multiple terminals and shells. Explicit names cost
  one tab-completion and remove a category of bugs.
- **Addresses**: US-002, US-003

## 9. Risks & mitigations

- **Risk**: the front-matter mutation could corrupt files with
  unusual YAML (multi-line strings, comments). → **Mitigation**:
  use `gray-matter` for both parse and stringify; snapshot tests
  cover round-trip preservation on the shipped templates.
- **Risk**: a partial write between phase files leaves a spec in
  an inconsistent state on disk crash. → **Mitigation**: `spec new`
  writes to a temp directory and `rename`s into place atomically;
  `spec approve` only mutates one file at a time, which is already
  atomic at the rename level.
- **Risk**: NFR-001 breaks once `listSpecs` reads all three files
  per spec. → **Mitigation**: parallelise the per-spec reads with
  `Promise.all`; bench in T-007.

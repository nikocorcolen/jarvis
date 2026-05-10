---
spec: bootstrap-init
phase: design
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Design: bootstrap-init

## 1. Overview

`friday init` is implemented as an orchestration command in
`src/cli/commands/init.ts`. It checks for an existing `.friday/`,
calls the existing `detectStack` helper, copies the steering
templates, and uses small `pre-fill` functions to inject detected
values into `tech.md` and `structure.md`. The optional bootstrap
prompt is rendered by `prompts/steering-bootstrap.ts` and printed
to stdout. Total flow is sequential and synchronous-friendly; no
parallelism is needed.

## 2. Architecture

```
cli/commands/init.ts
        │
        ├─► core/friday-dir.ts        (locate / detect existing .friday)
        ├─► core/detect-stack.ts      (read manifests)
        ├─► core/templates.ts         (load steering templates)
        ├─► core/init-prefill.ts      (NEW: pre-fill tech.md / structure.md)
        ├─► io/fs.ts                  (write files)
        ├─► prompts/steering-bootstrap.ts (render optional prompt)
        └─► io/output.ts              (success/info/prompt output)
```

One new module: `core/init-prefill.ts`. Everything else uses
existing scaffolding helpers.

## 3. Components

### 3.1 `cli/commands/init.ts`
- **Responsibility**: orchestrate the init flow. Detect existing
  `.friday/`, call detection, write files, print summary, optionally
  print bootstrap prompt.
- **Location**: `src/cli/commands/init.ts`
- **Addresses**: US-001 (criteria 1, 2, 3, 4), US-002 (all), US-003 (all)

### 3.2 `core/init-prefill.ts` (new)
- **Responsibility**: pure string transformations that inject detected
  values into `tech.md` and `structure.md` template strings. Receives
  the template content + detection result, returns modified content.
  No I/O.
- **Location**: `src/core/init-prefill.ts`
- **Addresses**: US-002 (criteria 1, 2, 3), FR-001

### 3.3 `core/detect-stack.ts` (already scaffolded)
- **Responsibility**: read manifests and return `DetectedStack`.
  Already exists; needs the manifest precedence rule applied.
- **Location**: `src/core/detect-stack.ts`
- **Addresses**: US-002 (criterion 1), FR-001

### 3.4 `prompts/steering-bootstrap.ts` (already scaffolded)
- **Responsibility**: render the optional prompt as a pure string.
  Real content goes here, replacing the stub.
- **Location**: `src/prompts/steering-bootstrap.ts`
- **Addresses**: US-002 (criterion 4)

## 4. Data model

```typescript
// New, in core/init-prefill.ts
interface FolderEntry {
  name: string;
  isDirectory: boolean;
}

// Reused from core/detect-stack.ts:
interface DetectedStack {
  language: string | null;
  runtime: string | null;
  manifests: string[];
  dependencies: string[];
}

// Reused from core/types.ts:
interface FridayConfig {
  formatVersion: number;   // 1
  createdAt: string;       // ISO 8601
  createdBy: string;       // "friday-cli@<version>"
}
```

## 5. Contracts

```typescript
// core/init-prefill.ts
export function prefillTechMd(
  template: string,
  stack: DetectedStack,
): string;

export function prefillStructureMd(
  template: string,
  topLevelFolders: string[],
): string;

export function listTopLevelFolders(
  repoRoot: string,
): Promise<string[]>;

// prompts/steering-bootstrap.ts (stub → real)
export function renderSteeringBootstrapPrompt(args: {
  detectedLanguage: string | null;
  manifests: string[];
}): string;
```

`detectStack` from `core/detect-stack.ts` keeps its current signature
but its body is updated to apply the FR-001 precedence rule
(stop after the first matching manifest for `language` / `runtime`,
keep collecting `manifests` array for visibility).

## 6. Error handling

- **`.friday/` already exists** (US-003): the command checks
  `pathExists(join(cwd, '.friday'))` BEFORE any write. If true, prints
  the message via `error()` and returns exit code 1. No partial state.
- **Manifest exists but is malformed** (e.g. broken package.json):
  `detectStack` already swallows JSON parse errors and returns
  partial detection. Init proceeds with whatever was detected.
- **Permission denied on write**: bubbles up as an unexpected error
  caught by the global handler in `cli/index.ts` (exit code 2).
- **The pre-fill string transforms cannot find a section header**
  (template drift): pre-fill leaves the section unchanged and continues.
  This is graceful degradation, not a failure.

## 7. Security & privacy

- The command never reads files outside the working directory tree.
- Dependency names from package.json are written to disk (in tech.md);
  these are public package identifiers, not secrets.
- The command does not transmit data anywhere (NFR-002).

## 8. Key decisions

### 8.1 Pre-fill via string substitution, not template engine
- **Decision**: `prefillTechMd` and `prefillStructureMd` use simple
  search-and-replace on known anchor patterns (e.g. the
  `<!-- TODO -->` markers under specific section headings).
- **Alternative considered**: introduce a templating engine
  (Handlebars, EJS, or even literal-template substitution).
- **Rejected because**: adds a dependency for a problem solved by
  ~30 lines of string handling. Pre-fill targets are stable.
- **Addresses**: US-002, NFR-001 (performance)

### 8.2 Bootstrap prompt only when code is detected
- **Decision**: empty repos get clean templates with no prompt.
- **Alternative considered**: always print a generic prompt.
- **Rejected because**: an empty-repo prompt would give the agent
  nothing to inspect and would generate hallucinated steering.
- **Addresses**: US-001 (criterion 4 implicitly), US-002 (criteria 4, 5)

### 8.3 Refuse instead of `--force` overwrite
- **Decision**: the MVP refuses if `.friday/` exists and asks the
  user to delete it manually.
- **Alternative considered**: `--force` flag to wipe and recreate.
- **Rejected because**: low-value, high-risk feature for v0.1.
  The manual-delete escape hatch is unambiguous and never silently
  destroys work.
- **Addresses**: US-003

### 8.4 Listing top-level folders, not full tree
- **Decision**: `listTopLevelFolders` returns only direct children.
- **Alternative considered**: walk a few levels deep to seed
  structure.md with a richer tree.
- **Rejected because**: deeper trees are noisy in a steering file
  and quickly go stale. Section 1 of structure.md asks for a
  high-level picture; the human refines depth as needed.
- **Addresses**: US-002 (criterion 3)

## 9. Risks & mitigations

- **Risk**: dependency lists in tech.md become stale as the project
  evolves. → **Mitigation**: pre-filled entries are explicitly tagged
  "(detected, classify as load-bearing or replaceable)" so the human
  notices they need review. Re-running `init` is not the answer; the
  human edits steering as the project changes.
- **Risk**: the pre-fill anchors drift from the templates and the
  substitution silently no-ops. → **Mitigation**: snapshot tests
  pin both the template anchors and the pre-fill output together.
- **Risk**: large repos have hundreds of top-level entries (rare but
  possible). → **Mitigation**: `listTopLevelFolders` is bounded by
  NFR-001 (1000 entries) and the dependency list is capped at 10.

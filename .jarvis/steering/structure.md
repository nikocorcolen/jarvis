---
type: steering
scope: structure
updated: 2026-05-10
---

# Structure

## 1. Folder layout

- `src/cli/` — CLI entry point and command files. Orchestration only.
- `src/cli/commands/` — one file per command, each exporting `meta`
  and `run(args): Promise<number>`.
- `src/core/` — pure domain logic. No filesystem, no logging, no
  network. Trivially testable.
- `src/io/` — boundaries with the operating system: filesystem
  wrappers (`fs.ts`) and stdout/stderr helpers (`output.ts`).
- `src/prompts/` — pure renderers, one per generated prompt. Same
  input, identical output.
- `templates/spec/` — the three markdown templates copied by
  `spec new` (requirements.md, design.md, tasks.md).
- `templates/steering/` — the three steering templates used by
  `init` (product.md, tech.md, structure.md).
- `tests/` — unit, integration, and e2e tests, mirroring `src/`.
- `dist/` — compiled JavaScript output, published to npm.
- `dist-tests/` — compiled tests, never published.
- `.jarvis/` — Jarvis's own specs, written in Jarvis (dogfooding).

## 2. Where things go

- New CLI command → `src/cli/commands/<name>.ts`, registered in
  `src/cli/index.ts`.
- New prompt → `src/prompts/<name>.ts`, exporting one pure function
  named `render<Name>Prompt(...)`.
- New domain logic → first try to extend an existing `core/` module;
  create a new file only when the responsibility is clearly distinct.
- New filesystem helper → `src/io/fs.ts`. Do not import `node:fs`
  outside this file (and `core/jarvis-dir.ts`, which uses
  `existsSync` synchronously by design).
- New shared type → `src/core/types.ts`, but only when used by 2+
  modules. Otherwise keep types local to their module.
- New template → `templates/<kind>/<name>.md`, loaded via
  `loadTemplate(kind, name)` from `core/templates.ts`.
- Test for a module at `src/X/Y.ts` → `tests/Y.test.ts` (flat layout,
  not mirrored deep). Use `node:test`, no extra framework.

## 3. Naming conventions

- **Files**: kebab-case (`spec-validate.ts`, not `specValidate.ts`).
- **Folders**: kebab-case.
- **Types and interfaces**: PascalCase (`SpecState`, `ApproveResult`).
- **Type unions for results**: tagged with a `kind` field
  (`{ kind: 'approved' } | { kind: 'out-of-order' }`).
- **Functions**: camelCase verbs (`approvePhase`, `listSpecs`).
- **Constants**: SCREAMING_SNAKE_CASE for true constants
  (`FORMAT_VERSION`, `PHASES`); camelCase for derived values.
- **Prompt renderers**: prefix `render`, suffix `Prompt`
  (`renderRequirementsPrompt`).
- **Spec names** (filesystem): lowercase kebab-case, 1-50 chars,
  enforced by `isValidSpecName`.

## 4. Import boundaries

A violation of these boundaries is treated as a steering-impact
change, not a casual refactor.

ESM extensions: imports from local files always end in `.js` even
though the source is `.ts`. This is required by NodeNext module
resolution.

## 5. Patterns to follow

- **Command anatomy**: every command exports `meta` (name and
  description) and an async `run(args)` that returns a number used
  as the process exit code. See `src/cli/commands/init.ts` for the
  canonical example.
- **Result variants**: when an operation has multiple expected
  outcomes (not just success/failure), return a tagged union and
  pattern-match on `kind` in the caller. See `ApproveResult` in
  `core/spec-store.ts`.
- **Dependency injection for time and process state**: any function
  whose behaviour depends on `Date.now()` or `process.cwd()` must
  accept those as optional parameters with sensible defaults. This
  is what makes commands testable. See `init.run` and
  `approvePhase`.
- **Atomic writes**: when creating multi-file artifacts (a spec
  directory), stage in a tmp directory and `rename` into place so
  a partial write never leaves the project in a half-baked state.
  See `createSpec`.
- **Front-matter mutation, not re-render**: when updating a spec
  file, parse front-matter, change only the relevant fields, and
  re-stringify with `gray-matter`. The body is preserved
  byte-for-byte. Never regenerate from a template.

## 6. Anti-patterns

- Calling `console.log` / `console.error` directly. Always go through
  `src/io/output.ts`. The stdout/stderr separation is part of the
  product contract.
- `process.exit(N)`. Set `process.exitCode` and let the program
  return naturally. Hard exit kills async cleanup.
- Catching exceptions to drive control flow for expected outcomes.
  Use result variants instead.
- Adding a dependency to solve a 30-line problem. The runtime list
  is small on purpose. New deps require justification in a steering
  update.
- Mutating steering files from a command. `init` pre-fills the
  observable parts on first run; nothing else writes to steering.
- Generating prompts with template engines or string concatenation
  spread across files. Prompts are pure functions with their full
  text inline; this is a feature, not a limitation.
- Writing tests that depend on the order of `it` blocks within a
  suite, or that share state across tests. Each test sets up its
  own tmp directory.
---
type: steering
scope: tech
updated: 2026-05-10
---

# Tech

## 1. Stack

- **Language**: TypeScript 5
- **Runtime**: Node.js 20+ (ESM only, no CJS)
- **Framework**: none. Plain Node.js.

## 2. Key dependencies

- **commander**: CLI argument parsing and subcommand registration. Load-bearing.
- **gray-matter**: YAML front-matter parsing in markdown files. Replaceable.
- **kleur**: terminal colors (smaller than chalk). Replaceable.
- **prompts**: interactive wizard input for `init`. Replaceable.

That is the entire runtime dependency list and it is intended to stay
that way. Each new dependency is a decision that requires explicit
justification.

## 3. External services

None. Jarvis operates entirely on the local filesystem. It does not
make network calls, does not call any LLM, and does not phone home
for telemetry. This is a hard guarantee, not a soft preference.

## 4. Storage & data

All persistent state lives under `.jarvis/` at the repo root:

- `.jarvis/config.json` — project metadata with `formatVersion`.
- `.jarvis/steering/{product,tech,structure}.md` — human-written.
- `.jarvis/specs/<name>/{requirements,design,tasks}.md` — collaborative
  human + agent.

Files are UTF-8 markdown with YAML front-matter. The `formatVersion`
field exists from day one to support future migrations cleanly.

## 5. Constraints & conventions

- **Pure core / dirty edges.** `src/core/` has no I/O and no logging.
  Filesystem and stdout/stderr live in `src/io/`. Commands in
  `src/cli/commands/` orchestrate; they do not contain logic.
- **stdout is the command's product** (prompts to copy, JSON, dumps);
  **stderr is human-facing progress**. Never `console.log` directly;
  always go through `src/io/output.ts`.
- **Exit codes are part of the contract.** 0 = success or informational,
  1 = user-facing error, 2 = unexpected bug. CI relies on this.
- **Result variants over exceptions** for expected outcomes (out of
  order, already approved, spec not found). Exceptions reserved for
  truly unexpected failures.
- **Deterministic prompts.** All prompt renderers in `src/prompts/`
  are pure functions: same input, identical output. They are tested
  with snapshots.
- **Steering is human writing.** Agents propose changes (via the
  Steering Impact section in tasks.md); they never edit steering
  files directly. The CLI must not generate or rewrite steering
  except for the observable pre-fill in `init`.
- **English in prompts and templates.** LLMs follow English
  instructions more reliably and the EARS / US / FR / NFR vocabulary
  is anglophone. The user's conversation with the agent can be in
  any language.

## 6. Out of bounds

- **No LLM calls in the MVP.** `jarvis spec fill` (calling an LLM
  directly) is a v1.x feature gated behind explicit configuration.
  The MVP is intentionally agent-agnostic.
- **No telemetry, no analytics, no auto-update.** Ever, by design,
  not just in the MVP.
- **No bundlers in source.** The package is published as plain ESM
  JavaScript. No webpack, no rollup, no esbuild as a runtime
  dependency.
- **No global state.** Dependencies are passed explicitly. The CLI
  must remain trivially testable by injecting `cwd`, `now`, etc.
- **No plugins or extensibility hooks** in the MVP. Premature
  extension points are a maintenance tax that pays off only when
  there is real demand we cannot yet justify.
- **No watch mode, no daemon.** Jarvis runs, does its work, exits.
---
type: steering
scope: structure
updated: <YYYY-MM-DD>
---

# Structure

<!--
This file describes the codebase layout and the conventions that
keep it consistent: where things live, how they're named, and how
new code should be added.

Agents reading this file use it to decide WHERE to place new files
and HOW to name them. If a new feature needs a folder that doesn't
fit the current layout, the agent flags it as a steering impact
instead of inventing a new convention.

Update this file when the layout itself evolves (new top-level
folder, new layer, new naming rule).
-->

## 1. Folder layout

<!--
The top-level folders of the repo with a one-line description each.
Use a tree if helpful, but the descriptions matter more than the tree.

Example:
- src/        Application code (entry point: src/index.ts)
- src/cli/    Command definitions and argument parsing
- src/core/   Domain logic, no I/O dependencies
- src/io/     Filesystem, network, and process boundaries
- tests/      Unit and integration tests, mirroring src/
- templates/  Markdown templates shipped with the package
- docs/       User-facing documentation
-->

<!-- TODO -->

## 2. Where things go

<!--
Rules for adding new code. Resolve common questions in advance:
"where does a new command live?", "where do shared types go?",
"where does a new template belong?"

Be opinionated. The goal is that two contributors solving the
same problem end up putting the file in the same place.

Examples:
- New CLI command → src/cli/commands/<name>.ts
- New template → templates/<phase>.md
- Shared types → src/core/types.ts (only if used by 2+ modules)
- Test for X → tests/<same path as X>.test.ts
-->

<!-- TODO -->

## 3. Naming conventions

<!--
File names, folder names, identifier styles. Keep it short and
strict; ambiguity here causes endless small inconsistencies.

Examples:
- Files: kebab-case (spec-validate.ts, not specValidate.ts)
- Folders: kebab-case
- Types/interfaces: PascalCase
- Constants: SCREAMING_SNAKE_CASE
- Test files: <name>.test.ts next to the source file's mirror in tests/
-->

<!-- TODO -->

## 4. Import boundaries

<!--
Which layers can import which. Prevents accidental coupling.
If the product is small, this section can be brief or omitted.

Example:
- core/   imports from: nothing (pure domain logic)
- io/     imports from: core
- cli/    imports from: core, io
- tests/  imports from: anywhere
-->

<!-- TODO -->

## 5. Patterns to follow

<!--
Repeated patterns that should stay consistent across the codebase.
Examples: error handling, command structure, template loading.

Each pattern: a name, a one-line description, and a pointer to a
canonical example in the code.
-->

<!-- TODO -->

## 6. Anti-patterns

<!--
Things that have been tried and rejected, or that violate the
boundaries above. Saves future contributors from re-inventing
mistakes.
-->

<!-- TODO -->

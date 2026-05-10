---
type: steering
scope: tech
updated: <YYYY-MM-DD>
---

# Tech

<!--
This file describes HOW this product is built at the technology level:
languages, frameworks, services, and the constraints any new feature
must respect.

Agents reading this file treat its contents as HARD CONSTRAINTS.
If a feature cannot be built within these constraints, the agent
must flag the conflict instead of silently violating them.

Update this file when something cross-cutting changes (new service,
new framework, deprecation of a library used project-wide).
-->

## 1. Stack

<!--
Languages, runtimes, primary frameworks. Be concrete:
"Node.js 20+, TypeScript 5, ESM only" beats "JavaScript".
-->

- **Language**: <!-- TODO -->
- **Runtime**: <!-- TODO -->
- **Framework**: <!-- TODO -->

## 2. Key dependencies

<!--
Libraries that are project-wide standards (not feature-specific).
For each one, note what it's used for and whether it's load-bearing
(swapping it out would touch many places) or replaceable.

Example:
- **commander**: CLI argument parsing. Load-bearing.
- **gray-matter**: front-matter parsing. Replaceable.
-->

<!-- TODO -->

## 3. External services

<!--
Third-party services this product depends on at runtime.
For each: what it's for, whether it's required or optional,
and the fallback if it's unavailable.

If the product has no external services, write "None." and move on.
-->

<!-- TODO -->

## 4. Storage & data

<!--
Where data lives: filesystem layout, databases, caches, queues.
Conventions for naming, encoding, schema evolution.
-->

<!-- TODO -->

## 5. Constraints & conventions

<!--
Rules that apply to all code in this repo. Things an agent must
not violate without explicit approval.

Examples:
- All public APIs must have TypeScript types exported.
- No network calls in core logic; gate them behind interfaces.
- Errors are returned, not thrown, in library code.
- Logs go to stderr; stdout is reserved for command output.
-->

<!-- TODO -->

## 6. Out of bounds

<!--
Technologies, patterns, or services that are explicitly rejected
for this product, with a one-line reason.

This is the tech-level mirror of product.md's "Non-goals".

Examples:
- No ORM. Hand-written SQL with a query builder is the standard.
- No global state. Pass dependencies explicitly.
- No bundlers in source — published as plain ESM.
-->

<!-- TODO -->

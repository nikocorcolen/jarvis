---
spec: bootstrap-init
phase: requirements
status: approved
created: 2026-05-10
updated: 2026-05-10
---

# Requirements: bootstrap-init

## 1. Overview

`friday init` is the entry point to a Friday project. It creates the
`.friday/` directory with steering templates and configuration, detects
the existing tech stack when applicable, and emits an optional prompt
to help the user fill steering sections that cannot be inferred from
code. Without this command, no other Friday command has a place to write.

## 2. User stories

### US-001: Initialize a new empty project

**As a** developer starting a fresh project
**I want to** run `friday init` and get a working `.friday/` directory
**So that** I can immediately start writing my first spec

**Acceptance criteria:**
- WHEN the user runs `friday init` in a directory without `.friday/`
  THE SYSTEM SHALL create `.friday/` with subdirectories `steering/`
  and `specs/`
- WHEN creating the steering directory THE SYSTEM SHALL copy the three
  steering templates (product.md, tech.md, structure.md) into it
- WHEN initialization completes THE SYSTEM SHALL write a
  `.friday/config.json` file with `formatVersion`, `createdAt` and
  `createdBy` fields
- WHEN initialization completes THE SYSTEM SHALL print a success
  summary to stderr listing what was created

### US-002: Initialize on top of an existing codebase

**As a** developer adopting Friday on an existing project
**I want to** run `friday init` and have it pre-fill what it can detect
**So that** I do not have to type information that is already in my
package.json or equivalent

**Acceptance criteria:**
- WHEN the user runs `friday init` and the current directory contains
  a recognized manifest (package.json, pyproject.toml, go.mod, Cargo.toml)
  THE SYSTEM SHALL pre-fill section 1 ("Stack") of `tech.md` with the
  detected language and runtime
- WHEN package.json is present THE SYSTEM SHALL pre-fill section 2
  ("Key dependencies") of `tech.md` with up to 10 of its dependencies
  marked as "(detected, classify as load-bearing or replaceable)"
- WHEN any code is detected THE SYSTEM SHALL pre-fill section 1
  ("Folder layout") of `structure.md` with the top-level folders found
  in the repo, ignoring `node_modules`, `.git`, `dist`, `build`, and
  hidden folders starting with `.`
- WHEN code is detected THE SYSTEM SHALL print the steering bootstrap
  prompt to stdout at the end of initialization
- WHEN no code is detected THE SYSTEM SHALL leave all steering sections
  marked `<!-- TODO -->` and SHALL NOT print the bootstrap prompt

### US-003: Refuse to overwrite an existing project

**As a** developer who already has a Friday project
**I want to** be protected from accidentally re-initializing
**So that** I do not lose existing steering or specs

**Acceptance criteria:**
- WHEN the user runs `friday init` and `.friday/` already exists at the
  current directory THE SYSTEM SHALL exit with code 1 without modifying
  any file
- WHEN refusing to overwrite THE SYSTEM SHALL print a clear message
  pointing to the existing `.friday/` path and suggesting the user
  delete it manually if a fresh start is intended

## 3. Functional requirements

### FR-001: Manifest precedence
**Priority:** P1
**Persona:** developer

WHEN multiple manifests are present THE SYSTEM SHALL prefer them in this
order for stack detection: package.json, pyproject.toml, go.mod, Cargo.toml.

**Rationale:** monorepos and polyglot projects exist; picking the first
match deterministically avoids surprising users with different output
between runs.

## 4. Non-functional requirements

- **NFR-001**: `friday init` SHALL complete in under 500 ms on a
  modern laptop in a directory with up to 1000 top-level entries.
- **NFR-002**: The command SHALL operate without network access.
- **NFR-003**: All file writes SHALL use the project's working directory
  as their root; the command SHALL never write outside it.

## 5. Out of scope

- Interactive wizard asking product/audience questions. Steering is
  human-written; a wizard would invent answers.
- Detecting frameworks beyond language/runtime (React vs Vue, FastAPI
  vs Django). The bootstrap prompt covers this conversationally.
- Migrating from other spec formats (Kiro, etc.).
- Re-initialization with `--force` to overwrite. Out of MVP.
- Initializing inside a subdirectory of an existing Friday project.

## 6. Open questions

- [x] Should `init` work from a subdirectory? → No. It writes `.friday/`
      at the current working directory. The user is responsible for
      running it at the repo root.
- [x] Should the bootstrap prompt also cover product.md? → No. Product
      questions cannot be inferred from code; the prompt only assists
      tech.md and structure.md. Product.md is filled by the human alone.

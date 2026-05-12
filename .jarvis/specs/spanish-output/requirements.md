---
spec: spanish-output
phase: requirements
status: approved
created: 2026-05-11
updated: 2026-05-12
---

# Requirements: spanish-output

## 1. Overview

The `jarvis-cli` currently outputs all messages and AI prompts strictly in English. This feature introduces a configurable localization system that allows users to interact with the CLI and receive AI prompts in Spanish. The language preference will be stored in the project's `.jarvis/config.json`. The default language will be Spanish.

## 2. User stories

### US-001: Configure project language

**As a** developer initializing a new project
**I want to** specify my preferred language for CLI interactions
**So that** the CLI communicates with me in a language I am comfortable with

**Acceptance criteria:**
- WHEN running `jarvis init` THE SYSTEM SHALL support a flag `--lang=en` or `--lang=es` to set the project's language.
- WHEN a language is selected THE SYSTEM SHALL save this preference (`"lang": "en"` or `"es"`) in `.jarvis/config.json`.
- WHEN no language is explicitly provided THE SYSTEM SHALL default to Spanish (`"lang": "es"`).
- WHEN running `jarvis init` on an existing project (which refuses to re-init) THE SYSTEM SHALL output the refusal message in the language configured in the existing `.jarvis/config.json`, falling back to Spanish if the key is missing.

### US-002: Localized human-facing output

**As a** developer using the jarvis-cli
**I want to** see terminal output (success messages, errors, next steps) in my configured language
**So that** I can understand the state of my specs and what to do next without mental translation

**Acceptance criteria:**
- WHEN `.jarvis/config.json` has `"lang": "es"` THE SYSTEM SHALL output all stderr progress messages (e.g., `✓ Created spec...`) in Spanish.
- WHEN `.jarvis/config.json` has `"lang": "es"` THE SYSTEM SHALL output the "Next steps" human-readable block from `jarvis spec status` in Spanish.
- WHEN `.jarvis/config.json` has `"lang": "es"` THE SYSTEM SHALL output all error messages in Spanish.

### US-003: Localized AI Prompts

**As a** developer copying prompts to an AI agent
**I want to** ensure the generated prompts are in my configured language
**So that** I can interact with the AI in my preferred language

**Acceptance criteria:**
- WHEN `.jarvis/config.json` has `"lang": "es"` THE SYSTEM SHALL output the stdout AI prompts (e.g., "You are acting as a product owner...") translated to Spanish.
- WHEN `.jarvis/config.json` has `"lang": "es"` THE SYSTEM SHALL generate the markdown templates (`requirements.md`, `design.md`, `tasks.md`, steering files) with Spanish comments. Note: standard structural markers (like `Addresses: US-001`) might remain English if it affects the parser, though the prompt instructions should explicitly be in Spanish.

## 3. Functional requirements

### FR-001: Fallback behavior
**Priority:** P0
**Persona:** developer

WHEN `.jarvis/config.json` is missing the `lang` key, or the config file itself is missing or malformed THE SYSTEM SHALL default to Spanish (`es`) output.

**Rationale:** The user explicitly requested Spanish as the default configuration.

## 4. Non-functional requirements

- **NFR-001**: Adding a new language in the future should not require rewriting core orchestration logic; the translation strings should be isolated.

## 5. Out of scope

- Detecting the operating system's locale automatically. The language is tied to the *project* config, not the local machine, to ensure all team members see the same output.
- Supporting languages other than English (`en`) and Spanish (`es`) at this time.

## 6. Open questions

- None.

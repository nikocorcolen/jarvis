---
spec: spanish-output
phase: design
status: approved
created: 2026-05-11
updated: 2026-05-12
---

# Design: spanish-output

## 1. Overview

To support a localized CLI experience, we will introduce a lightweight internationalization (i18n) module within the `core` layer. This module will read the `lang` preference from `.jarvis/config.json`. The CLI commands, output utilities, and AI prompt renderers will use a centralized dictionary object for all strings printed to `stderr` and `stdout`. The default language will be Spanish (`es`).

## 2. Architecture

The changes will be primarily contained within the `core`, `io`, and `prompts` boundaries:
- **`src/core/types.ts`**: Update the `JarvisConfig` interface to include an optional `lang` property.
- **`src/core/i18n.ts`** (New): A new module responsible for holding the language dictionaries (English and Spanish) and providing a simple getter function for translations.
- **`src/core/config.ts`** (New or existing): Modify how `config.json` is read to expose the configured language, defaulting to `'es'`.
- **`src/cli/commands/*.ts`**: Update commands to use the translation getter for their human-facing `stderr` outputs.
- **`src/prompts/*.ts`**: Update prompt renderers to use the translation getter so AI prompts are localized.

## 3. Components

### 3.1 JarvisConfig Type Update
- **Responsibility**: Extend the existing configuration type to support the language preference.
- **Location**: `src/core/types.ts`
- **Addresses**: US-001 (criterion 2)

### 3.2 I18n Module
- **Responsibility**: Maintain strongly-typed dictionary records for supported languages (`en`, `es`). Export a function `t(key: TranslationKey, args?: Record<string, string>): string`.
- **Location**: `src/core/i18n.ts`
- **Addresses**: US-002, US-003, NFR-001

### 3.3 Config Reader
- **Responsibility**: Read `.jarvis/config.json` and parse the `lang` property. If the file or property is missing, return `'es'`.
- **Location**: `src/core/jarvis-dir.ts` or a new `src/core/config.ts`
- **Addresses**: US-001 (criterion 3), FR-001

### 3.4 CLI and Prompts Refactoring
- **Responsibility**: Replace hardcoded English strings in `src/cli/commands/*.ts` and `src/prompts/*.ts` with calls to the `t()` function based on the current configuration. 
- **Location**: `src/cli/commands/*.ts`, `src/prompts/*.ts`
- **Addresses**: US-002, US-003

## 4. Data model

**Updated `JarvisConfig` (in `src/core/types.ts`)**:
```typescript
export interface JarvisConfig {
  formatVersion: number;
  createdAt: string;
  createdBy: string;
  lang?: 'en' | 'es'; // New field
}
```

## 5. Contracts

**`i18n.ts` exports:**
```typescript
// Define all possible translation keys strictly
export type TranslationKey = 
  | 'init.createdDir'
  | 'init.noCodeDetected'
  | 'prompt.productOwner'
  // ... and so on

export function t(lang: 'en' | 'es', key: TranslationKey, args?: Record<string, string | number>): string;
```

## 6. Error handling

- If `.jarvis/config.json` fails to parse or the `lang` key is invalid, the config reader will safely catch the error and return the fallback language `'es'` (FR-001).
- If a specific translation key is missing, the `t()` function should gracefully fallback to the Spanish string (or English if that's the only one available) to avoid runtime crashes.

## 7. Security & privacy

N/A.

## 8. Key decisions

### 8.1 Typed Dictionary vs. External JSON files for Translations
- **Decision**: Use strongly-typed TypeScript objects for the dictionaries (`en` and `es`) directly in the source code.
- **Alternative considered**: Loading `locales/es.json` at runtime.
- **Rejected because**: Compile-time safety is critical to avoid missing translation keys during refactoring.
- **Addresses**: NFR-001

### 8.2 Initialization Flag
- **Decision**: Add a `--lang <lang>` flag to `jarvis init`. If omitted, it defaults to `es`.
- **Addresses**: US-001 (criterion 1)

## 9. Risks & mitigations

- **Risk**: Localizing prompts might cause the LLMs to misunderstand structural rules (e.g. if we translate "Addresses:" or "US-001").
- **Mitigation**: We will ensure the translation targets the *instructions* sent to the AI, but we explicitly tell the AI to use the correct English canonical markers (like `Addresses:`) in the generated output to preserve internal parser logic.

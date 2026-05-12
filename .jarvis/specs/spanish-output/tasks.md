---
spec: spanish-output
phase: tasks
status: approved
created: 2026-05-11
updated: 2026-05-12
---

# Tasks: spanish-output

## Task list

- [ ] **T-001**: Update JarvisConfig type to include lang property
      Files: `src/core/types.ts`
      Done when: `JarvisConfig` interface includes `lang?: 'en' | 'es'`.
      Addresses: US-001 (criterion 2)

- [ ] **T-002**: Implement i18n module and translation dictionaries
      Files: `src/core/i18n.ts`, `tests/i18n.test.ts`
      Done when: The module exports the `TranslationKey` type covering all current CLI messages and prompts, an `en` dictionary, an `es` dictionary, and a `t(lang, key, args?)` function that successfully returns translated strings.
      Addresses: US-002, US-003, FR-001, NFR-001

- [ ] **T-003**: Update config reading logic to expose current language defaulting to Spanish
      Files: `src/core/jarvis-dir.ts`, `tests/jarvis-dir.test.ts`
      Done when: A new function `readJarvisConfig()` is added (or `requireJarvisDir` is updated) that parses `.jarvis/config.json`, extracts the `lang` property, and safely falls back to `'es'` if the file/key is missing or malformed.
      Addresses: US-001 (criterion 3), FR-001

- [ ] **T-004**: Add `--lang` flag to `init` command
      Files: `src/cli/commands/init.ts`, `tests/init.e2e.test.ts`
      Done when: `jarvis init --lang=en` saves `"lang": "en"` to `.jarvis/config.json`. If omitted, it saves `"lang": "es"`.
      Addresses: US-001 (criteria 1, 2, 3)

- [ ] **T-005**: Wire translations into the `init` command outputs and prompts
      Files: `src/cli/commands/init.ts`, `src/prompts/steering-bootstrap.ts`, `tests/init.e2e.test.ts`
      Done when: The `init` command uses `t()` for its messages to `stderr`, and the `steering-bootstrap` prompt uses `t()` so it renders in Spanish by default.
      Addresses: US-002, US-003

- [ ] **T-006**: Wire translations into the spec lifecycle commands (`new`, `approve`) and phase prompts
      Files: `src/cli/commands/spec-new.ts`, `src/cli/commands/spec-approve.ts`, `src/prompts/*.ts`, `tests/spec-lifecycle.e2e.test.ts`
      Done when: Success/error messages to `stderr` and AI prompts for requirements, design, and tasks on `stdout` are translated using `t()`.
      Addresses: US-002, US-003

- [ ] **T-007**: Wire translations into the `spec status` command
      Files: `src/cli/commands/spec-status.ts`, `src/core/traceability.ts`
      Done when: The "Next steps:" block and the instructional action texts are translated via `t()`. JSON output actions should also use the translated text.
      Addresses: US-002

- [ ] **T-008**: Wire translations into the `context` command
      Files: `src/cli/commands/context.ts`, `src/prompts/context-dump.ts`
      Done when: Error messages to `stderr` use `t()`. The agent preface in the output dump to `stdout` is translated via `t()`.
      Addresses: US-002, US-003

- [ ] **T-009**: Document the new language configuration and defaults
      Files: `README.md`
      Done when: The `README.md` explains that the default language is Spanish (`es`), describes the `--lang` flag for `jarvis init`, and explains how to manually change the language.
      Addresses: US-001

## Steering Impact

- File: `tech.md`
- Change: Add a note under Constraints & conventions stating that all CLI output and AI prompts must be translatable via the `i18n` module.
- Rationale: This is a cross-cutting architectural rule for all future CLI commands and prompts.

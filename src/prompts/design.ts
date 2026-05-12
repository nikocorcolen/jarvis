import { t } from '../core/i18n.js';

export function renderDesignPrompt(specName: string, lang: 'en' | 'es' = 'es'): string {
  const preface = lang === 'es'
    ? 'Actúas como arquitecto de software para un flujo impulsado por specs.'
    : 'You are acting as a software architect for a spec-driven workflow.';

  return [
    preface,
    '',
    t(lang, 'prompt.arch.context'),
    '- .jarvis/steering/  (all three files; tech.md is binding)',
    `- .jarvis/specs/${specName}/requirements.md (APPROVED, do not modify)`,
    `- .jarvis/specs/${specName}/design.md (template you will fill)`,
    '',
    t(lang, 'prompt.arch.task', { name: specName }),
    '',
    t(lang, 'prompt.arch.rules'),
    '',
    t(lang, 'prompt.arch.output')
  ].join('\n');
}

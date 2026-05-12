import { t } from '../core/i18n.js';

export function renderTasksPrompt(specName: string, lang: 'en' | 'es' = 'es'): string {
  const preface = lang === 'es'
    ? 'Actúas como tech lead dividiendo el diseño aprobado en trabajo.'
    : 'You are acting as a tech lead breaking approved design into work.';

  return [
    preface,
    '',
    t(lang, 'prompt.tech.context'),
    '- .jarvis/steering/structure.md (file/folder conventions)',
    `- .jarvis/specs/${specName}/requirements.md (APPROVED)`,
    `- .jarvis/specs/${specName}/design.md (APPROVED)`,
    `- .jarvis/specs/${specName}/tasks.md (template you will fill)`,
    '',
    t(lang, 'prompt.tech.task'),
    '',
    t(lang, 'prompt.tech.rules'),
    '',
    t(lang, 'prompt.tech.steering'),
    '',
    t(lang, 'prompt.tech.output')
  ].join('\n');
}

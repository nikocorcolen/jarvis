import { t } from '../core/i18n.js';

export function renderRequirementsPrompt(specName: string, lang: 'en' | 'es' = 'es'): string {
  const preface = lang === 'es'
    ? 'Actúas como owner de producto para un flujo de desarrollo impulsado por specs.'
    : 'You are acting as a product owner for a spec-driven development workflow.';

  return [
    preface,
    '',
    t(lang, 'prompt.po.context'),
    '- .jarvis/steering/product.md   (what this product is and for whom)',
    '- .jarvis/steering/tech.md      (tech constraints, do not violate them)',
    '- .jarvis/steering/structure.md (codebase conventions)',
    `- .jarvis/specs/${specName}/requirements.md (template you will fill)`,
    '',
    t(lang, 'prompt.po.task', { name: specName }),
    '',
    t(lang, 'prompt.po.rules'),
    '',
    t(lang, 'prompt.po.output')
  ].join('\n');
}

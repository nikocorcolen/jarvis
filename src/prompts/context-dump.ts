import { t } from '../core/i18n.js';

export interface ContextFile {
  filename:
    | 'product.md'
    | 'tech.md'
    | 'structure.md'
    | 'requirements.md'
    | 'design.md'
    | 'tasks.md';
  content: string;
}

export interface ContextDumpInput {
  specName: string;
  steering: ContextFile[];
  specsOverview: string;
  activeSpec: ContextFile[];
  lang?: 'en' | 'es';
}

export function renderContextDump(input: ContextDumpInput): string {
  const lang = input.lang ?? 'es';
  
  return [
    t(lang, 'prompt.preface.agent'),
    '',
    '# Jarvis Context Dump',
    '',
    '## Steering',
    renderFiles(input.steering),
    '',
    '## Specs Overview',
    input.specsOverview,
    '',
    `## Active Spec: ${input.specName}`,
    renderFiles(input.activeSpec),
  ].join('\n');
}

function renderFiles(files: readonly ContextFile[]): string {
  return files
    .map((file) => `### ${file.filename}\n${file.content}`)
    .join('\n\n');
}

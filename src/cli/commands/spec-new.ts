import { join } from 'node:path';
import {
  createSpec,
  InvalidSpecNameError,
  SpecAlreadyExistsError,
} from '../../core/spec-store.js';
import { requireJarvisDir, readJarvisConfig } from '../../core/jarvis-dir.js';
import { renderRequirementsPrompt } from '../../prompts/requirements.js';
import { t } from '../../core/i18n.js';
import {
  dim,
  error,
  info,
  printPromptBlock,
  success,
} from '../../io/output.js';

export const meta = {
  name: 'spec new',
  description:
    'Create a new spec with empty templates and print the requirements prompt',
};

export interface SpecNewArgs {
  name: string;
}

export async function run(args: SpecNewArgs): Promise<number> {
  const jarvisDir = requireJarvisDir();
  const config = readJarvisConfig(jarvisDir);

  try {
    await createSpec({ jarvisDir, name: args.name });
  } catch (err) {
    if (err instanceof InvalidSpecNameError) {
      error(err.message);
      return 1;
    }
    if (err instanceof SpecAlreadyExistsError) {
      error(t(config.lang, 'init.alreadyExists', { path: err.path }));
      return 1;
    }
    throw err;
  }

  const specDir = join(jarvisDir, 'specs', args.name);
  success(t(config.lang, 'spec.created', { name: args.name }));
  info(t(config.lang, 'status.action.requirements', { name: args.name }));
  
  printPromptBlock(renderRequirementsPrompt(args.name, config.lang));
  return 0;
}

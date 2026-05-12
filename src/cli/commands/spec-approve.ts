import { approvePhase, listSpecs } from '../../core/spec-store.js';
import { requireJarvisDir, readJarvisConfig } from '../../core/jarvis-dir.js';
import { renderDesignPrompt } from '../../prompts/design.js';
import { renderTasksPrompt } from '../../prompts/tasks.js';
import { t } from '../../core/i18n.js';
import {
  dim,
  error,
  info,
  printPromptBlock,
  success,
} from '../../io/output.js';
import type { SpecPhase } from '../../core/types.js';

export const meta = {
  name: 'spec approve',
  description: 'Approve a spec phase and print the prompt for the next one',
};

export interface SpecApproveArgs {
  spec: string;
  phase: SpecPhase;
}

export async function run(args: SpecApproveArgs): Promise<number> {
  const jarvisDir = requireJarvisDir();
  const config = readJarvisConfig(jarvisDir);
  const { spec: name, phase } = args;

  const result = await approvePhase({ jarvisDir, name, phase });

  switch (result.kind) {
    case 'approved': {
      if (phase === 'requirements') {
        success(t(config.lang, 'spec.approvedRequirements', { name }));
        info(t(config.lang, 'status.action.design', { name }));
        printPromptBlock(renderDesignPrompt(name, config.lang));
      } else if (phase === 'design') {
        success(t(config.lang, 'spec.approvedDesign', { name }));
        info(t(config.lang, 'status.action.tasks', { name }));
        printPromptBlock(renderTasksPrompt(name, config.lang));
      } else {
        success(t(config.lang, 'spec.approvedTasks', { name }));
        info(t(config.lang, 'spec.readyForImplementation', { name }));
      }
      return 0;
    }

    case 'already-approved': {
      info(t(config.lang, 'spec.alreadyApproved', { phase }));
      return 0;
    }

    case 'out-of-order': {
      error(t(config.lang, 'spec.outOfOrder', { phase, dep: result.missingDependency }));
      return 1;
    }

    case 'spec-not-found': {
      const available = await listSpecs(jarvisDir);
      if (available.length === 0) {
        error(t(config.lang, 'spec.notFound', { name }));
      } else {
        const names = available.map((s) => s.name).join(', ');
        error(t(config.lang, 'spec.notFound', { name }));
      }
      return 1;
    }

    case 'phase-file-missing': {
      error(t(config.lang, 'spec.phaseMissing', { phase }));
      return 1;
    }

    default: {
      const _exhaustive: never = result;
      throw new Error(
        `unreachable ApproveResult variant: ${JSON.stringify(_exhaustive)}`,
      );
    }
  }
}

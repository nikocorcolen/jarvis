import {
  deriveNextStep,
  type NextStep,
} from '../../core/spec-next-step.js';
import { formatSpecsOverview } from '../../core/spec-format.js';
import { listSpecs } from '../../core/spec-store.js';
import { requireJarvisDir, readJarvisConfig } from '../../core/jarvis-dir.js';
import { error, out } from '../../io/output.js';
import kleur from 'kleur';
import { t } from '../../core/i18n.js';

export const meta = {
  name: 'spec status',
  description: 'List all specs, their phase states, and the next required action',
};

export interface SpecStatusArgs {
  json?: boolean;
}

export async function run(args: SpecStatusArgs): Promise<number> {
  const jarvisDir = requireJarvisDir();
  const config = readJarvisConfig(jarvisDir);
  const states = await listSpecs(jarvisDir);

  if (args.json) {
    const payload = states.map((state) => {
      const step = deriveNextStep(state);
      if (step !== null && step.kind === 'approve') {
        if (step.phase === 'requirements') step.action = t(config.lang, 'status.action.requirements', { name: state.name });
        else if (step.phase === 'design') step.action = t(config.lang, 'status.action.design', { name: state.name });
        else if (step.phase === 'tasks') step.action = t(config.lang, 'status.action.tasks', { name: state.name });
      }
      return {
        ...state,
        nextStep: step,
      };
    });
    out(JSON.stringify(payload, null, 2));
    return 0;
  }

  if (states.length === 0) {
    error(t(config.lang, 'status.noSpecs'));
    return 0;
  }

  // Use the shared formatter, passing our colorize function (US-001, FR-002)
  const overview = formatSpecsOverview(states, { colorize: colorMarker });

  error(t(config.lang, 'status.summary', { count: states.length }));
  out(overview);

  const pendingSteps = states
    .map((state) => ({ name: state.name, step: deriveNextStep(state) }))
    .filter((entry): entry is { name: string; step: NextStep } => entry.step !== null);

  if (pendingSteps.length > 0) {
    out('');
    out(t(config.lang, 'status.nextSteps'));
    const maxName = Math.max(...pendingSteps.map((p) => p.name.length));
    for (const { name, step } of pendingSteps) {
      let actionText = step.action;
      if (step.kind === 'approve') {
        if (step.phase === 'requirements') actionText = t(config.lang, 'status.action.requirements', { name });
        else if (step.phase === 'design') actionText = t(config.lang, 'status.action.design', { name });
        else if (step.phase === 'tasks') actionText = t(config.lang, 'status.action.tasks', { name });
      }
      out(`${name.padEnd(maxName)}  → ${actionText}`);
    }
  }

  return 0;
}

function colorMarker(marker: string): string {
  if (marker === '✓') return kleur.green('✓');
  if (marker === '·') return kleur.dim('·');
  if (marker === '?') return kleur.bgRed().white('?');
  return marker; // '-' stays default
}

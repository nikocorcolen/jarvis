import { join } from 'node:path';
import { requireJarvisDir, readJarvisConfig } from '../../core/jarvis-dir.js';
import { formatSpecsOverview } from '../../core/spec-format.js';
import { listSpecs } from '../../core/spec-store.js';
import type { SpecState } from '../../core/spec-store.js';
import { pathExists, readText } from '../../io/fs.js';
import { error, out } from '../../io/output.js';
import { t } from '../../core/i18n.js';
import {
  renderContextDump,
  type ContextFile,
} from '../../prompts/context-dump.js';

export const meta = {
  name: 'context',
  description: 'Print the steering and active spec as a single context dump',
};

export interface ContextArgs {
  spec?: string;
}

type ContextTargetResult =
  | { kind: 'resolved'; name: string }
  | { kind: 'no-specs' }
  | { kind: 'multiple-specs'; names: string[] }
  | { kind: 'spec-not-found'; requested: string; names: string[] };

const STEERING_FILES = ['product.md', 'tech.md', 'structure.md'] as const;
const PHASE_FILES = ['requirements.md', 'design.md', 'tasks.md'] as const;
const MISSING_PHASE_PLACEHOLDER = '<!-- phase file missing -->\n';

export async function run(args: ContextArgs): Promise<number> {
  const jarvisDir = requireJarvisDir();
  const config = readJarvisConfig(jarvisDir);
  const states = await listSpecs(jarvisDir);
  const target = resolveContextTarget(args.spec, states);

  if (target.kind !== 'resolved') {
    reportTargetError(target, config.lang);
    return 1;
  }

  const steering = await readSteeringFiles(jarvisDir);
  if (steering.kind === 'missing') {
    error(t(config.lang, 'context.steeringMissing', { path: steering.path }));
    return 1;
  }

  const activeSpec = await readActiveSpecFiles(jarvisDir, target.name);
  const dump = renderContextDump({
    specName: target.name,
    steering: steering.files,
    specsOverview: formatSpecsOverview(states),
    activeSpec,
    lang: config.lang,
  });

  out(dump);
  return 0;
}

function resolveContextTarget(
  requested: string | undefined,
  states: readonly SpecState[],
): ContextTargetResult {
  const names = states
    .map((state) => state.name)
    .sort((a, b) => a.localeCompare(b));

  if (requested !== undefined) {
    if (names.includes(requested)) {
      return { kind: 'resolved', name: requested };
    }
    return { kind: 'spec-not-found', requested, names };
  }

  if (names.length === 0) return { kind: 'no-specs' };
  if (names.length === 1) return { kind: 'resolved', name: names[0]! };
  return { kind: 'multiple-specs', names };
}

function reportTargetError(result: Exclude<ContextTargetResult, { kind: 'resolved' }>, lang: 'en' | 'es'): void {
  if (result.kind === 'no-specs') {
    error(t(lang, 'context.noSpecs'));
    return;
  }

  if (result.kind === 'multiple-specs') {
    error(t(lang, 'context.multipleSpecs', { available: result.names.join(', ') }));
    return;
  }

  error(t(lang, 'context.notFound', { name: result.requested, available: result.names.join(', ') }));
}

async function readSteeringFiles(
  jarvisDir: string,
): Promise<
  | { kind: 'ok'; files: ContextFile[] }
  | { kind: 'missing'; path: string }
> {
  const files: ContextFile[] = [];

  for (const filename of STEERING_FILES) {
    const path = join(jarvisDir, 'steering', filename);
    if (!pathExists(path)) {
      return { kind: 'missing', path };
    }
    files.push({ filename, content: await readText(path) });
  }

  return { kind: 'ok', files };
}

async function readActiveSpecFiles(
  jarvisDir: string,
  specName: string,
): Promise<ContextFile[]> {
  const files: ContextFile[] = [];

  for (const filename of PHASE_FILES) {
    const path = join(jarvisDir, 'specs', specName, filename);
    const content = pathExists(path)
      ? await readText(path)
      : MISSING_PHASE_PLACEHOLDER;
    files.push({ filename, content });
  }

  return files;
}

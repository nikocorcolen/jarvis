import { join } from 'node:path';
import { detectStack, type DetectedStack } from '../../core/detect-stack.js';
import {
  listTopLevelFolders,
  prefillStructureMd,
  prefillTechMd,
} from '../../core/init-prefill.js';
import { loadTemplate } from '../../core/templates.js';
import { FORMAT_VERSION, type JarvisConfig } from '../../core/types.js';
import { ensureDir, pathExists, writeJson, writeText } from '../../io/fs.js';
import {
  bold,
  dim,
  error,
  info,
  printPromptBlock,
  success,
} from '../../io/output.js';
import { renderSteeringBootstrapPrompt } from '../../prompts/steering-bootstrap.js';
import { t } from '../../core/i18n.js';

export const meta = {
  name: 'init',
  description:
    'Bootstrap a Jarvis project: create .jarvis/ with steering and config',
};

export interface InitArgs {
  /** Override the working directory. Tests use this; users do not. */
  cwd?: string;
  /** Hard-coded ISO timestamp for deterministic tests. */
  now?: () => string;
  /** Hard-coded `createdBy` string for deterministic tests. */
  createdBy?: string;
  /** The language to use for CLI output. */
  lang?: 'en' | 'es';
}

const STEERING_FILES = ['product.md', 'tech.md', 'structure.md'] as const;

/**
 * `jarvis init` flow:
 *  1. Refuse if `.jarvis/` already exists at cwd (US-003).
 *  2. Detect stack and (when applicable) list top-level folders.
 *  3. Create `.jarvis/{steering,specs}` and copy steering templates,
 *     pre-filling tech.md and structure.md when there is detection.
 *  4. Write `.jarvis/config.json`.
 *  5. Print success summary to stderr.
 *  6. If anything was detected, print the bootstrap prompt to stdout.
 */
export async function run(args: InitArgs): Promise<number> {
  const cwd = args.cwd ?? process.cwd();
  const now = args.now ?? (() => new Date().toISOString());
  const createdBy = args.createdBy ?? `jarvis-cli@${getOwnVersion()}`;
  const lang = args.lang ?? 'es';

  const jarvisDir = join(cwd, '.jarvis');

  if (pathExists(jarvisDir)) {
    error(t(lang, 'init.alreadyExists', { path: jarvisDir }));
    return 1;
  }

  const stack = await detectStack(cwd);
  const hasDetection = stack.manifests.length > 0;
  const folders = hasDetection ? await listTopLevelFolders(cwd) : [];

  // Build the steering directory.
  const steeringDir = join(jarvisDir, 'steering');
  const specsDir = join(jarvisDir, 'specs');
  await ensureDir(steeringDir);
  await ensureDir(specsDir);

  for (const file of STEERING_FILES) {
    const template = await loadTemplate('steering', file);
    let content = template;

    if (file === 'tech.md' && hasDetection) {
      content = prefillTechMd(template, stack);
    } else if (file === 'structure.md' && folders.length > 0) {
      content = prefillStructureMd(template, folders);
    }

    await writeText(join(steeringDir, file), content);
  }

  // Write config.json.
  const config: JarvisConfig = {
    formatVersion: FORMAT_VERSION,
    createdAt: now(),
    createdBy,
    lang,
  };
  await writeJson(join(jarvisDir, 'config.json'), config);

  // Success summary to stderr.
  success(t(lang, 'init.createdDir', { path: dim(jarvisDir) }));
  info(`  ├── steering/  ${dim('(' + STEERING_FILES.join(', ') + ')')}`);
  info(`  ├── specs/     ${dim('(empty)')}`);
  info(`  └── config.json`);

  if (hasDetection) {
    info('');
    info(
      `Detected: ${bold(stack.language ?? 'unknown')} (${stack.manifests.join(
        ', ',
      )})`,
    );
    if (stack.dependencies.length > 0) {
      info(t(lang, 'init.prefilledTech', { count: stack.dependencies.length }));
    }
    if (folders.length > 0) {
      info(t(lang, 'init.prefilledStructure', { count: folders.length }));
    }
    info('');
    info(t(lang, 'prompt.preface.init'));
    printPromptBlock(
      renderSteeringBootstrapPrompt({
        detectedLanguage: stack.language,
        manifests: stack.manifests,
        lang,
      }),
    );
  } else {
    info('');
    info(t(lang, 'init.noCodeDetected', { path: dim(steeringDir) }));
  }

  return 0;
}

/**
 * Reads the package version from the env or falls back to a static
 * string. We intentionally avoid importing package.json directly to
 * keep tsconfig simple and to avoid the JSON import assertion dance.
 */
function getOwnVersion(): string {
  return process.env['JARVIS_VERSION'] ?? '0.1.0';
}

// Re-export for tests that want to assert the contract surface.
export type { DetectedStack };

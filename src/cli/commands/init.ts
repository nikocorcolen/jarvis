import { join } from 'node:path';
import { detectStack, type DetectedStack } from '../../core/detect-stack.js';
import {
  listTopLevelFolders,
  prefillStructureMd,
  prefillTechMd,
} from '../../core/init-prefill.js';
import { loadTemplate } from '../../core/templates.js';
import { FORMAT_VERSION, type FridayConfig } from '../../core/types.js';
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

export const meta = {
  name: 'init',
  description:
    'Bootstrap a Friday project: create .friday/ with steering and config',
};

export interface InitArgs {
  /** Override the working directory. Tests use this; users do not. */
  cwd?: string;
  /** Hard-coded ISO timestamp for deterministic tests. */
  now?: () => string;
  /** Hard-coded `createdBy` string for deterministic tests. */
  createdBy?: string;
}

const STEERING_FILES = ['product.md', 'tech.md', 'structure.md'] as const;

/**
 * `friday init` flow:
 *  1. Refuse if `.friday/` already exists at cwd (US-003).
 *  2. Detect stack and (when applicable) list top-level folders.
 *  3. Create `.friday/{steering,specs}` and copy steering templates,
 *     pre-filling tech.md and structure.md when there is detection.
 *  4. Write `.friday/config.json`.
 *  5. Print success summary to stderr.
 *  6. If anything was detected, print the bootstrap prompt to stdout.
 */
export async function run(args: InitArgs): Promise<number> {
  const cwd = args.cwd ?? process.cwd();
  const now = args.now ?? (() => new Date().toISOString());
  const createdBy = args.createdBy ?? `friday-cli@${getOwnVersion()}`;

  const fridayDir = join(cwd, '.friday');

  if (pathExists(fridayDir)) {
    error(
      `.friday/ already exists at ${fridayDir}. ` +
        `Delete it manually if you want to start fresh.`,
    );
    return 1;
  }

  const stack = await detectStack(cwd);
  const hasDetection = stack.manifests.length > 0;
  const folders = hasDetection ? await listTopLevelFolders(cwd) : [];

  // Build the steering directory.
  const steeringDir = join(fridayDir, 'steering');
  const specsDir = join(fridayDir, 'specs');
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
  const config: FridayConfig = {
    formatVersion: FORMAT_VERSION,
    createdAt: now(),
    createdBy,
  };
  await writeJson(join(fridayDir, 'config.json'), config);

  // Success summary to stderr.
  success(`Created ${dim(fridayDir)}`);
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
      info(
        `Pre-filled tech.md with ${stack.dependencies.length} dependencies.`,
      );
    }
    if (folders.length > 0) {
      info(`Pre-filled structure.md with ${folders.length} top-level folders.`);
    }
    info('');
    info(
      'Optional: copy this prompt to your AI agent for help drafting the steering files.',
    );
    printPromptBlock(
      renderSteeringBootstrapPrompt({
        detectedLanguage: stack.language,
        manifests: stack.manifests,
      }),
    );
  } else {
    info('');
    info(
      `No code detected. Open ${dim(steeringDir)} and fill the TODO sections by hand.`,
    );
  }

  return 0;
}

/**
 * Reads the package version from the env or falls back to a static
 * string. We intentionally avoid importing package.json directly to
 * keep tsconfig simple and to avoid the JSON import assertion dance.
 */
function getOwnVersion(): string {
  return process.env['FRIDAY_VERSION'] ?? '0.1.0';
}

// Re-export for tests that want to assert the contract surface.
export type { DetectedStack };

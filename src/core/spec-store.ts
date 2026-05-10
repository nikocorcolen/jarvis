import { mkdtemp, readdir, rename, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  parseFrontMatter,
  stringifyFrontMatter,
} from './frontmatter.js';
import { loadTemplate } from './templates.js';
import type {
  SpecFrontMatter,
  SpecPhase,
  SpecStatus,
} from './types.js';
import { ensureDir, pathExists, readText, writeText } from '../io/fs.js';

/**
 * `spec-store` is the only module that knows how a spec is laid out
 * on disk. The lifecycle commands read and mutate specs exclusively
 * through this API.
 *
 * Design principle (decision 8.2): expected outcomes are returned as
 * tagged-union result variants, not thrown. Exceptions are reserved
 * for truly unexpected errors (FS permissions, malformed files).
 */

// ---------------------------------------------------------------------------
// Public types
// ---------------------------------------------------------------------------

export interface SpecPhaseState {
  /** Phase file exists on disk. */
  exists: boolean;
  /** Status read from front-matter; null when file is missing or invalid. */
  status: SpecStatus | null;
  /** ISO date from front-matter `updated`; null when unavailable. */
  updated: string | null;
}

export interface SpecState {
  name: string;
  requirements: SpecPhaseState;
  design: SpecPhaseState;
  tasks: SpecPhaseState;
}

export interface CreateSpecOptions {
  fridayDir: string;
  name: string;
  /** Defaults to `() => new Date().toISOString().slice(0, 10)`. */
  today?: () => string;
}

export interface ApprovePhaseOptions {
  fridayDir: string;
  name: string;
  phase: SpecPhase;
  today?: () => string;
}

export type ApproveResult =
  | { kind: 'approved'; previouslyApproved: false }
  | { kind: 'already-approved' }
  | { kind: 'out-of-order'; missingDependency: SpecPhase }
  | { kind: 'spec-not-found' }
  | { kind: 'phase-file-missing' };

export class InvalidSpecNameError extends Error {
  override readonly name = 'InvalidSpecNameError';
  constructor(public readonly invalidName: string) {
    super(
      `invalid spec name "${invalidName}". ` +
        `Names must match ${SPEC_NAME_REGEX.source} ` +
        `(lowercase kebab-case, 1-50 chars). Example: "magic-link-auth".`,
    );
  }
}

export class SpecAlreadyExistsError extends Error {
  override readonly name = 'SpecAlreadyExistsError';
  constructor(public readonly path: string) {
    super(`spec already exists at ${path}`);
  }
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** FR-002: lowercase kebab-case, 1-50 chars, must start alphanumeric. */
const SPEC_NAME_REGEX = /^[a-z0-9][a-z0-9-]{0,49}$/;

const PHASES: readonly SpecPhase[] = ['requirements', 'design', 'tasks'];

const PHASE_FILES: Readonly<Record<SpecPhase, string>> = {
  requirements: 'requirements.md',
  design: 'design.md',
  tasks: 'tasks.md',
};

/** Earlier phases that must be approved before each phase. */
const PHASE_DEPENDENCIES: Readonly<Record<SpecPhase, SpecPhase[]>> = {
  requirements: [],
  design: ['requirements'],
  tasks: ['requirements', 'design'],
};

// ---------------------------------------------------------------------------
// T-001: Name validation
// ---------------------------------------------------------------------------

export function isValidSpecName(name: string): boolean {
  return SPEC_NAME_REGEX.test(name);
}

// ---------------------------------------------------------------------------
// T-002: Reading specs from disk
// ---------------------------------------------------------------------------

/**
 * Reads the state of a single spec. Returns `null` when the spec
 * directory does not exist. Never throws for "expected" cases like
 * malformed front-matter (status falls back to `null`).
 */
export async function readSpecState(
  fridayDir: string,
  name: string,
): Promise<SpecState | null> {
  const specDir = specDirPath(fridayDir, name);
  if (!pathExists(specDir)) return null;

  const [requirements, design, tasks] = await Promise.all(
    PHASES.map((phase) => readPhaseState(specDir, phase)),
  );

  return {
    name,
    requirements: requirements!,
    design: design!,
    tasks: tasks!,
  };
}

/**
 * Lists every spec under `.friday/specs/`, sorted alphabetically.
 * Reads of the three phase files happen in parallel for each spec
 * (NFR-001: bench in T-010).
 */
export async function listSpecs(fridayDir: string): Promise<SpecState[]> {
  const specsDir = join(fridayDir, 'specs');
  if (!pathExists(specsDir)) return [];

  let entries;
  try {
    entries = await readdir(specsDir, { withFileTypes: true });
  } catch {
    return [];
  }

  const names = entries
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort((a, b) => a.localeCompare(b));

  const states = await Promise.all(
    names.map((name) => readSpecState(fridayDir, name)),
  );

  return states.filter((s): s is SpecState => s !== null);
}

async function readPhaseState(
  specDir: string,
  phase: SpecPhase,
): Promise<SpecPhaseState> {
  const path = join(specDir, PHASE_FILES[phase]);
  if (!pathExists(path)) {
    return { exists: false, status: null, updated: null };
  }

  let raw: string;
  try {
    raw = await readText(path);
  } catch {
    return { exists: true, status: null, updated: null };
  }

  let data: Partial<SpecFrontMatter>;
  try {
    ({ data } = parseFrontMatter<Partial<SpecFrontMatter>>(raw));
  } catch {
    return { exists: true, status: null, updated: null };
  }

  const status =
    data.status === 'draft' || data.status === 'approved'
      ? data.status
      : null;
  const updated = normalizeDateField(data.updated);

  return { exists: true, status, updated };
}

/**
 * The YAML parser (`gray-matter` default) decodes ISO dates as Date
 * objects. We normalise both Date and string values to YYYY-MM-DD,
 * and reject anything else.
 */
function normalizeDateField(value: unknown): string | null {
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return null;
}

// ---------------------------------------------------------------------------
// T-003: Creating a spec
// ---------------------------------------------------------------------------

/**
 * Creates a new spec directory with the three templates pre-filled
 * (name, dates, status: draft). Writes to a tmp directory first and
 * renames it into place, so a partial write cannot leave a half-baked
 * spec on disk.
 */
export async function createSpec(opts: CreateSpecOptions): Promise<void> {
  const { fridayDir, name } = opts;
  const today = opts.today ?? defaultToday;

  if (!isValidSpecName(name)) {
    throw new InvalidSpecNameError(name);
  }

  const finalPath = specDirPath(fridayDir, name);
  if (pathExists(finalPath)) {
    throw new SpecAlreadyExistsError(finalPath);
  }

  await ensureDir(join(fridayDir, 'specs'));

  // Stage in a tmp dir, then atomic rename.
  const stagingRoot = await mkdtemp(join(tmpdir(), 'friday-spec-'));
  const stagingDir = join(stagingRoot, name);
  await ensureDir(stagingDir);

  try {
    const date = today();
    for (const phase of PHASES) {
      const template = await loadTemplate('spec', PHASE_FILES[phase]);
      const filled = renderSpecFile(template, name, date);
      await writeText(join(stagingDir, PHASE_FILES[phase]), filled);
    }
    await rename(stagingDir, finalPath);
  } catch (err) {
    // Best-effort cleanup; never mask the original error.
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
    throw err;
  } finally {
    // If the rename succeeded, the staging root is empty and safe to remove.
    await rm(stagingRoot, { recursive: true, force: true }).catch(() => {});
  }
}

/**
 * Substitutes the template placeholders for a brand-new spec file.
 * Replaces `<name>`, both `<YYYY-MM-DD>` occurrences, and ensures
 * `status: draft`.
 */
function renderSpecFile(template: string, name: string, date: string): string {
  // The shipped templates use `<name>` once and `<YYYY-MM-DD>` twice
  // (created and updated). Simple replace-all is sufficient because
  // these tokens never appear in the body.
  return template
    .replace(/<name>/g, name)
    .replace(/<YYYY-MM-DD>/g, date);
}

// ---------------------------------------------------------------------------
// T-004: Approving a phase
// ---------------------------------------------------------------------------

/**
 * Approves a phase, enforcing FR-001 ordering. Returns a result
 * variant; the command decides what to print and which exit code to
 * emit. Only mutates the front-matter `status` and `updated` fields;
 * the body of the file is preserved byte-for-byte (decision 8.4).
 */
export async function approvePhase(
  opts: ApprovePhaseOptions,
): Promise<ApproveResult> {
  const { fridayDir, name, phase } = opts;
  const today = opts.today ?? defaultToday;

  const state = await readSpecState(fridayDir, name);
  if (!state) return { kind: 'spec-not-found' };

  const phaseState = state[phase];
  if (!phaseState.exists) return { kind: 'phase-file-missing' };

  // FR-001: every dependency must already be approved.
  for (const dep of PHASE_DEPENDENCIES[phase]) {
    if (state[dep].status !== 'approved') {
      return { kind: 'out-of-order', missingDependency: dep };
    }
  }

  if (phaseState.status === 'approved') {
    return { kind: 'already-approved' };
  }

  // Mutate the file: parse, change status + updated, stringify, write.
  const filePath = join(specDirPath(fridayDir, name), PHASE_FILES[phase]);
  const raw = await readText(filePath);
  const { data, content } = parseFrontMatter<Record<string, unknown>>(raw);

  data['status'] = 'approved';
  data['updated'] = today();

  const next = stringifyFrontMatter(data, content);
  await writeText(filePath, next);

  return { kind: 'approved', previouslyApproved: false };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function specDirPath(fridayDir: string, name: string): string {
  return join(fridayDir, 'specs', name);
}

function defaultToday(): string {
  return new Date().toISOString().slice(0, 10);
}

// Exposed for tests that want to assert against the canonical list.
export { PHASES, PHASE_FILES };

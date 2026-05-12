import type { SpecPhase } from './types.js';
import type { SpecState } from './spec-store.js';

export type NextStepKind = 'approve' | 'fix-malformed' | 'restore-missing';

export interface NextStep {
  kind: NextStepKind;
  phase: SpecPhase;
  action: string;
}

const PHASES: readonly SpecPhase[] = ['requirements', 'design', 'tasks'];

export function deriveNextStep(state: SpecState): NextStep | null {
  if (PHASES.every((phase) => state[phase].exists && state[phase].status === 'approved')) {
    return null;
  }

  const missing = PHASES.find((phase) => !state[phase].exists);
  if (missing) {
    return {
      kind: 'restore-missing',
      phase: missing,
      action: `${missing}.md missing, restore from git or re-scaffold.`,
    };
  }

  const malformed = PHASES.find(
    (phase) => state[phase].exists && state[phase].status === null,
  );
  if (malformed) {
    return {
      kind: 'fix-malformed',
      phase: malformed,
      action: `fix front-matter in ${malformed}.md (status field unreadable).`,
    };
  }

  const draft = PHASES.find((phase) => state[phase].status === 'draft');
  if (draft) {
    return {
      kind: 'approve',
      phase: draft,
      action: `edit ${draft}.md, then run: jarvis spec approve ${state.name} ${draft}`,
    };
  }

  return null;
}

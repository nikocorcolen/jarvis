import { info } from '../../io/output.js';
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
  info(
    `friday spec approve ${args.spec} ${args.phase}: not implemented yet (spec-lifecycle spec).`,
  );
  return 0;
}

import { info } from '../../io/output.js';

export const meta = {
  name: 'spec status',
  description: 'Show every spec with its current phase and status',
};

export interface SpecStatusArgs {
  // No options yet.
}

export async function run(_args: SpecStatusArgs): Promise<number> {
  info('friday spec status: not implemented yet (spec-lifecycle spec).');
  return 0;
}

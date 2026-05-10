import { info } from '../../io/output.js';

export const meta = {
  name: 'spec new',
  description: 'Create a new spec with empty templates and print the requirements prompt',
};

export interface SpecNewArgs {
  name: string;
}

export async function run(args: SpecNewArgs): Promise<number> {
  info(`friday spec new ${args.name}: not implemented yet (spec-lifecycle spec).`);
  return 0;
}

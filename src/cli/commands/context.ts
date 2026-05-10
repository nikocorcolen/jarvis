import { info } from '../../io/output.js';

export const meta = {
  name: 'context',
  description: 'Print the steering and active spec as a single context dump',
};

export interface ContextArgs {
  spec?: string;
}

export async function run(args: ContextArgs): Promise<number> {
  const target = args.spec ?? '<active>';
  info(`friday context ${target}: not implemented yet (context-dump spec).`);
  return 0;
}

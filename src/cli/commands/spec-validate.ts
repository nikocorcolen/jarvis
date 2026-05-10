import { info } from '../../io/output.js';

export const meta = {
  name: 'spec validate',
  description: 'Validate traceability of one spec or all specs',
};

export interface SpecValidateArgs {
  /** When omitted, validate every spec. */
  spec?: string;
}

export async function run(args: SpecValidateArgs): Promise<number> {
  const target = args.spec ?? '<all>';
  info(`friday spec validate ${target}: not implemented yet (traceability-validation spec).`);
  return 0;
}

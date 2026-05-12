#!/usr/bin/env node
import { Command } from 'commander';
import { error } from '../io/output.js';
import { JarvisNotFoundError } from '../core/jarvis-dir.js';

import * as init from './commands/init.js';
import * as specNew from './commands/spec-new.js';
import * as specApprove from './commands/spec-approve.js';
import * as specStatus from './commands/spec-status.js';
import * as specValidate from './commands/spec-validate.js';
import * as context from './commands/context.js';
import type { SpecPhase } from '../core/types.js';

const VERSION = '0.1.0';

function buildProgram(): Command {
  const program = new Command();

  program
    .name('jarvis')
    .description('Spec-driven development CLI')
    .version(VERSION);

  program
    .command('init')
    .description(init.meta.description)
    .option('--lang <lang>', 'language for CLI output (en or es)', 'es')
    .action(async (opts: { lang: 'en' | 'es' }) => {
      process.exitCode = await init.run({ lang: opts.lang });
    });

  const spec = program.command('spec').description('Manage specs');

  spec
    .command('new <name>')
    .description(specNew.meta.description)
    .action(async (name: string) => {
      process.exitCode = await specNew.run({ name });
    });

  spec
    .command('approve <spec> <phase>')
    .description(specApprove.meta.description)
    .action(async (specName: string, phase: string) => {
      const valid: SpecPhase[] = ['requirements', 'design', 'tasks'];
      if (!valid.includes(phase as SpecPhase)) {
        error(`invalid phase "${phase}". Expected one of: ${valid.join(', ')}.`);
        process.exitCode = 1;
        return;
      }
      process.exitCode = await specApprove.run({
        spec: specName,
        phase: phase as SpecPhase,
      });
    });

  spec
    .command('status')
    .description(specStatus.meta.description)
    .option('--json', 'emit machine-readable JSON instead of the human table')
    .action(async (opts: { json?: boolean }) => {
      process.exitCode = await specStatus.run({ json: opts.json });
    });

  spec
    .command('validate [name]')
    .description(specValidate.meta.description)
    .action(async (name: string | undefined) => {
      process.exitCode = await specValidate.run({ spec: name });
    });

  program
    .command('context [spec]')
    .description(context.meta.description)
    .action(async (specName: string | undefined) => {
      process.exitCode = await context.run({ spec: specName });
    });

  return program;
}

async function main(argv: string[]): Promise<void> {
  const program = buildProgram();
  try {
    await program.parseAsync(argv);
  } catch (err) {
    handleError(err);
  }
}

function handleError(err: unknown): void {
  if (err instanceof JarvisNotFoundError) {
    error(err.message);
    process.exitCode = 1;
    return;
  }
  // Unexpected: signal a bug, hide stack unless DEBUG=1.
  const debug = process.env['DEBUG'] === '1';
  const msg =
    err instanceof Error ? err.message : 'unexpected error of unknown shape';
  error(`internal error: ${msg}`);
  if (debug && err instanceof Error && err.stack) {
    process.stderr.write(err.stack + '\n');
  } else {
    process.stderr.write(
      'Run again with DEBUG=1 for the full stack trace.\n',
    );
  }
  process.exitCode = 2;
}

main(process.argv).catch(handleError);

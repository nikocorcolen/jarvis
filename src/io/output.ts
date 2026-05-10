import kleur from 'kleur';

/**
 * Output convention for Friday CLI:
 *
 *  - stdout : the "product" of the command (prompts, dumps, lists)
 *             — anything a user might pipe to another tool.
 *  - stderr : progress, success/error indicators, human-facing notes.
 *
 * This module centralises the convention so commands never call
 * `console.log` directly.
 */

export function out(text: string): void {
  process.stdout.write(text);
  if (!text.endsWith('\n')) process.stdout.write('\n');
}

export function info(text: string): void {
  process.stderr.write(text + '\n');
}

export function success(text: string): void {
  process.stderr.write(kleur.green('✓ ') + text + '\n');
}

export function warn(text: string): void {
  process.stderr.write(kleur.yellow('⚠ ') + text + '\n');
}

export function error(text: string): void {
  process.stderr.write(kleur.red('✗ ') + text + '\n');
}

export function dim(text: string): string {
  return kleur.gray(text);
}

export function bold(text: string): string {
  return kleur.bold(text);
}

/** Used to print copy-paste prompts with visual delimiters. */
export function printPromptBlock(prompt: string): void {
  const sep = '─'.repeat(60);
  process.stdout.write('\n' + sep + '\n');
  process.stdout.write(prompt.trimEnd() + '\n');
  process.stdout.write(sep + '\n');
}

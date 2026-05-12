import type { Issue } from '../core/types.js';

/**
 * Renders the prompt that helps an AI agent fix traceability issues
 * found by `jarvis spec validate`. Only emitted when there is at
 * least one error or warning.
 *
 * Stub. Real content lives in the `traceability-validation` spec.
 */
export function renderValidateFixPrompt(_args: {
  spec: string;
  errors: Issue[];
  warnings: Issue[];
}): string {
  return `[TODO: validate fix prompt]`;
}

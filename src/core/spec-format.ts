import type { SpecPhaseState, SpecState } from './spec-store.js';
import type { SpecPhase } from './types.js';

const PHASES: readonly SpecPhase[] = ['requirements', 'design', 'tasks'];

const PHASE_LABEL: Readonly<Record<SpecPhase, string>> = {
  requirements: 'R',
  design: 'D',
  tasks: 'T',
};

export interface FormatOptions {
  colorize?: (marker: string) => string;
}

export function formatSpecsOverview(
  states: readonly SpecState[],
  options: FormatOptions = {},
): string {
  if (states.length === 0) return '';

  const sorted = [...states].sort((a, b) => a.name.localeCompare(b.name));
  const namePad = Math.max(...sorted.map((state) => state.name.length));

  return sorted
    .map((state) => formatSpecRow(state, namePad, options))
    .join('\n');
}

function formatSpecRow(
  state: SpecState,
  namePad: number,
  options: FormatOptions,
): string {
  const padded = state.name.padEnd(namePad);
  const markers = PHASES.map((phase) => {
    const marker = markerFor(state[phase]);
    return `${PHASE_LABEL[phase]}${options.colorize?.(marker) ?? marker}`;
  }).join(' ');
  return `${padded}  ${markers}`;
}

function markerFor(state: SpecPhaseState): string {
  if (!state.exists) return '-';
  if (state.status === 'approved') return '✓';
  if (state.status === 'draft') return '·';
  return '?';
}

/**
 * Shared types for Friday CLI.
 *
 * This module is intentionally pure: no I/O, no side effects, no
 * dependencies. Anything imported from here is safe to use in any layer.
 */

export const FORMAT_VERSION = 1 as const;

export type SpecPhase = 'requirements' | 'design' | 'tasks';
export type SpecStatus = 'draft' | 'approved';

export type SteeringScope = 'product' | 'tech' | 'structure';

/** Front-matter expected at the top of every spec file. */
export interface SpecFrontMatter {
  spec: string;
  phase: SpecPhase;
  status: SpecStatus;
  created: string;
  updated: string;
}

/** Front-matter expected at the top of every steering file. */
export interface SteeringFrontMatter {
  type: 'steering';
  scope: SteeringScope;
  updated: string;
}

/** .friday/config.json shape. */
export interface FridayConfig {
  formatVersion: number;
  createdAt: string;
  createdBy: string;
}

/** Identifier kinds used in requirements.md. */
export type IdKind = 'US' | 'FR' | 'NFR';

/** A traceability identifier, e.g. "US-001". */
export type Id = `${IdKind}-${string}`;

/** A traceability issue found by `friday spec validate`. */
export type Issue =
  | {
      kind: 'orphan';
      file: 'design.md' | 'tasks.md';
      id: Id;
    }
  | {
      kind: 'missing-coverage';
      in: 'design.md' | 'tasks.md';
      id: Id;
    };

export interface ValidationResult {
  spec: string;
  errors: Issue[];
  warnings: Issue[];
}

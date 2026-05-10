import type { Id, Issue } from './types.js';

/**
 * Stubs for the traceability layer.
 * Real implementation lives in the `traceability-validation` spec.
 *
 * They are exported here so commands and tests can compile against
 * stable signatures even before the logic is in place.
 */

/** Extracts US/FR/NFR IDs defined in a requirements.md body. */
export function extractDefinedIds(_requirementsMd: string): Set<Id> {
  return new Set();
}

/** Extracts US/FR/NFR IDs referenced in a design.md or tasks.md body. */
export function extractReferencedIds(_md: string): Set<Id> {
  return new Set();
}

/**
 * Validates traceability across a single spec.
 * Returns errors (orphan references) and warnings (missing coverage).
 */
export function validateSpec(_files: {
  requirements: string;
  design: string;
  tasks: string;
}): { errors: Issue[]; warnings: Issue[] } {
  return { errors: [], warnings: [] };
}

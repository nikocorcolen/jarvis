/**
 * Renders the prompt printed by `friday spec approve requirements`
 * for an AI agent to fill `design.md`. The agent acts as a software
 * architect.
 *
 * Hard rules baked in:
 *  - Every decision traces to one or more US-XXX / FR-XXX / NFR-XXX.
 *  - Respect tech.md constraints; flag conflicts, never silently
 *    violate them.
 *  - No full implementation code; pseudocode and signatures only.
 *  - Each significant decision lists the alternative considered.
 */
export function renderDesignPrompt(specName: string): string {
  return `You are acting as a software architect for a spec-driven workflow.

CONTEXT TO READ FIRST:
- .friday/steering/  (all three files; tech.md is binding)
- .friday/specs/${specName}/requirements.md (APPROVED, do not modify)
- .friday/specs/${specName}/design.md (template you will fill)

YOUR TASK:
Fill design.md based on the approved requirements for "${specName}".

RULES:
1. Every component, contract, and decision must trace to one or more
   identifiers from requirements.md. Use the format:
       "Addresses: US-001 (criteria 1, 3), FR-002, NFR-001"
   When a user story is fully covered, citing US-XXX is enough.
   When only part is covered, cite the criterion: "US-001 (criterion 2)".
2. Cover, in order: architecture overview, components, data model,
   contracts (APIs / events / signatures), error handling, security
   considerations, and key technical decisions with rationale.
3. Respect tech.md constraints. If a requirement cannot be met within
   them, FLAG IT explicitly in a "Risks & mitigations" entry instead
   of silently violating the constraint.
4. Do NOT write implementation code. Pseudocode, type signatures, and
   short interface sketches are fine; full functions are not.
5. For each significant decision, briefly note:
   - The decision
   - The alternative considered
   - Why the alternative was rejected
6. Map error scenarios to the EARS criteria in requirements.md that
   describe them (typically the "WHEN <invalid> ..." lines).

OUTPUT:
Edit the existing design.md respecting its section structure.
Keep status as "draft" in the front-matter; the user runs
\`friday spec approve design\` to advance.

START by listing the user stories and requirements you will address,
then ask me about any ambiguity or trade-off you see BEFORE writing.`;
}

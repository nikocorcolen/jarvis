/**
 * Renders the prompt printed by `friday spec new` for an AI agent
 * to fill `requirements.md`. The agent acts as a product owner.
 *
 * Hard rules baked in:
 *  - No technology, libraries, or implementation details.
 *  - Acceptance criteria use EARS notation, grouped under each US.
 *  - Use US-XXX / FR-XXX / NFR-XXX identifiers for traceability.
 *  - Ask clarifying questions BEFORE writing.
 */
export function renderRequirementsPrompt(specName: string): string {
  return `You are acting as a product owner for a spec-driven development workflow.

CONTEXT TO READ FIRST:
- .friday/steering/product.md   (what this product is and for whom)
- .friday/steering/tech.md      (tech constraints, do not violate them)
- .friday/steering/structure.md (codebase conventions)
- .friday/specs/${specName}/requirements.md (template you will fill)

YOUR TASK:
Fill requirements.md for the feature: "${specName}".

RULES:
1. Do NOT propose technology, libraries, endpoints, or implementation
   details. Those belong in design.md, not here.
2. Group acceptance criteria UNDER each user story. Use EARS format:
   "WHEN <trigger> THE SYSTEM SHALL <response>"
3. Use these identifiers for traceability:
   - US-001, US-002, ...   for user stories
   - FR-001, FR-002, ...   for cross-cutting functional requirements
                           (only when they don't fit inside a single US)
   - NFR-001, NFR-002, ... for non-functional requirements
4. Cover happy path, error cases, and edge cases inside each user
   story. Cross-cutting concerns (performance, security, accessibility)
   go under "Non-functional requirements".
5. Be explicit about "Out of scope" — listing what this spec does NOT
   cover prevents later scope creep.
6. If the feature description is ambiguous, ASK clarifying questions
   BEFORE writing. Do not assume.

OUTPUT:
Edit the existing requirements.md respecting its section structure.
Keep status as "draft" in the front-matter; the user runs
\`friday spec approve requirements\` to advance.

START by asking me up to 5 clarifying questions about the feature.
Only after I answer, write the file.`;
}

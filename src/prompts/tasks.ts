/**
 * Renders the prompt printed by `friday spec approve design` for an
 * AI agent to fill `tasks.md`. The agent acts as a tech lead.
 *
 * Hard rules baked in:
 *  - Each task ≤ 1 day, independently verifiable, traced to US/FR/NFR.
 *  - Tests are tasks, not afterthoughts.
 *  - Mandatory "Steering Impact" section at the end: propose, never
 *    apply. Steering is human-written; agents only suggest.
 */
export function renderTasksPrompt(specName: string): string {
  return `You are acting as a tech lead breaking approved design into work.

CONTEXT TO READ FIRST:
- .friday/steering/structure.md (file/folder conventions)
- .friday/specs/${specName}/requirements.md (APPROVED)
- .friday/specs/${specName}/design.md (APPROVED)
- .friday/specs/${specName}/tasks.md (template you will fill)

YOUR TASK:
Generate an ordered, actionable task list to implement the design.

RULES:
1. Each task must be:
   - Completable in ≤ 1 day of focused work.
   - Independently verifiable (clear, testable "done" criterion).
   - Linked to one or more US-XXX / FR-XXX / NFR-XXX it satisfies.
2. Order tasks by dependency. A task cannot depend on a later task.
3. Include tasks for: setup, implementation, tests, docs, and
   migration when applicable. Tests are tasks, NOT afterthoughts.
4. Use this format per task:

   - [ ] **T-001**: <verb-first description>
         Files: <paths likely touched>
         Done when: <verifiable criterion>
         Addresses: US-001 (criterion 2), FR-001

5. Do NOT write the code. This is a plan, not an implementation.

STEERING IMPACT CHECK:
After the task list, review whether this feature introduces anything
that should update steering files. Steering changes are RARE and only
justified for cross-cutting changes that future features will share.

Examples that justify a steering update:
- New external service or infrastructure (Redis, queue, storage).
- New folder convention or architectural layer.
- New library that becomes a project-wide standard.
- Change to auth model, error handling pattern, or data conventions.

Examples that do NOT justify a steering update:
- Feature-specific tables, endpoints, or business rules.
- One-off integrations used only by this feature.
- UI components specific to this feature.

OUTPUT for the steering check:
Add a section "## Steering Impact" with one of:
  a) "None. This feature is self-contained."
  b) A bulleted list of proposed steering changes, each with:
     - File: <steering/product.md | tech.md | structure.md>
     - Change: <what to add or modify>
     - Rationale: <why this is cross-cutting, not feature-specific>

DO NOT modify steering files directly. The user reviews and applies
changes manually after approving the spec.

OUTPUT:
Edit the existing tasks.md respecting its section structure.
Keep status as "draft" in the front-matter; the user runs
\`friday spec approve tasks\` to mark this spec ready for
implementation.

START by writing the full task list. No clarifying questions are
needed unless the design has gaps — in that case, list the gaps
first and wait for my answers before writing tasks.`;
}

---
spec: <name>
phase: tasks
status: draft
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
---

# Tasks: <name>

<!--
Ordered, actionable breakdown of the approved design.
Each task ≤ 1 day, independently verifiable, linked to user stories
or requirements. Tests are tasks, not afterthoughts.
-->

## Task list

<!--
Format per task:
- [ ] T-XXX: <verb-first description>
      Files: <paths likely touched>
      Done when: <verifiable criterion>
      Addresses: US-XXX (criterion N) | FR-XXX | NFR-XXX
-->

- [ ] **T-001**: ...
      Files: ...
      Done when: ...
      Addresses: US-001 (criterion 1)

- [ ] **T-002**: ...
      Files: ...
      Done when: ...
      Addresses: US-001 (criterion 2), FR-001

- [ ] **T-003**: ...
      Files: ...
      Done when: ...
      Addresses: NFR-001

## Steering Impact

<!--
Mandatory section. Filled by the agent at the end of task generation.
Either:
  - "None. This feature is self-contained."
  - A list of proposed steering changes for the human to review.
The agent NEVER edits steering files directly.

Examples that justify a steering update:
- New external service or infrastructure (Redis, queue, storage)
- New folder convention or architectural layer
- New library that becomes a project-wide standard
- Change to auth model, error handling pattern, or data conventions

Examples that do NOT justify a steering update:
- Feature-specific tables, endpoints, or business rules
- One-off integrations used only by this feature
-->

None. This feature is self-contained.

## Notes

<!--
Optional. Implementation hints, gotchas discovered during design,
or links to relevant docs/issues.
-->

---
name: nth-planner
description: Ordered implementation plan for a change whose problem and design are already settled. Use for substantial multi-step features, cross-cutting changes, migrations, risky refactors, or work with ordering or dependency constraints across milestones. Do not use while a root cause is still undiagnosed (use nth-problem-analysis) or a design choice is still open (use nth-deepthink), or for small localized or single-component changes where implementing is cheaper than planning.
metadata:
  managed-by: nth-claude-kit
---

# Planner

Write an actionable implementation plan. This skill turns what is already known into a plan. Built-in Plan or Explore may gather information first when it is missing. The plan should guide implementation, not read as an essay.

Inspect the codebase before naming files; never invent file names. Keep the plan in the current context. Write a persistent plan file only if the user asks for one, the work needs to persist across sessions, or project guidance requires durable plans.

## Procedure

1. **State the concrete outcome.**
2. **Capture the settled requirements and constraints.**
3. **Identify the relevant existing behavior and project conventions.**
4. **Identify the affected boundaries or components,** and any dependencies and ordering constraints.
5. **Split the work into the smallest sensible ordered milestones.**
6. **Identify meaningful risks,** and rollback or recovery concerns where they apply.

## Output

- **Outcome**
- **Constraints**
- **Milestones** (ordered). For each:
  - objective
  - affected area
  - required behavior
  - success criteria
  - verification: targeted, and delegated to `verifier` when the output is noisy
- **Risks and rollback**
- **Blocking decisions**: only the unresolved decisions that actually block implementation
- **Out of scope**: include this when scope creep is plausible

---
name: nth-refactor
description: Evidence-based structural audit that decides whether existing code whose maintainability has degraded actually needs refactoring, and in what direction. Use when duplication forces repeated changes, responsibilities are badly mixed, abstractions no longer fit actual usage, code has become hard to reason about, or debt is slowing safe changes. Do not use for routine cleanup, formatting, naming, small local smells, opportunistic refactoring during unrelated work, reviewing a completed change (use reviewer), diagnosing a runtime failure (use nth-problem-analysis), choosing among several genuinely difficult designs once a refactor is already justified (use nth-deepthink), or planning a refactor whose direction is already decided (use nth-planner).
metadata:
  managed-by: nth-claude-kit
---

# Refactor audit

Establish whether a structural problem is real and material, then recommend the smallest useful refactor direction. This is an audit. Do not implement anything unless the caller explicitly asks after the analysis. Do not produce a generic clean-code checklist. Report only issues with concrete impact.

## Procedure

1. **Define the maintenance problem.** State what is slow, risky, or repeatedly painful to change.
2. **Gather evidence from actual usage and change patterns.** Look at call sites, changes that had to be repeated in several places, and files that change together in git history (read-only).
3. **Classify only material issues:** duplication, excessive coupling, misplaced responsibility, obsolete abstraction, or accidental complexity. Separate true hotspots from cosmetic smells, and drop the cosmetic ones.
4. **State the concrete impact of each issue:** change amplification, regression risk, comprehension cost, or testing difficulty.
5. **Recommend the smallest useful direction,** and name what should explicitly not be refactored. If several consequential designs remain genuinely open, say so and leave that choice to nth-deepthink.
6. **Define success criteria and regression protection** using the project's existing verification approach.

## Output

- **Problem**
- **Findings**: for each, the issue type, location, evidence, and impact
- **Recommended direction**: the smallest change that is useful
- **Leave alone**: areas and smells deliberately excluded, each with a one-line reason
- **Success criteria and regression protection**

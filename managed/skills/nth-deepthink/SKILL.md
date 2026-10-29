---
name: nth-deepthink
description: Pre-decision synthesis for a genuinely difficult choice where no approach has been selected yet. Use when several dimensions interact, requirements or constraints conflict, or multiple viable options carry significant trade-offs and rework risk. Do not use to debug an observed failure (use nth-problem-analysis), to critique an approach that has already been selected (use nth-decision-critic), to decide whether existing code needs structural refactoring at all (use nth-refactor), to plan a settled change (use nth-planner), or just because a task is large, touches many files, or follows an established project pattern.
metadata:
  managed-by: nth-claude-kit
---

# Deepthink

Reach a well-grounded direction on a conceptually difficult problem. Scale the depth to the problem: when the decision turns out to be simple, say so and answer directly. Do not build exhaustive matrices. Do not spawn subagents to simulate depth. Use independent investigation only when it adds real evidence. This skill does not implement. The main conversation decides and implements.

## Procedure

1. **Define the problem or decision precisely.**
2. **Identify the hard constraints and the unknowns.** Separate facts, assumptions, and preferences.
3. **Identify the few dimensions that actually drive the outcome.**
4. **Develop the credible approaches.** Usually two to four.
5. **Compare their trade-offs** using criteria that matter for this problem.
6. **Test the leading conclusion** against failure cases and reversibility, and resolve contradictions where you can.

## Output

Give a concise synthesis, not a transcript of your reasoning:

- **Recommended direction**
- **Why**: a short summary of the reasoning
- **Key trade-offs**: what this direction gives up
- **Assumptions** it depends on
- **Unresolved uncertainty**, and what would settle it
- **Next action**

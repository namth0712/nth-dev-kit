---
name: nth-problem-analysis
description: Root-cause diagnosis of an observed application, runtime, or system failure (error, crash, wrong output, flaky or regressed behavior) whose cause is unknown. Use when behavior contradicts the code, several causes are plausible, a previous fix failed, the issue spans components, or evidence conflicts. Requires an actual observed failure. Do not use for misbehavior of reusable Claude configuration such as instructions, rules, skills, agents, or prompts (use nth-prompt-engineer), for design, architecture, or trade-off questions without a failure (use nth-deepthink or nth-decision-critic), for obvious localized bugs, syntax/type errors, or cosmetic issues, or when the root cause is already known.
metadata:
  managed-by: nth-claude-kit
---

# Problem analysis

Find the actual root cause before proposing a fix. This skill is an analysis procedure only. Do not edit code just because it was invoked. The main conversation decides whether and how to implement afterward. It is not `reviewer`, which reviews completed changes, and not `verifier`, which runs noisy checks.

## Procedure

1. **State the failure.** Record exactly what happens, where, and with which inputs, compared with what was expected.
2. **Separate observations from assumptions.** Treat every assumption as unverified until evidence supports it.
3. **Gather the smallest useful evidence.** Use the failing path, logs, recent changes, or a targeted reproduction. Use Explore only when broad codebase investigation would materially help.
4. **Form 2–4 plausible hypotheses.** For each one, note which evidence would confirm it and which would falsify it.
5. **Check the highest-value evidence first.** That is the check that eliminates the most hypotheses for the least cost. Drop hypotheses the evidence does not support.
6. **Name a root cause only when the evidence supports it.** If it does not yet, say so and name the next check that would tell the remaining hypotheses apart.

## Output

Give concise, visible findings. Do not narrate your internal thought process.

- **Observed failure**
- **Hypotheses**: for each, the evidence that confirmed or eliminated it
- **Root cause**, or "not yet established" plus the next check
- **Contributing factors** and **symptoms**, kept separate from the root cause
- **Corrective direction**: the smallest change that addresses the root cause
- **Verification**: how to confirm the fix works and the symptom does not return

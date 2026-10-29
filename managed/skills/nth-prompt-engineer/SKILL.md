---
name: nth-prompt-engineer
description: Diagnose and minimally fix reusable Claude configuration (instructions, rules, skills, agents, workflows) when there is observed evidence it misbehaves, including when the cause is unknown. Signs include over- or under-triggering, contradictions, excess context cost, recurring misunderstanding, a component doing too much or too little, and needless tool calls or ceremony. Do not use for ordinary task prompting, rewording a one-off request, style-only rewording, speculative optimization without an observed problem, or application, runtime, or system failures (use nth-problem-analysis).
metadata:
  managed-by: nth-claude-kit
---

# Prompt engineer

Fix reusable Claude configuration based on observed behavior, using the smallest change that works. Diagnose first. Do not edit instructions, rules, skills, or agents unless the caller explicitly asks after the analysis. Do not redesign the instruction system unless the evidence shows the architecture itself is the problem.

## Procedure

1. **State the observed failure or inefficiency,** with its evidence: transcripts, trigger logs, or context measurements.
2. **Identify the responsible component,** or the likely candidates. Separate runtime evidence from speculation.
3. **Inspect for overlap** with neighboring instructions, rules, skills, and agents. Also check for ambiguity, precedence or load-order problems, and context cost.
4. **Propose the smallest change** that fixes the observed issue while keeping the behavior that already works.
5. **Define a before/after calibration test:** prompts that should trigger, prompts that should not, and prompts that sit close to neighboring components.
6. **When implementing, validate** the desired trigger, the negative trigger, interaction with neighbors, and context overhead where it can be measured. Model invocation is probabilistic, so repeat or vary prompts where the result matters.

## Output

- **Observed problem** and its evidence
- **Cause**: the component and mechanism, each marked as evidence or hypothesis
- **Proposed change**: a minimal diff or the new wording
- **Calibration test**: positive, negative, and neighbor prompts, with expected results
- **Results** (if validated), and **remaining uncertainty**

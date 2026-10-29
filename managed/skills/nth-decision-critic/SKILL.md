---
name: nth-decision-critic
description: Adversarial review of a concrete, already-selected proposal with consequential architectural, data, security, operational, API, or long-term maintenance impact, done before it becomes expensive to reverse. Requires a specific proposal to test. Do not use for open-ended option generation or for choosing among undecided options (use nth-deepthink), for debugging a failure (use nth-problem-analysis), for routine details, naming, or cheap reversible choices, or for reviewing finished code.
metadata:
  managed-by: nth-claude-kit
---

# Decision critic

Test a proposed decision against its strongest credible objections. The goal is an accurate verdict, not disagreement. If the decision is clearly adequate, say so. Do not manufacture alternatives. This skill critiques a decision, not code: `reviewer` remains the post-change review. The main conversation owns the final decision.

## Procedure

1. **Restate the decision neutrally,** including its scope.
2. **Extract its important assumptions,** and state what must be true for it to succeed.
3. **Build the strongest credible alternative or objection.**
4. **Check the proposal against:**
   - existing constraints and project conventions
   - reversibility and the cost of being wrong
   - failure modes
   - hidden coupling
   - migration and operational cost, where relevant
   - unnecessary complexity
5. **Separate factual evidence from judgment.** Verify facts from code or docs when practical.

## Output

- **Decision**: a one-line restatement
- **Survives**: what holds up under criticism
- **Weak or unsupported**: each point marked as evidence or judgment
- **Would change the decision**: the specific evidence that would do it
- **Verdict**: keep as is, modify (say how), or reconsider

---
name: nth-doc-sync
description: Audit existing documentation after a meaningful code, architecture, workflow, schema, or behavior change has been completed. It finds stale, missing, duplicated, or contradictory docs and keeps each concern documented in one owning place. Use when implemented behavior, ownership boundaries, schemas, workflows, or APIs changed and docs may now be wrong or inconsistent. Do not use before a meaningful change exists, for small changes with no documentation impact, typo or cosmetic fixes, writing docs from scratch where no documentation system exists, or reviewing code correctness (use reviewer).
metadata:
  managed-by: nth-claude-kit
---

# Documentation sync audit

Check that authoritative documentation still matches what was actually implemented, and that each concern is documented in one owning place. This is an audit. Do not edit docs unless the caller explicitly asks after the analysis. Never rewrite unrelated documentation.

## Procedure

1. **Identify the actual implemented change** from the code or diff, not from the plan or stated intent.
2. **Find the docs that own the affected concerns,** and note which one is the source of truth for each concern.
3. **Compare the implementation against those docs.**
4. **Classify each finding** as stale, missing, duplicated, contradictory, or historical/non-authoritative.
5. **When code and docs disagree, do not assume the docs are wrong.** If a doc may record an intended product or design decision, flag the discrepancy for the user instead of changing the doc to match the code.
6. **Recommend an action for each finding:** update it, remove the duplication, move it to the owning doc, or mark it historical. Keep each rule in one place and link to it rather than copying. Do not copy guidance into project docs when a higher-level source, such as global instructions, already owns it.

## Output

- **Change**: a one-line summary of what was implemented
- **Findings**: for each, the doc, location, classification, evidence, and recommended action
- **Needs a decision**: discrepancies where the implementation itself may be wrong
- **Out of scope**: related doc issues you noticed that this change did not cause

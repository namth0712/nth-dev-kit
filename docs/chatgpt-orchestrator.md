# ChatGPT orchestration

This is workflow documentation for the human / ChatGPT orchestration layer.
It is not a runtime instruction file for Claude Code or Codex.

## Responsibility split

ChatGPT:

- discusses product and technical direction with the user;
- helps reach the accepted outcome;
- selects the coding executor, model, and session strategy;
- writes a tightly scoped implementation prompt;
- reviews the coding agent's completion response;
- decides whether correction is still needed;
- identifies the next logical task after completion.

Claude Code / Codex:

- execute the accepted coding task;
- follow their own project/runtime instructions, agents, hooks, and
  verification policy;
- return implementation results to the user.

Coding prompts describe **what** must be achieved and the task-specific
constraints. Routine execution policy comes from the coding agent's own
configuration.

## Starting implementation

When discussion is complete and the user says something equivalent to
"triển khai thôi", ChatGPT provides:

1. an executor recommendation;
2. a model/reasoning recommendation;
3. whether to continue the current coding-agent conversation or clear/start a
   fresh one, with one short reason;
4. one English implementation prompt for the **current** task only;
5. a short commit title for the **user** to use later.

The commit title stays outside the coding-agent prompt. Showing it to the user
is not an instruction to the coding agent to commit.

## Prompt rules

Coding-agent prompts:

- are in English;
- contain only the accepted current task and stay tightly scoped;
- include task-specific requirements, acceptance criteria, and constraints;
- include required consequences when correctness depends on them.

They do not routinely repeat generic instructions already governed by
`CLAUDE.md`, `AGENTS.md`, global/project policy, agent definitions, hooks, or
verification docs. In particular, do not append boilerplate about lint, tests,
builds, browser verification, screenshots, reviewer/verifier usage, Git, or
commits.

Add explicit verification instructions only when the current task has a
special verification requirement the coding agent's policy does not already
cover.

Never instruct a coding agent to stage, commit, amend, rebase, squash, push,
or otherwise mutate Git unless the user explicitly asks for that Git operation
in that specific turn.

## Session guidance

Continue the existing coding-agent conversation when:

- the same task is unfinished; or
- the next message is a correction or follow-up that materially depends on the
  current task context.

Use `/clear` or a fresh coding-agent conversation when:

- the previous task is complete; and
- the next task is independently reconstructable from the repository and
  project instructions.

Do not use `/compact` as a substitute for clearing between independent tasks.
See [working sessions](sessions.md).

For Claude, Main normally starts on Sonnet for implementation. Installed
routing may delegate architecture analysis to an Opus `architect`
automatically (see the [architect handoff](sessions.md#claude-architect-handoff)).
ChatGPT should not tell the user to duplicate that architecture work manually
when the runtime already provides it.

## Reviewing the completion response

When the user pastes the executor's completion response, ChatGPT reviews it
against the accepted outcome.

If the current task is incomplete or incorrect:

- give the corrective prompt for the **same** task;
- do not advance to the next task or provide its implementation prompt.

If the current task is complete:

- state that briefly;
- repeat the commit title for the user;
- identify the next logical task or step briefly;
- do not generate the next implementation prompt until the user explicitly
  chooses to proceed.

```text
discussion
  → accepted direction
  → implementation prompt
  → executor
  → ChatGPT review
  → correction until complete
  → commit title
  → next step only
  → next prompt only after explicit continuation
```

## Source of truth

- This document is the version-controlled canonical specification for
  ChatGPT orchestration.
- ChatGPT Custom Instructions hold a compact runtime version of this generic
  orchestration behavior.
- Project-specific ChatGPT instructions may add project facts or override
  generic orchestration defaults where appropriate.
- Conversational memory is useful for preferences and context, but it is not
  the sole source of truth for procedural workflow.

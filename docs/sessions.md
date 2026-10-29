# Working sessions

This is user workflow guidance, not always-loaded project instructions.

- Start a fresh conversation for each independent task or coherent cluster
  of related tasks.
- In Claude, use `/clear` between completed tasks. Use `/compact` only when
  continuing the same unfinished task.
- Choose the model and effort before substantial work when the agent offers
  those controls; presets do not set account preferences.
- Reference known files directly instead of repeatedly rediscovering them.
- Prefer narrow searches and quiet command output. Keep useful findings,
  rather than large logs, in the working context.
- After major configuration, plugin, or MCP changes, inspect the loaded
  context using the current agent's supported diagnostics (for example,
  Claude's `/context` when available). Restart if changes need a new session.
- Put durable knowledge in code, docs, or configuration. Conversation history
  is not the project's knowledge store.
- If you plan tasks in ChatGPT and hand them to a coding agent, see
  [ChatGPT orchestration](chatgpt-orchestrator.md).

## Claude architect handoff

This applies where the legacy Claude Complex global instructions are
installed. The session model is your choice; the kit never sets it. The flow
below assumes a Sonnet Main session.

```text
routine bug / UI-only / copy / mechanical task
  → Sonnet Main implements directly

feature / domain / API or data contract / integration / refactor / architecture task
  → Opus `architect` analyzes in an isolated, read-only context
  → Main writes .nth-dev-kit/HANDOFF.md
  → Sonnet Main implements and verifies
  → Main deletes the handoff after successful completion

manual major-design workflow
  → you run an Opus planning session
  → it writes the same .nth-dev-kit/HANDOFF.md
  → a fresh Sonnet session applies it ("implement the current handoff")
    without rerunning architect, then deletes it after successful completion
```

- `.nth-dev-kit/HANDOFF.md` is a temporary local continuity artifact, not
  project documentation. It lets unfinished work survive `/clear`, usage
  limits, interruptions, and switching Claude runtimes or accounts.
- It stays while the task is incomplete: implementation or verification
  pending or failed, the handoff `BLOCKED`, or work interrupted. After the task
  completes and required verification passes, Main deletes it and removes
  `.nth-dev-kit/` only if nothing else is left there. Ask Main to keep it if
  you want it.
- In a Git working tree, Main adds `/.nth-dev-kit/` to the repository-local
  `.git/info/exclude` if it is missing. That is the only Git change this
  workflow makes: it never edits `.gitignore` or commits the handoff.
- The next architect-driven task replaces an existing handoff.
- A handoff marked `BLOCKED` names a decision to resolve before
  implementation.
- To bypass the analysis for a qualifying task, say so explicitly.

## Optional workflows

Ponytail is an optional external add-on. It is not a requirement or capability
of Simple, Standard, or Complex. If desired, configure it separately through
its own workflow. Installing this kit never installs or configures Ponytail.

CodeGraph belongs to the preserved Claude Complex implementation as an
optional integration. Its existing availability and provenance checks still
apply; the dormant lifecycle neither installs the CLI nor indexes projects.

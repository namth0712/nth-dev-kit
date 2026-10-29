# Preset specifications

One logical specification per preset:

- [Simple](simple/SPEC.md): small changes, narrow investigation, economical
  verification, and no unrequested Git mutation.
- [Standard](standard/SPEC.md): Simple plus deliberate investigation routing,
  useful independent checks, and lightweight project documentation discipline.
- [Complex](complex/SPEC.md): the mature Claude capabilities, described without
  copying their implementation.

Specifications describe behavior. [Claude](../agents/claude/README.md) and
[Codex](../agents/codex/README.md) define supported representations. Only Simple
currently has a supported new project application for both agents. No preset
is activated by installing or updating the dormant library.

Use the [Project Start prompts](../README.md#lifecycle) with an explicit preset.
Keep project facts and current tasks separate from preset content.

## Existing Simple installations

`simple/core.md`, `simple/claude/CLAUDE.md`, and `simple/codex/AGENTS.md` have
been consolidated into `simple/SPEC.md`. There are no separately maintained
agent copies. The adapters embed that file's exact text at application time.
The original intent is preserved; the Git rule now explicitly covers all Git
mutations, including staging.

Existing copied Simple instructions are not automatically migrated. Project
Start may adopt an exact current or historical copy without duplicating it;
customized or merely similar text is preserved and reported. See
[ownership](../docs/ownership.md). Historical paths remain useful evidence
through raw Git blobs, not as parallel sources to edit.

Ponytail is an optional external workflow choice, outside every preset. See
[session guidance](../docs/sessions.md).

# Shared settings intent

This file is not a settings file. It describes behavior the installer must
achieve using whatever configuration mechanism the running Claude Code version
supports. Merge only what is listed here; never replace a settings file.

## Required shared behavior

- Maximum nested subagent spawn depth: one level. The main conversation may
  spawn subagents; subagents must not spawn further subagents.
- Do not force a global subagent model.
- Do not force a global subagent model override.
- Conditional, only when the CodeGraph integration is in **automatic** state:
  pre-approve exactly `Bash(<bound-launcher> explore -- *)`, as defined in
  `managed/integrations/codegraph.md`. This is the kit's only managed
  permission. It is recorded in the runtime provenance state (see
  INSTALL.md), and a bare `codegraph` rule is never installed.

## Must be preserved (never set, changed, or removed by this kit)

- Account-specific model selection.
- Account-specific effort level.
- Theme and UI preferences.
- Update-channel settings.
- Authentication and account settings.
- Every other setting not listed under "Required shared behavior".

## Known representation

As of Claude Code 2.1.274 (bootstrap version), the spawn-depth limit is set as an
environment variable in the user settings file's `env` object:

    CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1   (value stored as the string "1")

The subagent-model intents mean: do not set `CLAUDE_CODE_SUBAGENT_MODEL` or
`CLAUDE_CODE_SUBAGENT_MODEL_FORCE`. If either is already present, leave it
alone and report it rather than deleting it; the kit only avoids forcing them.

This representation is historical, not guaranteed. The installer must check the
running version's own documentation and help for the current mechanism before
applying it. If the mechanism has changed, use the documented replacement. If
none is documented, leave the intent unapplied and report it as unsupported.

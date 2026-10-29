# Codex adapter

## Status

| Preset | Representation | Project Start / Update |
|---|---|---|
| Simple | Exact `presets/simple/SPEC.md` text in root `AGENTS.md` | Supported after runtime and ownership checks |
| Standard | Logical spec; no repository mapping for investigation isolation, independent checks, or scoped engineering guidance | Stop: mapping not implemented |
| Complex | No Codex implementation of the Claude role/skill/settings/integration bundle | Stop: mapping not implemented |

These gaps describe this repository, not a claim that Codex lacks subagents,
skills, or review features. Native features alone do not constitute a tested
adapter. Do not copy Claude agent YAML, `paths:` rules, permissions, settings,
or Explore/Plan names into Codex configuration. Do not create a framework to
approximate a missing mapping during installation or project application.

## Runtime contract

At execution time inspect the active Codex version/environment, local help,
applicable configuration, and current official documentation. Confirm support
for root `AGENTS.md`, its discovery/precedence, instruction size limits, and
inert HTML comments. Stop before writing if compatibility is uncertain.

The [official AGENTS.md guide](https://learn.chatgpt.com/docs/agent-configuration/agents-md)
describes global instructions in `CODEX_HOME`, project discovery from root to
working directory, preference for `AGENTS.override.md`, configured fallback
names, and a combined size limit. Check those mechanisms for the actual
runtime. Preserve global and nested instructions. If an override shadows the
root `AGENTS.md`, a fallback would be displaced, or the result would truncate,
stop and report; do not change discovery settings to force this adapter to fit.

For Simple, follow [project ownership](../../docs/ownership.md): merge one
managed block containing the exact spec text into root `AGENTS.md`, preserving
project facts and overrides. Do not install global instructions or modify
`config.toml`, approval policies, models, effort, skills, or plugins. Use a
local copy, never a live reference to the mutable dormant library. Start a
fresh task to load the result.

## Installed library resolution

Resolve the active Codex home from `CODEX_HOME`, or the current runtime's
documented default (normally `~/.codex`). The installed library is its
`nth-dev-kit` subdirectory. This is an internal adapter path, not a project
prompt input. Verify that this subtree is not auto-discovered or imported as
instructions, skills, or plugins in the running environment; stop if uncertain.
Do not write a pointer or preset to global `AGENTS.md` or change discovery settings.

Global Install/Update uses `KIT_SOURCE` and copies the full kit, including both
adapters, all presets/docs/prompts, and inert `managed/` sources, under that
directory. Follow [the dormant library contract](../../docs/lifecycle.md),
including its receipt and installed ownership evidence. Preserve everything
outside that dedicated subtree.

Project Start requires only `PRESET`. If the library exists, verify the full
receipt/integrity and use it. If absent, resolve a positively identified known
source and invoke the same Codex Global Install procedure, verify the result,
then resume Start. If no safe source is known, ask only for the source repository
path. Never use the application project, guess by name, download/clone, or
apply source presets directly. An invalid existing library stops for repair.

Project Update resolves and verifies the same installed copy automatically;
it never bootstraps or uses the source checkout. Missing/invalid installation
stops with Global Install guidance. Projects use local rendered copies and
installed historical proof, so Global Update never changes projects implicitly.

Project Start must stop for Standard or Complex before any project mutation.
Project Update must also stop if an existing preset needs an unsupported
mapping. Neither operation may silently substitute Simple.

# Claude Code adapter

## Status

| Preset | Representation | Project Start / Update |
|---|---|---|
| Simple | Exact `presets/simple/SPEC.md` text in root `CLAUDE.md` | Supported after runtime and ownership checks |
| Standard | Logical spec only; no selected project routing/rule bundle | Stop: mapping not implemented |
| Complex | Complete legacy implementation in `managed/` and `INSTALL.md` | Stop: safe project-local mapping not implemented |

All three specs and the legacy sources can be stored as dormant library data.
Availability in the library does not activate any of them.

## Runtime contract

At execution time inspect the running version, active configuration (including
`CLAUDE_CONFIG_DIR`), local help, and current official Claude documentation.
Confirm project `CLAUDE.md` discovery, precedence, imports, and inert HTML
comments. Inspect applicable parent, project, local, and scoped instructions
without changing them. If a contract is unsupported or uncertain, stop before
writing; do not invent a replacement format. Historical observations in
[compat](../../compat/README.md) are evidence, not a version guarantee.

For Simple, use [project ownership](../../docs/ownership.md) to merge exactly
one block into root `CLAUDE.md`. Copy the spec text; do not import or symlink a
mutable global library into runtime instructions. Preserve all project facts
and overrides outside the block. Do not install agents, rules, skills,
settings, or integrations. Start a fresh session to load the result.

For global operations, use only [the dormant library contract](../../docs/lifecycle.md).
Do not copy anything into Claude's auto-discovered instructions, agents, rules,
skills, plugins, hooks, or settings, except the documented Default enable of
the pinned nth-status component and the Global Update refresh of an already
enabled optional integration; do not execute the legacy installer in
`INSTALL.md`.

## Installed library resolution

Resolve the active Claude configuration directory using `CLAUDE_CONFIG_DIR`
when set, otherwise the current runtime's documented default (historically
`~/.claude`). The installed library is its `nth-dev-kit` subdirectory. This is
an internal adapter path, not a project prompt input. Verify that this subtree
is not auto-discovered or imported as instructions, agents, rules, skills, or
plugins. Stop if uncertain; never inject a preset or pointer into global
`CLAUDE.md` or alter discovery settings to make the directory dormant.

Global Install/Update uses `KIT_SOURCE` and copies the full kit, including both
adapters, all presets/docs/prompts, and inert `managed/` sources, into that
directory. Verify the receipt and installed ownership evidence under the
lifecycle contract; preserve everything outside the dedicated subtree.

Project Start requires only `PRESET`. Verify and use an existing installed
library. If absent, resolve a positively identified known source and invoke
the same Claude Global Install procedure, verify the result, then resume Start.
If no safe source is known, ask only for the source repository path. Never use
the application project, guess by name, download/clone, or apply source presets
directly. An invalid existing library stops for repair instead of bootstrap.

Project Update resolves and verifies the same installed copy automatically;
it never bootstraps or uses the source checkout. Missing/invalid installation
stops with Global Install guidance. Projects use local rendered copies and
installed historical proof, so Global Update never changes projects implicitly.

## Built-in integration

nth-status is the adapter's one default-on integration: a Claude-only mod
drawing a four-row status band (project, model and effort pickers with context
and quota usage, cache countdown and running agents, prompt and session time
and API-equivalent cost) and a `/nth-status` detail pane. It is released from
its own repository; this kit holds no copy of it. `packages/compatibility.json`
pins one release: its version and the sha256 of its six release files and of
its `docs/installation.md`.

- Before writing anything, Global Install and Global Update check
  nth-status's state. Where nothing is installed and no plugin manager has
  it, they verify `STATUS_SOURCE` (the person's checkout, or a clone of the
  pinned release tag) against the pin. A missing tag, a mismatch, a plugin
  manager that cannot be queried, or a state file that cannot be validated
  stops the whole operation with nothing written. After the library is
  verified they run its Default enable, which installs into
  `<config>/skills/nth-status/`, plus a capture-only `statusLine` when none
  exists, under nth-status's own provenance rules.
- Where nothing records a kit install but the plugin manager already has an
  nth-status plugin (for example from its own marketplace), they write
  nothing for nth-status and report it; the library still installs.
- On an enabled installation, Global Update only reports whether it matches
  the pin. Updating it is nth-status's own Update; a kit update never does it.
- nth-status's Disable records an opt-out that Global Install/Update respect.
- Project Start's bootstrap install does not check or enable it. It is not part of any
  preset.

See [integrations](../../docs/integrations.md) for the version contract,
adoption of installations made by earlier kits, and rollback.

## Optional integrations

[Session title](integrations/session-title.md) is an optional Claude-only
mod that names new conversations deterministically and adds `/task` to set the
title's task part. It is not
part of any preset. The library stores it as dormant data; it is enabled per
config home only through its explicit Enable procedure, after which Global
Update refreshes only its proven kit-owned active items.

[Task progress](integrations/task-progress.md) is an optional Claude-only mod
that shows native task progress (a band above the prompt plus a detail pane;
the pane alone in VS Code) and shortens the native stale-checklist reminder to
a checkpoint note. It follows the same dormant/Enable/refresh/Disable lifecycle,
loads from `<config>/skills/nth-task-progress/`, and may own two native
task-tool `env` keys it added.

nth-review, an optional Claude-only code-review skill (`/nth-review`), is not
part of this repository. Its source, procedures and ongoing development stay
in the pre-split nth-dev-kit repository, unchanged; whether and how it joins
this kit is deferred to a separate future workstream. This kit ships no
nth-review files, and no lifecycle prompt creates, enables, refreshes, or
copies it into `<config>/skills/` or any project. Legacy nth-review files an
earlier kit installed in the library are preserved byte for byte outside this
kit's management ([excluded paths](../../docs/lifecycle.md#excluded-legacy-nth-review-paths));
this kit cannot update or disable them. Projects that enabled it
from an earlier kit keep their own copies under
`<project>/.claude/skills/nth-review/`; this kit neither inspects nor changes
them.

## Preserved Complex implementation

These files remain in place to preserve installer paths and historical proof:

| Source | Existing responsibility |
|---|---|
| `managed/global-instructions.md` | Global coding discipline, Explore/Plan/architect/reviewer/verifier routing, and the handoff rule |
| `managed/agents/{architect,reviewer,verifier}.md` | Read-only pre-implementation analysis (Opus), bounded independent review, and noisy verification |
| `managed/rules/*.md` | Path-scoped TypeScript, React, database defaults |
| `managed/skills/*/SKILL.md` | Four reasoning and three maintenance skills |
| `managed/settings.md` | Spawn-depth intent and preservation of user preferences |
| `managed/integrations/codegraph*.md` | Optional CLI integration and automatic routing template |
| `INSTALL.md` (legacy installer section) | Version detection, ownership comparison, runtime provenance, reconciliation |

The legacy installer section of `INSTALL.md` is an active-global installer,
retained for existing users who explicitly request that compatibility
workflow. It is not the Global Install/Update lifecycle of nth-dev-kit (the
entry section above it only routes to that lifecycle). Its procedure after the migration notice is
unchanged, including path validation, core-agent conflict handling,
removed/renamed integration cleanup, and CodeGraph routing consistency. The
only addition is `architect` as a third core agent, installed, conflict-checked,
and validated like `reviewer` and `verifier`.

The global instructions route feature, domain, API/data contract, integration,
infrastructure, refactoring, and other design-bearing tasks to the read-only
`architect` before implementation. Main persists its result to the project's
`.nth-dev-kit/HANDOFF.md` and then implements it. Routine bug, UI-only, and
mechanical tasks stay in Main. The `tools` allowlist (`Read, Grep, Glob`) is
what enforces read-only behavior: Claude Code ignores a subagent's
`permissionMode: plan` when Main runs in `acceptEdits`, `auto`, or
`bypassPermissions` mode. See [session guidance](../../docs/sessions.md#claude-architect-handoff)
for the workflow.

An existing legacy installation remains globally active. The new prompts must
report this state and leave it untouched; installing a dormant library does
not neutralize it. If inherited legacy behavior would defeat the requested
project preset, Project Start/Update stops and reports that incompatibility.
It must not silently label a Simple-plus-global-Complex session as Simple.

Relocating the legacy agents, settings, skill precedence, permission provenance,
and routing safely into project scope needs a separately validated migration.
Neither Standard nor Complex requests authorize running the global installer
or copying a subset of `managed/` into a project.

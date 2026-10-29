# Claude Global Update

Inputs:
- `KIT_SOURCE = <updated trusted nth-dev-kit Git source repository>`.
- `STATUS_SOURCE = <trusted nth-status checkout at the version in KIT_SOURCE/packages/compatibility.json>`;
  required when Global Install's nth-status preflight finds nth-status
  required.
- Optional: `KIT_HISTORY_SOURCE = <frozen pre-split nth-dev-kit Git repository>`
  (see `docs/lifecycle.md`).

Resolve `<active Claude config directory>/nth-dev-kit` automatically, honoring
`CLAUDE_CONFIG_DIR` when set and otherwise the current runtime's default.
Require an existing valid installation; otherwise report Global Install first.
Do not request a library path or change environments to find another copy.

Read `KIT_SOURCE/docs/lifecycle.md`, `docs/ownership.md`, and
`agents/claude/README.md`; execute only the Global Update contract.

- Inspect the installed receipt, current Claude Code version/configuration,
  and supported discovery mechanisms. Stop on incompatibility or uncertainty.
- Before writing anything, run the nth-status preflight of Global Install
  (`prompts/claude/global/install.md`) exactly; a stop there writes nothing,
  the library included.
- Update only provably kit-owned library content. Preserve unrelated/customized
  files and report conflicts. Reconcile removed/renamed components only with
  safe paths and current/historical content proof. Update the FULL library
  from `KIT_SOURCE`, retain verified historical preset evidence for project
  ownership checks, then verify the full inventory and receipt. The library
  copy of the former embedded nth-status (`agents/claude/integrations/nth-status/`,
  `nth-status.md`, `nth-status-statusline.sh`) is a removed component: remove
  each file only when `KIT_HISTORY_SOURCE` history proves it, otherwise
  preserve and report it. The installed nth-status never reads it.
- Never activate Simple, Standard, or Complex, inspect or alter projects, change
  their active presets, or implicitly apply new capabilities. Keep the library
  non-auto-loaded. Do not run the legacy installer in `INSTALL.md`. Do not
  modify user runtime configuration except the nth-status step and optional
  integration refreshes below.
- After the library is verified, nth-status by
  `<config>/nth-dev-kit-hooks/nth-status.state.json`:
  - absent and managed by the plugin manager: write nothing and report it
    exactly as Global Install does;
  - absent otherwise: run "Default enable" in
    `STATUS_SOURCE/docs/installation.md` with the `STATUS_SOURCE` the
    preflight verified;
  - `"enabled": true`: read only; write nothing (a kit update never updates
    nth-status). The state is structurally valid only when it is valid JSON
    with `schemaVersion` 1, `mod.path` exactly `skills/nth-status`, recorded
    files only among the pin's five mod paths (`.claude-plugin/plugin.json`,
    `hooks/hooks.json`, `hooks/register.tsx`, `hooks/status.ts`,
    `types/index.d.ts`), `capture.script` null or with path exactly
    `nth-dev-kit-hooks/nth-status-statusline.sh`, and no symlink, junction or
    reparse point on any of these paths, all inside `<config>` (the
    preflight stops on any other state). A recorded
    file missing or no longer equal to its record is a conflict. Otherwise
    compare each recorded `mod.files` hash with the pin's entry for the same
    path, and a recorded `capture.script.sha256` with the pin's
    `scripts/nth-status-statusline.sh` (an unrecorded script is no
    difference). Report "matches the pinned version", or "differs" naming
    the files and that nth-status's own Update with `STATUS_SOURCE` at the
    pinned version moves it;
  - `"enabled": false` (opted out): change nothing.
- After the library is verified, if `<config>/nth-dev-kit-hooks/session-title.state.json`
  exists, follow "Global Update refresh" in the updated library's
  `agents/claude/integrations/session-title.md` (it also migrates a schema 1
  shell-hook state to the mod). Without that state, never enable it or touch
  `skills/nth-session-title/`, settings, or hooks. Never change
  `NTH_SESSION_TITLE_LABEL`.
- Likewise, if `<config>/nth-dev-kit-hooks/task-progress.state.json` exists,
  follow "Global Update refresh" in the updated library's
  `agents/claude/integrations/task-progress.md`. Without that state, never
  enable it or touch `skills/nth-task-progress/` or settings.
- nth-review is not part of this kit (deferred to a separate workstream).
  Never refresh, enable, or copy it into `<config>/skills/` or any project,
  and never inspect projects. The installed library's legacy nth-review files
  (`agents/claude/integrations/review.md` and everything under
  `agents/claude/integrations/review/`) are the lifecycle's excluded paths:
  leave them byte for byte even when history proves them kit-owned, ignore
  and drop their receipt entries, never treat them as removed components or
  conflicts, and report once that they are preserved outside this kit's
  management. This kit cannot update, enable, or disable nth-review.
- Report refreshed items and conflicts separately from the library result.
- Report any legacy global Claude behavior as unchanged. Validate the library
  and dormancy; report changes, conflicts, and optional per-project updates.
- Do not commit anything or otherwise mutate Git state.

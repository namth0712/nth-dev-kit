# Codex Global Update

Input: `KIT_SOURCE = <updated trusted nth-dev-kit Git source repository>`.
Optional: `KIT_HISTORY_SOURCE = <frozen pre-split nth-dev-kit Git repository>`
(see `docs/lifecycle.md`).

Resolve the installed copy automatically at `$CODEX_HOME/nth-dev-kit`, using
the active Codex home (normally `~/.codex` when unset), not a user-supplied
library path. Require an existing valid installation; otherwise report Global
Install first. Do not change the active environment to find another copy.

Read `KIT_SOURCE/docs/lifecycle.md`, `docs/ownership.md`, and
`agents/codex/README.md`; execute only the Global Update contract.

- Inspect the installed receipt, current Codex version/configuration, and
  supported discovery mechanisms. Stop on incompatibility or uncertainty.
- Update only provably kit-owned library content. Preserve unrelated/customized
  files and report conflicts. Reconcile removed/renamed components only with
  safe paths and current/historical content proof. Update the FULL library
  from `KIT_SOURCE`, retain verified historical preset evidence for project
  ownership checks, then verify the full inventory and receipt.
- Never activate Simple, Standard, or Complex, inspect or alter projects, change
  their active presets, or implicitly apply new capabilities. Keep the library
  non-auto-loaded. Do not modify user runtime configuration or execute `INSTALL.md`.
- Validate content and dormancy; report changes, conflicts, and optional
  per-project updates. Unsupported mappings remain unsupported.
- Do not commit anything or otherwise mutate Git state.

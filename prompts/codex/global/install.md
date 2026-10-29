# Codex Global Install

Input: `KIT_SOURCE = <trusted nth-dev-kit Git source repository>`.
Optional: `KIT_HISTORY_SOURCE = <frozen pre-split nth-dev-kit Git repository>`
(see `docs/lifecycle.md`).

Resolve the active Codex home (`CODEX_HOME`, otherwise the runtime's documented
default, normally `~/.codex`). Install into its `nth-dev-kit` subdirectory;
the user does not supply an installed-library path.

Read `KIT_SOURCE/docs/lifecycle.md`, `docs/ownership.md`, and
`agents/codex/README.md`; execute only the Global Install contract.

- Inspect the current Codex version/environment, relevant configuration, and
  supported native discovery mechanisms. Stop on incompatibility or uncertainty.
- Verify source identity and destination safety/dormancy. Copy the FULL library,
  including all presets, both adapters, docs, prompts, and inert managed sources.
  Create/verify the receipt and installed historical ownership evidence under
  the lifecycle contract. Prove ownership before replacing anything; preserve
  unrelated/customized content and report conflicts. Never sync the whole home.
- Never activate Simple, Standard, or Complex. Never alter projects or their
  active presets. Do not write global `AGENTS.md`, config, skills, or plugins,
  or execute the historical Claude `INSTALL.md`.
- Validate content and dormancy; report library path, version evidence,
  changes, conflicts, and supported project mappings.
- Do not commit anything or otherwise mutate Git state.

Project Start bootstrap invokes this same procedure only when the installed
directory is absent. Return the verified installed library to Start so it can
continue its original preset request; installation itself activates nothing.

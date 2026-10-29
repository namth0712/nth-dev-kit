# Claude Global Install

Inputs:
- `KIT_SOURCE = <trusted nth-dev-kit Git source repository>`.
- `STATUS_SOURCE = <trusted nth-status checkout at the version in KIT_SOURCE/packages/compatibility.json>`;
  required when the nth-status preflight below finds nth-status required;
  not needed when invoked as Project Start bootstrap.
- Optional: `KIT_HISTORY_SOURCE = <frozen pre-split nth-dev-kit Git repository>`
  (see `docs/lifecycle.md`).

Resolve the active Claude configuration directory (`CLAUDE_CONFIG_DIR` when
set, otherwise the runtime's documented default). Install into its
`nth-dev-kit` subdirectory; the user supplies no installed-library path.

Read `KIT_SOURCE/docs/lifecycle.md`, `docs/ownership.md`, and
`agents/claude/README.md`; execute only the Global Install contract.

- Inspect the current Claude Code version/configuration and supported native
  discovery mechanisms. Stop and report incompatibility or uncertainty.
- nth-status preflight, read-only and before writing anything (skip it when
  invoked as Project Start bootstrap), by
  `<config>/nth-dev-kit-hooks/nth-status.state.json`:
  - valid JSON with `schemaVersion` 1 and `"enabled": false`: opted out;
  - `"enabled": true` and structurally valid as the enabled branch of
    `prompts/claude/global/update.md` defines: enabled;
  - present otherwise (invalid JSON, unknown `schemaVersion`, `enabled` not a
    boolean, an enabled state that is not structurally valid): stop, the
    state cannot be verified;
  - absent: query this configuration's plugin manager (for example
    `claude plugin list`). If it lists an nth-status plugin other than
    `nth-status@skills-dir` (for example `nth-status@namth0712-nth-status`),
    the plugin manager manages it. If it cannot be queried, stop. Otherwise
    nth-status is required: read `components.nth-status` in
    `KIT_SOURCE/packages/compatibility.json`, and in `STATUS_SOURCE` compute
    the LF-canonical sha256 of `procedure.path` and of every path in
    `files`; each must exist and match. Without `STATUS_SOURCE`, or on any
    mismatch, stop and report which files differ and that `STATUS_SOURCE`
    must be an nth-status checkout at the pinned `version`.

  A stop here writes nothing at all, the library included. Report the reason
  and what fixes it.
- Verify source identity and destination safety/dormancy. Copy the FULL library,
  including all presets, both adapters, docs, prompts, the component pin, and
  inert managed sources. Create/verify the receipt and installed historical
  ownership evidence under the lifecycle contract. Prove ownership before
  replacing anything; preserve unrelated/customized content and report
  conflicts. Never sync the whole config.
- Never activate Simple, Standard, or Complex. Never alter projects or their
  active presets. Do not run the legacy installer in `INSTALL.md` or alter
  user runtime configuration except the nth-status Default enable below.
  Never enable or refresh the optional session-title or task-progress
  integrations; report an existing enabled state as unchanged. nth-review is
  not part of this kit (deferred to a separate workstream): never create,
  enable, or copy it into the library, `<config>/skills/`, or any project.
  Legacy nth-review files already in the destination are the lifecycle's
  excluded paths: leave them byte for byte and report them as preserved
  outside this kit's management.
- After the library is verified, act on the preflight result. Opted out:
  unchanged. Managed by the plugin manager: write nothing for nth-status;
  report that the plugin manager manages it and that nth-status's "Disable"
  records an opt-out so the kit stops checking. Enabled: report how it
  compares with the pin as the enabled branch of `update.md` does, writing
  nothing. Required: run "Default enable" in
  `STATUS_SOURCE/docs/installation.md` (state absent → Install) with the
  `STATUS_SOURCE` the preflight verified. Report its result and conflicts
  separately from the library. When invoked as Project Start bootstrap, skip
  this step and report that the next Global Install/Update enables
  nth-status.
- Report any existing legacy global Claude behavior as unchanged, not dormant.
- Validate content and dormancy; report the library path, version evidence,
  changes, conflicts, and supported project mappings.
- Do not commit anything or otherwise mutate Git state.

Project Start bootstrap invokes this same procedure only when the installed
directory is absent. Return the verified installed library to Start so it can
continue its original preset request; installation itself activates nothing.

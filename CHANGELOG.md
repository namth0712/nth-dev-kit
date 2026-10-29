# Changelog

## Unreleased

This repository restarted with fresh Git history. The earlier history is the
frozen pre-split repository (root commit
`d4cfc826d2aaa659c7b575e18f698d9d0488bcad`), supplied to Global Install/Update
as the optional `KIT_HISTORY_SOURCE`.

- nth-status moved to its own repository. The kit pins nth-status 0.1.0 in
  `packages/compatibility.json` and holds no copy of it.
- Behavior change: Claude Global Install takes `STATUS_SOURCE` and installs
  the pinned nth-status only after checking that checkout's files against the
  pin. Global Update installs it only where nothing is installed; on an
  enabled installation it reports how it compares with the pin and no longer
  refreshes it. nth-status's own Update moves it.
- Lifecycle: `KIT_HISTORY_SOURCE` (optional) lets ownership proof and the
  historical preset archive use the pre-split history. Docs and prompts name
  no machine path for `KIT_SOURCE`; Project Start bootstrap uses a known or
  explicitly supplied source only.
- nth-review is not part of this repository: it stays in the pre-split
  repository, unchanged, and its integration is deferred to a separate future
  workstream. This kit ships no nth-review files. Legacy nth-review files in
  an installed library are excluded paths: Global Install/Update preserve
  them byte for byte (even when history proves them kit-owned), drop them
  from the receipt, and never update, remove, enable, or disable them
  ([lifecycle](docs/lifecycle.md#excluded-legacy-nth-review-paths)).
- Session-title: examples in `session-title.md`, a comment in
  `hooks/title.ts` and test fixtures use generic names. Global Update's
  refresh replaces an installed `hooks/title.ts` still equal to its record.
- Added `tools/check-portability.sh`, `docs/integrations.md`,
  `docs/development.md`, `docs/releasing.md`; rewrote `README.md`.
- Install from GitHub: `INSTALL.md` now opens with the agent entry that the
  README's one-line prompt points to. It routes to Global Install or Update,
  states the config home and planned writes and waits for confirmation, and
  deletes its temporary clones. The legacy installer below it is unchanged.
- Lifecycle: `KIT_SOURCE` may be a retrieval clone (full, canonical origin,
  temporary) and `STATUS_SOURCE` a clone of nth-status's release tag
  `v<version>`; existing checkouts are still never fetched or changed. Project
  Start still never clones.
- Claude Global Install/Update write nothing for nth-status where no kit
  install is recorded but the plugin manager already has an nth-status
  plugin (its marketplace install), and report it.
- Behavior change: Claude Global Install/Update resolve and verify
  nth-status before writing anything. A missing release tag, files that
  differ from the pin, a plugin manager that cannot be queried, or an
  nth-status state that cannot be validated now stop the run with nothing
  written (previously the library was installed and nth-status skipped). An
  opt-out or a marketplace-installed nth-status still lets the library
  install; Project Start bootstrap is unchanged.
- The pin now names the public nth-status 0.1.0 release (its first public
  commit); four of its six release-file digests changed.
- The portability check allows the public GitHub owner in the repository
  URLs and marketplace identifiers only. `scratchpad/` is ignored.
- README restructured as the public entry: supported environments,
  prerequisites, install, configuration, updates, uninstall, security and
  troubleshooting. The install is one line on every local surface,
  `Install https://github.com/namth0712/nth-dev-kit`, and the README points
  Claude to `INSTALL.md`, whose source step now covers a request that gives
  only the URL and a clone Claude made before reading it.
- Released under the MIT License (`LICENSE`). Global Install/Update copy
  `LICENSE` into the library.

Checked together: nth-status 0.1.0 with Claude Code 2.1.312 (validation and
tests); earlier live checks of nth-status ran on 2.1.310 to 2.1.312.

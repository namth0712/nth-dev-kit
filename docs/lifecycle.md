# Dormant library lifecycle

Global Install/Update stores the full kit as dormant data inside the active
agent's global configuration environment. Neither operation activates Simple,
Standard, or Complex, changes projects, or installs runtime instructions.
Project Start/Update is the only new activation/reconciliation path. One
exception is deliberate: an adapter may document a default-on integration
(Claude: the nth-status mod, an external component pinned in
`packages/compatibility.json`; see [integrations](integrations.md)), which
Global Install/Update enable through that component's own provenance rules
unless the user opted out. A second deliberate exception: an adapter
may document a project-scoped optional integration with its own explicit
per-project Enable, Update, and Disable. Project Start/Update never run them,
and Global Install/Update only store such an integration as dormant library
data. All operations prohibit commits and other Git mutations. Creating
and deleting a retrieval clone (below) is not a mutation of an existing
repository.

## Inputs and runtime checks

- `KIT_SOURCE` belongs only to Global Install/Update, including the installation
  substep of Project Start bootstrap. It identifies the trusted Git source
  repository, one of:
  - a local checkout of this repository that the person names. Do not fetch,
    pull, or change that checkout as part of a lifecycle prompt;
  - a retrieval clone made for this run, as [INSTALL.md](../INSTALL.md)
    describes: a full, non-shallow `git clone` of
    `https://github.com/namth0712/nth-dev-kit` (the default branch, or the tag
    or branch the person names) into a new, empty temporary directory outside
    the configuration directory and the current project. Its identity is that
    `remote.origin.url` (with or without `.git`), `git rev-parse
    --is-shallow-repository` reporting `false`, and the complete kit structure.
    Any other URL needs the person's explicit confirmation that they trust it.
    Report its `HEAD` commit as the revision, not as a release. Write nothing
    else into it, and delete it after the run.

  A shallow clone lacks the history that proves earlier kit content, so it is
  never used as `KIT_SOURCE`.
- `KIT_HISTORY_SOURCE` is an optional input of the same operations. This
  repository restarted with fresh Git history; the frozen repository holding
  the earlier history has root commit `d4cfc826d2aaa659c7b575e18f698d9d0488bcad`.
  When it is supplied, confirm that root commit, then read it only as raw Git
  objects (commit lists and blobs, never a checkout), and never fetch, pull,
  check out, or change it. Its history counts as this kit's source history
  wherever this contract and [ownership](ownership.md) use Git history as
  proof; current `KIT_SOURCE` content still comes first. Without it, content
  that only the earlier history can prove is preserved and reported, as any
  unprovable copy is. Bootstrap uses it only when already known and never
  asks for it.
- Claude's default-on nth-status also needs `STATUS_SOURCE`, the nth-status
  repository at the version `packages/compatibility.json` pins: a local
  checkout under the same no-fetch rule, or a retrieval clone of
  `https://github.com/namth0712/nth-status` at the release tag `v<version>`
  (nth-status's tag convention; a shallow clone is enough, since only file
  digests are checked) made and deleted the same way. Make it only when the
  nth-status preflight needs it, before anything is written. A missing tag or
  failed clone means there is no `STATUS_SOURCE`, which stops the operation
  before any write; see the
  [Claude adapter](../agents/claude/README.md#built-in-integration).
- The adapter resolves the installed location internally: Codex uses
  `$CODEX_HOME/nth-dev-kit` (default Codex home: `~/.codex`); Claude uses
  `<active Claude config directory>/nth-dev-kit` (`CLAUDE_CONFIG_DIR` when set,
  otherwise the current runtime's default). Inspect the active environment;
  do not assume the default when an override applies.
- Project Start accepts only `PRESET = Simple | Standard | Complex` as its
  normal kit-related input. Project Update needs no kit path or preset input.
  Neither asks the user to locate the installed library or uses the Git source
  as a substitute. Ambiguous active environments stop before writes.

Inspect the active agent version and relevant non-secret configuration. Use
local help and current official documentation to identify supported discovery
mechanisms and the selected `agents/<agent>/README.md` contract. Do not read
credentials, sessions, logs, caches, or account data. If the library's dormant
status or adapter compatibility is uncertain, stop and report before mutation.
Unsupported Standard/Complex project mappings may be stored as documentation;
this does not make them applicable.

The dedicated `nth-dev-kit` subdirectory is inside the active configuration
environment but must be outside automatic discovery and active instruction
imports. Verify that its nested `managed/`, adapters, and prompts are inert
data for the running agent. Resolve paths and check reparse points before
access. Reject source/destination overlap and any destination in the current
application project. If the expected location is auto-loaded or dormancy cannot
be established, stop; do not invent a different location. Do not modify global
`AGENTS.md`/`CLAUDE.md`, register plugins, hooks, MCP servers, permissions,
skills, or settings, except a default-on integration (Global Install step 5,
Global Update step 5) and the refresh in Global Update step 5. Never execute
the legacy installer section of `INSTALL.md`. Report existing
historical Claude global behavior as unchanged, not as dormant.

## Library contents and receipt

Install the FULL library for either agent, not a preset or agent subset. Copy
ordinary files, preserving repository-relative paths: `README.md`, `INSTALL.md`,
`LICENSE`, `compat/README.md`, `packages/compatibility.json`, and all library material under `presets/`,
`agents/`, `prompts/`, `docs/`, and `managed/`. Both agents' adapters and all
eight prompts are included. Exclude `.git`, local configuration, credentials,
runtime data, the repository's development files (`CHANGELOG.md`, `tools/`,
`scratchpad/`), and unrelated untracked extras such as tree-generation scripts.
Preflight the complete repository-owned library inventory; do not silently
omit a required non-Markdown library resource. The selected adapter alone
governs execution. `managed/` remains inert data, never runtime installation.

Keep a small library receipt `.nth-dev-kit-library.json` with `schemaVersion: 1`,
`agent: "claude" | "codex"`, and `files`, an object mapping each copied relative
path to its lowercase SHA-256 of LF-canonical UTF-8 content. These content
digests identify the exact installed revision even for an uncommitted copy.
Do not claim a release based only on source HEAD. Receipt keys are inventory,
not ownership or permission to access arbitrary paths.

Include installed ownership evidence under `history/presets/<preset>/<digest>.md`.
During global operations only, collect exact current and historical spec text
from the trusted source and, when supplied, `KIT_HISTORY_SOURCE` (raw Git
blobs, including the three former Simple paths documented in ownership.md). Deduplicate by canonical content digest;
include these files in the receipt. Retain proven prior evidence on updates.
This small text archive is not a Git checkout or runtime instruction source;
it lets Project Update prove older content without accessing `KIT_SOURCE`.
Never archive arbitrary project text as kit evidence. If source history cannot
prove an old version, report that limitation rather than manufacturing proof.

Validate the receipt schema, agent, path allowlist, and digests; invalid JSON,
duplicate keys, unknown schemas, unsafe paths, or changed recorded content
are conflicts. Apply [ownership](ownership.md) independently to every existing
file. Current kit content or raw Git history of `KIT_SOURCE` or
`KIT_HISTORY_SOURCE` (including renamed source paths) must prove
replacement/removal; hashes or a kit-looking directory alone cannot.
Use source history when available. If an old copy has no matching available
history, preserve it and report the limitation.

### Excluded legacy nth-review paths

Earlier kits shipped the nth-review integration as library data. It remains
in the pre-split repository and is outside this kit. In an installed library
(either agent), `agents/claude/integrations/review.md` and everything under
`agents/claude/integrations/review/` are excluded paths:

- Global Install and Global Update never create, replace, refresh, remove,
  rename, activate, or deactivate anything at these paths, and never write
  under them. They are not inventory, not removed components, and not
  ownership candidates: do not prove them, even when current content or Git
  history (`KIT_SOURCE` or `KIT_HISTORY_SOURCE`) would show them kit-owned.
  They are preserved byte for byte.
- Do not traverse into them for reconciliation, and never follow a reparse
  point there.
- An existing receipt's entries for these paths are ignored during validation
  (path allowlist and digest alike) and are not carried into a refreshed
  receipt. Files at these paths are neither recorded nor reported as
  conflicts, so they never stop an operation.
- Report once, separately from the library result, that legacy nth-review
  files are present and preserved outside this kit's management. This kit
  offers no way to update, enable, or disable nth-review.

Every other path keeps the ownership and conflict rules of this document and
[ownership](ownership.md).

Before project operations, require a valid receipt for the active agent and
verify every recorded file's digest, safe relative path, and presence. Require
the full library inventory above, including all three specs, both adapters,
all eight prompts, and the shared lifecycle/ownership docs; a subset receipt
is not a full install. Validate history filenames against their preset and
content digest. Unrecorded files are not authoritative kit sources. Missing,
invalid, mismatched, or incomplete receipts stop the project operation with a
request to run Global Install to diagnose/repair it. Do not overwrite an
existing invalid installation or fall back to the source checkout.

## Global Install

1. Complete runtime and source checks; resolve the adapter's installed location
   inside the active configuration environment and enumerate the full library.
2. Preflight all files. Create missing files; accept exact current content
   unchanged. An existing library with a valid receipt belongs to Global
   Update; report that route rather than rerunning legacy installation.
   Any other destination collision must be proven and reconciled before use.
   [Excluded legacy nth-review paths](#excluded-legacy-nth-review-paths) are
   left as they are and never created. Before any write, also run the
   preflight the adapter documents for each default-on integration: it
   verifies the integration's provenance state and, where step 5 will install
   it, its source against the adapter's pin. A failed preflight stops the
   operation with nothing written; an opt-out and the adapter's documented
   exceptions pass it.
3. Copy the full approved library and ownership evidence, then create the
   receipt. Preserve unrelated destination files; never replace or sync the
   whole directory.
4. Verify each copied file and receipt, and confirm nothing was written to
   automatically loaded files or projects. Report library path, agent/version,
   available mappings, conflicts, and that no preset was activated. Never
   enable or refresh optional integrations; report an enabled one as unchanged.
5. Only after step 4 verified the library: for each default-on integration the
   adapter documents, act on the step 2 preflight: run its documented Default
   enable with the source verified there where nothing is installed, and
   leave an opted-out integration, or one the adapter documents as managed
   elsewhere, unchanged. Default enable installs only where nothing is
   installed. Report its result and conflicts separately; they never change
   the library result.

## Global Update

1. Resolve the same installed location automatically. Require and inspect the
   existing library receipt and current agent version; take updates from
   `KIT_SOURCE`, never from a project or another arbitrary library.
   Preflight the new source and every existing managed file against current
   content/history and the receipt. Preserve custom/unprovable files and stop
   on library conflicts; do not leave a mixed library labeled as successfully
   updated. [Excluded legacy nth-review paths](#excluded-legacy-nth-review-paths)
   take no part in this preflight or in the steps below. Run the default-on
   integration preflight of Global Install step 2 here as well.
2. Update proven older content, leave exact current files untouched, and add
   new library material only as dormant data. For removed/renamed components,
   validate each old path against a known historical library source path,
   prove its content, then remove that file only. Never recursively delete a
   directory with extra user files. Unsafe records remain for conflict repair.
3. Preserve verified preset ownership evidence before replacing old specs;
   retain the historical text archive even when source components disappear.
   Refresh the receipt only for the successfully reconciled full inventory. On
   partial I/O failure report incomplete state; never claim success or conceal
   the mismatch. Re-running must first revalidate actual files and proof.
4. Verify content and dormancy. Report the library delta. Never inspect or
   alter projects' active presets, and never apply newly added capabilities
   to them. Project Update remains optional and explicit for each project.
5. Only after step 4 verified the library: for each optional integration the
   adapter documents, if its provenance state exists in the active
   configuration, run that integration's documented Global Update refresh. An
   absent state means it is not enabled: do not create, enable, or inspect its
   runtime entries. A default-on integration differs: with no state, run its
   Default enable with the source the step 1 preflight verified (or nothing,
   where the adapter documents another manager); with an
   enabled state, only report how the installation compares with the pin and
   write nothing (a kit update never updates it); with an opted-out state,
   skip it. Report
   integration results and conflicts separately; they never change the library
   result. A project-scoped integration keeps its state in each project, which
   Global Update never inspects: never refresh it, and report that existing
   project installations need their own explicit Update.

## Project Start: resolve, bootstrap, apply

1. Require one explicit valid `PRESET`; never choose automatically. Resolve
   the active agent environment and its normal installed location.
2. If that directory exists, verify its receipt and full integrity before
   loading its contracts. A damaged, partial, or unreceipted directory is a
   conflict, not an absent installation; stop and report Global Install repair.
3. If the directory does not exist, resolve a source safely. Use an already
   configured/known source location or an explicitly supplied source path,
   only when positively identified. Confirm
   the candidate's resolved Git root, its previously established source identity,
   and complete kit structure. A matching folder name or `.git` alone is not
   proof. Never treat the current application project as the kit source, scan
   arbitrary similarly named directories, download/clone a replacement, or use
   embedded preset copies. If no source can be established, ask only for the
   nth-dev-kit source repository path and retain the original preset selection.
4. Execute that source's `prompts/<agent>/global/install.md` using exactly the
   Global Install contract above, including ownership, version, path, dormancy,
   and full-library receipt checks. Bootstrap may write only the dedicated kit
   directory, never other global configuration, so it skips Global Install
   step 5 and the integration preflight of step 2, and reports that the next Global Install/Update enables the
   default-on integration. Do not apply any preset yet.
5. Verify the installed receipt and integrity. Continue the original Project
   Start from the installed library's lifecycle, ownership, adapter, and selected
   spec. Do not read source files for project application or store source links
   in project instructions. Apply only the requested compatible preset locally.
   Unsupported mappings stop before project writes, even after bootstrap.

Bootstrap installs only when absent; it never implicitly updates an existing
library. On installation failure leave the project unchanged and report the
failure. If installation succeeded but application is blocked, report those
two outcomes separately. The user need not leave the project or repeat Start.

## Project Update

Resolve and verify the installed library from the active environment exactly
as above, with no path inputs. Unlike Start, Update does not bootstrap or run
Global Update. If the library is absent/invalid, stop and report Global Install
first. Identify the existing project preset and follow the installed ownership
contract, using only installed current specs and historical text evidence.
Never request the Git source as a project dependency, switch presets, add new
capabilities implicitly, or change unrelated global/user configuration.

These are agent-executed contracts, not an unattended installer. Content proof
and runtime inspection are required on every run. They do not migrate or
disable historical user configuration as a side effect.

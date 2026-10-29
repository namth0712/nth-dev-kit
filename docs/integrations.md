# Integrations and the nth-status contract

| Integration | Agent | Where its source lives | Activation |
|---|---|---|---|
| nth-status | Claude | Its own repository; pinned in `packages/compatibility.json` | Default-on: Global Install/Update install the pinned release unless opted out |
| [Session title](../agents/claude/integrations/session-title.md) | Claude | `agents/claude/integrations/session-title/` | Optional, per config home, explicit Enable |
| [Task progress](../agents/claude/integrations/task-progress.md) | Claude | `agents/claude/integrations/task-progress/` | Optional, per config home, explicit Enable |
| nth-review | Claude | Not in this repository: the pre-split repository, with its ongoing work | Deferred to a separate future workstream |
| CodeGraph | Claude (legacy Complex) | `managed/integrations/` | Legacy installer only |

The kit owns the lifecycle that installs and refreshes these. Each
integration's own document owns its runtime files, state and procedures.
nth-review, an optional project-scoped code-review skill, is not part of this
repository. Its source, procedures and ongoing development stay in the
pre-split repository, unchanged. Whether it later joins this kit or becomes a
component of its own is a separate, future workstream: this split neither
requires nor performs it, and no lifecycle prompt here creates, enables,
refreshes, or copies it.

## nth-status

nth-status is developed, versioned and released in its own repository, which
holds the only copy of its source. This kit holds no nth-status files: only
the pin, its prompt steps, and this document.

### The pin

`packages/compatibility.json` names the one nth-status release this kit
installs:

| Field | Meaning |
|---|---|
| `schemaVersion` | `1` |
| `components.nth-status.version` | The release's `version` from its `.claude-plugin/plugin.json` |
| `components.nth-status.activation` | `selected-profile`: installed only into the config home the running session uses |
| `components.nth-status.files` | LF-canonical sha256 of each of its six release files, by repository-relative path |
| `components.nth-status.procedure` | Path and sha256 of its `docs/installation.md`, so the kit runs exactly the procedure it checked |

There is no `kitVersion`, release `ref`/commit SHA, or minimum Claude Code
version in the pin yet: the kit has no version number, the first release
commits and tags are made by hand, and no minimum has been tested. The
release is identified by its digests, which a checkout either matches or not.

A known-good combination is this kit's content (its library receipt digests)
plus the pinned release. The versions checked together are recorded in
[CHANGELOG.md](../CHANGELOG.md).

### What the kit does with it

1. Before writing anything, Global Install checks nth-status's provenance
   state: opted out passes; an enabled state must be structurally valid; an
   invalid state stops. With no state, it queries the configuration's plugin
   manager: if that cannot be queried, it stops; if it lists an nth-status
   plugin other than `nth-status@skills-dir` (its own marketplace install),
   nothing will be written for nth-status.
2. Otherwise nth-status is required: it reads `components.nth-status` and
   checks `STATUS_SOURCE`, the person's checkout or, in the
   [GitHub install](../INSTALL.md), a clone of
   `https://github.com/namth0712/nth-status` at the tag `v<version>`. Every
   pinned file and the procedure must exist and match. A missing tag or a
   mismatch stops the whole install with nothing written, the library
   included, and names the version needed.
3. It copies the library (the pin included) and verifies it.
4. It runs "Default enable" from `STATUS_SOURCE/docs/installation.md` where
   nth-status is required, reports how an enabled installation compares with
   the pin, and changes nothing where it is opted out or managed by the
   plugin manager. Its result and conflicts are reported separately from the
   library.

Global Update does the same, including stopping before any write. On an enabled
installation it only compares the recorded hashes with the pin and reports;
it never changes nth-status files. Project Start's bootstrap install skips
nth-status entirely. See the [Claude prompts](../prompts/claude/global/install.md).

### Profile targeting

Every step works on the config home of the running session only
(`CLAUDE_CONFIG_DIR` when set, otherwise the default). Another home is never
read or written, and no credentials are read or copied. To set up a second
home, run Global Install in a session started with that `CLAUDE_CONFIG_DIR`.

### Updating nth-status without a kit release

Run nth-status's own Update with `STATUS_SOURCE` at the release you want, in
each config home you want to change. Only nth-status's files, its
`statusLine` and its state change. The kit's next Global Update then reports
that the installation differs from the pin and leaves it alone.

To make a newer release the kit's default, update `packages/compatibility.json`
(see [releasing](releasing.md)); existing installations still move only when
someone runs nth-status's Update.

### Opting out and uninstalling

nth-status's Disable removes only what its Install recorded and writes an
opt-out; Global Install/Update then leave it off. Its Install leaves the
opt-out again.

A marketplace install of nth-status is managed by Claude Code's plugin
manager (`claude plugin disable` / `uninstall`); the kit never changes it.
Running nth-status's Disable once in that home records an opt-out, so the kit
stops checking it.

The kit itself has no uninstall procedure. Its library is the data folder
`<config>/nth-dev-kit/` (receipt `.nth-dev-kit-library.json`), which no runtime
loads; Project Start/Update need it. Each optional integration has its own
Disable. To remove the kit, first run each enabled integration's Disable,
then delete `<config>/nth-dev-kit/` by hand. Project Start/Update then stop
until the next Global Install, and preset blocks already written into
projects stay as they are. Deleting the folder also deletes any
[legacy nth-review files](lifecycle.md#excluded-legacy-nth-review-paths) in
it; move them out first if you still use them.

### Rollback

- nth-status: its Update with `STATUS_SOURCE` at an earlier release.
- The kit library: Global Update proves replacements from `KIT_SOURCE` content
  and history, so moving to an older kit checkout leaves files newer than that
  checkout as unprovable conflicts. It is not a supported path.
- A kit from before the split refreshes nth-status from its own embedded copy
  once its library update succeeds, replacing only files still equal to
  their records (see cutover step 6 below).

## Installations from before the split

Earlier kits embedded nth-status and refreshed it on every Global Update.
Their installations use the same paths, state file and schema as the
standalone release, so they need no migration:

- The next Global Update reports how the installation compares with the pin.
  Release 0.1.0 (the initial public release, which adds marketplace
  packaging and runtime fixes) differs from the last embedded copy in
  `.claude-plugin/plugin.json`, `hooks/register.tsx`, `hooks/status.ts` and
  `types/index.d.ts`, so the report names those files; `hooks/hooks.json`
  and the capture script are unchanged. nth-status's Update with
  `STATUS_SOURCE` at 0.1.0 replaces them.
- The old library copy of nth-status (`agents/claude/integrations/nth-status/`,
  `nth-status.md`, `nth-status-statusline.sh` under `<config>/nth-dev-kit/`)
  is a removed component. Global Update removes those files only when
  `KIT_HISTORY_SOURCE` is supplied and proves them; otherwise they stay and
  are reported. The installed nth-status never reads them.
- Session-title's `hooks/title.ts` changed by a comment in this release; its
  Global Update refresh replaces an installed copy still equal to its record.

## Cutover from the pre-split repository

This repository and nth-status were populated from the pre-split repository's
working tree, with fresh history. The switch is manual and reversible:

1. If nth-status changed since the pin, run `sh tools/release-digests.sh` in
   nth-status and update `packages/compatibility.json`.
2. Create both Git repositories, their first commits and the nth-status
   `v0.1.0` tag by hand.
3. In a throwaway config home, run Global Install with `KIT_SOURCE` (this
   repository), `STATUS_SOURCE` (nth-status at `v0.1.0`) and
   `KIT_HISTORY_SOURCE` (the frozen pre-split repository), then Global Update
   again and confirm it writes nothing.
4. A config home's installed library may hold legacy nth-review files
   (`agents/claude/integrations/review.md` and `agents/claude/integrations/review/`
   under `<config>/nth-dev-kit/`). This kit's Global Install and Global Update
   preserve them byte for byte as
   [excluded paths](lifecycle.md#excluded-legacy-nth-review-paths), whether
   or not history proves them, drop them from the receipt, and report them as
   preserved. They stay outside this kit's management: it cannot update,
   enable, or disable nth-review, and projects that use it keep their copies.
   nth-review's own procedures and development stay with the pre-split
   repository; transferring it is a separate, future decision, not part of
   this cutover.
5. For each real config home you switch: Global Update with the same three
   inputs, then nth-status's Update with `STATUS_SOURCE` at `v0.1.0`.
6. To undo, run the pre-split kit's Global Update from the frozen repository.
   Files this kit added to the library (`packages/compatibility.json` and
   the new docs) are unprovable there, so it may stop and report them as
   conflicts; after checking that they equal this kit's copies, delete them
   from `<config>/nth-dev-kit/` and rerun. Once its library update succeeds,
   it refreshes nth-status from its embedded copy, replacing only files still
   equal to their records.

Keep the frozen pre-split repository while any installation made from it
remains: it is the `KIT_HISTORY_SOURCE` that proves that installation's older
content.

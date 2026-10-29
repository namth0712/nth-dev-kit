# Installing nth-dev-kit

This file is the entry point for a Claude Code session asked to install or
update nth-dev-kit from https://github.com/namth0712/nth-dev-kit. It only
routes: the contracts it names are authoritative, and nothing here replaces
or relaxes them. People start from the [README](README.md#install).

## Install or update with Claude Code

Steps for the agent:

1. **Session.** Continue only in a local Claude Code session (the CLI, the
   VS Code extension, or a local session in the Claude desktop app's Code
   tab) with a shell and `git` on `PATH`. In a cloud or remote session, or
   any surface that cannot write the person's local Claude configuration,
   stop and say so.
2. **Config home.** Resolve the active configuration directory as
   [the Claude adapter](agents/claude/README.md#installed-library-resolution)
   does: `CLAUDE_CONFIG_DIR` when set in this session's environment,
   otherwise the runtime's default. Never switch homes inside a session. To
   install into another home, stop and explain that Claude Code must be
   restarted with `CLAUDE_CONFIG_DIR` set to it.
3. **Source.** Use one `KIT_SOURCE` and check it before reading further:
   - A local checkout the person names is used unchanged. It must be a Git
     repository with this kit's structure; if `git rev-parse
     --is-shallow-repository` reports `true`, stop and say so (it cannot
     prove earlier kit content).
   - Otherwise use the retrieval clone that
     [the lifecycle](docs/lifecycle.md#inputs-and-runtime-checks) defines
     (full, canonical origin, in a new temporary directory outside the config
     home and the current project, at the ref the person names or the
     default branch). A request that gives only the repository URL, such as
     `Install https://github.com/namth0712/nth-dev-kit`, means this. If you
     already cloned it for this run, check that clone against those rules: if
     it is shallow, run `git fetch --unshallow` in it; if it is anywhere else
     (for example inside the current project), make a correct clone and treat
     the first one as this run's clone to delete. Make one only if no usable
     clone exists yet.
   - Read this file again from `KIT_SOURCE` if you started from another copy
     (for example one fetched from the web).
4. **Route.** Read `<config>/nth-dev-kit/.nth-dev-kit-library.json`. A
   receipt that parses as JSON and names agent `claude`: Global Update,
   which validates it and stops on invalid or conflicting state. No
   `<config>/nth-dev-kit/` directory, or one without such a receipt: Global
   Install, which preserves and reports anything it cannot prove.
5. **Other inputs.** Use `KIT_HISTORY_SOURCE` only when the person supplies a
   local path to it; never ask for it. For nth-status, a checkout the person
   names is used unchanged. Otherwise, before step 6, apply the state and
   plugin-manager checks of the chosen prompt's nth-status preflight, and
   make the `STATUS_SOURCE` retrieval clone (the pinned release tag) only
   when they find nth-status required. If those checks stop, the tag is
   missing, or the clone fails, stop: nothing is installed.
6. **Confirm once.** Before writing anything, tell the person: the config
   home and why it was chosen, Install or Update, the source and its
   revision (`HEAD`), and what may be written: `<config>/nth-dev-kit/`; for
   nth-status, `<config>/skills/nth-status/`,
   `<config>/nth-dev-kit-hooks/nth-status*`, and a `statusLine` only if none
   exists; and on Update, a refresh of any optional mod already enabled in
   this home (its own files under `<config>/skills/` and
   `<config>/nth-dev-kit-hooks/`, and the settings entries it recorded). Wait
   for their go-ahead.
7. **Run.** Follow `KIT_SOURCE/prompts/claude/global/install.md` or
   `update.md` exactly, with the inputs above.
8. **Clean up.** On every exit, including a stop in any step above, a
   declined confirmation, or a prompt that stops on a conflict, delete only
   the clones this run created, and report their paths if deletion fails.
   Then give the prompt's report, and stop. Never run Project Start as part
   of this.

Codex: install from a local checkout with
[prompts/codex/global/install.md](prompts/codex/global/install.md) or
[update.md](prompts/codex/global/update.md); this entry does not cover it.

## Legacy active-global installer (never run for a normal install)

> This is the preserved **active-global** `nth-claude-kit` installer, not the
> dormant Global Install/Update lifecycle. Do not execute it for a normal
> nth-dev-kit install, update, or Project Start. Use the
> [entry above](#install-or-update-with-claude-code) or the eight prompts
> linked from [README.md](README.md#lifecycle). Continue below only when the
> user explicitly requests maintaining the historical global Claude setup.
> Existing global behavior is not migrated or disabled by the new lifecycle.
> The procedure below and its compatibility identifiers remain unchanged,
> except that `architect` joined `reviewer` and `verifier` as a core agent.

These instructions are for a Claude Code instance. Use them to install or update
this kit in the Claude Code configuration that **your current session** uses.
Follow them in order. Running them again should update the installation, and a
second run with no kit changes should change nothing.

This repository describes intent. Paths, file formats, and commands mentioned
below are what worked at bootstrap (see `compat/README.md`). If the running
version documents something different, follow the running version. Do not write
an install script. Inspect, decide, and apply each step yourself.

## A. Detect runtime

1. Get the running version (for example `claude --version`).
2. Find the active configuration directory:
   - If `CLAUDE_CONFIG_DIR` is set in this session's environment, use it.
   - Otherwise use the version's default user config directory (at bootstrap:
     `~/.claude`).
   - Say which directory you picked, and why, before changing anything.
3. Inspect the current configuration before changing anything. Record the
   global instructions file, the global agents, and the user settings file.
   Keep the original settings content so you can compare it later.
4. For this version, work out the supported mechanism for each of these:
   global instructions, global subagents, global rules, global skills, and
   shared settings/environment. Use sources in this order: local `--help`
   output, the version's official documentation (the `claude-code-guide`
   agent, if available), what you see on disk, and `compat/README.md` last.
5. If this repository conflicts with the runtime, the runtime wins. Report the
   conflict.

## B. Preserve unrelated configuration

- Never overwrite, copy, or sync the whole config directory.
- Never read into, copy, or sync any of these: authentication, credentials,
  sessions, conversation history, project history or memory, caches, logs,
  telemetry, backups, plugins, account-specific model or effort settings, or
  user agents, rules, and skills that are not in `managed/`.
- Manage only the components in `managed/`. Anything else in the config
  directory is out of scope, even if it looks outdated.

### Ownership comparison

Every ownership or update decision in this document compares managed text
canonically. That covers "matches", "identical", "earlier kit version", and
"obsolete". It applies to agents, rules, skills, and global-instructions
sections alike.

- Canonicalize both sides by converting CRLF, then any remaining lone CR, to
  LF. Change nothing else: whitespace, encoding (including a BOM),
  frontmatter, and content must match exactly.
- Ownership can be proven by the current kit file, or by a historical version
  of the same file from this repository's git history, including earlier
  paths of renamed files. Read historical versions as raw blobs from the
  object store (for example `git cat-file -p <commit>:<path>`), never from a
  checked-out working tree. Canonicalize them too, so the result does not
  depend on `core.autocrlf` or other checkout settings. This repository
  restarted with fresh history: its earlier history is the frozen repository
  described as `KIT_HISTORY_SOURCE` in
  [the lifecycle](docs/lifecycle.md#inputs-and-runtime-checks), and counts as
  this repository's git history when the user supplies it.
- A marker, name, or path alone never proves ownership. Without a matching
  git history version, only a match with the current kit file proves it.
- If an installed file already canonically matches the current kit file, it
  is unchanged. Do not rewrite it just to change its line endings. When an
  update is required, write the kit file's content.

### Runtime provenance state

Some changes cannot carry their own ownership proof: an entry in a shared
list (such as a permission rule), or a file rendered with machine-specific
values. Identical content never proves who created such an entry. For these,
the kit keeps a small state file in the active configuration directory
(at bootstrap: `<config>/nth-claude-kit-state.json`):

    {
      "schemaVersion": 1,
      "managedPermissions": [ { "integration": "<name>", "value": "<exact rule>" } ],
      "managedFiles":       [ { "integration": "<name>", "path": "<path relative to config>", "sha256": "<of the exact bytes written>" } ]
    }

- Record only what the kit itself added or wrote. The file holds no
  credentials, secrets, or session data.
- If the entry already existed before the kit added it, leave it alone and do
  not record it.
- Update or remove a recorded entry only if it is still present with exactly
  the recorded value or hash. Afterwards, update the record.
- Recorded but changed: preserve it and report a conflict. Present but not
  recorded: the user owns it, so preserve it.
- Git history and string equality never prove ownership of these entries.
- If the state file exists but is not valid JSON or has an unknown
  `schemaVersion`, do not overwrite it. Report a conflict, and skip every
  change that depends on provenance.
- Write the state file only when a recorded mutation happens, and keep it
  otherwise.
- A `managedFiles` record never authorizes arbitrary file access. Before you
  read, update, or delete its target, validate the record:
  - `integration` must be a current or git-history integration of this kit
    (the name of an intent file under `managed/integrations/`).
  - `path` must be exactly that integration's expected path (at bootstrap:
    `rules/nth-claude-kit/<integration>.md`). It must be relative and use no
    `..`, and no other filename or directory is accepted.
  - Resolve the target, following symlinks, junctions, and other reparse
    points, and confirm it still lies inside the configuration directory's
    kit namespace (at bootstrap: `<config>/rules/nth-claude-kit/`).
  - A record that fails any check is unsafe. Do not touch its target: keep
    the record, and report a conflict.

## C. Install managed agents

For each file in `managed/agents/`, install it through the global-agent
mechanism this version supports (at bootstrap: `<config>/agents/<name>.md`).

If an agent with the same name already exists at the destination, compare
them as described in "Ownership comparison":

- **Matches the current kit file**: leave it alone.
- **Matches an earlier kit version from git history**: update it.
- **Anything else** (custom edits, a different purpose, or unclear
  ownership): do not overwrite it. Report the conflict with a short diff, then
  continue with the remaining steps.

`architect`, `reviewer`, and `verifier` are core agents: the global
instructions route work to them by name. If any one of them is in conflict
(including an unowned user-level agent with the same name), the installation
is in conflict. Do not install or update the routing. Instead, handle the existing
managed block in step D as follows:

- If the block is proven kit-owned (its text canonically matches the current
  kit file or a git-history version), remove the whole block, markers
  included, so no kit routing points at the conflicting agent. Report that
  the kit's global instructions are **disabled** until the conflict is
  resolved. A later install re-adds the block.
- If the block is customized or its ownership cannot be proven, leave it
  untouched. Report a **blocking conflict**, and warn that existing routing
  may send work to the conflicting user-level agent.
- If there is no block, add none.

In every case, skip the rest of step D for this run, including its normal
"Neither present: append" path, so a disabled block is not re-added in the
same run. Report the installation as not successful. This applies only
to the user-level configuration you are installing into. Same-name agents in
individual projects are intentional overrides; they are never inspected or
treated as conflicts.

## D. Merge global instructions

Skip this step if step C found a core-agent conflict; the conflict handling
above has already dealt with the block for this run.

Merge `managed/global-instructions.md` into the global instructions file this
version supports (at bootstrap: `<config>/CLAUDE.md`). Never replace the whole
file.

The installed content goes in a delimited managed block:

    <!-- nth-claude-kit:begin global-instructions -->
    ...exact contents of managed/global-instructions.md...
    <!-- nth-claude-kit:end global-instructions -->

- **Block present:** the markers alone do not prove ownership of the text
  between them. Using "Ownership comparison", compare that text with the
  current kit file and with the historical versions of
  `managed/global-instructions.md`:
  - It matches the current kit file: leave the file untouched.
  - It matches an earlier kit version: replace only the text between the
    markers, keeping the file's existing line-ending style.
  - Anything else (for example, a user edit inside the markers): leave it,
    and report the conflict with a short diff.
- **No block, but sections with the managed file's headings already exist
  unmarked** (for example, a manual copy): if each one canonically matches the kit
  content or an earlier kit version, replace them with a single managed
  block where the first one was. A section runs from its heading up to the
  next heading of the same or higher level, or to the end of the file. Do not
  add a second copy. If any of them contain custom content, report the
  conflict and leave the file unchanged.
- **Neither present:** append the managed block, with a blank line before it.
- **File missing:** create it with only the managed block.
- Leave all other content exactly as it is.
- If this version stops honoring HTML comments as inert text, choose an
  equivalent safe delimiter the version documents, and report the change.

## E. Apply settings intent

Read `managed/settings.md`. Translate each required behavior into the settings
mechanism this version supports. Merge into the existing user settings:

- Parse the file, change only the managed keys, and write it back. Keep all
  other keys and their values.
- For nested objects such as `env`, add or update only the managed keys. Never
  replace the whole object.
- Never add, change, or remove anything listed under "Must be preserved".
- If the file is not valid JSON (or this version's format), stop this step and
  report it. Do not rewrite a file you cannot parse.

## F. Rules and skills

- If `managed/rules/` exists and contains real rules, install them through
  this version's user-level (global) rules mechanism. At bootstrap, that is
  `.md` files under `<config>/rules/`, which is searched recursively, with
  optional `paths:` YAML frontmatter for path scoping. If the running version
  uses a different rule format or scoping syntax, translate to it. If it
  cannot scope rules by path, do not install them unscoped; report the rules
  as unsupported.
  - Install kit rules into a kit-owned namespace (at bootstrap:
    `<config>/rules/nth-claude-kit/`) so ownership is unambiguous. Never touch
    the user's other rules, or project rules (`<project>/.claude/rules/`).
  - Inside the namespace, use the step C ownership policy for each file.
    Leave matching files alone, and install new or updated ones. If a file
    is not in `managed/rules/`, remove it only if it canonically matches an
    earlier kit version; otherwise report it.
  - If a same-named rule exists outside the namespace, report it as a
    possible duplicate. Do not modify it.
  - Files in the namespace that the provenance state records (rendered by
    step G) belong to step G. Leave them alone here.
- If `managed/skills/` exists and contains real skills, install each skill
  folder through this version's user-level (global) skills mechanism. At
  bootstrap, that is `<config>/skills/<name>/SKILL.md`. Skill folders are not
  discovered inside a namespace subfolder, so kit skills sit beside the
  user's own skills.
  - Names: every kit skill name starts with `nth-`. Personal skills take
    precedence over same-named project skills, so the prefix prevents kit
    skills from shadowing project skills. Never install a kit skill under an
    unprefixed name.
  - Ownership is proven by content alone, using "Ownership comparison". An
    installed skill file belongs to the kit only if it canonically matches
    the current kit file or a version of it in git history, including
    earlier paths of renamed skills. The `metadata.managed-by: nth-claude-kit` frontmatter
    marker only helps find candidates. It is never proof on its own.
  - Missing: install it. Identical to the current kit file: leave it alone.
    Matches an earlier kit version: update only the files the kit ships, and
    report any extra files without deleting them. Anything else: report a
    conflict with a short diff, and preserve the installed files.
  - Obsolete: this covers kit-looking skills whose name is no longer in
    `managed/skills/`, including skills the kit has renamed. Remove one only
    if every one of its files canonically matches a version in git history.
    Otherwise report it and preserve it.
  - A kit version that was installed but never committed cannot be proven
    later. It will be reported as a conflict for the user to resolve.
  - Never touch other user skills, account-synced skills, plugin skills, or
    project skills. If a higher-precedence skill with the same name would
    shadow a kit skill, report it.
- If either directory is missing or empty, skip it. Never create placeholder
  components.

## G. Optional integrations

Each file in `managed/integrations/` describes one optional external CLI tool.
The kit never installs, vendors, upgrades, or configures these tools. It
never adds MCP servers for them, and never indexes or initializes projects.
Everything an integration writes (a permission, a rendered rule) is recorded
in the runtime provenance state.

Classify each integration, and report the state:

- **unavailable**: the tool's CLI is not found, or its read-only version
  check fails.
- **manual**: the CLI works, but automatic use cannot be made safe. Either
  the Bash tool is unavailable in this runtime (check your own tool list; a
  fresh headless session's init tool list confirms it), or no
  executable-bound permission can be established as the intent file defines
  it.
- **automatic**: the CLI works, Bash is available, and an executable-bound
  permission was verified at runtime. That means the resolved absolute
  launcher runs without resolving anything through `PATH`, the rule matches
  only its intended command, and a same-named shadow executable is not
  auto-approved.

Then reconcile, using provenance for every write:

- **automatic**: add the intent's permission and record it. Leave a
  present-but-unrecorded identical permission alone and unrecorded; it still
  counts as established. Render the routing rule (at bootstrap:
  `<config>/rules/nth-claude-kit/<name>.md`) and record it only once the
  permission is established. If the permission is in conflict, treat the
  integration as **manual**.
- **manual or unavailable**: remove the integration's recorded permission and
  rendered files only if they still match their records, then drop those
  records. Preserve anything unrecorded or changed, and report it.
- **The managed form changed between kit versions**: migrate only entries
  proven by provenance.
- **Integrations no longer in `managed/integrations/`** (removed or renamed):
  after the current integrations are processed, check the provenance records
  that name any other integration. Remove a recorded permission only if it
  is still present with exactly its recorded value. Remove a recorded file
  only if its record passes the `managedFiles` validation and its hash still
  matches. Drop each record only after its cleanup succeeds. If anything has
  changed or is unsafe, preserve it and report a conflict. A name or path
  alone never proves ownership.
- Never install a broader fallback, such as a bare-name rule, a wildcard
  over the tool's commands, or a PowerShell rule, just to reach automatic
  mode.

## H. Validate

- Validate the installed agent definitions with the version's own tooling
  (at bootstrap: `claude plugin validate <config>/agents`). Also confirm that
  the frontmatter parses.
- Confirm `reviewer` and `verifier` have exactly the tools
  `Read, Grep, Glob, Bash, PowerShell`: no `Write`, `Edit`, or `Agent`.
- Confirm `architect` has exactly the tools `Read, Grep, Glob`: no `Write`,
  `Edit`, `Bash`, `PowerShell`, or `Agent`. Confirm its frontmatter sets
  `model: opus`, `effort: high`, and `permissionMode: plan`, and sets no
  `maxTurns`, so a turn limit cannot cut off the handoff.
- None of the three core agents may set `omitClaudeMd`, so all of them
  receive the applicable project instructions.
- Global instructions: identify which one of these states applies, and
  validate only that state. Derive the managed headings from
  `managed/global-instructions.md`; do not hard-code them.
  - **Installed** (normal): there is exactly one begin marker and one end
    marker. The text between them canonically equals
    `managed/global-instructions.md`. Each managed heading appears exactly
    once in the whole file, so no managed section exists both inside and
    outside the block.
  - **Disabled** (a proven block was removed because of an `architect`,
    `reviewer`, or `verifier` conflict): there are zero kit markers, and none
    of the managed headings appear anywhere in the file.
  - **Blocked, or block conflict** (a block that could not be proven
    kit-owned was preserved, or a core-agent conflict found no block): the
    file is byte-identical to its state before this run. Do not check marker
    or heading counts here, and do not normalize the preserved content.
- Rules: every file in `managed/rules/` must be installed canonically
  identical in the kit namespace, with no extra or duplicate kit rules. If practical,
  confirm that a matching file actually triggers the rule (for example, with
  the version's instruction-load diagnostics). If you cannot test it, say so.
- Skills: every skill in `managed/skills/` must be installed canonically
  identical,
  with no duplicate or stray kit skills. Confirm the runtime recognizes them,
  for example in a fresh headless session's skill list. Note that the
  version's skill-listing budget may truncate descriptions.
- Confirm the settings intent is met (at bootstrap:
  `env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH == "1"`), and that no
  subagent-model override was added.
- Compare the settings with the copy you kept in step A. Only managed keys,
  and permissions that step G recorded in the provenance state, may differ.
- Integrations: report each state (unavailable, manual, or automatic). In
  automatic mode, confirm the intended command is approved without a prompt,
  and that other commands of the tool, path options, environment prefixes,
  chaining, and a shadow executable are not. Confirm every provenance record
  matches what is actually installed.
- Report whether a restart or new session is needed. At bootstrap, agents,
  global instructions, rules, and `env` are all read when a session starts.
  Skill edits hot-reload, but a skills directory created during a session is
  only picked up by a new session.

If this version does not support a managed capability, do not invent an
undocumented workaround. Leave that component unapplied and report exactly
what is unsupported and why.

## I. Git safety

Installation changes Claude Code configuration only. Never commit, stage,
reset, checkout, restore, stash, rebase, merge, push, or rewrite history in
this repository or any other. Read-only git commands (`log`, `show`, `diff`,
`status`) are allowed.

## Final report

Include:

- the version and config directory
- each component, with its status: installed, updated, unchanged, conflict,
  unsupported, unavailable, manual, automatic, blocked (global instructions
  held back by a core-agent conflict), or disabled (a proven kit block
  removed because of that conflict)
- the files modified
- the validation results
- whether a restart is required

# Session-title integration (optional, Claude-only)

A small Claude Code mod, [session-title/](session-title/), that gives each new
conversation a short, deterministic title and adds a `/task` command to set
the title's task part. It makes no model call, adds no prompt section or tool,
and runs `git` read-only.

    C2_ndk_main_OH          new conversation
    C2_ndk_main_OH_mod      after /task mod

It is not part of Simple, Standard, or Complex. Global Install/Update stores
these files as dormant library data and never enables them; Project
Start/Update never touches them. It becomes active in one Claude config home
only when the user explicitly asks for **Enable** below. After that, Global
Update keeps the active copy current through
[Global Update refresh](#global-update-refresh). There is no Codex counterpart.

## States

| State | What exists in `<config>` | Who changes it |
|---|---|---|
| Dormant (available) | Canonical files under `nth-dev-kit/agents/claude/integrations/session-title/`; no state file | Global Install/Update, as library data only |
| Enabled (active) | `nth-dev-kit-hooks/session-title.state.json` (schema 2), plus the mod copy it records | Enable, Global Update refresh (proven kit-owned items only), Disable |
| Enabled, earlier version | A schema 1 state file recording `nth-dev-kit-hooks/session-title.sh` and one `hooks.SessionStart` group | Global Update refresh or Enable migrate it to schema 2; Disable removes it |
| Label | `env.NTH_SESSION_TITLE_LABEL` in `settings.json` | The user (or Enable with explicit `LABEL`); independent of the states and inert without the mod |

The state file's presence is what "enabled" means. Without it, no lifecycle
operation reads or writes this integration's mod folder, settings, or hooks.

## Title format

    <label>_<folder>_<branch>_<model><effort>[_<task>]

| Field | Source | Rule |
|---|---|---|
| label | `NTH_SESSION_TITLE_LABEL` from that config home's settings `env` | Kept as set when it matches `[A-Za-z0-9._-]{1,16}` |
| folder | Basename of the session's working directory | First letter or digit of each `-`-separated part, lowercase: `sandbox` → `s`, `sample-mod` → `sm`, `nth-dev-kit` → `ndk` |
| branch | `git symbolic-ref --short -q HEAD` (read-only) | `main`, `master`, `develop` kept; otherwise each `/` component abbreviated like the folder: `feature/key-points` → `f/kp` |
| model | The SessionStart input's `model`, else the session's main-loop model | Family: `O` Opus, `S` Sonnet, `H` Haiku |
| effort | See [Effort](#effort) | `L` low, `M` medium, `H` high, `xH` xhigh, `Max` max; shown only right after a model code |
| task | `/task <name>` only; never inferred | Trimmed, whitespace runs collapsed to one space |

A field that is unknown or invalid is left out together with its `_`: no
placeholder, timestamp, sequence number, or `Untitled`. Examples: no
repository → `C2_ndk_OH`; unknown effort → `C2_ndk_main_O`; another model
family → `C2_ndk_main`. When no field is known, no title is set. Abbreviation
collisions are accepted.

### Effort

SessionStart hooks receive no effort on 2.1.310, so the mod uses, in order:

1. the effort the engine sent on the main loop's last request for the current
   model, or none if that request carried no effort (known once a request has
   gone out, so for `/task`; an `/effort` change shows after the next request);
2. `CLAUDE_CODE_EFFORT_LEVEL` in the environment;
3. the merged settings: `modelSettings[<model>].effortLevel` (a `[1m]` model id
   also matches its base id), then `effortLevel`.

Not visible to the mod: a `--effort` command-line flag, and the model's own
default when nothing above is set (effort is then left out). At startup a
model that takes no effort may still show the settings value. Running `/task`
after a request refreshes the title with the effort that request sent.

## Behavior

Verified on Claude Code 2.1.310 (see [evidence](#verified-representation)).

| Event | Title |
|---|---|
| New conversation (`startup`) | Set, unless it already has a title (for example `claude -n <name>`), it is a subagent, or a hook beneath already set one |
| `resume`, `--continue`, `fork`, `clear`, `compact` | Never set; the existing title stays |
| Manual `/rename` | Never overwritten automatically |
| `/task <name>` | Title becomes `<prefix>_<name>` |
| `/task` (no argument) | Title becomes `<prefix>`, removing the task part |

`/task` recomputes the prefix when it runs, so it reflects the current
branch, model and effort. It replaces whatever the title was, a manual one
included, because the user asked for it. It runs the built-in `/rename <title>`
just after answering (a command hook cannot run another command while it
holds the turn), so it costs no model call; like any `/rename`, the model sees
a short hidden note that the session was named. The kit never edits session or
transcript files.

## Runtime label

The label identifies a local Claude config home (for example one per
account directory). It is local metadata: no credentials or account identity,
and never stored in this repository. Set it in the `env` object of that config
home's `settings.json`:

```json
{ "env": { "NTH_SESSION_TITLE_LABEL": "C1" } }
```

Each config home has its own settings file, so labels are independent.
Lifecycle operations never change the label except Enable with an explicit
`LABEL`. A new label applies to new conversations and the next `/task`.

## Runtime files and ownership

Enable writes only these, all in the active config directory `<config>`:

| Item | Owner proof |
|---|---|
| `<config>/skills/nth-session-title/`: the mod's runtime files, LF bytes: `.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/register.ts`, `hooks/title.ts` | sha256 of each, recorded in the state file |
| `<config>/nth-dev-kit-hooks/session-title.state.json`: provenance | — |

```json
{
  "schemaVersion": 2,
  "mod": {
    "path": "skills/nth-session-title",
    "files": { "<relative path>": "<sha256 of the bytes written>" }
  }
}
```

Claude Code auto-loads a plugin folder under `<config>/skills/` as
`nth-session-title@skills-dir` (honoring `CLAUDE_CONFIG_DIR`), so loading
needs no settings, marketplace, or `enabledPlugins` change. Tests (`tests/`)
stay in the library; the folder holds only the four runtime files.

Schema 1 (the earlier shell hook) recorded:

```json
{
  "schemaVersion": 1,
  "script": { "path": "nth-dev-kit-hooks/session-title.sh", "sha256": "<hash>" },
  "settingsHook": { "event": "SessionStart", "group": <exact group inserted> }
}
```

The runtime copy lives outside the receipted library. Ownership follows the
runtime provenance rules of [INSTALL.md](../../../INSTALL.md#runtime-provenance-state):
an item is kit-owned only while it is present with exactly its recorded hash or
value. The label is user configuration: it is never recorded as owned. Enable,
Global Update refresh, and Disable never touch other skills, plugins, hooks or
settings, the nth-status, task-progress, or CodeGraph integrations, the legacy
`nth-claude-kit-state.json`, or the library under `<config>/nth-dev-kit/`.

## Enable

Run only when the user explicitly asks, in the config home they intend.
Optional input: `LABEL`. Do not commit or otherwise mutate Git.

1. Resolve `<config>` (`CLAUDE_CONFIG_DIR` when set, otherwise the runtime
   default) and state which directory, and why, before changing anything.
2. Confirm on the running version, probing uncertain points only with a
   scratch copy loaded by `claude --plugin-dir <copy>`: `claude plugin
   validate` lists only `session.start`, `classic.SessionStart`, `turn.step`
   and `command.run{command=task}` hooks, the calls `$.command.register`,
   `$.command.run`, `$.clock.after`, `$.process.run`, `$.session.*`,
   `$.settings.read`, `$.ui.toast`, and env reads of `NTH_SESSION_TITLE_LABEL`
   and `CLAUDE_CODE_EFFORT_LEVEL` only; a new interactive session gets the
   title; `/task x` renames it with no assistant message. If unsupported, stop
   and report; do not switch to another mechanism.
3. Require a valid installed library receipt. Take the four runtime files from
   `<config>/nth-dev-kit/agents/claude/integrations/session-title/` and verify
   their receipt digests.
4. Validate the state file if present. Invalid JSON, an unknown
   `schemaVersion` or key, a schema 2 mod path other than exactly
   `skills/nth-session-title` or a recorded file that is not a safe relative
   path inside it, a schema 1 script path other than exactly
   `nth-dev-kit-hooks/session-title.sh`, a symlink/junction/reparse point
   anywhere on a recorded path, or a target outside `<config>` is a conflict:
   stop. A `"disabling": true` state (left by an interrupted Disable) is
   accepted here: Enable drops the flag when it writes the state. A schema 1
   state is migrated as in [Global Update refresh](#global-update-refresh)
   step 4; Enable then continues at step 5 with the schema 2 state (stale
   schema 1 items: Enable continues at step 5 as if no state existed).
5. Check the mod folder's path, with or without a state file:
   `<config>/skills/` and `<config>/skills/nth-session-title/`, where they
   exist, must be ordinary directories (no symlink, junction, or reparse
   point) inside `<config>`; otherwise conflict.
   Preflight every runtime file before writing any: missing → to write;
   canonically equal to the library copy → keep; equal to its recorded sha256
   → to replace; anything else → conflict. Any other file in the folder is a
   conflict. On any conflict stop and write nothing.
6. Write the planned files as LF bytes, `.claude-plugin/plugin.json` last (the
   folder becomes a plugin only once its manifest exists).
7. Set `env.NTH_SESSION_TITLE_LABEL` only if the user supplied a valid
   `LABEL`, keeping every other entry.
8. Write the state file only if its content changes.
9. Verify: each file matches its recorded hash; settings differ from the
   original only in the requested label; `claude plugin list` shows
   `nth-session-title@skills-dir` loaded. Report that it applies to new
   conversations.

Rerunning Enable is safe and changes nothing when everything is current.

## Global Update refresh

Claude Global Update runs this after the library update has been reconciled
and its receipt verified. If the library update stopped or is incomplete,
skip it and report the integration as not refreshed. It never enables the
integration, re-adds removed items, or changes the label.

1. No state file: the integration is not enabled. Stop here without reading or
   writing `skills/nth-session-title/`, `nth-dev-kit-hooks/`, or
   `settings.json`.
2. Validate the state file as in Enable step 4. On conflict, change nothing
   active and report it. A `"disabling": true` state: change nothing and
   report that Disable must be rerun.
3. If the updated library no longer ships the mod, leave the active items and
   state unchanged and report that Disable can remove them.
4. Schema 1 (migration to the mod; the same enabled integration gets its new
   implementation). Preflight everything before writing anything:
   - the recorded hook group is present exactly, or missing (changed →
     conflict);
   - the script matches its recorded sha256, or is missing (changed →
     conflict);
   - `settings.json` parses;
   - each mod runtime path is absent or canonically equal to the library
     copy, the folder holds no other file, and the folder path passes Enable
     step 5's path check;
   - at least one of the group and the script is still present. Both missing
     means the user already removed the integration: write nothing and report
     the stale state for Disable to clear.
   On any conflict write nothing, leave the schema 1 items active, and report.
   Otherwise: write the mod files (`.claude-plugin/plugin.json` last); remove
   the recorded group if present (then `hooks.SessionStart` and `hooks` only if
   left empty; nothing else in `settings.json` changes); delete the script if
   present; write the schema 2 state; remove nothing else from
   `nth-dev-kit-hooks/`. Continue with this section's step 6.
5. Schema 2. Preflight every file before writing any. Each recorded file,
   compared with the updated library copy:
   - canonically equal → no write (correct the recorded hash if it differs);
   - present with exactly the recorded sha256 → to replace with the library's
     LF bytes, recording the new hash;
   - missing → conflict: do not recreate it; report that Enable or Disable is
     needed;
   - anything else → customized: conflict.
   A runtime file new in the library is to be written only if its path is
   absent (present → conflict). A recorded file the library dropped is to be
   deleted only if its hash matches (customized → conflict). On any conflict
   write nothing at all and report it. Write order: files,
   `.claude-plugin/plugin.json` last, then the state file, rewritten only if a
   record changed.
6. On an I/O failure, stop and report exactly what was written; a rerun
   revalidates from the actual files. Verify each active file against its
   record and, after a migration, that settings differ from their prior
   content only in the removed group. Report refreshed, migrated, unchanged,
   and conflicting items separately from the library result. Integration
   conflicts never change the library outcome.

A second run with no kit changes writes nothing.

## Disable

1. Validate the state file as in Enable step 4. No state file: nothing is
   owned; report any `skills/nth-session-title/` folder or similar hook group
   as user-owned.
2. Schema 2: delete `.claude-plugin/plugin.json` first if its sha256 matches
   (the folder then stops loading as a plugin), then each other recorded file
   whose sha256 matches; a missing one is
   already resolved; a changed one stays, keeps its record, and is reported as
   a conflict. Leave any unrecorded file and report it. Then remove the mod's
   directories only if empty.
3. Schema 1: remove the recorded group only if an exactly equal one is present,
   then `hooks.SessionStart` and `hooks` only if left empty (missing → drop its
   record; changed → keep the record and report). Delete the script only if
   its sha256 matches the record; otherwise keep it and report.
4. If no conflict remains, delete the state file, then remove
   `nth-dev-kit-hooks/` only if empty. Otherwise rewrite the state file with
   only the conflicting records (schema 1: `script` and/or `settingsHook`)
   and `"disabling": true`, so a rerun of Disable reports the same conflict
   and changes nothing, and Global Update refresh never re-adds what Disable
   removed.
5. Report a remaining `NTH_SESSION_TITLE_LABEL` as user-owned and inert.

Existing titles stay as they are.

## Verification

Run the mod's tests on a scratch copy of `session-title/`, so the repository
and the receipted library stay byte-identical:

    claude plugin validate <copy>
    claude plugin test <copy>

The tests cover the folder, branch, model, effort, label and task rules;
dropped fields; full titles; effort from settings, a `[1m]` model id, the env
override, and the last main-loop request (none included); startup gating (resume, fork, clear, compact, an existing title,
a subagent, a title set beneath); and `/task` setting, replacing and removing
the task through `/rename`. Live checks per config home: a new interactive
session gets the expected title; `/task mod` renames it with no assistant
message; a manually renamed session keeps its title after restart and
`/resume`.

## Verified representation

Evidence from Claude Code 2.1.310 (installed types and live probes); current
runtime detection wins.

- SessionStart input: `session_id`, `transcript_path`, `cwd`,
  `scratchpad_dir`, `hook_event_name`, `source`, and optionally `agent_type`,
  `model`, `session_title` (the current custom title). The interactive CLI
  passes `model` (`claude-opus-5-5`, `claude-opus-5-5[1m]`). No effort field
  and no `CLAUDE_EFFORT` variable, even with effort configured.
- A mod's `classic.SessionStart` hook sees that input and its
  `sessionTitle` is stored for `startup`, whether or not a settings hook is
  configured; settings hooks run beneath it.
- `UserPromptSubmit` can also set a title, but only when the prompt goes on to
  the model: with `decision: "block"` or `continue: false` the title is
  discarded, and `suppressOriginalPrompt` does not stop the model call. It
  carries no model or effort. A slash command with no definition does not
  raise it. So a hook-only `/task` would cost a model call; it is not used.
- A mod command answered with `{ text }` makes no model call. Calling
  `$.command.run` from inside that command's hook is refused ("it would wait
  on the turn this hook is holding"); scheduled with `$.clock.after`, the
  built-in `/rename <title>` sets and persists the title with no assistant
  message.
- `turn.step` carries the effort of each main-loop request (`high` for
  `claude-opus-5-5` under `modelSettings` `high`).
- The mod API has no call to read or set the session title directly, and its
  own `session.start` has no source.

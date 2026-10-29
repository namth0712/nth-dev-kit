# Task-progress integration (optional, Claude-only)

A small Claude Code mod, [task-progress/](task-progress/), that shows the
progress of Claude's native task list: a compact one-row band above the prompt
and a detail pane with every task.

    ● Running ━━━━────── 2/5 · Running tests Tasks
    ◌ Paused ────────── 0/10 · list not updated · Doing backend schema Tasks
    ● Running · No plan

It reads Claude's native task tools (`TodoWrite`, `TaskCreate`, `TaskUpdate`),
the native task files, the turn lifecycle, and the permission-request event.
The native task list is the only source of progress: the mod keeps no
checklist of its own. It makes no model call, registers no tool, adds no
prompt section, never denies or rewrites a tool call, and never extends a turn.
Counts, bar and current task are computed locally. Its effects on the model:
the native stale-checklist reminder (see
[Surfaces and native tools](#surfaces-and-native-tools)), shortened to a
checkpoint note while a checklist is open and dropped otherwise, and the
one-line answer of `/task-progress` when the person runs it.

It is not part of Simple, Standard, or Complex. Global Install/Update stores
these files as dormant library data and never enables them; Project
Start/Update never touches them. It becomes active in one Claude config home
only when the user explicitly asks for **Enable** below. After that, Global
Update keeps the active copy current through
[Global Update refresh](#global-update-refresh). There is no Codex counterpart.

## States

| State | What exists in `<config>` | Who changes it |
|---|---|---|
| Dormant (available) | Canonical files under `nth-dev-kit/agents/claude/integrations/task-progress/`; no state file | Global Install/Update, as library data only |
| Enabled (active) | `nth-dev-kit-hooks/task-progress.state.json`, plus the mod copy and settings `env` values it records | Enable, Global Update refresh (proven kit-owned items only), Disable |

The state file's presence is what "enabled" means. Without it, no lifecycle
operation reads or writes this integration's mod folder or settings.

## Behavior

In the terminal the band is a rounded panel matching nth-status's (border in
the theme's `subtle`, one cell of padding, the same faint fill per theme
family): a head row with the bold execution state, a bar of heavy `━` cells
that fills the row (completed part in the state's color, the track in
`subtle`), `completed/total · percent`, and a `[ Tasks ▾ ]` button; under it
the current task, dim and cut to fit:

    ╭──────────────────────────────────────────────────────────╮
    │ ● Running ━━━━━━━━━━━━━━━━━━━━━━━━━ 1/4 · 25% [ Tasks ▾ ] │
    │ Locating integration entry points                        │
    ╰──────────────────────────────────────────────────────────╯

Height contract with nth-status, whose panel sits under this band and which
cannot measure it: the panel (4 rows, 3 without a checklist) is drawn only
where the band's `maxRows` holds 10, so 6 stay for nth-status's own panel;
nth-status reserves 4 rows from 10 and 1 below. With fewer rows, or where the
head row does not fit, the band is one row without a border. In the fullscreen
layout `maxRows` is what the bottom slot (at most half the terminal, the
prompt included) leaves, per the mod API; that the expanded native task list
takes from that slot is inferred from the border loss seen with it, not
verified live.

    ● Running ━━━━━━━━ 1/4 · 25% · Locating integration entry points Tasks

The button gives way before the bar, and in the one-row form the current task
first. The desktop app keeps the one-row band below (state, bar, `c/t`, the
current step, `Tasks`). Execution state and task completion are separate:

| Situation | Band |
|---|---|
| Idle with no checklist (new or cleared session, turn ended) | hidden |
| Main turn running, no checklist | `● Running · No plan` |
| Main turn running, checklist open | `● Running ━━━━────── 2/5 · <current step>` |
| A permission dialog is up for a main-loop tool call | `◆ Waiting for approval ━━━━────── 2/5 · …` |
| Turn ended, checklist unfinished | `◌ Paused ━━━━────── 2/5 · next: <step>` |
| … and work done since its last update | `◌ Paused ━━━━────── 2/5 · list not updated · <current step>` |
| Not running, every step completed | `✓ Completed ━━━━━━━━━━ 5/5` |
| Turn interrupted (Esc) | `✕ Interrupted ━━━━────── 2/5` (or `· No plan`) |
| Turn ended with an error or refusal | `! Turn failed · …` |

- Progress is completed/total native tasks only, never time or effort; the bar
  fills `floor(completed / total × width)` cells, so it is full only when
  every step is. Without a checklist nothing is counted: `No plan`, never
  `0%`. The end of a turn never marks anything complete; only the checklist
  does.
- Colors are theme keys, so light and dark themes both read: Running `claude`,
  Waiting for approval `permission`, Completed `success`, Interrupted
  `warning`, Turn failed `error`, Paused/Idle `inactive`, the empty bar
  `subtle`; each state also has its own glyph (`●` `◆` `✓` `✕` `!` `◌`), so
  none is told by color alone. Labels such as `No plan`, `next:` and the
  current task are dim. Only the terminal panel sets a background (the faint
  fill above).
- Running is the main turn only, and only while the surface reports a turn
  running (`isWorking`): a subagent's or background agent's turn never sets
  it, so an agent still working after the main turn ended leaves the band
  Paused or Completed (agents are shown by nth-status and the native views,
  not here).
- Waiting for approval starts when the engine raises a permission dialog for
  a main-loop tool call (one no settings hook answered) and ends when a
  main-loop call of that tool settles or the turn starts or ends. No event
  marks the person's answer, so after an approval it stays while the approved
  tool runs. A subagent's approval is not shown.
- Current step: the first `in_progress` step (its `activeForm`), else the
  first `pending` step as `next:`. Where the row has no room it is dropped,
  then the `Tasks` button, so the band never takes a second row.
- Plan changes are marked in the pane until the next turn: `plan +n` (steps
  added once work began, or to a plan carried over from an earlier request),
  `plan revised` (steps dropped or renamed), `plan replaced` (a new list
  sharing no step, or a switch between `TodoWrite` and `Task*`).
- The checklist is kept until a new one replaces it: a new turn (also a
  background-task notification turn), the end of a turn, or an emptied native
  list never clears it, so a finished plan stays Completed after the final answer.
  A list created after a finished plan settled starts a new plan. The working
  state is set when a model turn starts, so a prompt that starts no turn (a
  local slash command) changes nothing.
- "list not updated": the main loop used other tools after the checklist
  last changed and then answered with steps still open. Claude stopped
  updating the list, so the counts are only the last recorded ones.
- `Task*` plans are reconciled with the native task files
  (`<config>/tasks/<list id>/*.json`, the list id `CLAUDE_CODE_TASK_LIST_ID` or
  the session id) after each main-loop `TaskCreate`/`TaskUpdate`, after a
  subagent's while the main plan is a task plan (so its statuses count at
  once), at the end of a turn, and at session start. Deleted tasks
  drop out; a new task plan leaves out files numbered below its first task
  (earlier plans in the same list). Unreadable or empty files keep the
  event-derived state. `TodoWrite` has no file; its tool calls are the record.
  A list shared across sessions (`CLAUDE_CODE_TASK_LIST_ID`) can show the
  earlier sessions' tasks at session start until the first new task.
- Desktop and the one-row terminal band: from 60 columns the bar is 10 (one
  row: 8) cells wide, else 5.
- A subagent's own `TodoWrite` list and its turns are ignored; the band
  follows the main conversation.
- Progress is kept per session id: in the mod's session state (survives a mod
  reload) and in its plugin store, the 20 most recent sessions (survives
  `/resume` and restarts; a turn recorded as running is restored as
  interrupted, and an approval mark is dropped). `/clear` starts the new
  session empty.

## Detail pane

A pane titled `Tasks` (id `task-progress`): the band's state, bar and counts
with the plan-change mark, the current step (`Now:` or `Next:`, wrapped), and
a `Show n tasks ▾` / `Hide tasks ▴` button that lists every native task with
its status (`✓` done, `●` in progress, `○` pending). Without a checklist it
reads `No native task list in this session.`

It opens on the person's request, placed at any width, focused, expanded,
and closed with Esc:

- the band's `Tasks` button: a click on the desktop app, or in a fullscreen
  terminal; otherwise focus the band with ctrl+x tab (the ring starts on
  `Tasks`) and press Enter. The keyboard then stays in the band: ctrl+x tab
  walks its controls and then the pane, where Tab and Enter work its button;
- `/task-progress` (answers `Task progress opened.`, or that no surface draws
  it);
- and, unasked and collapsed, whenever the VS Code extension attaches, unless
  it is already open there.

## Surfaces and native tools

Built against the Claude Code 2.1.310 mod API; tests mount the band on the
terminal and desktop surfaces and the pane on terminal, desktop and VS Code.

| Surface | Band | Pane | Verified live |
|---|---|---|---|
| Terminal CLI (including VS Code's integrated terminal) | Drawn | On request | Yes (2.1.311, fullscreen, 120×45 down to 28×60 and 45×40): panel and one-row fallback, live progress, `Tasks` by keyboard, the pane; mouse clicks and an expanded native task list not verified |
| VS Code extension chat panel | None (the mod API raises `AbovePrompt` only on terminal and desktop) | Opened when it attaches | No: needs a check in the extension |
| Claude desktop app | Drawn | On request | No: needs a check in the app |
| Headless `-p` / SDK | Not drawn; state is still recorded | Not drawn | — |

The mod API exposes no native task view and no task data of the desktop app or
the extension, so the mod cannot detect or reuse them: it never opens a pane
unasked there except in VS Code, which has no band. Background agents are not
shown; nth-status and the native views already show them.

For Opus 5.5 and Sonnet 5.5 the native task tools exist only when
`CLAUDE_CODE_ENABLE_TODO_TOOLS` is true (older model families get them by
default). With it, the CLI offers `TaskCreate`/`TaskUpdate`/`TaskList`, and
the VS Code extension (which starts Claude with `CLAUDE_CODE_ENABLE_TASKS=0`)
offers `TodoWrite`. Both are deferred behind tool search: each request carries
only their names until the model loads one, typically for work of three or
more steps. Small requests therefore show `Running · No plan`. When to create
and reuse native tasks is set by the kit's managed global instructions (Task
tracking): substantive multi-step work only, and unfinished tasks are updated
when the same work continues. The mod adds no instruction of its own.

The engine's native reminder (`todo_reminder` / `task_reminder`) fires when 10
or more assistant turns passed since the list last changed, at most every 10
turns. `CLAUDE_CODE_TODO_REMINDER_MODE=baseline` keeps it on (unset, an
account flag decides; `off` disables it). While a checklist is open in the
main loop the mod rewrites it to one line:

    Checklist checkpoint: <c>/<t> done, current: "<step>". If statuses changed,
    update them with TodoWrite|TaskUpdate now; do not add steps or work because
    of this note.

It drops it otherwise (no checklist, a finished one, or a subagent's). This is
the only checkpoint mechanism: no tool, model call, or per-prompt text.

## Runtime files and ownership

Enable writes only these, all in the active config directory `<config>`:

| Item | Owner proof |
|---|---|
| `<config>/skills/nth-task-progress/`: the mod's runtime files, LF bytes: `.claude-plugin/plugin.json`, `hooks/hooks.json`, `hooks/register.tsx`, `hooks/progress.ts`, `types/index.d.ts` | sha256 of each, recorded in the state file |
| `env.CLAUDE_CODE_ENABLE_TODO_TOOLS = "1"` and `env.CLAUDE_CODE_TODO_REMINDER_MODE = "baseline"` in `<config>/settings.json` | exact value recorded in the state file, only for keys Enable added (`"off"` is the earlier kit value of the reminder key) |
| `<config>/nth-dev-kit-hooks/task-progress.state.json`: provenance | — |

```json
{
  "schemaVersion": 1,
  "mod": {
    "path": "skills/nth-task-progress",
    "files": { "<relative path>": "<sha256 of the bytes written>" }
  },
  "settingsEnv": { "<KEY>": "<value Enable added>" }
}
```

Claude Code auto-loads a plugin folder under `<config>/skills/` as
`nth-task-progress@skills-dir` (honoring `CLAUDE_CONFIG_DIR`), so loading
needs no settings, marketplace, or `enabledPlugins` change; its projected
always-on context cost is ~0 tokens. Tests (`tests/`) stay in the library,
and the folder holds only the five runtime files. The plugin store file `<config>/plugins/store/nth-task-progress_*.json`
holds session progress (step texts written by the model) and is the engine's,
not kit-owned.

The runtime copy lives outside the receipted library. Ownership follows the
runtime provenance rules of [INSTALL.md](../../../INSTALL.md#runtime-provenance-state):
an item is kit-owned only while it is present with exactly its recorded hash
or value. A pre-existing settings key is user configuration: it is never
recorded as owned. Enable, Global Update refresh, and Disable never touch other
skills, plugins, hooks or settings, the session-title or CodeGraph
integrations, the legacy `nth-claude-kit-state.json`, or the library under
`<config>/nth-dev-kit/`.

## Enable

Run only when the user explicitly asks, in the config home they intend.
Optional input: `TODO_TOOLS=skip` (add neither env key). Do not commit or
otherwise mutate Git.

1. Resolve `<config>` (`CLAUDE_CONFIG_DIR` when set, otherwise the runtime
   default) and state which directory, and why, before changing anything.
2. Confirm on the running version, probing uncertain points only in a
   throwaway `CLAUDE_CONFIG_DIR` (copy the five runtime files into its
   `skills/nth-task-progress/`): `claude plugin list` shows
   `nth-task-progress@skills-dir` as loaded; `claude plugin details
   nth-task-progress@skills-dir` reports ~0 always-on tokens; `claude plugin
   validate` lists only session (`start`, `attach` for `vscode`, `end`),
   turn, `tool.call`, `classic.PermissionRequest`, `prompt.attachment`
   (`todo_reminder`, `task_reminder`), `command.run` (`task-progress`) and
   `ui.render` (`AbovePrompt`, `Pane` `task-progress`) hooks, the
   `task-progress` command, no tool or prompt-section registration, and env
   reads of `CLAUDE_CONFIG_DIR` and `CLAUDE_CODE_TASK_LIST_ID` only. If
   unsupported, stop and report; do not switch to another loading mechanism.
3. Require a valid installed library receipt. Take the five runtime files from
   `<config>/nth-dev-kit/agents/claude/integrations/task-progress/` and verify
   their receipt digests.
4. Validate the state file if present. Invalid JSON, an unknown
   `schemaVersion`, a mod path other than exactly `skills/nth-task-progress`,
   a recorded file outside the five runtime paths, a symlink/junction/reparse
   point anywhere on the path, or a target outside `<config>` is a conflict:
   stop.
5. Preflight every runtime file before writing any: missing → to write;
   canonically equal to the library copy → keep; equal to its recorded sha256
   → to replace; anything else → conflict. Any other file in the folder is a
   conflict. Parse `settings.json` too (unless `TODO_TOOLS=skip`); invalid
   JSON is a conflict. On any conflict stop and write nothing.
6. Write the planned files as LF bytes, `.claude-plugin/plugin.json` last (the
   folder becomes a plugin only once its manifest exists).
7. Unless `TODO_TOOLS=skip`: keep the original `settings.json` content. For
   each of the two env keys: absent → add it (creating `env` if missing) and
   record it; present with exactly the recorded value → keep, except a
   recorded reminder value still exactly `"off"` (the earlier kit value),
   which is rewritten to `"baseline"` and re-recorded; present otherwise →
   user-owned: leave it, do not record it, and report it. Never modify other
   entries. Write `settings.json` only if a key was added or migrated.
8. Write the state file (file hashes and the env keys added or still
   recorded) only if its content changes.
9. Verify, before running any `claude` command in `<config>`: settings differ
   from the original only in the added or migrated env keys, and each file matches its
   recorded hash. A CLI start may migrate settings on its own (2.1.296 rewrote
   `"model": "opus"` as `"opus[1m]"`); that is not part of Enable. Then
   `claude plugin list` shows the plugin loaded. Report that it applies to new
   sessions.

Rerunning Enable is safe and changes nothing when everything is current.

## Global Update refresh

Claude Global Update runs this after the library update has been reconciled
and its receipt verified. If the library update stopped or is incomplete,
skip it and report the integration as not refreshed. It never enables the
integration or re-adds removed items, and changes settings only to migrate
the recorded reminder value (step 5).

1. No state file: the integration is not enabled. Stop here without reading or
   writing `skills/nth-task-progress/` or `settings.json`.
2. Validate the state file as in Enable step 4. On conflict, change nothing
   active and report it.
3. If the updated library no longer ships the mod, leave the active items and
   state unchanged and report that Disable can remove them.
4. Preflight every file before writing any. Each recorded file, compared
   with the updated library copy:
   - canonically equal → no write (correct the recorded hash if it differs);
   - present with exactly the recorded sha256 → to replace with the library's
     LF bytes, recording the new hash;
   - missing → conflict: do not recreate it; report that Enable or Disable is
     needed;
   - anything else → customized: conflict.
   A runtime file new in the library is to be written only if its path is
   absent (present → conflict). A recorded file the library dropped is to be
   deleted only if its hash matches (customized → conflict).
   On any conflict write nothing at all and report it: the files form one
   module, and a partial refresh could leave a mixed, unloadable version.
5. Write order: files, `.claude-plugin/plugin.json` last, then the state file,
   which is rewritten only if a record changed. Recorded env values are only
   checked: a missing or changed one is reported, never re-added or
   rewritten. One exception: a recorded `CLAUDE_CODE_TODO_REMINDER_MODE` that
   is still exactly `"off"` both in `settings.json` and in the record is
   rewritten to `"baseline"` and re-recorded; `settings.json` is written only
   for that. On an I/O failure, stop and report exactly what was written; a
   rerun revalidates from the actual files.
6. Verify each active file against its record. Report refreshed, unchanged,
   and conflicting items separately from the library result. Integration
   conflicts never change the library outcome.

A second run with no kit changes writes nothing.

## Disable

1. Validate the state file as in Enable step 4. No state file: nothing is
   owned; report any `skills/nth-task-progress/` folder as user-owned.
2. Delete each recorded file whose sha256 matches; a missing one is already
   resolved; a changed one stays, keeps its record, and is reported as a
   conflict. Leave any unrecorded file and report it. Then remove the mod's
   directories only if empty.
3. For each recorded env key: remove it only if its exact recorded value is
   present; a missing key is resolved; a changed value stays and is reported
   as user-owned (its record is dropped). Never remove other keys; remove the
   `env` object only if that leaves it empty. Write `settings.json` only if
   something was removed.
4. If no file conflict remains, delete the state file, then remove
   `nth-dev-kit-hooks/` only if empty. Otherwise rewrite the state file with
   only the conflicting file records (no env records), so a rerun reports the
   same conflict and changes nothing.
5. Report the plugin store file as left in place (engine data, not kit-owned).

## Verification

Run the mod's tests on a scratch copy of `task-progress/`, so the repository
and the receipted library stay byte-identical:

    claude plugin validate <copy>
    claude plugin test <copy>

The tests cover `TodoWrite` and `Task*` updates, the bar and counts,
current-step selection and fitting, expanded/revised/replaced plans, requests
without a checklist (`No plan`, hidden when idle), the execution-state
precedence, Waiting for approval and its end, interrupted, subagent and
background-agent turns, a stale running record, session isolation, `/clear`,
restoration from the store (version 1 records included), the list left not
updated after a final answer, finished plans across later turns, emptied
native lists, reconciliation with native task files (a subagent's update
mid-turn included), the checkpoint reminder, the band on the terminal and
desktop surfaces and none on VS Code, its `Tasks` button, the pane on all
three with its expand button, `/task-progress`, and the VS Code attach. Live
checks per config home: a real `TaskCreate`/`TaskUpdate` (CLI) or `TodoWrite`
(`CLAUDE_CODE_ENABLE_TASKS=0`) run updates the store file, and an interactive
CLI shows the band and opens the pane. The VS Code extension and the desktop
app need a person's check: the pane opens in the extension, its buttons
answer clicks, and its text reads in light and dark themes; the desktop app
shows the band and opens the pane.

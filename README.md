# nth-dev-kit

**Working presets and lifecycle prompts for Claude Code (and Codex).**
nth-dev-kit installs a dormant library of presets into your Claude
configuration. You then apply one preset to one project when you ask for it:
the project's instructions get a small, owned block that the kit can later
update without touching your own text. It also installs the nth-status
session dashboard and ships two optional Claude mods.

There is no installer program. Every operation is a Markdown prompt that
Claude reads and executes in your session, checking ownership before it
replaces anything.

```text
Install https://github.com/namth0712/nth-dev-kit
```

> **Claude:** to install or update this kit, follow [INSTALL.md](INSTALL.md).

- [What it provides](#what-it-provides) · [Supported environments](#supported-environments) · [Prerequisites](#prerequisites)
- [Install](#install) · [Configuration](#configuration) · [Updates](#updates) · [Uninstall](#uninstall)
- [Security and privacy](#security-and-privacy) · [Troubleshooting](#troubleshooting)
- [How it works](#how-it-works) · [Documentation](#documentation) · [License](#license)

## What it provides

| Part | What it is |
|---|---|
| Presets | Logical working behavior in `presets/`: **Simple** (small changes, narrow investigation, minimal meaningful verification), **Standard** and **Complex** |
| Lifecycle prompts | Global Install, Global Update, Project Start and Project Update for each agent (`prompts/`) |
| Ownership contracts | What the prompts may write and how they prove a file is theirs (`docs/lifecycle.md`, `docs/ownership.md`) |
| nth-status (Claude) | A live session dashboard above the prompt, from [its own repository](https://github.com/namth0712/nth-status). The kit pins one release and installs it by default |
| Optional Claude mods | [Session title](agents/claude/integrations/session-title.md) (deterministic conversation titles, `/task`) and [task progress](agents/claude/integrations/task-progress.md) (a task band and pane); off until you enable them |
| Legacy Claude Complex sources | The earlier always-on global setup (`managed/` and the legacy section of `INSTALL.md`), kept for existing users |

What can be applied to a project today:

| Preset | Claude Code | Codex |
|---|---|---|
| Simple | Supported: one block in the project's `CLAUDE.md` | Supported: one block in the project's `AGENTS.md` |
| Standard | Specification only: Project Start stops | Specification only: Project Start stops |
| Complex | Legacy global implementation only; project mapping not implemented | Not implemented |

Not included: nth-review (the earlier code-review skill; see
[below](#nth-review)), and no change to global instructions, settings or
projects beyond what a prompt documents.

## Supported environments

Installing writes to your local Claude configuration directory, so it needs
a **local** Claude Code session that can run `git` and write files.

| Surface | Install and update | Notes |
|---|---|---|
| Claude Code CLI | Supported | Choose any config home with `CLAUDE_CONFIG_DIR` |
| Claude Code in VS Code | Supported | Shares the CLI's config home; another home only through the extension's environment setting ([below](#choosing-a-config-home)) |
| Claude desktop app, Code tab, **local** session | Supported | Uses the default config home; selecting another home there is not documented |
| Desktop Code tab cloud sessions, Claude Code on the web, other remote sessions | Not supported | They run in a cloud environment and cannot reach your local configuration |
| Claude desktop app chat (not the Code tab) | Not supported | Not a Claude Code session |
| Codex CLI | From a local checkout only | See [the Codex adapter](agents/codex/README.md) |

Platforms: the prompts resolve every path at run time. They have been run on
Windows; macOS and Linux follow the same contracts but have not been checked.
The GitHub install flow has so far been validated against a local copy of
this repository, not yet against the published one
([development](docs/development.md#public-install-flow-simulated)).

## Prerequisites

- Claude Code, logged in. The contracts were first checked on 2.1.274/2.1.275
  ([compat](compat/README.md)); nth-status on 2.1.310 to 2.1.312. Each run
  inspects the running version and stops on an unsupported mechanism.
- `git` on `PATH` and HTTPS access to github.com.
- The `claude` command on `PATH`, so the install can ask the plugin manager
  whether nth-status is already installed. Without it, an install where
  nth-status is not set up yet stops before writing anything.
- `sh` on `PATH` (Git Bash on Windows) for the nth-status cache countdown and
  the optional mods.

## Install

In a local Claude Code session (the CLI, the VS Code panel, or a **local**
session in the desktop app's Code tab), send:

```text
Install https://github.com/namth0712/nth-dev-kit
```

Claude follows [INSTALL.md](INSTALL.md) from there:

1. It clones the repository into a temporary folder and checks it. If
   nth-status still needs installing, it also fetches nth-status's pinned
   release and checks it against the pin; if that fails, it stops with
   nothing written.
2. It tells you the config home, whether this is an install or an update,
   the revision and what it may write, and waits for your go-ahead.
3. It installs the library into `<config>/nth-dev-kit/` and, unless you opted
   out or use nth-status from its marketplace, the pinned nth-status.
4. It deletes its temporary clones and reports what it installed, left
   unchanged or found in conflict.

Approve the requests to run `git` and to write outside the current folder,
or stop at any point. Plan mode cannot install. Start a new session
afterwards so nth-status loads. In the CLI, run `claude` from a folder that
is not one of your projects.

Variations:

- A reviewed revision: `Install https://github.com/namth0712/nth-dev-kit at tag <tag>`.
- A checkout you already have: `Install nth-dev-kit from my checkout at <path>`.
  Claude uses it unchanged.
- Codex installs from a local checkout only:
  `Follow prompts/codex/global/install.md with KIT_SOURCE = <path to nth-dev-kit>.`

## Configuration

### Choosing a config home

Every operation changes only the config home of the running session:
`CLAUDE_CONFIG_DIR` when set, otherwise `~/.claude`. To install into another
profile, start Claude Code with that variable, then send the install line:

```sh
# macOS/Linux shells, Git Bash
CLAUDE_CONFIG_DIR="$HOME/.claude-work" claude
```

```powershell
# PowerShell
$env:CLAUDE_CONFIG_DIR = "$HOME\.claude-work"; claude
```

In VS Code, set `CLAUDE_CONFIG_DIR` (an absolute path) in the
`claudeCode.environmentVariables` setting and reload the window. The desktop
app uses the default home.

### Applying a preset to a project

Open the project, start a fresh session, and run Project Start with the
preset you want:

```text
Follow ~/.claude/nth-dev-kit/prompts/claude/project/start.md with PRESET = Simple.
```

Use your config home in place of `~/.claude`. Start uses only the installed
library and writes one managed block into the project's `CLAUDE.md`; keep
your project's own facts outside that block. It never chooses a preset for
you. See [ownership](docs/ownership.md) and
[session guidance](docs/sessions.md).

### nth-status and the optional mods

| To | Do |
|---|---|
| Keep nth-status off | Ask Claude to clone https://github.com/namth0712/nth-status and follow "Disable" in its `docs/installation.md` (Disable needs no particular release); the kit then leaves it off |
| Use nth-status from its marketplace instead | Install it with the plugin manager, as [its README](https://github.com/namth0712/nth-status) describes; the kit then detects it and installs nothing |
| Enable session title or task progress | Ask Claude to follow "Enable" in `~/.claude/nth-dev-kit/agents/claude/integrations/session-title.md` (or `task-progress.md`) |

## Updates

Send the same line again (or say "Update" in place of "Install"). Claude
finds the existing install and routes to Global Update, which replaces only
files it proves the kit wrote, preserves anything you changed, and writes
nothing when everything is current.

- A kit update never changes an installed nth-status: it only reports how it
  compares with the pin. Move nth-status with its own Update (or the plugin
  manager for a marketplace install).
- Projects keep their preset until you run Project Update in them:
  `Follow ~/.claude/nth-dev-kit/prompts/claude/project/update.md.`
- An installation made before this repository's fresh start needs the
  earlier history once ([integrations](docs/integrations.md#installations-from-before-the-split)).

## Uninstall

The kit has no uninstall procedure, by design: nothing it installs is loaded
automatically except nth-status and the mods you enabled.

1. In each config home, turn off what runs: nth-status's "Disable" (see
   [above](#nth-status-and-the-optional-mods); or `claude plugin uninstall`
   for a marketplace install), and "Disable" for each optional mod you
   enabled. nth-status's Disable leaves an opt-out record
   (`<config>/nth-dev-kit-hooks/nth-status.state.json`), so a later install
   leaves nth-status off until you run its Install.
2. Delete `<config>/nth-dev-kit/` by hand. Project Start/Update then stop
   until you install again. Preset blocks already written into projects stay
   until you remove them. Legacy nth-review files an earlier kit put in that
   folder are deleted with it: move them out first if you still use them.

Details: [opting out and uninstalling](docs/integrations.md#opting-out-and-uninstalling).

## Security and privacy

- **What it writes:** `<config>/nth-dev-kit/` (the library and its receipt);
  for nth-status, `<config>/skills/nth-status/`,
  `<config>/nth-dev-kit-hooks/nth-status*`, and a `statusLine` only when you
  have none; in a project, only the managed block Project Start/Update own.
  The optional mods write only when you enable them, and an update
  refreshes the ones you enabled.
- **What it never touches:** credentials, sessions, history, logs and caches;
  your global `CLAUDE.md`, other settings, agents, rules and skills; other
  config homes; and projects except the one you run Project Start/Update in.
  It never stages, commits or pushes.
- **No silent overwrites:** a file is replaced only when its content proves
  the kit wrote it. Anything else is preserved and reported as a conflict.
- **Network:** reading the repository page if Claude starts there, then
  only the two `git clone` calls INSTALL.md asks for, over HTTPS. The installed mods make no network or model calls.
- **Trust:** these files are instructions Claude executes with your
  permissions. nth-status is checked against pinned digests. The kit itself
  is trusted by its URL only (there is no signature): read it first, or name
  a tag or commit you reviewed. Claude asks before using any other URL.

## Troubleshooting

| Report | Meaning | Fix |
|---|---|---|
| Clone failed | No network, `git` missing, or a wrong ref | Fix that and rerun; nothing was written |
| Stopped: nth-status tag missing or files differ | The pinned release tag is not published, or does not match the pin | Nothing was written; rerun once it is published, install nth-status from its marketplace, or opt out with its "Disable" |
| Stopped: nth-status state invalid | `<config>/nth-dev-kit-hooks/nth-status.state.json` is not valid JSON, has an unknown schema, or records unexpected paths | Nothing was written; repair that file by hand (nth-status's own procedures report the same conflict) |
| nth-status managed by the plugin manager | It is installed from its marketplace | Nothing to do; run its "Disable" once if you want the kit to stop checking |
| Unprovable or customized file | Neither the current kit nor its history proves the kit wrote it | It is preserved; for installs from before the split, see [Updates](#updates); otherwise reconcile by hand |
| Missing, invalid or incomplete receipt | The installed library is damaged or partial | Run the install prompt again; it preserves and reports anything it cannot prove |
| Stopped: plugin manager could not be queried | The `claude` command is not on `PATH` in this session | Nothing was written; rerun from a terminal where `claude` runs, with the same config home |
| Project Start asks for a source path | No library is installed in this config home | Install first, from a session using the same config home |
| "Cannot install from this session" | A cloud, remote or chat session | Use the CLI, VS Code or a local desktop Code session |
| Legacy global behavior reported | The historical always-on setup is active | It stays as is; Project Start/Update stop if it defeats the requested preset |

More: [integrations](docs/integrations.md), and `docs/troubleshooting.md` in
[nth-status](https://github.com/namth0712/nth-status) for the dashboard.

## How it works

| Layer | Owns |
|---|---|
| `presets/<name>/SPEC.md` | Logical working behavior |
| `agents/<agent>/README.md` | Native representation, compatibility and support status |
| Dormant library | The full kit in the agent's config home (`<config>/nth-dev-kit/`, or `$CODEX_HOME/nth-dev-kit`), never loaded automatically |
| Project application | One explicitly selected preset per agent and project |
| Project instructions | Your project facts and overrides, outside managed blocks |

### Lifecycle

| Operation | Claude Code | Codex | Effect |
|---|---|---|---|
| Global Install | [install](prompts/claude/global/install.md) | [install](prompts/codex/global/install.md) | Copy the full dormant library; Claude also installs the pinned nth-status unless opted out |
| Global Update | [update](prompts/claude/global/update.md) | [update](prompts/codex/global/update.md) | Reconcile the library; install nth-status where absent, report an installed one; refresh enabled optional mods |
| Project Start | [start](prompts/claude/project/start.md) | [start](prompts/codex/project/start.md) | Verify (or, from a known local source, bootstrap) the library, then apply an explicit preset |
| Project Update | [update](prompts/claude/project/update.md) | [update](prompts/codex/project/update.md) | Reconcile the existing preset without switching or expanding it |

The inputs the global prompts take (the GitHub install supplies them):

| Input | Is |
|---|---|
| `KIT_SOURCE` | A local checkout of this repository, or the full clone `INSTALL.md` makes |
| `STATUS_SOURCE` | nth-status at the version `packages/compatibility.json` pins: a checkout, or a clone of its release tag |
| `KIT_HISTORY_SOURCE` | Optional: the frozen pre-split repository, to prove content installed by earlier kits |
| `PRESET` | Project Start only: `Simple`, `Standard` or `Complex` |

```text
nth-dev-kit/
├── presets/                     README.md, {simple,standard,complex}/SPEC.md
├── agents/
│   ├── claude/                  adapter README, integrations/{session-title,task-progress}{.md,/}
│   └── codex/README.md
├── prompts/{claude,codex}/      {global/{install,update},project/{start,update}}.md
├── docs/                        lifecycle, ownership, integrations, sessions, development, releasing, chatgpt-orchestrator
├── packages/compatibility.json  the pinned nth-status release
├── managed/                     preserved Claude Complex sources (inert library data)
├── compat/README.md             historical evidence and retained identifiers
├── tools/check-portability.sh   privacy and portability check (not installed)
├── INSTALL.md                   agent entry for installing; legacy installer below it
├── CHANGELOG.md
├── LICENSE                      MIT
└── README.md
```

### nth-status

nth-status is developed and released in
[its own repository](https://github.com/namth0712/nth-status).
`packages/compatibility.json` pins one release: its version and the digests
of its release files and install procedure. Global Install runs its Default
enable only from a source that matches the pin: it installs where nothing is
installed, reports where it is installed, and does nothing where you opted
out or the plugin manager already has it. See
[integrations](docs/integrations.md#nth-status).

### Existing Claude installations

The legacy installer section of [INSTALL.md](INSTALL.md) installs the earlier
always-on global setup (agents, rules, skills, settings intent, CodeGraph
routing from `managed/`). Users who have it keep it: the dormant lifecycle
neither updates nor disables it, only reports it. A safe project-local
Complex migration is deferred. See the
[Claude adapter](agents/claude/README.md) and
[retained identifiers](compat/README.md#compatibility-identifiers-retained).

### nth-review

nth-review, an optional project-scoped Claude code-review skill, is not part
of this repository; whether and how it joins this kit is a separate, future
workstream. No prompt here creates, enables, refreshes or copies it. Legacy
nth-review files an earlier kit installed in a library are preserved byte for
byte and left outside this kit's management
([excluded paths](docs/lifecycle.md#excluded-legacy-nth-review-paths)); this
kit cannot update or disable them. Projects that enabled it keep their own
copies.

Ponytail is an optional external workflow choice, outside all presets; no
prompt installs or configures it.

## Documentation

| Document | Covers |
|---|---|
| [INSTALL.md](INSTALL.md) | The agent's install and update entry (and the legacy installer) |
| [Library lifecycle](docs/lifecycle.md) | Inputs, retrieval clones, the receipt, Global Install/Update, Project Start/Update |
| [Ownership](docs/ownership.md) | Proof before replacement, the project block, Project Start/Update |
| [Integrations](docs/integrations.md) | The nth-status pin, opting out, uninstalling, rollback, pre-split installs |
| [Claude adapter](agents/claude/README.md) · [Codex adapter](agents/codex/README.md) | Per-agent representation and support |
| [Presets](presets/README.md) | The three specifications |
| [Sessions](docs/sessions.md) · [ChatGPT orchestration](docs/chatgpt-orchestrator.md) | Working guidance |
| [Development](docs/development.md) · [Releasing](docs/releasing.md) | Testing, the privacy check, release steps |
| [Changelog](CHANGELOG.md) | Changes |

Contributors and agents working in this repository never stage, commit, tag
or push on their own.

## License

Released under the [MIT License](LICENSE). Copyright (c) 2026 namth0712.

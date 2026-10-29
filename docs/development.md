# Development

## What there is to test

The kit is mostly instructions: presets, adapters, lifecycle prompts and
inert `managed/` sources that an agent reads and executes. There is no build,
package manager or installer program. What can be checked:

| Part | Check |
|---|---|
| Session-title and task-progress mods | `claude plugin validate` and `claude plugin test` on a scratch copy of `agents/claude/integrations/<name>/` |
| Lifecycle prompts and integration procedures | Run them in a throwaway config home (below) |
| The GitHub install entry (`INSTALL.md`) | Simulate the public repositories locally (below) |
| Every file | `sh tools/check-portability.sh` (below) |
| Documentation | Relative links resolve; commands and paths match the files present |

nth-status is tested in its own repository.

## Mods on a scratch copy

Keep the checkout byte-identical to what a library receipt records by running
the tools on a copy, in a throwaway config home:

    # macOS/Linux shells, Git Bash
    copy="$(mktemp -d)/task-progress"
    cp -R agents/claude/integrations/task-progress "$copy"
    CLAUDE_CONFIG_DIR="$(mktemp -d)" claude plugin validate "$copy"
    CLAUDE_CONFIG_DIR="$(mktemp -d)" claude plugin test "$copy"

    # PowerShell
    $copy = Join-Path ([IO.Path]::GetTempPath()) "task-progress-$(New-Guid)"
    Copy-Item -Recurse agents/claude/integrations/task-progress $copy
    $env:CLAUDE_CONFIG_DIR = Join-Path ([IO.Path]::GetTempPath()) "claude-$(New-Guid)"
    claude plugin validate $copy
    claude plugin test $copy

Use `session-title` the same way.

## Lifecycle prompts in a throwaway config home

Never try a lifecycle change against a config home you use. Start Claude
Code with an empty `CLAUDE_CONFIG_DIR` (no credentials are copied into it),
then ask it to follow `prompts/claude/global/install.md` with `KIT_SOURCE`
set to this checkout and `STATUS_SOURCE` set to an nth-status checkout at the
pinned release. Check, in that home only:

- `nth-dev-kit/.nth-dev-kit-library.json` lists every library file with its
  digest and nothing from `tools/`, `scratchpad/` or `CHANGELOG.md`;
- `skills/nth-status/` and `nth-dev-kit-hooks/nth-status*` match the pin;
  `settings.json` differs only by the added `statusLine`;
- a second Global Install/Update writes nothing.

Delete the throwaway home afterwards. A fresh home may stop at first-run
onboarding in the interactive CLI; `claude plugin list` and the file checks
work without it.

### Global Update with legacy nth-review files

Checks the [excluded paths](lifecycle.md#excluded-legacy-nth-review-paths)
rule. In a throwaway config home, build `nth-dev-kit/` as a pre-split kit
installed it (its files and receipt from a pre-split commit), then:

- add a file under `nth-dev-kit/agents/claude/integrations/review/` that no
  history holds (ownership unknown), and change one recorded nth-review file
  after its receipt digest was written;
- snapshot the nth-review files:

      # macOS/Linux shells, Git Bash (macOS: shasum -a 256 for sha256sum)
      cd "$CLAUDE_CONFIG_DIR/nth-dev-kit"
      find agents/claude/integrations/review agents/claude/integrations/review.md -type f -exec sha256sum {} + | sort > "$HOME/review-before.txt"

      # PowerShell
      Set-Location "$env:CLAUDE_CONFIG_DIR\nth-dev-kit"
      Get-ChildItem -Recurse -File agents\claude\integrations\review, agents\claude\integrations\review.md | Get-FileHash | Sort-Object Path | Format-Table -HideTableHeaders Hash, Path > "$HOME\review-before.txt"

- run Global Update with `KIT_SOURCE`, `STATUS_SOURCE` and
  `KIT_HISTORY_SOURCE`, take the same snapshot again, and compare.

Expected: the two snapshots are identical (historically provable and unknown
files alike); the refreshed `.nth-dev-kit-library.json` has no key under
either excluded path; the report lists the nth-review files as preserved and
no conflict for them; every other file is reconciled as before (the old
embedded nth-status library files are removed only because the pre-split
history proves them). A second Global Update writes nothing. Without
`KIT_HISTORY_SOURCE` the nth-review snapshot is still identical, and the
other unprovable files are preserved and reported as before. A fresh Global
Install into an empty home creates no file under either excluded path.

### Public install flow, simulated

Tests the [INSTALL.md](../INSTALL.md) entry before (or without) publishing,
with every Git repository and config home disposable, under one temporary
directory `$T`; never the working repositories.

1. Copy this tree (without `.nth-dev-kit/` and `scratchpad/`) and an
   nth-status tree into `$T`, commit each with a throwaway identity, and
   serve them as bare repositories `$T/kit.git` and `$T/status.git`. Tag
   `status.git` as the scenario needs: no tag (the pinned tag is missing), a
   `v<version>` tag on files that do not match the pin, or a `v<version>` tag
   on files that do.
2. Redirect the public URLs with a throwaway Git config, so clones keep the
   canonical origin URL:

       # macOS/Linux shells, Git Bash
       export GIT_CONFIG_GLOBAL="$T/gitconfig"
       git config --global url."file://$T/kit.git".insteadOf https://github.com/namth0712/nth-dev-kit
       git config --global url."file://$T/status.git".insteadOf https://github.com/namth0712/nth-status

3. Start Claude Code from `$T/cwd` with `CLAUDE_CONFIG_DIR="$T/home"` and the
   same `GIT_CONFIG_GLOBAL`, send the [README install line](../README.md#install)
   followed by "Clone it first; do not fetch web pages." (so Claude reads the
   redirected clone, not the published site), and check:
   - the clone is full (`git rev-parse --is-shallow-repository` is `false`),
     outside `$T/home` and `$T/cwd`, with origin
     `https://github.com/namth0712/nth-dev-kit`;
   - the config home, route (Install), revision and planned writes are stated
     and confirmed before any write;
   - the library and receipt are as in the throwaway-home checks above;
   - nth-status: when the tag is missing or differs, the run stops before
     any write (`$T/home` unchanged, no `nth-dev-kit/`) and deletes its
     clones; installed per the pin when it matches;
   - the clones are deleted, and a second run routes to Global Update and
     writes nothing.
4. In another home where `claude plugin marketplace add <nth-status tree in $T>` and
   `claude plugin install nth-status@namth0712-nth-status` ran first, the kit
   writes no `skills/nth-status/` and no `statusLine`, and reports it.

Publishing cannot be simulated fully: after the first push, repeat step 3
against the real URLs (no `GIT_CONFIG_GLOBAL`) on each surface the README
lists.

## Privacy and portability check

    sh tools/check-portability.sh

It fails when a file contains a drive-letter or home-directory path, an
email address, or the local user's identifiers (Git `user.name` and
`user.email`, the OS user name and the host name, read at run time and never
stored). Placeholders pass: `C:\path\to\...`, `/home/me`, `C:\Users\someone`,
`@example.com`. Add private terms (your project names, folder names), one per
line, in a file kept outside the repository:

    PORTABILITY_TERMS_FILE="$HOME/.config/portability-terms.txt" sh tools/check-portability.sh

The public GitHub owner may appear only in the repository URLs
(`https://github.com/namth0712/nth-dev-kit`, `.../nth-status`), the marketplace
forms `namth0712/nth-status`, `namth0712-nth-status` and
`nth-status@namth0712-nth-status`, and an owner name in package metadata. The
check ignores those forms and still flags a local identifier anywhere else.

Findings print as `<file>:<line>: <rule>`; the matched text is never shown.
Pass paths to check part of the tree, for example
`sh tools/check-portability.sh docs prompts`.

## Conventions

- Paths in docs and prompts are relative to the repository root, or runtime
  placeholders such as `<config>` and `KIT_SOURCE`; never a machine's path.
- Text files are LF (`.gitattributes`); receipts and pins hash LF-canonical
  content.
- Agents working here never stage, commit, tag or push.

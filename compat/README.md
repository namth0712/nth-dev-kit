# Compatibility notes

- nth-dev-kit stores logical intent. It is not tied to one Claude Code
  filesystem layout.
- If these notes and the running version disagree, runtime detection wins.
- Tested at bootstrap with Claude Code 2.1.274. The first install also ran on
  2.1.275 with no changes.
- Update these notes only when a future version changes paths, settings
  schemas, validation commands, or agent/rule/skill formats.
- Never silently downgrade or drop a managed capability. Report anything the
  running version does not support.

## Bootstrap-era representation (2.1.274)

This table describes the preserved legacy active-global Claude implementation,
not destinations for the new dormant library. Use the runtime contracts in
[Claude](../agents/claude/README.md) and [Codex](../agents/codex/README.md) for
the new lifecycle. Current runtime evidence wins; unsupported or uncertain
mappings stop before writes. No Codex Standard/Complex port is claimed.

| Component           | Mechanism                                                            |
|---------------------|----------------------------------------------------------------------|
| Config directory    | `$CLAUDE_CONFIG_DIR`, else `~/.claude`                               |
| Global agents       | `<config>/agents/<name>.md` (YAML frontmatter + prompt)              |
| Global instructions | `<config>/CLAUDE.md`                                                 |
| Global rules        | `<config>/rules/**/*.md`; scoped with YAML `paths:` globs (2.1.276)  |
| Global skills       | `<config>/skills/<name>/SKILL.md`, not nested; personal skills override project skills of the same name, hence the `nth-` prefix (2.1.276) |
| Settings            | `<config>/settings.json`; env vars under `env`                       |
| Spawn depth         | `env.CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH = "1"`                     |
| Agent validation    | `claude plugin validate <config>/agents`; on 2.1.284 it reports `contents: []` and passes invalid agent frontmatter, so check the runtime loader instead: a headless session's init `agents` list plus `--debug-file` diagnostics (`Agent file ... has invalid ...`) |
| Agent frontmatter   | `model: opus`, `effort`, `permissionMode: plan` supported (2.1.284); a parent in `acceptEdits`/`auto`/`bypassPermissions` overrides `permissionMode`, so `architect` relies on its `tools` allowlist for read-only behavior |

## Optional integrations

- **CodeGraph CLI 1.6.0**, tested with Claude Code 2.1.276. The integration
  is CLI-only, and the kit configures no MCP server.
  - `--` ends option parsing: `codegraph explore -- "<query>"` treats
    `--path`, `-p`, and any other option-like text as query text, and searches
    the nearest index at or above the working directory. Without `--`,
    options are parsed even after the query, so `explore "q" --path <other>`
    selects another project. The `CODEGRAPH_DIR` environment variable also
    changes the target.
  - `Bash(<launcher> explore -- *)` rules match only that exact prefix. Tested
    as not auto-approved: other subcommands, a leading `--path`, a trailing
    `--path` without `--`, an environment-variable prefix, `$(...)`
    substitution, and chained commands. Bash rules do not cover the
    PowerShell tool.
  - Executable identity: a bare `codegraph` rule auto-approved a same-named
    shadow executable earlier on `PATH`. The npm launcher resolves `node`
    through `PATH`, so an absolute-path rule to it still executed a shadow
    `node`. On npm installs, automatic mode is therefore unavailable and the
    integration is **manual**.
  - Built-in Explore ran `codegraph explore` through Bash when it was
    approved, and returned a synthesis rather than raw graph output.
  - Without an index, the CLI returns guidance to use normal tools; it does
    not initialize the project.

## Compatibility identifiers retained

- `nth-claude-kit-state.json`: legacy runtime permission/file provenance.
- `rules/nth-claude-kit/`: legacy scoped and rendered rule namespace.
- `nth-claude-kit:begin/end global-instructions`: legacy managed block markers.
- `metadata.managed-by: nth-claude-kit`: skill discovery hints, never proof.
- `nth-claude-kit` in managed CodeGraph routing text and its matching global
  instruction: preserve their agreement and historical content proof.
- `managed/`, `INSTALL.md`, the `nth-` skill names, and
  `architect`/`reviewer`/`verifier`: stable source paths and runtime names used
  by the proven installer. `architect` was added later as a third core agent;
  it did not rename or replace the other two.

Do not rename these identifiers merely to change branding. `managed/` files
change only through deliberate kit updates, never through branding changes, so
their Git history remains ownership proof. Historical Git blobs retain the old
Simple paths for ownership comparison; the only current Simple source is
`presets/simple/SPEC.md`.

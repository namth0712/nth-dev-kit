# CodeGraph integration (optional, CLI-only)

CodeGraph is an external tool that provides local, indexed code intelligence
(symbols, relationships, call paths) through its `codegraph` CLI. The kit
owns only the routing behavior and the runtime configuration described here.
It does not own, vendor, or install CodeGraph. It does not own per-project
indexes or CodeGraph's user-level preferences (such as telemetry). It never
configures a CodeGraph MCP server.

## Rules that always apply

- Use CodeGraph only when the current project already has a valid index (in
  the project directory or a parent). Never initialize or index a project
  automatically. Indexing is the project owner's explicit decision.
- Target only the current project's nearest index. Always put `--` before
  the query (`codegraph explore -- "<query>"`), so that nothing in the query,
  including option-like text such as `--path`, can select another project.
  Never pass a path option or an environment-variable prefix.
- If the CLI is unavailable, the project has no index, or the graph answer is
  insufficient, use Read/Grep/Glob. CodeGraph must never block ordinary
  exploration.
- Do not repeat a sufficient CodeGraph result with broad Grep/Read. Check
  sources only for gaps or correctness-critical details.

## Integration states

The installer classifies the integration on each run:

| State | Condition | What is installed |
|---|---|---|
| unavailable | `codegraph` CLI not found | nothing |
| manual | CLI found, but the Bash tool is unavailable **or** no executable-bound permission can be established safely | nothing; CodeGraph runs only when the user asks, with per-call approval |
| automatic | CLI, the Bash tool, and a verified executable-bound permission | the managed permission and the rendered routing rule |

**Executable-bound** means the approved command names an absolute launcher
path that runs CodeGraph without resolving any interpreter or helper through
`PATH`, and that CodeGraph does not replace through an environment-controlled
download. A bare `codegraph` name is never bound, because a same-named
executable earlier on `PATH` would inherit the approval. If binding cannot be
proven, including with a shadow-executable test, the state is **manual**.

## Automatic mode

- **Managed permission:** `Bash(<bound-launcher> explore -- *)`. It matches
  only that launcher running `explore --`. It never matches other CodeGraph
  commands, compound commands, environment-variable prefixes, or the
  PowerShell tool. Never broaden it.
- **Routing:** `codegraph.routing.md` is rendered with the bound command and
  installed as a user-level rule. Broad investigation of an indexed project
  goes to built-in Explore, which runs exactly one small
  `<bound-launcher> explore -- "<query>"` through Bash from the project
  directory, stops if that is sufficient, uses targeted Read/Grep/Glob only
  for gaps, and returns concise findings.
- Both the permission and the rendered rule contain a machine-specific path.
  They are runtime installation state recorded in the provenance file, and
  never stored in this repository.

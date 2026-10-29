# Claude Project Start

Input: `PRESET = Simple | Standard | Complex`.
The user must select exactly one valid preset; never choose automatically.
No kit path is required as normal input.

Resolve `<active Claude config directory>/nth-dev-kit`, honoring
`CLAUDE_CONFIG_DIR` when set, otherwise the runtime's documented default.
Inspect the active version and validate the resolved path before access.

- If the directory exists, verify its receipt and full integrity under the
  lifecycle contract. Invalid/missing receipts or incomplete content stop for
  Global Install repair; never overwrite an invalid installation as bootstrap.
- If absent, identify a configured/known source or an explicitly supplied
  source. Validate its resolved Git root, established
  identity, and full kit structure. A name or `.git` alone is insufficient.
  Never use the application project, guess a directory, download/clone, or
  fall back to embedded presets. If no safe source is known, ask only for the
  nth-dev-kit source repository path, keeping the original preset selection.
- Bootstrap by executing that source's `prompts/claude/global/install.md`
  with its `KIT_SOURCE` under the exact Global Install safety contract. Install
  the FULL dormant library only in the resolved kit directory, preserve other
  user configuration, inject nothing into global `CLAUDE.md`, and verify the
  receipt/integrity before continuing. Failure leaves the project unchanged.

Continue the original request using the verified installed library, never the
source checkout as an application fallback. Do not update an existing library
implicitly. No source path or live library import belongs in project instructions.

Read the installed library's `docs/lifecycle.md`, `docs/ownership.md`, and
`agents/claude/README.md`. Verify the library receipt/content and load the
authoritative `presets/<requested-preset>/SPEC.md`. Follow Project Start.

- Inspect current project-local and inherited instructions, project metadata,
  and the current Claude Code version. Verify the adapter's native mechanism.
- Stop before project writes for uncertainty, incomplete mapping,
  or inherited legacy behavior incompatible with the requested preset. Do not
  silently degrade Standard/Complex or run the historical global installer.
- Apply only the requested preset project-locally under the ownership contract.
  Preserve project facts, constraints, and overrides; avoid duplicate equivalent
  instructions. Infer no architecture or domain conventions.
- Do not activate other presets, change global/user configuration outside the
  bootstrap kit directory, or change an existing preset selection.
- Do not commit anything or otherwise mutate Git.
- Verify the single managed block, preserved surrounding content, and metadata.
  Report bootstrap and project-application outcomes separately, any conflicts,
  and the need for a fresh Claude session. No need to leave the project or rerun Start.

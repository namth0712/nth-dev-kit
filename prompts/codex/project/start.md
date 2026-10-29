# Codex Project Start

Input: `PRESET = Simple | Standard | Complex`.

The user must select exactly one valid preset. Never choose automatically.
No kit path is required as normal input.

Resolve `$CODEX_HOME/nth-dev-kit` from the active Codex environment, using the
runtime's documented Codex home default (normally `~/.codex`) when unset.
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
- Bootstrap by executing that source's `prompts/codex/global/install.md`
  with its `KIT_SOURCE` under the exact Global Install safety contract. Install
  the FULL dormant library only in the resolved kit directory, preserve other
  user configuration, inject nothing into global `AGENTS.md`, and verify the
  receipt/integrity before continuing. Failure leaves the project unchanged.

Continue the original request using the verified installed library, never the
source checkout as an application fallback. Do not update an existing library
implicitly. No source path or live library import belongs in project instructions.

Read the installed library's `docs/lifecycle.md`, `docs/ownership.md`,
`agents/codex/README.md`, and the authoritative
`presets/<requested-preset>/SPEC.md`.

Follow Project Start:

- Inspect current project-local and inherited instructions, project metadata,
  and the current Codex version/environment.
- Verify the requested preset has a complete Codex mapping before making
  project changes. Stop and report if the mapping is unsupported,
  incomplete, or uncertain. Never silently substitute another preset.
- Apply only the requested preset project-locally under the ownership contract.
- Preserve project facts, constraints, overrides, and unrelated instructions.
- Avoid duplicate equivalent instructions.
- Infer no architecture or domain conventions that were not supplied.
- Do not activate other presets.
- Do not modify global/user Codex configuration outside the bootstrap kit directory.
- Do not change an existing preset selection.
- Do not commit anything or otherwise mutate Git.

After applying:

- verify the project-local managed content and metadata;
- report bootstrap and project-application outcomes separately;
- report changes or conflicts;
- report whether a fresh Codex task is required.

No need to leave the project or rerun Start after successful bootstrap.

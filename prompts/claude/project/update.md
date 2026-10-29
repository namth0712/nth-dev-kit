# Claude Project Update

Scope: the current project. No kit-related user input is required.

Resolve `<active Claude config directory>/nth-dev-kit`, honoring
`CLAUDE_CONFIG_DIR` when set, otherwise the runtime's documented default.
Validate the path and verify the full installed receipt/integrity before use.
If absent, invalid, or incomplete, stop and report Global Install first. Do not
bootstrap, implicitly update the global library, request a kit path, or fall
back to the source checkout.

Read the installed library's `docs/lifecycle.md`, `docs/ownership.md`, and
`agents/claude/README.md`. Verify the library receipt/content. Follow Project
Update using the preset identified by valid project state and proven content;
never change preset implicitly. Missing or ambiguous selection stops the run.

- Load that preset's authoritative spec and compare its adapter with the actual
  project-local content. Recheck the current Claude Code version and inherited
  instructions; stop on changed/incompatible mechanisms or incomplete mapping.
- Update only provably kit-owned content. Preserve project facts, overrides,
  unrelated content, and customized/unprovable managed content; report conflicts.
  Use installed current specs and receipted historical text for proof; never
  access the Git source as a project dependency.
- Never add capabilities merely because the kit contains them. Report proposed
  expansions separately. Do not run `INSTALL.md`, change global/user
  configuration, or activate another preset.
- Verify the unchanged preset identity, block, metadata, and surrounding bytes.
  Report differences, conflicts, and any need for a fresh session.
- Do not commit anything or otherwise mutate Git state.

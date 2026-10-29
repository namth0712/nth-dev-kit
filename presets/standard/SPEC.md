# Standard

For normal medium-sized applications. Includes [Simple](../simple/SPEC.md), plus:

- Route broad or noisy read-only investigation outside the main working
  context when the agent supports it. Give it a bounded question and use a
  concise synthesis; keep narrow lookups local.
- When narrow investigation expands into repeated searches, large files, or
  several components, pause and deliberately reroute or rescope the remaining
  investigation. Report unavailable isolation instead of pretending it ran.
- Use lightweight independent review or isolated verification only when it
  materially improves confidence. Avoid mandatory review rituals.
- Keep durable project facts and entry-point references in the project's
  existing docs. Use those references before rediscovering the architecture.
- Apply scoped engineering rules only for technologies and conventions the
  project explicitly uses; preserve its established choices.

This specification does not require the Complex skill collection. Adapter
availability is defined in [Claude](../../agents/claude/README.md) and
[Codex](../../agents/codex/README.md); a spec alone is not an implementation.

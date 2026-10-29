# Complex

For large or multi-product projects. Builds on the logical discipline in
[Standard](../standard/SPEC.md) with these capabilities:

- Separate reviewer and verifier roles, used when the work warrants them.
- Isolated, read-only pre-implementation analysis for feature, domain,
  contract, integration, infrastructure, refactoring, and other design-bearing
  work. The analysis is persisted as a project-local handoff that
  implementation follows; routine and mechanical work skips it.
- On-demand reasoning for diagnosis, difficult decisions, proposal critique,
  and substantial implementation planning.
- On-demand maintenance audits for refactoring, documentation, and prompts.
- Scoped engineering rules that yield to explicit project conventions.
- Optional CodeGraph exploration of an already indexed project, with safe
  command routing and ownership of any rendered configuration.
- Bounded investigation and project-context routing so only relevant product
  facts enter a task; project documentation remains the source of those facts.

The mature Claude implementation is authoritative for its existing behavior:
[Claude adapter](../../agents/claude/README.md), implemented in `managed/`
and the legacy `INSTALL.md`. This spec does not duplicate those instructions
or add new runtime requirements to that implementation. Its historic global
scope is a migration constraint, not project-local activation support.

[Codex](../../agents/codex/README.md) has no complete Complex mapping yet.
Do not approximate missing capabilities or apply a lesser preset in its place.

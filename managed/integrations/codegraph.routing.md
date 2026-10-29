# CodeGraph exploration (nth-claude-kit, automatic mode)

In a project that already has a CodeGraph index (`.codegraph/` in the project
or a parent), delegate broad investigation to Explore and tell it to:

- Run exactly one small `{{CODEGRAPH_EXPLORE}} "<query>"` with the Bash tool
  from the project directory. This exact form is pre-approved. Add no `cd`,
  environment-variable, or path-option prefix, and run no other CodeGraph
  commands.
- Stop graph exploration if that is sufficient, and use Read/Grep/Glob only
  for gaps.
- Return concise findings, not raw graph output.

Never initialize or index a project. Without an index, explore normally.

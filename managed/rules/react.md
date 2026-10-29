---
paths:
  - "**/*.{tsx,jsx}"
---

# React conventions (personal defaults)

The project's established frontend architecture and explicit project rules override these defaults. Do not "correct" an established project to match them.

- Give each piece of application/server state one deliberate owner. Do not create parallel, competing sources of truth.
- Reuse the project's shared HTTP/API client. Do not add a second one.
- Call hooks unconditionally.
- Render components as JSX elements (`<Row />`), never by calling component functions directly (`Row()`).
- When a component carries substantial behavior, separate orchestration/state from presentation, using the project's established component architecture rather than a new pattern.
- Do not introduce a new state-management, form, styling, or data-fetching system when the project already has one.

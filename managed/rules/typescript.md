---
paths:
  - "**/*.{ts,tsx,mts,cts}"
---

# TypeScript conventions (personal defaults)

Explicit project conventions and project rules override these defaults. Do not "correct" an established project to match them.

- Prefix interfaces with `I` (`IUserProfile`).
- Prefix literal-union type aliases with `T` (`type TSyncState = 'idle' | 'running'`).
- Use the project's exact domain vocabulary. Do not invent synonyms for established concepts.
- Prefer one clear exported concern per file where the surrounding code does, and name the file after that concern using the project's naming convention.
- Preserve existing barrel-export conventions where the project uses them.
- Do not add abstractions merely to deduplicate small amounts of code.

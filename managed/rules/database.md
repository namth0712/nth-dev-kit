---
paths:
  - "**/*.{sql,prisma}"
  - "**/{migrations,migration}/**/*"
  - "**/*.{migration,entity}.{ts,js}"
---

# Database schema conventions (personal defaults)

Explicit project conventions and project rules override these defaults. Do not "correct" an established schema to match them. The project's existing ORM and migration mechanism always wins; do not impose a different migration strategy.

- The application owns business logic and relational integrity: no physical foreign keys, triggers, stored procedures, or CHECK constraints.
- Store time as UTC Unix epochs in unsigned integer columns.
- Avoid native JSON columns. Serialized auxiliary structures stay application-owned.
- Name primary keys after the entity (`user_id`/`userId`), not a bare `id`.
- Reference columns reuse the referenced entity's identifier name.
- Counters and denormalized values are caches of normalized truth, never replacements for it.
- Every new index must serve a real query path. No speculative indexes.
- Where the project has an established sentinel convention, follow it instead of casually introducing NULL.

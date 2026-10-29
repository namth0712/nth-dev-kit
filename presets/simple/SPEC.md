# Working discipline

## Scope

- Prefer the smallest correct change.
- Reuse existing code before adding abstractions or dependencies.
- Follow existing project conventions before generic preferences.
- Keep investigation narrow and relevant to the task. Do not survey unrelated parts of the repository.
- Do not refactor unrelated code.

## Verification

- Use the smallest verification that can reasonably falsify the changed behavior.
- Verify each required behavior once unless the result is ambiguous. Do not repeat successful checks merely for reassurance.
- Do not run broad test, lint, build, or browser suites unless the change requires them.
- If verification tooling cannot exercise something cleanly, report the limitation instead of spending substantial time working around the tooling.

## Git

- Do not mutate Git state (including staging, commits, branches, history, or remotes) unless explicitly requested.

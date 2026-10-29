# Ownership and project application

This contract governs the new lifecycle. The legacy Claude installer's
existing ownership and runtime-provenance rules remain in `INSTALL.md`.

## Proof before replacement

- Compare text by normalizing CRLF, then remaining CR, to LF only. Do not trim,
  reformat, remove a BOM, or normalize other whitespace or encoding.
- A current authoritative kit file or a historical version of that same file
  (including known renamed paths) can prove ownership by exact canonical
  equality. Global Install/Update reads source history (`KIT_SOURCE` and,
  when supplied, the pre-split `KIT_HISTORY_SOURCE`; see
  [lifecycle](lifecycle.md#inputs-and-runtime-checks)) as raw Git blobs, never
  from checked-out files, and stores verified preset text in the installed
  library's receipted `history/presets/` archive. Project operations compare
  with that installed evidence; they never read the source Git checkout.
- The [excluded legacy nth-review paths](lifecycle.md#excluded-legacy-nth-review-paths)
  of an installed library are outside this contract: never prove, replace, or
  remove them.
- Names, markers, metadata, version labels, and a stored hash alone are not
  proof. Customized or unprovable content stays unchanged; report a conflict.
- A match with current content is a no-op; do not rewrite line endings.
  If the installed archive lacks the required historical text, current equality
  is the only project content proof. Preserve older unprovable content and
  report that Global Update must first supply verified history. Do not ask a
  project operation to locate the Git source. The installed library contains
  historical text evidence, not a Git object store.
- Before any target read or write, validate its path against the operation's
  allowed destinations. Reject traversal, absolute metadata paths, symlinks,
  junctions, and other reparse points on the target or intervening path that
  could redirect access outside the intended root. Recheck before mutation.
  Metadata can never expand the destination set.
- Preflight the entire operation before mutation. On conflict, stop and report
  the proposed diff; do not partially apply a preset or claim an updated
  library version. Preserve concurrent edits by rereading targets before write.

## Simple representation

The only supported project destinations are root `CLAUDE.md` for Claude and
root `AGENTS.md` for Codex, plus root `.nth-dev-kit.json`. The adapter must
first confirm that the selected instructions file will actually load.

Embed the exact contents of `presets/simple/SPEC.md` between these inert
delimiters (the placeholder below is explanatory, never literal runtime text):

```markdown
<!-- nth-dev-kit:begin simple -->
<exact Simple SPEC.md contents, including its final newline>
<!-- nth-dev-kit:end simple -->
```

Only the embedded spec is runtime discipline. Do not copy lifecycle, adapter,
session, or ownership documentation into the project's instructions. Do not
link, import, or symlink runtime content to the installed library: Global
Update must not change an active project by changing an import target.

Keep project facts, constraints, and explicit overrides outside the block.
They remain authoritative for that project. Do not infer its architecture,
technology choices, domain vocabulary, or build commands during application.

## Minimal project state

Use `.nth-dev-kit.json` only to record the explicit selection per agent:

```json
{
  "schemaVersion": 1,
  "agents": {
    "codex": {
      "preset": "simple",
      "appliedVersion": "sha256:<canonical-spec-content-digest>"
    }
  }
}
```

`appliedVersion` is `sha256:` followed by the lowercase SHA-256 of the complete
LF-canonical spec encoded as UTF-8, preserving any BOM and final newline. This
is a content version, so dirty or copied source is not mislabeled as a release.
The example is schematic; compute the actual digest when applying. There are
no user-controlled destination paths in project state.

Validate schema 1, the selected agent's object, its preset enum, and digest
format. Preserve other agents and unrelated fields. Malformed JSON, duplicate
keys, unknown schema, or disagreement between selection, digest, and proven
content is a conflict. Record state only after a successful application;
unchanged state is not rewritten. State identifies intent, never ownership.

## Project Start

1. Require only one explicit `PRESET = Simple | Standard | Complex`. Normalize
   the preset name to lowercase for lookup; a missing/invalid value stops before
   any write. Resolve the installed library through the active agent adapter;
   follow [lifecycle bootstrap](lifecycle.md#project-start-resolve-bootstrap-apply)
   only if it is absent. Verify its receipt and integrity before using its
   spec/evidence. Complete adapter checks before touching the project.
   Unsupported mappings stop, without fallback to another preset or source.
2. Inspect the selected agent's current instructions, inherited instructions,
   and project state. If state already selects a different preset, stop: these
   prompts do not implement preset switching. If it selects the same preset,
   use Project Update's rules rather than duplicating it.
3. If one well-formed managed block exists, prove its body against the spec or
   history before adopting/updating it. Multiple, nested, mismatched, or stray
   markers are conflicts. Check for equivalent instructions outside the block
   too; duplicates require reconciliation rather than another copy. Never
   overwrite content merely because it is marked.
4. For legacy unmarked Simple, accept a single exact current or historical
   copy as a bounded whole section, including its subsections. The historical
   source paths were `presets/simple/core.md`, `presets/simple/claude/CLAUDE.md`,
   and `presets/simple/codex/AGENTS.md`; Global Install/Update archives that
   evidence for project use. Wrap/replace only that proven span and keep
   all surrounding project content byte-for-byte. Ambiguous boundaries,
   duplicate copies, or similar/customized discipline stop for reconciliation;
   do not append another equivalent policy.
5. When no equivalent instructions exist, append one block (or create the
   missing file), preserving existing bytes and using its line-ending style
   for inserted text. Write only that agent's state after verifying the result.

## Project Update

Resolve the installed library automatically from the active agent environment
and verify its receipt/integrity. No kit path or source input is required.
If missing or invalid, stop and report Global Install first; Update does not
bootstrap. Use only the installed spec and receipted historical text evidence.

Require valid existing state and exactly one matching block. An unmarked
legacy copy without state needs explicit Project Start adoption first. Prove
the existing body from current/historical kit content and confirm its digest
matches `appliedVersion`; the metadata alone is insufficient. Recheck the
current runtime and adapter, and load the spec for the recorded preset.
Verify that equivalent managed discipline has not been duplicated outside the
block; preserve and report ambiguous or customized duplicates as conflicts.

Never switch presets, recreate a missing block, or silently add capabilities.
For Simple, replacement can revise the existing discipline only. If a newer
spec/adapter adds a capability, role, rule set, integration, or new destination,
stop and report the proposed expansion for a separate explicit decision. No
extra file is authorized simply because it appears in the new kit. A removed
or incomplete adapter is a conflict, not permission to downgrade or erase it.

Replace only a proven older block body and update only that agent's digest.
Keep markers, surrounding bytes, project overrides, and unrelated state.
Customized/unprovable content and conflicting state remain untouched. Verify
the body, digest, single block, and preservation of surrounding content; report
the compatibility evidence, precise diff, and any required fresh session.

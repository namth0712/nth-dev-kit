# Releasing

## Identity and versions

- The kit has no version number yet. An installed library is identified by
  its receipt: the LF-canonical sha256 of every copied file. Choosing a
  version scheme (and adding `kitVersion` to the pin) is an open decision.
- Changes are listed in [CHANGELOG.md](../CHANGELOG.md) under `Unreleased`
  until a release commit is tagged by hand.
- nth-status is versioned and tagged in its own repository. The kit records
  the release it installs in `packages/compatibility.json`
  ([the pin](integrations.md#the-pin)).

## Steps

1. Move the `Unreleased` entries in `CHANGELOG.md` under a dated heading and
   name the nth-status version in the pin.
2. Run `sh tools/check-portability.sh` and the mod tests
   ([development](development.md)); both must pass.
3. Run Global Install and then Global Update in a throwaway config home and
   check that the second run writes nothing.
4. Commit and tag by hand. Agents never commit, tag or push.

## Before the first publication

The README's install prompt works only once these hold:

- The kit's default branch on https://github.com/namth0712/nth-dev-kit
  holds the release content.
- https://github.com/namth0712/nth-status has the tag `v<version>` for the
  pinned version, and a clone of that tag matches every digest in the pin
  (check with `sh tools/release-digests.sh` there). Without it, every
  install where nth-status is not set up yet stops before writing anything.
- The [simulated public install](development.md#public-install-flow-simulated)
  passed, and after the push the real URLs were tried in a throwaway config
  home.
- Neither `scratchpad/` (ignored) nor a local `.nth-dev-kit/` working
  folder is committed.

Never rewrite published history (no force-push to a published branch or
tag): Global Update proves earlier installed content from it.

## Pinning a new nth-status release

1. In an nth-status checkout at the new release tag, run
   `sh tools/release-digests.sh`.
2. Replace `components.nth-status` in `packages/compatibility.json` with its
   output.
3. In a throwaway config home, run Global Install with `STATUS_SOURCE` at that
   tag, and Global Update over an install of the previous pin (it must report
   "differs" and write nothing).
4. Record the pair in `CHANGELOG.md`.

The kit needs a new pin only when it should install a different nth-status
by default. People can move an existing installation to any release with
nth-status's own Update at any time.

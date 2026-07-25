# Contributing to Lore

Thanks for considering a contribution. This project is small and pragmatic — please keep changes
focused and match the existing style.

## Development setup

```bash
git clone https://github.com/Tjindl/Lore
cd Lore
npm install
npm link          # makes `lore` available globally, pointing at your working copy
```

`lore` is a CommonJS Node.js CLI — no build step, no TypeScript. Edit `src/` or `bin/lore.js` and
re-run the command to see your change.

## Running tests

```bash
npm test
```

Tests live in `tests/` and use [Jest](https://jestjs.io/). Add or update tests for any behavior
change — CI runs the suite on every pull request.

## Project layout

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how the codebase is organized
(`src/commands/`, `src/lib/`, `src/watcher/`, `src/mcp/`, `src/ui/`) before making structural
changes.

## Making a change

1. Open an issue first for anything beyond a small fix, so we can agree on the approach.
2. Create a branch off `main`.
3. Keep commits scoped and messages descriptive (`fix(mcp): ...`, `feat(cli): ...` style is
   preferred but not required).
4. Make sure `npm test` passes.
5. Open a pull request describing what changed and why. Link the related issue if any.

## Reporting bugs / requesting features

Use the [issue templates](.github/ISSUE_TEMPLATE) — they ask for the context needed to reproduce
or evaluate the request.

## Code style

- Plain CommonJS (`require`/`module.exports`), no TypeScript, no bundler.
- Match the formatting of surrounding code; there's no enforced linter yet.
- Prefer small, composable functions in `src/lib/` over logic embedded in `src/commands/`.

## Releasing (maintainers)

1. Update `CHANGELOG.md`: move `[Unreleased]` entries under a new `## [x.y.z] - YYYY-MM-DD`
   heading and add the compare link at the bottom.
2. Bump `version` in `package.json` to match.
3. Commit, then tag: `git tag vx.y.z && git push origin main --tags`.
4. Pushing the tag triggers [`.github/workflows/release.yml`](.github/workflows/release.yml),
   which runs the test suite and publishes to npm.

The release workflow requires an `NPM_TOKEN` secret (an npm automation token with publish
access) configured in the repository settings — it is not included in this repo and must be
added manually before the first tagged release.

## Security issues

Please don't open a public issue for a security vulnerability — see
[SECURITY.md](SECURITY.md) for how to report it privately.

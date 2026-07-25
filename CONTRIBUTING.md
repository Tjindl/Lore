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
4. Make sure `npm test` and `npm run lint` pass.
5. If your change affects published behavior (not docs/tests/CI-only), add a changeset:
   `npx changeset` — pick the affected bump type (patch/minor/major) and write a one-line
   summary. This becomes the `CHANGELOG.md` entry, so write it for users, not for reviewers.
6. Open a pull request describing what changed and why. Link the related issue if any.

## Reporting bugs / requesting features

Use the [issue templates](.github/ISSUE_TEMPLATE) — they ask for the context needed to reproduce
or evaluate the request.

## Code style

- Plain CommonJS (`require`/`module.exports`), no TypeScript, no bundler. Some files in `src/lib/`
  opt into type-checking via `// @ts-check` + JSDoc — see [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).
- Formatting is enforced by Prettier/ESLint (`npm run lint`, `npm run format`), and runs
  automatically on staged files via a pre-commit hook (Husky + lint-staged).
- Prefer small, composable functions in `src/lib/` over logic embedded in `src/commands/`.

## Releasing (maintainers)

Releases are automated with [Changesets](https://github.com/changesets/changesets):

1. PRs that change published behavior carry a changeset (added via `npx changeset`, see above).
2. On every push to `main`, [`.github/workflows/release.yml`](.github/workflows/release.yml) either:
   - opens/updates a "Version Packages" pull request that bumps `package.json` and rewrites
     `CHANGELOG.md` from the accumulated changesets, or
   - if that PR was just merged (no changesets left pending), publishes the new version to npm
     and tags the release.

Nothing to do manually beyond merging the Version Packages PR when you're ready to ship. The
workflow requires an `NPM_TOKEN` secret (an npm automation token with publish access) configured
in the repository settings — it is not included in this repo and must be added manually before
the first release.

## Security issues

Please don't open a public issue for a security vulnerability — see
[SECURITY.md](SECURITY.md) for how to report it privately.

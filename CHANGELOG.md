# Changelog

All notable changes to this project are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [Unreleased]

### Added
- Jest test suite (`tests/`) covering init, overview, search, and stale commands.
- Open source project scaffolding: `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`,
  issue/PR templates, CI and release workflows.

### Changed
- Documentation restructured: README trimmed to an overview, with the full command reference
  moved to `docs/COMMANDS.md` and architecture details to `docs/ARCHITECTURE.md`.

### Fixed
- Various stability fixes across init, log, search, stale, watch, and the MCP overview/search
  tools.

## [0.5.1] - 2026-03-11

### Fixed
- Prevented the UI dashboard from crashing the MCP stdio stream when `lore serve` runs both
  the MCP server and the dashboard together.

### Documentation
- Added autonomous zero-prompt MCP integration instructions to the README.

## [0.5.0] - 2026-03-10

### Added
- `lore_update` MCP tool for modifying existing Lore entries from an AI agent.
- UI dashboard support and status management surfaced through the MCP server.
- Entry deduplication, with drafts saved for human review instead of silently discarded.

## [0.4.0] - 2026-03-05

### Added
- `lore prompt` — generates a zero-shot LLM context prompt from semantic search results.
- Architecture documentation.

### Fixed
- MCP `search` tool now enforces the token budget correctly (removed a fallback path that
  bypassed it).
- Relevance scoring no longer double-counts exact file matches against the parent-directory
  bonus.
- `lore init` awaits the initial directory mine so the draft count displays correctly.
- `lore search` / `lore prompt` accept unquoted multi-word queries.
- Post-commit hook no longer destructively overwrites an existing user hook.
- Mined drafts are deduplicated against existing drafts and entries.
- `lore onboard` ellipsis truncation fixed for decision summaries.
- Fixed a crash when formatting entries missing a `context` property.
- CLI version string now reads dynamically from `package.json`.

## [0.3.0] - 2026-02-28

### Added
- Local web dashboard (`lore ui`) with graph visualization.

## [0.2.0] - 2026-02-27

### Added
- Interactive CLI menu, bulk draft review, fuzzy command matching, improved terminal formatting.

## [0.1.1] - 2026-02-27

### Added
- Initial npm publishing setup and documentation.

## [0.1.0] - 2026-02-27

### Added
- Phase 1 CLI: `init`, `log`, `why`, `status`, `stale`, `search`, `export`, `edit`, backed by a
  git-native `.lore/` knowledge base.

[Unreleased]: https://github.com/Tjindl/Lore/compare/v0.5.1...HEAD
[0.5.1]: https://github.com/Tjindl/Lore/compare/v0.5.0...v0.5.1
[0.5.0]: https://github.com/Tjindl/Lore/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/Tjindl/Lore/compare/v0.3.0...v0.4.0
[0.3.0]: https://github.com/Tjindl/Lore/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/Tjindl/Lore/compare/v0.1.1...v0.2.0
[0.1.1]: https://github.com/Tjindl/Lore/releases/tag/v0.1.1

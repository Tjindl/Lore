# Lore

**Persistent project memory for developers and their AI assistants.**

[![npm version](https://img.shields.io/npm/v/lore-memory.svg)](https://www.npmjs.com/package/lore-memory)
[![CI](https://github.com/Tjindl/Lore/actions/workflows/ci.yml/badge.svg)](https://github.com/Tjindl/Lore/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/node/v/lore-memory.svg)](package.json)

Lore captures the decisions, invariants, gotchas, and abandoned approaches that live in your
head and puts them in your codebase instead — versioned in git, and queryable by both you and
your AI coding assistant.

## Why

Every AI coding session starts from zero. You re-explain why you chose JWT over sessions, why
that Redis approach was abandoned, why the 200ms budget is a hard limit — because that context
lives in your head, not your repo. Without it, your assistant re-suggests things you already
rejected and removes workarounds that exist for real reasons.

Lore fixes that: it's a structured, git-native memory bank that you (and any AI agent working in
your codebase) can query before making changes.

## Install

```bash
npm install -g lore-memory
```

Or from source:

```bash
git clone https://github.com/Tjindl/Lore
cd Lore
npm install
npm link
```

## Quick start

```bash
cd your-project
lore init             # set up .lore/ and install the capture hook
lore watch --daemon   # start passive capture in the background
lore mine .           # scan existing source for lore-worthy comments
lore ui               # browse your knowledge base in a local dashboard
lore prompt "auth"    # generate an AI system prompt from relevant memory
```

Run `lore` with no arguments for an interactive menu.

## Entry types

| Type | Question it answers | Example |
|---|---|---|
| **Decision** | Why did we do this? | "Use Postgres over MongoDB — our data is highly relational." |
| **Invariant** | What must never be broken? | "Auth tokens must never be cached in memory." |
| **Gotcha** | What's a known trap? | "`Date.now()` in test fixtures produces flaky tests." |
| **Graveyard** | What did we try and abandon? | "Tried GraphQL for the public API — removed for N+1 queries." |

```bash
lore log --type decision \
  --title "Use Postgres over MongoDB" \
  --context "We started with Mongo but our data is highly relational..."
```

## Key features

- **Local dashboard** (`lore ui`) — search your memory bank and view health metrics in a browser.
- **Context compactor** (`lore prompt <query>`) — semantic search that compiles a ready-to-paste
  system prompt for any LLM.
- **Passive mining** (`lore watch`, `lore mine`) — scans source for signal comments
  (`// WARNING:`, `// HACK:`, `// IMPORTANT:`) and drafts entries for you to review.
- **MCP server** (`lore serve`) — native integration with Claude Code, Cursor, and other MCP
  clients, so agents query your memory before writing code.
- **Staleness tracking** (`lore stale`) — entries linked to a file are flagged when that file
  changes, so the knowledge base doesn't quietly rot.
- **Semantic search** (`lore search`) — offline vector embeddings via Ollama, no cloud calls.
- **Architect-in-the-loop hook** — a post-commit hook prompts you to log a decision after large
  changes.

See [docs/COMMANDS.md](docs/COMMANDS.md) for the full command reference and MCP setup, and
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for how it's built.

## Privacy & data

- 100% free and open source, no subscriptions.
- No cloud calls: semantic embeddings run locally via Ollama.
- Entries are plain JSON under `.lore/` at your project root, committed alongside your code so
  your whole team shares the same memory.

## Contributing

Contributions are welcome — see [CONTRIBUTING.md](CONTRIBUTING.md) for local setup, testing, and
PR guidelines. Please also read the [Code of Conduct](CODE_OF_CONDUCT.md).

## License

[MIT](LICENSE)

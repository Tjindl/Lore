# Command reference

Run `lore` with no arguments for an interactive menu, or `lore --help` / `lore <command> --help`
for CLI usage.

## Setup & capture

| Command | Description |
|---|---|
| `lore init` | Initialize `.lore/` in the current repo and install the post-commit hook |
| `lore log` | Log a decision, invariant, gotcha, or graveyard entry (interactive, or via flags) |
| `lore mine [path]` | Scan a file or directory for lore-worthy comments and create drafts |
| `lore watch` | Watch the project and mine comments passively (`--daemon` to run in background, `--stop` to stop it) |

## Review & edit

| Command | Description |
|---|---|
| `lore ui` | Launch the local web dashboard (`-p, --port`, default `3333`) |
| `lore drafts` | Review and approve auto-captured draft entries (`--auto` accepts confidence ≥ 0.8) |
| `lore edit <id>` | Open an entry JSON in your editor |

## Query & export

| Command | Description |
|---|---|
| `lore prompt <query>` | Generate a formatted LLM context prompt from project memory (`-t/--threshold`, `-l/--limit`) |
| `lore why <file>` | Show all entries relevant to a file or directory |
| `lore search <query>` | Search entries by keyword (semantic if Ollama is running) |
| `lore graph [file]` | Show or rebuild the module dependency graph (`--build`) |
| `lore export` | Generate `CLAUDE.md` at the project root |

## Health & onboarding

| Command | Description |
|---|---|
| `lore status` | Entry counts, draft count, stale summary |
| `lore stale` | Full stale-entry report with semantic pattern analysis |
| `lore score` | Lore Score (0–100): coverage, freshness, depth |
| `lore onboard` | Print a re-onboarding brief (`--days` to gate on time away) |

## AI integration

| Command | Description |
|---|---|
| `lore serve` | Start the MCP server (stdio) and dashboard for AI clients (`-q/--quiet`, `-p/--port`) |
| `lore embed` | Build the semantic search index via Ollama (`ollama pull nomic-embed-text` first) |

### Wiring up an MCP client

```json
{
  "mcpServers": {
    "lore": { "command": "lore", "args": ["serve"] }
  }
}
```

### Zero-prompt enforcement

Drop this instruction into your `CLAUDE.md` (or `.cursorrules` / `.clinerules`) so agents check
Lore before touching a file, without you having to ask:

> Before you modify, create, or explain any file in this codebase, you must ALWAYS execute the
> `lore_why` tool on that file path first to check if there are any architectural invariants,
> gotchas, or decisions you need to respect.

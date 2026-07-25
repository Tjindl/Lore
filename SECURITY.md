# Security Policy

## Supported Versions

Lore is pre-1.0 and evolving quickly. Only the latest published version on npm receives security
fixes.

| Version | Supported |
|---|---|
| Latest  | ✅ |
| Older   | ❌ |

## Reporting a Vulnerability

Please **do not** open a public GitHub issue for security vulnerabilities.

Instead, report it privately by emailing **tushar.bzp05@gmail.com** with:

- A description of the vulnerability and its potential impact
- Steps to reproduce (a minimal repro is ideal)
- Any suggested fix, if you have one

You should expect an initial response within a few days. Once a fix is available, we'll credit
you in the release notes unless you'd prefer otherwise.

## Scope notes

Lore stores project memory as local files under `.lore/` and, when enabled, talks to a locally
running Ollama instance for embeddings — it does not send code or entries to any third-party
cloud service. Reports involving unintended data exfiltration, arbitrary code execution via
crafted `.lore/` files, or MCP tool misuse are especially welcome.

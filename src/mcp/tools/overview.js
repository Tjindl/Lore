'use strict';

const { readIndex } = require('../../lib/index');
const { readEntry } = require('../../lib/entries');
const { checkStaleness } = require('../../lib/stale');
const { readConfig } = require('../../lib/config');
const { getDaysSinceLastSession, updateLastSession } = require('../../lib/sessions');
const { getDraftCount } = require('../../lib/drafts');
const { loadHistory } = require('../../lib/scorer');

const toolDefinition = {
  name: 'lore_overview',
  description:
    "Get a high-level summary of this project's Lore knowledge base. Returns key decisions, invariants, gotchas, stale entries, Lore Score, and pending drafts. Call this at the start of a session.",
  inputSchema: {
    type: 'object',
    properties: {
      include_stale: {
        type: 'boolean',
        description: 'Include stale entry warnings (default: true)',
      },
    },
    required: [],
  },
};

async function handler(args) {
  const includeStale = args.include_stale !== false;

  try {
    const config = readConfig();
    const index = readIndex();
    const daysSince = getDaysSinceLastSession();
    updateLastSession();

    const byType = { decision: [], invariant: [], gotcha: [], graveyard: [] };
    const staleItems = [];

    for (const entryPath of Object.values(index.entries)) {
      const entry = readEntry(entryPath);
      if (!entry) continue;
      if (byType[entry.type]) byType[entry.type].push(entry);
      if (includeStale) {
        const staleFiles = checkStaleness(entry);
        if (staleFiles.length > 0) staleItems.push({ entry, staleFiles });
      }
    }

    function getTimestamp(entry) {
      if (entry.date) {
        const d = new Date(entry.date);
        if (!isNaN(d.valueOf())) return d.getTime();
      }
      // Fallback to extracting from ID (e.g., decision-foo-bar-1710000000)
      if (entry.id) {
        const parts = entry.id.split('-');
        const tsString = parts[parts.length - 1];

        // Ensure that the last part is actually a valid unix timestamp (length >= 10 and all numeric)
        if (tsString && tsString.length >= 10 && /^\d+$/.test(tsString)) {
          const ts = parseInt(tsString, 10);
          if (!isNaN(ts)) return ts * 1000;
        }
      }
      return 0; // Ensures bad dates at least fall to bottom instead of blowing up the sort
    }

    // Sort entries newest-first
    for (const type of Object.keys(byType)) {
      byType[type].sort((a, b) => getTimestamp(b) - getTimestamp(a));
    }

    // Sort stale items newest-first too
    staleItems.sort((a, b) => getTimestamp(b.entry) - getTimestamp(a.entry));

    const lines = [];
    const projectName = config.project || 'this project';

    if (daysSince !== null && daysSince >= 3) {
      lines.push(`# Welcome back to ${projectName}`);
      lines.push(`_(You've been away for ${daysSince} day${daysSince === 1 ? '' : 's'})_`);
      lines.push('');
    } else {
      lines.push(`# Lore Overview — ${projectName}`);
      lines.push('');
    }

    // Lore Score one-liner
    const history = loadHistory();
    if (history.length > 0) {
      const latest = history[history.length - 1];
      lines.push(`**Memory health: ${latest.score}/100**`);
      lines.push('');
    }

    // Pending drafts
    const draftCount = getDraftCount();
    if (draftCount > 0) {
      lines.push(
        `**${draftCount} unreviewed draft${draftCount === 1 ? '' : 's'} — run \`lore drafts\` to review**`
      );
      lines.push('');
    }

    // Decisions
    if (byType.decision.length > 0) {
      lines.push(`## Architectural Decisions (${byType.decision.length})`);
      for (const e of byType.decision.slice(0, 5)) {
        lines.push(`• **${e.title}**`);
        if (e.context) {
          const summary = e.context.split('\n')[0].slice(0, 100);
          lines.push(`  ${summary}${e.context.length > 100 ? '…' : ''}`);
        }
      }
      if (byType.decision.length > 5) {
        lines.push(`  _(and ${byType.decision.length - 5} more — use lore_search to explore)_`);
      }
      lines.push('');
    }

    // Invariants
    if (byType.invariant.length > 0) {
      lines.push(`## Invariants — Never Break These (${byType.invariant.length})`);
      for (const e of byType.invariant) {
        lines.push(`• **${e.title}**`);
        if (e.context) {
          lines.push(`  ${e.context.split('\n')[0].slice(0, 100)}`);
        }
      }
      lines.push('');
    }

    // Gotchas
    if (byType.gotcha.length > 0) {
      lines.push(`## Gotchas (${byType.gotcha.length})`);
      for (const e of byType.gotcha.slice(0, 3)) {
        lines.push(`• **${e.title}**`);
      }
      if (byType.gotcha.length > 3) {
        lines.push(`  _(and ${byType.gotcha.length - 3} more)_`);
      }
      lines.push('');
    }

    // Stale
    if (includeStale && staleItems.length > 0) {
      lines.push(`## ⚠️ Stale Entries (${staleItems.length})`);
      for (const { entry, staleFiles } of staleItems.slice(0, 5)) {
        lines.push(`• **${entry.title}** (${entry.id})`);
        for (const s of staleFiles) {
          const daysText = s.daysAgo === 0 ? 'today' : `${s.daysAgo}d ago`;
          lines.push(`  ${s.filepath} changed ${daysText}`);
        }
      }
      lines.push('');
    }

    const total = Object.values(byType).reduce((sum, arr) => sum + arr.length, 0);
    lines.push('---');
    lines.push(`_Total: ${total} entries | Use lore_why <filepath> for file-specific context_`);

    return { content: [{ type: 'text', text: lines.join('\n') }] };
  } catch (e) {
    return {
      content: [{ type: 'text', text: `Error: ${e.message}` }],
      isError: true,
    };
  }
}

module.exports = { toolDefinition, handler };

// @ts-check
'use strict';

/**
 * @typedef {'decision' | 'invariant' | 'graveyard' | 'gotcha'} LoreEntryType
 */

/**
 * A single unit of project memory, stored as JSON under `.lore/<type>s/<id>.json`.
 * @typedef {Object} LoreEntry
 * @property {string} id
 * @property {LoreEntryType} type
 * @property {string} title
 * @property {string} [context]
 * @property {string[]} [files] - Relative file paths this entry is linked to
 * @property {string[]} [tags]
 * @property {string[]} [alternatives] - Alternatives considered (decisions/graveyard)
 * @property {string} [tradeoffs]
 * @property {string} [date] - ISO 8601 timestamp
 */

/**
 * The `.lore/index.json` lookup structure.
 * @typedef {Object} LoreIndex
 * @property {Object<string, string>} entries - entry id -> JSON file path under `.lore/`
 * @property {Object<string, string[]>} files - normalized file/dir path -> entry ids
 * @property {string} [lastUpdated]
 */

/**
 * Scoring/query context passed to `relevance.js`.
 * @typedef {Object} RelevanceContext
 * @property {string} [filepath]
 * @property {number[]} [queryEmbedding]
 * @property {string[]} [tags]
 */

/**
 * The import/importedBy dependency graph persisted at `.lore/graph.json`.
 * @typedef {Object} LoreGraph
 * @property {Object<string, string[]>} imports - filepath -> files it imports
 * @property {Object<string, string[]>} importedBy - filepath -> files that import it
 * @property {string} [lastUpdated]
 */

/**
 * Result of `computeScore()` — the Lore Score breakdown.
 * @typedef {Object} ScoreResult
 * @property {number} score
 * @property {number} coverage
 * @property {number} freshness
 * @property {number} depth
 * @property {number} activeModules
 * @property {number} coveredModules
 * @property {Array<{module: string, commits: number}>} topUnlogged
 */

/**
 * A single day's entry in `.lore/score.json` history.
 * @typedef {Object} ScoreHistoryEntry
 * @property {string} date - YYYY-MM-DD
 * @property {number} score
 * @property {number} coverage
 * @property {number} freshness
 * @property {number} depth
 */

module.exports = {};

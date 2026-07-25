// @ts-check
'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const { LORE_DIR, getTypeDir } = require('./index');

/** @typedef {import('./types').LoreEntry} LoreEntry */
/** @typedef {import('./types').LoreEntryType} LoreEntryType */
/** @typedef {import('./types').LoreIndex} LoreIndex */

/**
 * @param {LoreEntryType} type
 * @param {string} id
 */
function getEntryPath(type, id) {
  return path.join(LORE_DIR, getTypeDir(type), `${id}.json`);
}

/**
 * @param {string} entryPath
 * @returns {LoreEntry | null}
 */
function readEntry(entryPath) {
  try {
    return fs.readJsonSync(entryPath);
  } catch (/** @type {any} */ e) {
    console.error(chalk.red(`Failed to read entry at ${entryPath}: ${e.message}`));
    return null;
  }
}

/**
 * @param {LoreEntry} entry
 * @returns {string | undefined}
 */
function writeEntry(entry) {
  const entryPath = getEntryPath(entry.type, entry.id);
  try {
    fs.writeJsonSync(entryPath, entry, { spaces: 2 });
    return entryPath;
  } catch (/** @type {any} */ e) {
    console.error(chalk.red(`Failed to write entry: ${e.message}`));
    process.exit(1);
  }
}

/**
 * @param {LoreEntryType} type
 * @param {string} title
 * @returns {string}
 */
function generateId(type, title) {
  const words = title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .join('-')
    .slice(0, 40);
  const ts = Math.floor(Date.now() / 1000);
  return `${type}-${words}-${ts}`;
}

/**
 * @param {LoreIndex} index
 * @returns {LoreEntry[]}
 */
function readAllEntries(index) {
  const entries = [];
  for (const entryPath of Object.values(index.entries)) {
    const entry = readEntry(entryPath);
    if (entry) entries.push(entry);
  }
  return entries;
}

/**
 * Check if a similar entry or draft already exists.
 * @param {LoreIndex} index - The lore index
 * @param {LoreEntryType} type - Entry type
 * @param {string} title - Entry title
 * @returns {{ match: 'exact'|'fuzzy', entry: object, source: 'entry'|'draft' }|null}
 */
function findDuplicate(index, type, title) {
  const normalizedTitle = title.toLowerCase().trim();
  const titleWords = new Set(normalizedTitle.split(/\s+/).filter((w) => w.length > 2));

  /**
   * @param {string} [candidateTitle]
   * @returns {'exact' | 'fuzzy' | null}
   */
  function checkTitle(candidateTitle) {
    const candidate = (candidateTitle || '').toLowerCase().trim();

    // Exact match (case-insensitive)
    if (candidate === normalizedTitle) return 'exact';

    // Fuzzy match: ≥60% word overlap
    if (titleWords.size > 0) {
      const candidateWords = new Set(
        candidate.split(/\s+/).filter((/** @type {string} */ w) => w.length > 2)
      );
      if (candidateWords.size === 0) return null;

      let overlap = 0;
      for (const w of titleWords) {
        if (candidateWords.has(w)) overlap++;
      }

      const similarity = overlap / Math.max(titleWords.size, candidateWords.size);
      if (similarity >= 0.6) return 'fuzzy';
    }

    return null;
  }

  // Check approved entries
  for (const entryPath of Object.values(index.entries)) {
    const entry = readEntry(entryPath);
    if (!entry || entry.type !== type) continue;

    const match = checkTitle(entry.title);
    if (match) return { match, entry, source: 'entry' };
  }

  // Check pending drafts
  try {
    const { listDrafts } = require('./drafts');
    /** @type {any[]} */
    const drafts = listDrafts();
    for (const draft of drafts) {
      if (draft.suggestedType !== type) continue;

      const match = checkTitle(draft.suggestedTitle);
      if (match)
        return {
          match,
          entry: { id: draft.draftId, title: draft.suggestedTitle, type: draft.suggestedType },
          source: 'draft',
        };
    }
  } catch (e) {
    // drafts module not available — skip
  }

  return null;
}

module.exports = {
  getEntryPath,
  readEntry,
  writeEntry,
  generateId,
  readAllEntries,
  findDuplicate,
};

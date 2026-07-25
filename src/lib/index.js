// @ts-check
'use strict';

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

/** @typedef {import('./types').LoreIndex} LoreIndex */
/** @typedef {import('./types').LoreEntry} LoreEntry */

const LORE_DIR = '.lore';
const INDEX_PATH = path.join(LORE_DIR, 'index.json');

function loreExists() {
  return fs.existsSync(LORE_DIR);
}

/**
 * @returns {LoreIndex}
 */
function readIndex() {
  try {
    return fs.readJsonSync(INDEX_PATH);
  } catch (/** @type {any} */ e) {
    if (e.code === 'ENOENT') {
      console.error(chalk.red(`📖 index.json not found at ${INDEX_PATH}`));
    } else {
      console.error(chalk.red(`📖 Malformed index.json at ${INDEX_PATH}: ${e.message}`));
    }
    process.exit(1);
  }
}

/**
 * @param {LoreIndex} index
 */
function writeIndex(index) {
  try {
    index.lastUpdated = new Date().toISOString();
    fs.writeJsonSync(INDEX_PATH, index, { spaces: 2 });
  } catch (/** @type {any} */ e) {
    console.error(chalk.red(`Failed to write index.json: ${e.message}`));
    process.exit(1);
  }
}

/**
 * @returns {LoreIndex}
 */
function emptyIndex() {
  return {
    files: {},
    entries: {},
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * @param {import('./types').LoreEntryType} type
 */
function getTypeDir(type) {
  return type === 'graveyard' ? 'graveyard' : type + 's';
}

/**
 * @param {LoreIndex} index
 * @param {LoreEntry} entry
 */
function addEntryToIndex(index, entry) {
  const typeDir = getTypeDir(entry.type);
  index.entries[entry.id] = `.lore/${typeDir}/${entry.id}.json`;

  for (const filepath of entry.files || []) {
    const normalized = filepath.replace(/^\.\//, '');

    if (!index.files[normalized]) index.files[normalized] = [];
    if (!index.files[normalized].includes(entry.id)) {
      index.files[normalized].push(entry.id);
    }

    // Index immediate parent directory only (ancestor walking happens at lookup time)
    const dir = path.dirname(normalized.replace(/\/$/, ''));
    if (dir && dir !== '.') {
      const dirKey = dir + '/';
      if (!index.files[dirKey]) index.files[dirKey] = [];
      if (!index.files[dirKey].includes(entry.id)) {
        index.files[dirKey].push(entry.id);
      }
    }
  }

  index.lastUpdated = new Date().toISOString();
}

module.exports = {
  LORE_DIR,
  INDEX_PATH,
  loreExists,
  readIndex,
  writeIndex,
  emptyIndex,
  getTypeDir,
  addEntryToIndex,
};

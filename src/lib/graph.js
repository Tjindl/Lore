// @ts-check
'use strict';

const fs = require('fs-extra');
const path = require('path');
const { LORE_DIR } = require('./index');

/** @typedef {import('./types').LoreGraph} LoreGraph */
/** @typedef {import('./types').LoreIndex} LoreIndex */

const GRAPH_PATH = () => path.join(LORE_DIR, 'graph.json');

/**
 * @returns {LoreGraph}
 */
function emptyGraph() {
  return {
    imports: {}, // filepath → [filepath]
    importedBy: {}, // filepath → [filepath]
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * @returns {LoreGraph}
 */
function loadGraph() {
  const p = GRAPH_PATH();
  if (!fs.existsSync(p)) return emptyGraph();
  try {
    return fs.readJsonSync(p);
  } catch (/** @type {any} */ e) {
    return emptyGraph();
  }
}

/**
 * @param {LoreGraph} graph
 */
function saveGraph(graph) {
  graph.lastUpdated = new Date().toISOString();
  fs.writeJsonSync(GRAPH_PATH(), graph, { spaces: 2 });
}

/**
 * For a given filepath, return graph-context entry IDs weighted by relationship.
 * @param {string} filepath  Normalized relative path
 * @param {LoreGraph} graph
 * @param {LoreIndex} index
 * @returns {{ imports: Array<{file: string, entryIds: string[]}>, importedBy: Array<{file: string, entryIds: string[]}> }}
 */
function getGraphContext(filepath, graph, index) {
  const normalized = filepath.replace(/^\.\//, '');
  /** @type {{ imports: Array<{file: string, entryIds: string[]}>, importedBy: Array<{file: string, entryIds: string[]}> }} */
  const result = { imports: [], importedBy: [] };

  for (const dep of graph.imports[normalized] || []) {
    const entryIds = index.files[dep] || [];
    if (entryIds.length > 0) result.imports.push({ file: dep, entryIds });
  }
  for (const dep of graph.importedBy[normalized] || []) {
    const entryIds = index.files[dep] || [];
    if (entryIds.length > 0) result.importedBy.push({ file: dep, entryIds });
  }

  return result;
}

module.exports = { loadGraph, saveGraph, emptyGraph, getGraphContext };

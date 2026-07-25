'use strict';

const fs = require('fs-extra');

jest.mock('fs-extra');
jest.mock('../src/lib/index', () => ({ LORE_DIR: '.lore' }));

const { loadGraph, saveGraph, emptyGraph, getGraphContext } = require('../src/lib/graph');

describe('loadGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns an empty graph when graph.json does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    const graph = loadGraph();
    expect(graph.imports).toEqual({});
    expect(graph.importedBy).toEqual({});
  });

  it('returns an empty graph when graph.json is malformed', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readJsonSync.mockImplementation(() => {
      throw new Error('bad json');
    });
    const graph = loadGraph();
    expect(graph.imports).toEqual({});
  });

  it('loads a stored graph as-is', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readJsonSync.mockReturnValue({
      imports: { 'a.js': ['b.js'] },
      importedBy: {},
      lastUpdated: 'x',
    });
    const graph = loadGraph();
    expect(graph.imports).toEqual({ 'a.js': ['b.js'] });
  });
});

describe('saveGraph', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('stamps a fresh lastUpdated timestamp and writes to disk', () => {
    const graph = emptyGraph();
    graph.lastUpdated = 'stale-timestamp';

    saveGraph(graph);

    expect(graph.lastUpdated).not.toBe('stale-timestamp');
    expect(fs.writeJsonSync).toHaveBeenCalledWith(expect.stringContaining('graph.json'), graph, {
      spaces: 2,
    });
  });
});

describe('getGraphContext', () => {
  const graph = {
    imports: { 'src/auth.js': ['src/db.js', 'src/unlinked.js'] },
    importedBy: { 'src/auth.js': ['src/routes.js'] },
  };
  const index = {
    files: {
      'src/db.js': ['decision-1'],
      'src/routes.js': ['gotcha-1', 'gotcha-2'],
      // 'src/unlinked.js' intentionally has no linked entries
    },
  };

  it('only includes imports/importers that have linked entries', () => {
    const context = getGraphContext('src/auth.js', graph, index);
    expect(context.imports).toEqual([{ file: 'src/db.js', entryIds: ['decision-1'] }]);
    expect(context.importedBy).toEqual([
      { file: 'src/routes.js', entryIds: ['gotcha-1', 'gotcha-2'] },
    ]);
  });

  it('normalizes a leading ./ on the queried filepath', () => {
    const context = getGraphContext('./src/auth.js', graph, index);
    expect(context.imports).toHaveLength(1);
  });

  it('returns empty arrays for a file with no graph entries', () => {
    const context = getGraphContext('src/nowhere.js', graph, index);
    expect(context).toEqual({ imports: [], importedBy: [] });
  });
});

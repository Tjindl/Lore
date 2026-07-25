'use strict';

const { LORE_DIR } = require('../src/lib/index');

jest.mock('../src/lib/index', () => ({
  readIndex: jest.fn(),
  LORE_DIR: '.lore',
}));
jest.mock('../src/lib/config', () => ({
  readConfig: jest.fn(),
}));
jest.mock('../src/lib/stale', () => ({
  checkStaleness: jest.fn(),
}));
jest.mock('../src/lib/sessions', () => ({
  getDaysSinceLastSession: jest.fn(),
  updateLastSession: jest.fn(),
}));
jest.mock('../src/lib/drafts', () => ({
  getDraftCount: jest.fn(),
}));
jest.mock('../src/lib/scorer', () => ({
  loadHistory: jest.fn(),
}));
jest.mock('../src/lib/entries', () => ({
  readEntry: jest.fn(),
}));

const { readIndex } = require('../src/lib/index');
const { readEntry } = require('../src/lib/entries');
const { readConfig } = require('../src/lib/config');
const { checkStaleness } = require('../src/lib/stale');
const { getDaysSinceLastSession } = require('../src/lib/sessions');
const { loadHistory } = require('../src/lib/scorer');
const { getDraftCount } = require('../src/lib/drafts');
const { handler } = require('../src/mcp/tools/overview');

describe('MCP Overview logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should properly fallback to id-based timestamps, and sort descending', async () => {
    readConfig.mockReturnValue({ project: 'Lore-Test' });
    getDaysSinceLastSession.mockReturnValue(0);
    loadHistory.mockReturnValue([{ score: 100 }]);
    getDraftCount.mockReturnValue(0);
    checkStaleness.mockReturnValue([]);

    readIndex.mockReturnValue({
      entries: {
        1: 'lore_path/1', // ID timestamp parsing
        2: 'lore_path/2', // Valid date
        3: 'lore_path/3', // Bad date and ID, falls to 0
      },
    });

    readEntry.mockImplementation((path) => {
      if (path === 'lore_path/1') {
        return {
          id: 'decision-foo-1710000000', // Newer
          type: 'decision',
          title: 'Newer Decision',
        };
      } else if (path === 'lore_path/2') {
        return {
          id: 'decision-bar-12345',
          date: '2020-01-01T00:00:00Z', // Older
          type: 'decision',
          title: 'Older Decision',
        };
      } else {
        return {
          id: 'decision-broken-abc',
          type: 'decision',
          title: 'Broken Timestamp Decision',
        };
      }
    });

    const result = await handler({ include_stale: false });
    expect(result.content[0].text).toContain('Lore Overview — Lore-Test');

    const lines = result.content[0].text.split('\n');

    let newerIndex = -1;
    let olderIndex = -1;
    let brokenIndex = -1;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].includes('Newer Decision')) newerIndex = i;
      if (lines[i].includes('Older Decision')) olderIndex = i;
      if (lines[i].includes('Broken Timestamp Decision')) brokenIndex = i;
    }

    // Must be parsed and sorted properly
    expect(newerIndex).toBeLessThan(olderIndex);
    expect(olderIndex).toBeLessThan(brokenIndex);
  });
});

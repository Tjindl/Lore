'use strict';

const { execSync } = require('child_process');
const fs = require('fs-extra');

jest.mock('child_process', () => ({ execSync: jest.fn() }));
jest.mock('fs-extra');
jest.mock('../src/lib/index', () => ({
  readIndex: jest.fn(),
  LORE_DIR: '.lore',
}));
jest.mock('../src/lib/entries', () => ({
  readEntry: jest.fn(),
}));
jest.mock('../src/lib/stale', () => ({
  checkStaleness: jest.fn(),
}));
jest.mock('../src/lib/config', () => ({
  readConfig: jest.fn(),
}));

const { readIndex } = require('../src/lib/index');
const { readEntry } = require('../src/lib/entries');
const { checkStaleness } = require('../src/lib/stale');
const { readConfig } = require('../src/lib/config');
const { computeScore, saveScore, loadHistory } = require('../src/lib/scorer');

describe('computeScore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    readConfig.mockReturnValue({
      scoringWeights: { coverage: 0.4, freshness: 0.35, depth: 0.25 },
    });
    checkStaleness.mockReturnValue([]);
  });

  it('gives full coverage credit when every active module has a linked entry', () => {
    // 6 commits touching src/ crosses the >5 "active module" threshold.
    execSync.mockReturnValue(new Array(6).fill('src/auth.js').join('\n'));
    readIndex.mockReturnValue({ entries: { 1: 'path/1' } });
    readEntry.mockReturnValue({
      type: 'decision',
      files: ['src/auth.js'],
      date: new Date().toISOString(),
    });

    const result = computeScore();

    expect(result.activeModules).toBe(1);
    expect(result.coveredModules).toBe(1);
    expect(result.coverage).toBe(100);
    expect(result.topUnlogged).toEqual([]);
  });

  it('flags active modules with no linked entries as topUnlogged, ranked by commit count', () => {
    const lines = [...new Array(6).fill('src/a.js'), ...new Array(10).fill('src/b.js')];
    execSync.mockReturnValue(lines.join('\n'));
    readIndex.mockReturnValue({ entries: {} });

    const result = computeScore();

    expect(result.coverage).toBe(0);
    expect(result.topUnlogged[0]).toEqual({ module: 'src', commits: 16 });
  });

  it('treats an empty git history as neutral (50), not 0', () => {
    execSync.mockReturnValue('');
    readIndex.mockReturnValue({ entries: {} });

    const result = computeScore();

    expect(result.activeModules).toBe(0);
    expect(result.coverage).toBe(50);
  });

  it('falls back to no active modules when git log fails (not a git repo)', () => {
    execSync.mockImplementation(() => {
      throw new Error('fatal: not a git repository');
    });
    readIndex.mockReturnValue({ entries: {} });

    const result = computeScore();

    expect(result.activeModules).toBe(0);
    expect(result.coverage).toBe(50);
  });

  it('deducts freshness for stale linked files', () => {
    execSync.mockReturnValue('');
    readIndex.mockReturnValue({ entries: { 1: 'path/1' } });
    readEntry.mockReturnValue({
      type: 'decision',
      files: ['src/auth.js'],
      date: new Date().toISOString(),
    });
    checkStaleness.mockReturnValue([{ daysAgo: 20 }]);

    const result = computeScore();

    expect(result.freshness).toBeLessThan(100);
  });

  it('weights invariants and gotchas 1.5x for depth relative to decisions/graveyard', () => {
    execSync.mockReturnValue('');
    readIndex.mockReturnValue({ entries: { 1: 'path/1' } });
    readEntry.mockReturnValue({ type: 'invariant', files: [] });

    const result = computeScore();

    // 1 invariant * 1.5 / maxReasonable(20) * 100 = 7.5 -> rounds to 8
    expect(result.depth).toBe(8);
  });
});

describe('saveScore / loadHistory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("replaces today's existing history entry instead of duplicating it", () => {
    const today = new Date().toISOString().split('T')[0];
    fs.existsSync.mockReturnValue(true);
    fs.readJsonSync.mockReturnValue({ history: [{ date: today, score: 1 }] });

    const history = saveScore({ score: 99, coverage: 1, freshness: 1, depth: 1 });

    expect(history).toHaveLength(1);
    expect(history[0]).toMatchObject({ date: today, score: 99 });
    expect(fs.writeJsonSync).toHaveBeenCalled();
  });

  it('starts a fresh history when score.json does not exist yet', () => {
    fs.existsSync.mockReturnValue(false);

    const history = saveScore({ score: 50, coverage: 50, freshness: 50, depth: 50 });

    expect(history).toHaveLength(1);
  });

  it('loadHistory returns [] when score.json does not exist', () => {
    fs.existsSync.mockReturnValue(false);
    expect(loadHistory()).toEqual([]);
  });

  it('loadHistory returns [] when score.json is malformed', () => {
    fs.existsSync.mockReturnValue(true);
    fs.readJsonSync.mockImplementation(() => {
      throw new Error('bad json');
    });
    expect(loadHistory()).toEqual([]);
  });
});

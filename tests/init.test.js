'use strict';

const fs = require('fs-extra');
const init = require('../src/commands/init');
const { LORE_DIR } = require('../src/lib/index');
const path = require('path');

jest.mock('fs-extra');
jest.mock('chalk', () => ({
  green: jest.fn(),
  cyan: jest.fn(),
  red: jest.fn(),
  dim: jest.fn(),
}));
jest.mock('glob', () => ({ globSync: jest.fn() }));

jest.mock('../src/lib/index', () => ({
  emptyIndex: jest.fn(),
  readIndex: jest.fn(),
  LORE_DIR: '.lore',
}));

// Mock process.exit
const originalProcessExit = process.exit;
const processExitMock = jest.fn();
beforeAll(() => {
  process.exit = processExitMock;
});
afterAll(() => {
  process.exit = originalProcessExit;
});

describe('Init Command', () => {
  let consoleLogMock;
  let consoleErrorMock;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogMock.mockRestore();
    consoleErrorMock.mockRestore();
  });

  it('should generate a safe hook content for git post-commit', async () => {
    fs.existsSync.mockImplementation((filepath) => {
      if (filepath.endsWith('post-commit')) return true; // Pretend it exists
      if (filepath === path.join('.git', 'hooks')) return true;
      return false;
    });

    fs.readFile.mockResolvedValue('# existing hook');
    require('../src/lib/index').readIndex.mockReturnValue({ entries: {} });
    require('glob').globSync.mockReturnValue([]);

    await init();

    // One of the appendFile or writeFile calls should contain the new safe tty check string
    const hookCheckCalls = fs.appendFile.mock.calls
      .concat(fs.writeFile.mock.calls)
      .filter((call) => call[1] && typeof call[1] === 'string' && call[1].includes('lore log'));

    expect(hookCheckCalls.length).toBeGreaterThan(0);

    const hookContent = hookCheckCalls[0][1];

    // Assert our safety checks are present
    expect(hookContent).toContain('if [ -t 0 ] && [ -t 1 ] && [ -c /dev/tty ]; then');
    expect(hookContent).toContain('</dev/tty');
  });
});

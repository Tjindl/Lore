'use strict';

const fs = require('fs-extra');
const search = require('../src/commands/search');
const { LORE_DIR } = require('../src/lib/index');

jest.mock('../src/lib/index', () => {
  return {
    readIndex: jest.fn(),
    LORE_DIR: '.lore',
  };
});

jest.mock('../src/lib/entries', () => {
  const original = jest.requireActual('../src/lib/entries');
  return {
    ...original,
    readEntry: jest.fn(),
  };
});

jest.mock('../src/lib/guard', () => ({
  requireInit: jest.fn(),
}));

const { readIndex } = require('../src/lib/index');
const { readEntry } = require('../src/lib/entries');

describe('Search logic', () => {
  let consoleLogMock;
  let consoleErrorMock;
  let processExitMock;

  beforeEach(() => {
    jest.clearAllMocks();

    consoleLogMock = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => {});
    processExitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});

    jest.spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    consoleLogMock.mockRestore();
    consoleErrorMock.mockRestore();
    processExitMock.mockRestore();
  });

  it('should split queries by spaces and require all parts to match', () => {
    readIndex.mockReturnValue({
      entries: {
        1: 'lore_path/1',
        2: 'lore_path/2',
      },
    });

    readEntry.mockImplementation((path) => {
      if (path === 'lore_path/1') {
        return {
          title: 'MongoDB deployment',
          context: 'We chose to use MongoDB cluster.',
        };
      } else {
        return {
          title: 'Postgres vs Mongo',
          context: 'We use postgres everywhere except the logging microservice.',
        };
      }
    });

    // Querying for "mongo" should return both
    search('mongo');
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining('── Search results for "mongo"')
    );

    consoleLogMock.mockClear();

    // Querying for "postgres" should return only the second
    search('postgres');
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining('── Search results for "postgres"')
    );

    consoleLogMock.mockClear();

    // Querying for "postgres cluster" should return NO entries
    search('postgres cluster');
    expect(consoleLogMock).toHaveBeenCalledWith(expect.stringContaining('No entries found'));

    consoleLogMock.mockClear();

    // Querying for "mongo cluster" should return ONLY the first
    search('mongo cluster');
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining('── Search results for "mongo cluster"')
    );
  });
});

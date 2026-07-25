'use strict';

const fs = require('fs-extra');
const { checkStaleness } = require('../src/lib/stale');

jest.mock('fs-extra');

describe('Staleness Logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkStaleness', () => {
    it('should not flag a file modified on the same day (ISO date)', () => {
      // Entry made exactly at midnight GMT on Jan 1
      const entry = {
        date: '2026-01-01T00:00:00.000Z',
        files: ['src/index.js'],
      };

      // File modified 10 hours later the same day
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({
        mtime: new Date('2026-01-01T10:00:00.000Z'),
      });

      const stales = checkStaleness(entry);
      // Because we add 24 hours to ISO dates, this shouldn't be stale immediately
      expect(stales.length).toBe(0);
    });

    it('should not flag a file modified on the same day (YYYY-MM-DD date)', () => {
      // Entry made on Jan 1
      const entry = {
        date: '2026-01-01',
        files: ['src/index.js'], // Modified at midnight GMT + 24 hours - 1ms
      };

      // File modified 10 hours later the same day
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({
        mtime: new Date('2026-01-01T10:00:00.000Z'),
      });

      const stales = checkStaleness(entry);
      expect(stales.length).toBe(0);
    });

    it('should flag a file modified way after the grace period', () => {
      const entry = {
        date: '2026-01-01T00:00:00.000Z',
        files: ['src/index.js'],
      };

      // File modified 3 days later
      fs.existsSync.mockReturnValue(true);
      fs.statSync.mockReturnValue({
        mtime: new Date('2026-01-04T10:00:00.000Z'),
      });

      const stales = checkStaleness(entry);
      expect(stales.length).toBe(1);
      expect(stales[0].filepath).toBe('src/index.js');
      expect(stales[0].isStale).toBe(true);
    });
  });
});

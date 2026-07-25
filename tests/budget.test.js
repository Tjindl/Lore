'use strict';

const { estimateTokens, formatEntry, enforceBudget } = require('../src/lib/budget');

describe('estimateTokens', () => {
  it('estimates ~4 chars per token, rounding up', () => {
    expect(estimateTokens('')).toBe(0);
    expect(estimateTokens('abcd')).toBe(1);
    expect(estimateTokens('abcdefgh')).toBe(2);
    expect(estimateTokens('abcde')).toBe(2);
  });

  it('treats falsy input as empty', () => {
    expect(estimateTokens(null)).toBe(0);
    expect(estimateTokens(undefined)).toBe(0);
  });
});

describe('formatEntry', () => {
  const baseEntry = { id: 'decision-foo-123', type: 'decision', title: 'Use Postgres' };

  it('renders the type and title as an uppercase header, plus the id', () => {
    const text = formatEntry(baseEntry);
    expect(text).toContain('## [DECISION] Use Postgres');
    expect(text).toContain('ID: decision-foo-123');
  });

  it('omits optional sections that are absent', () => {
    const text = formatEntry(baseEntry);
    expect(text).not.toContain('Files:');
    expect(text).not.toContain('Tags:');
    expect(text).not.toContain('Alternatives considered:');
    expect(text).not.toContain('Tradeoffs:');
  });

  it('includes files, tags, context, alternatives, and tradeoffs when present', () => {
    const text = formatEntry({
      ...baseEntry,
      files: ['src/db.js'],
      tags: ['db', 'postgres'],
      context: 'We need relational integrity.',
      alternatives: ['MongoDB', 'DynamoDB'],
      tradeoffs: 'More ops overhead, stronger consistency.',
    });
    expect(text).toContain('Files: src/db.js');
    expect(text).toContain('Tags: db, postgres');
    expect(text).toContain('We need relational integrity.');
    expect(text).toContain('Alternatives considered: MongoDB, DynamoDB');
    expect(text).toContain('Tradeoffs: More ops overhead, stronger consistency.');
  });

  it('does not crash on an entry missing a context property', () => {
    expect(() => formatEntry(baseEntry)).not.toThrow();
  });
});

describe('enforceBudget', () => {
  function entry(id) {
    return { id, type: 'decision', title: id, context: 'x'.repeat(40) };
  }

  it('returns an empty string for no entries', () => {
    expect(enforceBudget([], 1000)).toBe('');
  });

  it('includes entries until the token budget is exhausted, dropping the rest', () => {
    const entries = [entry('a'), entry('b'), entry('c')];
    const costPerEntry = estimateTokens(formatEntry(entries[0]));
    const budget = costPerEntry * 2; // room for exactly two entries

    const result = enforceBudget(entries, budget);
    expect(result).toContain('[DECISION] a');
    expect(result).toContain('[DECISION] b');
    expect(result).not.toContain('[DECISION] c');
  });

  it('joins included entries with a separator', () => {
    const entries = [entry('a'), entry('b')];
    const result = enforceBudget(entries, 10000);
    expect(result).toContain('\n\n---\n\n');
  });

  it('never includes an entry that alone exceeds the budget', () => {
    const result = enforceBudget([entry('a')], 1);
    expect(result).toBe('');
  });
});

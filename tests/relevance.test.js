'use strict';

jest.mock('../src/lib/embeddings', () => ({
  getEmbedding: jest.fn(),
  cosineSimilarity: jest.fn(),
}));

const { getEmbedding, cosineSimilarity } = require('../src/lib/embeddings');
const { scoreEntry, rankEntries } = require('../src/lib/relevance');

describe('scoreEntry', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('scores a direct file match at full weight (1.0)', () => {
    const entry = { id: '1', files: ['src/auth/token.js'] };
    const score = scoreEntry(entry, { filepath: 'src/auth/token.js' });
    expect(score).toBe(1.0);
  });

  it('scores a same-directory (non-exact) match at parent-dir weight (0.7)', () => {
    const entry = { id: '1', files: ['src/auth/refresh.js'] };
    const score = scoreEntry(entry, { filepath: 'src/auth/token.js' });
    expect(score).toBeCloseTo(0.7);
  });

  it('does not stack a parent-dir bonus on top of an exact match', () => {
    const entry = { id: '1', files: ['src/auth/token.js', 'src/auth/refresh.js'] };
    const score = scoreEntry(entry, { filepath: 'src/auth/token.js' });
    expect(score).toBe(1.0);
  });

  it('scores an unrelated file at 0', () => {
    const entry = { id: '1', files: ['lib/other.js'] };
    const score = scoreEntry(entry, { filepath: 'src/auth/token.js' });
    expect(score).toBe(0);
  });

  it('adds weighted semantic similarity when an embedding is stored for the entry', () => {
    getEmbedding.mockReturnValue([1, 0]);
    cosineSimilarity.mockReturnValue(0.8);
    const entry = { id: '1', files: [] };
    const score = scoreEntry(entry, { queryEmbedding: [1, 0] });
    expect(score).toBeCloseTo(0.8 * 0.5);
  });

  it('ignores semantic similarity when the entry has no stored embedding', () => {
    getEmbedding.mockReturnValue(null);
    const entry = { id: '1', files: [] };
    const score = scoreEntry(entry, { queryEmbedding: [1, 0] });
    expect(score).toBe(0);
    expect(cosineSimilarity).not.toHaveBeenCalled();
  });

  it('adds a weighted score for tag overlap', () => {
    const entry = { id: '1', files: [], tags: ['auth', 'security'] };
    const score = scoreEntry(entry, { tags: ['auth'] });
    // overlap = 1 match / max(querySize=1, entrySize=2) = 0.5
    expect(score).toBeCloseTo(0.5 * 0.3);
  });

  it('combines multiple signals additively', () => {
    getEmbedding.mockReturnValue([1, 0]);
    cosineSimilarity.mockReturnValue(1);
    const entry = { id: '1', files: ['src/auth/token.js'], tags: ['auth'] };
    const score = scoreEntry(entry, {
      filepath: 'src/auth/token.js',
      queryEmbedding: [1, 0],
      tags: ['auth'],
    });
    expect(score).toBeCloseTo(1.0 + 0.5 + 0.3);
  });
});

describe('rankEntries', () => {
  it('drops zero-score entries and sorts the rest by score descending', () => {
    const entries = [
      { id: 'unrelated', files: ['lib/other.js'] },
      { id: 'exact', files: ['src/auth/token.js'] },
      { id: 'sibling', files: ['src/auth/refresh.js'] },
    ];

    const ranked = rankEntries(entries, { filepath: 'src/auth/token.js' });

    expect(ranked.map((e) => e.id)).toEqual(['exact', 'sibling']);
    expect(ranked[0]._score).toBeCloseTo(1.0);
    expect(ranked[1]._score).toBeCloseTo(0.7);
  });

  it('preserves the original entry fields alongside the attached _score', () => {
    const entries = [{ id: 'a', title: 'Some decision', files: ['src/auth/token.js'] }];
    const [ranked] = rankEntries(entries, { filepath: 'src/auth/token.js' });
    expect(ranked.title).toBe('Some decision');
    expect(ranked._score).toBe(1.0);
  });

  it('returns an empty array when nothing scores above 0', () => {
    const entries = [{ id: 'a', files: ['lib/other.js'] }];
    expect(rankEntries(entries, { filepath: 'src/auth/token.js' })).toEqual([]);
  });
});

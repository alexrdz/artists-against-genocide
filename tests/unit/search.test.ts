import { describe, it, expect } from 'vitest';
import { searchArtists, computeFacets } from '../../src/lib/search';
import type { CanonicalArtist } from '../../src/lib/schemas';

// Test fixtures — synthetic data that covers edge cases
function makeArtist(overrides: Partial<CanonicalArtist> & { id: string; name: string }): CanonicalArtist {
  const now = new Date().toISOString();
  return {
    slug: overrides.name.toLowerCase().replace(/\s+/g, '-'),
    sortKey: overrides.name.toLowerCase(),
    tier: 'G-C',
    evidence: [{
      id: `e-${overrides.id}`,
      category: 'G-C',
      summary: 'Test evidence',
      sourceUrl: 'https://example.com',
      sourceLabel: 'Test Source',
      campaignIds: ['nmg'],
    }],
    campaignIds: ['nmg'],
    status: 'published',
    reviewedAt: now,
    reviewedBy: 'test',
    reviewNotes: null,
    importedAt: now,
    updatedAt: now,
    ...overrides,
  } as CanonicalArtist;
}

const testArtists: CanonicalArtist[] = [
  makeArtist({ id: 'a1', name: 'Brian Eno', tier: 'G-C', campaignIds: ['nmg', 'mfp'], evidence: [
    { id: 'e1', category: 'G-C', summary: 'Signed the 2023 letter', sourceUrl: 'https://musiciansforpalestine.net', sourceLabel: 'MfP', campaignIds: ['mfp'] },
    { id: 'e2', category: 'G-C', summary: 'Listed in NMG boycott', sourceUrl: 'https://nomusicforgenocide.org/page-3-full-list', sourceLabel: 'NMG', campaignIds: ['nmg'] },
    { id: 'e3', category: 'S', summary: 'Named on Artists4Ceasefire', sourceUrl: 'https://artists4ceasefire.org', sourceLabel: 'A4C', campaignIds: ['a4c'] },
  ]}),
  makeArtist({ id: 'a2', name: 'Dua Lipa', tier: 'G-D', campaignIds: ['other'], evidence: [
    { id: 'e4', category: 'G-D', summary: 'Instagram post about genocide', sourceUrl: 'https://theguardian.com', sourceLabel: 'Guardian', campaignIds: ['other'] },
  ]}),
  makeArtist({ id: 'a3', name: 'Kneecap', tier: 'G-D', campaignIds: ['euro'], evidence: [
    { id: 'e5', category: 'G-D', summary: 'Eurovision boycott statement', sourceUrl: 'https://nomusicforgenocide.org/eurovision', sourceLabel: 'NMG Eurovision', campaignIds: ['euro'] },
  ]}),
  makeArtist({ id: 'a4', name: 'AURORA', tier: 'S', campaignIds: ['a4c'], evidence: [
    { id: 'e6', category: 'S', summary: 'Artists4Ceasefire supporter', sourceUrl: 'https://artists4ceasefire.org', sourceLabel: 'A4C', campaignIds: ['a4c'] },
  ]}),
  makeArtist({ id: 'a5', name: 'DJ Draft', tier: 'G-C', campaignIds: ['nmg'], status: 'draft', evidence: [
    { id: 'e7', category: 'G-C', summary: 'Draft entry', sourceUrl: 'https://nomusicforgenocide.org/page-3-full-list', sourceLabel: 'NMG', campaignIds: ['nmg'] },
  ]}),
];

describe('searchArtists', () => {
  it('returns all published artists with empty query and no filters', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: [], categories: [] });
    expect(result.total).toBe(4); // 4 published, 1 draft
  });

  it('never returns draft artists by default', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: [], categories: [] });
    for (const r of result.results) {
      expect(r.artist.status).toBe('published');
    }
  });

  it('returns drafts when status is "all"', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: [], categories: [], status: 'all' });
    expect(result.total).toBe(5);
  });

  it('finds artists by exact name', () => {
    const result = searchArtists(testArtists, { query: 'Brian Eno', campaigns: [], categories: [] });
    expect(result.total).toBe(1);
    expect(result.results[0].artist.name).toBe('Brian Eno');
  });

  it('finds artists by partial name', () => {
    const result = searchArtists(testArtists, { query: 'brian', campaigns: [], categories: [] });
    expect(result.total).toBe(1);
    expect(result.results[0].artist.name).toBe('Brian Eno');
  });

  it('search is case-insensitive', () => {
    const result = searchArtists(testArtists, { query: 'DUA LIPA', campaigns: [], categories: [] });
    expect(result.total).toBe(1);
  });

  it('returns no results for non-matching query', () => {
    const result = searchArtists(testArtists, { query: 'xyzqwerty', campaigns: [], categories: [] });
    expect(result.total).toBe(0);
  });

  it('filters by single campaign', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: ['nmg'], categories: [] });
    expect(result.total).toBe(1);
    expect(result.results[0].artist.name).toBe('Brian Eno');
  });

  it('filters by multiple campaigns with AND semantics', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: ['nmg', 'mfp'], categories: [] });
    expect(result.total).toBe(1);
    expect(result.results[0].artist.name).toBe('Brian Eno');
  });

  it('filters by evidence category with AND semantics', () => {
    // Brian Eno has both G-C and S evidence
    const result = searchArtists(testArtists, { query: '', campaigns: [], categories: ['G-C', 'S'] });
    expect(result.total).toBe(1);
    expect(result.results[0].artist.name).toBe('Brian Eno');
  });

  it('filters by single evidence category', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: [], categories: ['G-D'] });
    expect(result.total).toBe(2); // Dua Lipa and Kneecap
  });

  it('combines query and campaign filter', () => {
    const result = searchArtists(testArtists, { query: 'kneecap', campaigns: ['euro'], categories: [] });
    expect(result.total).toBe(1);
  });

  it('combines campaign and category filter', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: ['euro'], categories: ['G-D'] });
    expect(result.total).toBe(1);
    expect(result.results[0].artist.name).toBe('Kneecap');
  });

  it('paginates results', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: [], categories: [] }, 1, 2);
    expect(result.results).toHaveLength(2);
    expect(result.total).toBe(4);
    expect(result.totalPages).toBe(2);
    expect(result.page).toBe(1);
  });

  it('handles page beyond range', () => {
    const result = searchArtists(testArtists, { query: '', campaigns: [], categories: [] }, 99, 10);
    expect(result.page).toBe(1);
  });
});

describe('computeFacets', () => {
  it('computes campaign facet counts', () => {
    const facets = computeFacets(testArtists, { query: '', campaigns: [], categories: [] });
    expect(facets.campaigns['nmg']).toBe(1);
    expect(facets.campaigns['euro']).toBe(1);
    expect(facets.campaigns['a4c']).toBe(1);
    expect(facets.campaigns['mfp']).toBe(1);
  });

  it('computes category facet counts', () => {
    const facets = computeFacets(testArtists, { query: '', campaigns: [], categories: [] });
    expect(facets.categories['G-D']).toBe(2); // Dua Lipa, Kneecap
    expect(facets.categories['G-C']).toBe(1); // Brian Eno (published, has G-C evidence)
    expect(facets.categories['S']).toBe(2);   // Brian Eno (has S evidence), AURORA
  });

  it('facet counts respect query filter', () => {
    const facets = computeFacets(testArtists, { query: 'brian', campaigns: [], categories: [] });
    expect(facets.campaigns['nmg']).toBe(1);
    expect(facets.campaigns['euro']).toBe(0);
  });
});

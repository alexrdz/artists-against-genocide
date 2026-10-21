import { describe, it, expect } from 'vitest';
import { buildPublicExport } from '../../src/lib/public-export';
import type { CanonicalArtist, Campaign } from '../../src/lib/schemas';

function makeArtist(id: string, name: string, status: 'draft' | 'published' | 'withdrawn' = 'published'): CanonicalArtist {
  const now = new Date().toISOString();
  return {
    id,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    sortKey: name.toLowerCase(),
    tier: 'G-C',
    evidence: [{
      id: `e-${id}`,
      category: 'G-C',
      summary: 'Test evidence',
      sourceUrl: 'https://example.com',
      sourceLabel: 'Test Source',
      campaignIds: ['nmg'],
    }],
    campaignIds: ['nmg'],
    status,
    reviewedAt: status === 'published' ? now : null,
    reviewedBy: status === 'published' ? 'test' : null,
    reviewNotes: null,
    importedAt: now,
    updatedAt: now,
  };
}

const campaigns: Campaign[] = [
  { id: 'nmg', name: 'No Music for Genocide', slug: 'nmg', sourceUrl: 'https://nomusicforgenocide.org/', description: 'Test', registerId: 'nmg', artistCount: 0 },
  { id: 'mfp', name: 'Musicians for Palestine', slug: 'mfp', sourceUrl: 'https://musiciansforpalestine.net/', description: 'Test', registerId: 'mfp', artistCount: 0 },
];

describe('buildPublicExport — publication safeguards', () => {
  it('excludes draft artists from the export', () => {
    const artists = [
      makeArtist('a1', 'Published One', 'published'),
      makeArtist('a2', 'Draft One', 'draft'),
    ];
    const exportData = buildPublicExport(artists, campaigns, { 'G-C': 'Test' }, [], '2026-09-16');
    const names = exportData.artists.map(a => a.name);
    expect(names).toContain('Published One');
    expect(names).not.toContain('Draft One');
  });

  it('excludes withdrawn artists from the export', () => {
    const artists = [
      makeArtist('a1', 'Published One', 'published'),
      makeArtist('a2', 'Withdrawn One', 'withdrawn'),
    ];
    const exportData = buildPublicExport(artists, campaigns, { 'G-C': 'Test' }, [], '2026-09-16');
    const names = exportData.artists.map(a => a.name);
    expect(names).not.toContain('Withdrawn One');
  });

  it('only includes published artists in the search index', () => {
    const artists = [
      makeArtist('a1', 'Published One', 'published'),
      makeArtist('a2', 'Draft One', 'draft'),
      makeArtist('a3', 'Withdrawn One', 'withdrawn'),
    ];
    const exportData = buildPublicExport(artists, campaigns, { 'G-C': 'Test' }, [], '2026-09-16');
    expect(exportData.searchIndex).toHaveLength(1);
    expect(exportData.searchIndex[0].name).toBe('Published One');
  });

  it('all exported artists have status "published"', () => {
    const artists = [
      makeArtist('a1', 'Published One', 'published'),
      makeArtist('a2', 'Published Two', 'published'),
    ];
    const exportData = buildPublicExport(artists, campaigns, { 'G-C': 'Test' }, [], '2026-09-16');
    for (const artist of exportData.artists) {
      expect(artist.status).toBe('published');
    }
  });

  it('computes correct stats for published-only set', () => {
    const artists = [
      makeArtist('a1', 'Published One', 'published'),
      makeArtist('a2', 'Published Two', 'published'),
      makeArtist('a3', 'Draft One', 'draft'),
    ];
    const exportData = buildPublicExport(artists, campaigns, { 'G-C': 'Test' }, [], '2026-09-16');
    expect(exportData.stats.publishedArtists).toBe(2);
    expect(exportData.stats.totalArtists).toBe(2);
    expect(exportData.stats.totalEvidence).toBe(2);
  });

  it('preserves evidence source URLs in the export', () => {
    const artists = [makeArtist('a1', 'Published One', 'published')];
    const exportData = buildPublicExport(artists, campaigns, { 'G-C': 'Test' }, [], '2026-09-16');
    for (const artist of exportData.artists) {
      for (const ev of artist.evidence) {
        expect(ev.sourceUrl).toMatch(/^https?:\/\//);
        expect(ev.sourceLabel).toBeTruthy();
      }
    }
  });

  it('preserves category definitions and limitations', () => {
    const cats = { 'G-D': 'Direct', 'G-C': 'Collective', 'S': 'Solidarity', 'H': 'Historical' };
    const lims = ['Limitation 1', 'Limitation 2'];
    const exportData = buildPublicExport([makeArtist('a1', 'Test')], campaigns, cats, lims, '2026-09-16');
    expect(exportData.categoryDefinitions).toEqual(cats);
    expect(exportData.limitations).toEqual(lims);
  });

  it('preserves research snapshot date', () => {
    const exportData = buildPublicExport([makeArtist('a1', 'Test')], campaigns, {}, [], '2026-09-16');
    expect(exportData.researchSnapshotDate).toBe('2026-09-16');
  });

  it('passes Zod validation', () => {
    const exportData = buildPublicExport([makeArtist('a1', 'Test')], campaigns, { 'G-C': 'Test' }, [], '2026-09-16');
    // The buildPublicExport function calls publicExportSchema.parse internally
    // so if it returns without throwing, validation passed
    expect(exportData).toBeDefined();
  });
});

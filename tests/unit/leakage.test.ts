import { describe, it, expect } from 'vitest';
import { importResearchData } from '../../src/lib/importer';
import { buildPublicExport } from '../../src/lib/public-export';
import rawData from '../../src/data/palestine-directory-research-data.json';

describe('publication safeguard — end-to-end leakage tests', () => {
  const importResult = importResearchData(rawData);

  it('no draft artists appear in the public export', () => {
    const exportData = buildPublicExport(
      importResult.artists,
      importResult.campaigns,
      { 'G-D': 'Direct anti-genocide statement', 'G-C': 'Collective anti-genocide statement or boycott', 'S': 'Broader solidarity or ceasefire advocacy', 'H': 'Historical-only solidarity in the evidence collected' },
      [],
      '2026-09-16',
    );
    for (const artist of exportData.artists) {
      expect(artist.status).toBe('published');
    }
  });

  it('no unreviewed artists appear in the public export', () => {
    // All imported artists are draft + unreviewed, so export should be empty
    const exportData = buildPublicExport(
      importResult.artists,
      importResult.campaigns,
      { 'G-D': 'Direct anti-genocide statement', 'G-C': 'Collective anti-genocide statement or boycott', 'S': 'Broader solidarity or ceasefire advocacy', 'H': 'Historical-only solidarity in the evidence collected' },
      [],
      '2026-09-16',
    );
    expect(exportData.artists).toHaveLength(0);
    expect(exportData.searchIndex).toHaveLength(0);
  });

  it('raw register entries (8,932) do not appear as artist profiles', () => {
    // The artist index has 919 entries — registers have 8,932
    // Only artist index entries become profiles
    expect(importResult.artists).toHaveLength(919);
    expect(importResult.artists.length).toBeLessThan(8932);
  });

  it('no evidence records have empty campaign IDs', () => {
    for (const artist of importResult.artists) {
      for (const ev of artist.evidence) {
        expect(ev.campaignIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('no evidence records have missing source URLs', () => {
    for (const artist of importResult.artists) {
      for (const ev of artist.evidence) {
        expect(ev.sourceUrl).toBeTruthy();
        expect(ev.sourceUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  it('no evidence records have missing source labels', () => {
    for (const artist of importResult.artists) {
      for (const ev of artist.evidence) {
        expect(ev.sourceLabel).toBeTruthy();
      }
    }
  });

  it('no artist has a missing or empty name', () => {
    for (const artist of importResult.artists) {
      expect(artist.name).toBeTruthy();
      expect(artist.name.length).toBeGreaterThan(0);
    }
  });

  it('no artist has a missing or empty slug', () => {
    for (const artist of importResult.artists) {
      expect(artist.slug).toBeTruthy();
      expect(artist.slug.length).toBeGreaterThan(0);
    }
  });

  it('importer does not invent review dates or reviewer names', () => {
    for (const artist of importResult.artists) {
      expect(artist.reviewedAt).toBeNull();
      expect(artist.reviewedBy).toBeNull();
    }
  });

  it('importer does not invent quotations — evidence summaries come from source data', () => {
    // Compare against raw data
    const rawParsed = rawData as { artistIndex: { name: string; evidence: [string, string, string, string][] }[] };
    const rawByName = new Map(rawParsed.artistIndex.map(a => [a.name, a.evidence]));

    for (const artist of importResult.artists) {
      const rawEvidence = rawByName.get(artist.name);
      expect(rawEvidence).toBeDefined();
      if (!rawEvidence) continue;

      for (let i = 0; i < artist.evidence.length; i++) {
        const ev = artist.evidence[i]!;
        const rawEv = rawEvidence[i]!;
        expect(ev.summary).toBe(rawEv[1]); // Summary must match source data exactly
        expect(ev.sourceUrl).toBe(rawEv[2]);
        expect(ev.sourceLabel).toBe(rawEv[3]);
      }
    }
  });

  it('manifest counts match actual data', () => {
    const raw = rawData as { manifest: { artistEntryCount: number; evidenceRecordCount: number; registerEntryCount: number } };
    expect(importResult.artists.length).toBe(raw.manifest.artistEntryCount);
    expect(importResult.stats.totalEvidence).toBe(raw.manifest.evidenceRecordCount);
  });
});

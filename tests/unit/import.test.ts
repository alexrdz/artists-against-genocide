import { describe, it, expect } from 'vitest';
import { researchDataSchema, evidenceTupleSchema, evidenceCategorySchema } from '../../src/lib/schemas';
import { importResearchData, parseResearchData } from '../../src/lib/importer';
import rawData from '../../src/data/palestine-directory-research-data.json';

describe('Zod schema validation', () => {
  it('validates the real research data without errors', () => {
    const result = researchDataSchema.safeParse(rawData);
    expect(result.success).toBe(true);
  });

  it('rejects an invalid evidence category', () => {
    const result = evidenceCategorySchema.safeParse('X');
    expect(result.success).toBe(false);
  });

  it('rejects an evidence tuple with a non-URL source', () => {
    const result = evidenceTupleSchema.safeParse(['G-C', 'summary', 'not-a-url', 'label']);
    expect(result.success).toBe(false);
  });

  it('rejects an artist entry with no evidence', () => {
    const badData = {
      ...rawData,
      artistIndex: [{ name: 'Test', evidence: [], tier: 'S' }],
    };
    const result = researchDataSchema.safeParse(badData);
    expect(result.success).toBe(false);
  });
});

describe('importResearchData', () => {
  const result = importResearchData(rawData);

  it('imports all 919 artists', () => {
    expect(result.artists).toHaveLength(919);
  });

  it('imports all 1043 evidence records', () => {
    expect(result.stats.totalEvidence).toBe(1043);
  });

  it('produces stable IDs for artists', () => {
    // Same name should always produce same ID
    const r2 = importResearchData(rawData);
    expect(result.artists[0].id).toBe(r2.artists[0].id);
    expect(result.artists[100].id).toBe(r2.artists[100].id);
  });

  it('produces unique slugs', () => {
    const slugs = result.artists.map(a => a.slug);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('all artists start as draft', () => {
    for (const artist of result.artists) {
      expect(artist.status).toBe('draft');
    }
  });

  it('all artists have null review state initially', () => {
    for (const artist of result.artists) {
      expect(artist.reviewedAt).toBeNull();
      expect(artist.reviewedBy).toBeNull();
      expect(artist.reviewNotes).toBeNull();
    }
  });

  it('preserves evidence source URLs', () => {
    for (const artist of result.artists) {
      for (const ev of artist.evidence) {
        expect(ev.sourceUrl).toMatch(/^https?:\/\//);
      }
    }
  });

  it('preserves evidence source labels', () => {
    for (const artist of result.artists) {
      for (const ev of artist.evidence) {
        expect(ev.sourceLabel).toBeTruthy();
      }
    }
  });

  it('maps evidence to campaign IDs', () => {
    for (const artist of result.artists) {
      for (const ev of artist.evidence) {
        expect(ev.campaignIds.length).toBeGreaterThan(0);
      }
    }
  });

  it('preserves the tier category for each artist', () => {
    for (const artist of result.artists) {
      expect(['G-D', 'G-C', 'S', 'H']).toContain(artist.tier);
    }
  });

  it('produces campaign metadata', () => {
    expect(result.campaigns.length).toBeGreaterThanOrEqual(4);
    for (const campaign of result.campaigns) {
      expect(campaign.name).toBeTruthy();
      expect(campaign.sourceUrl).toMatch(/^https?:\/\//);
    }
  });

  it('computes correct category distribution', () => {
    expect(result.stats.byCategory['G-D']).toBe(13);
    expect(result.stats.byCategory['G-C']).toBe(768);
    expect(result.stats.byCategory['S']).toBe(134);
    expect(result.stats.byCategory['H']).toBe(4);
  });
});

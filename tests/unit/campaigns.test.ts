import { describe, it, expect } from 'vitest';
import { urlToCampaigns, buildCampaignMetadata } from '../../src/lib/campaigns';
import type { CampaignStatementSource } from '../../src/lib/schemas';

describe('campaign mapping', () => {
  describe('urlToCampaigns', () => {
    it('maps No Music for Genocide roster URL to nmg', () => {
      expect(urlToCampaigns('https://nomusicforgenocide.org/page-3-full-list')).toContain('nmg');
    });

    it(' maps Musicians for Palestine URL to mfp', () => {
      expect(urlToCampaigns('https://musiciansforpalestine.net/2023-signatories/')).toContain('mfp');
    });

    it('maps Eurovision boycott URL to euro', () => {
      expect(urlToCampaigns('https://nomusicforgenocide.org/eurovision')).toContain('euro');
    });

    it('maps Artists4Ceasefire URL to a4c', () => {
      expect(urlToCampaigns('https://www.artists4ceasefire.org/')).toContain('a4c');
    });

    it('maps unknown URLs to other', () => {
      expect(urlToCampaigns('https://www.theguardian.com/music/article')).toEqual(['other']);
    });

    it('always returns at least one campaign ID', () => {
      expect(urlToCampaigns('https://random.example.com').length).toBeGreaterThan(0);
    });
  });

  describe('buildCampaignMetadata', () => {
    const sources: CampaignStatementSource[] = [
      { campaign: 'No Music for Genocide', url: 'https://nomusicforgenocide.org/' },
      { campaign: 'Musicians for Palestine (2023)', url: 'https://musiciansforpalestine.net/2023-letter/' },
    ];
    const registers = [
      { id: 'nmg', name: 'No Music for Genocide', sourceUrl: 'https://nomusicforgenocide.org/page-3-full-list', entries: ['a', 'b'] },
      { id: 'mfp', name: 'Musicians for Palestine (2023)', sourceUrl: 'https://musiciansforpalestine.net/2023-signatories/', entries: ['c', 'd'] },
    ];
    const campaignMap = new Map([
      ['nmg', 10],
      ['mfp', 5],
    ]);

    it('builds campaign list with correct IDs', () => {
      const campaigns = buildCampaignMetadata(sources, registers, campaignMap);
      const ids = campaigns.map(c => c.id);
      expect(ids).toContain('nmg');
      expect(ids).toContain('mfp');
    });

    it('includes source URLs', () => {
      const campaigns = buildCampaignMetadata(sources, registers, campaignMap);
      for (const c of campaigns) {
        expect(c.sourceUrl).toMatch(/^https?:\/\//);
      }
    });

    it('includes artist counts', () => {
      const campaigns = buildCampaignMetadata(sources, registers, campaignMap);
      const nmg = campaigns.find(c => c.id === 'nmg');
      expect(nmg?.artistCount).toBe(10);
    });

    it('links campaigns to register IDs', () => {
      const campaigns = buildCampaignMetadata(sources, registers, campaignMap);
      const nmg = campaigns.find(c => c.id === 'nmg');
      expect(nmg?.registerId).toBe('nmg');
    });
  });
});

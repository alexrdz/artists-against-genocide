import type { CampaignId } from './schemas';

/**
 * Maps a source URL to one or more campaign IDs.
 * This is the canonical mapping derived from the research data's
 * campaignStatementSources and the known URL patterns of each register.
 */
const URL_PATTERNS: ReadonlyArray<{ pattern: RegExp; campaign: CampaignId }> = [
  { pattern: /nomusicforgenocide\.org\/page-3/i, campaign: 'nmg' },
  { pattern: /nomusicforgenocide\.org\/eurovision/i, campaign: 'euro' },
  { pattern: /nomusicforgenocide\.org\/?$/i, campaign: 'nmg' },
  { pattern: /musiciansforpalestine\.net/i, campaign: 'mfp' },
  { pattern: /artists4ceasefire\.org/i, campaign: 'a4c' },
];

/**
 * Maps a source URL to campaign IDs. A URL can belong to multiple campaigns
 * (e.g., nomusicforgenocide.org appears for both NMG and Eurovision).
 */
export function urlToCampaigns(sourceUrl: string): CampaignId[] {
  const campaigns: CampaignId[] = [];
  for (const { pattern, campaign } of URL_PATTERNS) {
    if (pattern.test(sourceUrl) && !campaigns.includes(campaign)) {
      campaigns.push(campaign);
    }
  }
  // Additional URL-based heuristics for news sources that report on specific campaigns
  if (/eurovision/i.test(sourceUrl) && !campaigns.includes('euro')) {
    campaigns.push('euro');
  }
  return campaigns.length > 0 ? campaigns : ['other'];
}

/**
 * Build the canonical campaign list from the research data's
 * campaignStatementSources plus the register data.
 */
export function buildCampaignMetadata(
  _sources: { campaign: string; url: string }[],
  _registers: { id: string; name: string; sourceUrl: string; entries: string[] }[],
  artistCampaignMap: Map<CampaignId, number>,
): { id: CampaignId; name: string; slug: string; sourceUrl: string; description: string; registerId: string | null; artistCount: number }[] {
  const campaignMap: Record<string, { name: string; url: string; registerId: string | null }> = {
    nmg: { name: 'No Music for Genocide', url: 'https://nomusicforgenocide.org/', registerId: 'nmg' },
    mfp: { name: 'Musicians for Palestine (2023)', url: 'https://musiciansforpalestine.net/2023-letter/', registerId: 'mfp' },
    euro: { name: 'Eurovision boycott (2026)', url: 'https://nomusicforgenocide.org/eurovision', registerId: 'euro' },
    a4c: { name: 'Artists4Ceasefire', url: 'https://www.artists4ceasefire.org/', registerId: null },
  };

  const descriptions: Record<string, string> = {
    nmg: 'An artist boycott collective that published a roster of musicians boycotting the cycle of music industry complicity in the genocide of Palestinians.',
    mfp: 'An open letter published in late 2023, signed by thousands of musicians, describing Gaza as a "textbook case of genocide" and demanding a ceasefire.',
    euro: 'A campaign calling for the boycott of Eurovision 2026 over the participation of Israel, organized through No Music for Genocide.',
    a4c: 'A public supporter list of artists advocating for a ceasefire and Palestinian rights.',
  };

  return (Object.keys(campaignMap) as CampaignId[]).map(id => {
    const meta = campaignMap[id];
    if (!meta) throw new Error(`Unknown campaign id: ${id}`);
    return {
      id,
      name: meta.name,
      slug: id,
      sourceUrl: meta.url,
      description: descriptions[id] ?? meta.name,
      registerId: meta.registerId,
      artistCount: artistCampaignMap.get(id) ?? 0,
    };
  });
}

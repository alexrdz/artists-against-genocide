import { researchDataSchema, canonicalArtistSchema, campaignSchema } from './schemas';
import type { ResearchData, CanonicalArtist, CanonicalEvidence, CampaignId, Campaign, EvidenceCategory } from './schemas';
import { nameToId, nameToSlug, nameToSortKey, evidenceToId } from './slug';
import { urlToCampaigns, buildCampaignMetadata } from './campaigns';

/**
 * Result of an import operation.
 */
export interface ImportResult {
  artists: CanonicalArtist[];
  campaigns: Campaign[];
  stats: {
    totalArtists: number;
    totalEvidence: number;
    byCategory: Record<EvidenceCategory, number>;
    byCampaign: Record<string, number>;
    duplicateNames: string[];
  };
  warnings: string[];
}

/**
 * Parse and validate raw JSON against the research-data Zod schema.
 * Throws on invalid data — callers should catch and report.
 */
export function parseResearchData(raw: unknown): ResearchData {
  return researchDataSchema.parse(raw);
}

/**
 * Transform validated research data into canonical artist records.
 * This is a pure function — same input always produces same output.
 */
export function importResearchData(raw: unknown, now: Date = new Date()): ImportResult {
  const data = parseResearchData(raw);
  const warnings: string[] = [];
  const seenIds = new Set<string>();
  const duplicateNames: string[] = [];

  // Track campaign membership counts
  const campaignArtistCounts = new Map<CampaignId, number>();

  const artists: CanonicalArtist[] = data.artistIndex.map((entry, index) => {
    const id = nameToId(entry.name);
    const slug = nameToSlug(entry.name);

    if (seenIds.has(id)) {
      duplicateNames.push(entry.name);
      warnings.push(`Duplicate artist ID "${id}" for name "${entry.name}" (entry #${index + 1})`);
    }
    seenIds.add(id);

    const evidence: CanonicalEvidence[] = entry.evidence.map(tuple => {
      const [category, summary, sourceUrl, sourceLabel] = tuple;
      const campaignIds = urlToCampaigns(sourceUrl);

      // Track campaign membership
      for (const cid of campaignIds) {
        campaignArtistCounts.set(cid, (campaignArtistCounts.get(cid) ?? 0) + 1);
      }

      return {
        id: evidenceToId(id, category, summary, sourceUrl),
        category,
        summary,
        sourceUrl,
        sourceLabel,
        campaignIds,
      };
    });

    // Deduplicate campaign IDs at the artist level
    const artistCampaignIds = [...new Set(evidence.flatMap(e => e.campaignIds))];

    const timestamp = now.toISOString();

    return canonicalArtistSchema.parse({
      id,
      slug,
      name: entry.name,
      sortKey: nameToSortKey(entry.name),
      tier: entry.tier,
      evidence,
      campaignIds: artistCampaignIds,
      status: 'draft',
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      importedAt: timestamp,
      updatedAt: timestamp,
    });
  });

  // Build campaign metadata
  const campaigns = campaignSchema.array().parse(
    buildCampaignMetadata(data.campaignStatementSources, data.registers, campaignArtistCounts),
  );

  // Compute stats
  const byCategory: Record<EvidenceCategory, number> = { 'G-D': 0, 'G-C': 0, S: 0, H: 0 };
  const byCampaign: Record<string, number> = {};
  let totalEvidence = 0;

  for (const artist of artists) {
    byCategory[artist.tier]++;
    for (const ev of artist.evidence) {
      totalEvidence++;
      for (const cid of ev.campaignIds) {
        byCampaign[cid] = (byCampaign[cid] ?? 0) + 1;
      }
    }
  }

  return {
    artists,
    campaigns,
    stats: {
      totalArtists: artists.length,
      totalEvidence,
      byCategory,
      byCampaign,
      duplicateNames,
    },
    warnings,
  };
}

/**
 * Get the research snapshot date from validated data.
 */
export function getResearchSnapshotDate(raw: unknown): string {
  const data = parseResearchData(raw);
  return data.researchSnapshotDate;
}

/**
 * Get the category definitions from validated data.
 */
export function getCategoryDefinitions(raw: unknown): Record<string, string> {
  const data = parseResearchData(raw);
  return data.categoryDefinitions;
}

/**
 * Get the limitations from validated data.
 */
export function getLimitations(raw: unknown): string[] {
  const data = parseResearchData(raw);
  return data.limitations;
}

import { publicExportSchema } from './schemas';
import type { CanonicalArtist, Campaign, PublicExport } from './schemas';
import { writeFileSync, mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EXPORT_PATH = join(__dirname, '..', 'data', 'public-export.json');

/**
 * Build the public export from canonical artists and campaign metadata.
 * Only published artists are included — drafts and withdrawn never appear.
 */
export function buildPublicExport(
  allArtists: CanonicalArtist[],
  campaigns: Campaign[],
  categoryDefinitions: Record<string, string>,
  limitations: string[],
  researchSnapshotDate: string,
): PublicExport {
  const published = allArtists.filter(a => a.status === 'published');

  const searchIndex = published.map(artist => ({
    id: artist.id,
    slug: artist.slug,
    name: artist.name,
    sortKey: artist.sortKey,
    tier: artist.tier,
    campaignIds: artist.campaignIds,
    evidenceCategories: [...new Set(artist.evidence.map(e => e.category))],
    evidenceCount: artist.evidence.length,
  }));

  const byCategory: Record<string, number> = {};
  const byCampaign: Record<string, number> = {};
  let totalEvidence = 0;

  for (const artist of published) {
    byCategory[artist.tier] = (byCategory[artist.tier] ?? 0) + 1;
    for (const ev of artist.evidence) {
      totalEvidence++;
      for (const cid of ev.campaignIds) {
        byCampaign[cid] = (byCampaign[cid] ?? 0) + 1;
      }
    }
  }

  // Update campaign artist counts to reflect published only
  const publishedCampaigns = campaigns.map(c => ({
    ...c,
    artistCount: published.filter(a => a.campaignIds.includes(c.id)).length,
  }));

  const exportData: PublicExport = {
    generatedAt: new Date().toISOString(),
    researchSnapshotDate,
    categoryDefinitions,
    limitations,
    campaigns: publishedCampaigns,
    artists: published,
    searchIndex,
    stats: {
      totalArtists: published.length,
      publishedArtists: published.length,
      totalEvidence,
      byCategory,
      byCampaign,
    },
  };

  return publicExportSchema.parse(exportData);
}

/**
 * Write the public export to src/data/public-export.json.
 */
export function writePublicExport(data: PublicExport): string {
  mkdirSync(dirname(EXPORT_PATH), { recursive: true });
  writeFileSync(EXPORT_PATH, JSON.stringify(data, null, 2));
  return EXPORT_PATH;
}

/**
 * Read the public export from disk. Throws if it doesn't exist.
 */
export function readPublicExport(): PublicExport {
  if (!existsSync(EXPORT_PATH)) {
    throw new Error('Public export not found. Run "npm run build:data" first.');
  }
  return publicExportSchema.parse(
    JSON.parse(readFileSync(EXPORT_PATH, 'utf-8')),
  );
}

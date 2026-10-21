import { z } from 'zod';

// ── Evidence categories ──────────────────────────────────────────

export const evidenceCategorySchema = z.enum(['G-D', 'G-C', 'S', 'H']);
export type EvidenceCategory = z.infer<typeof evidenceCategorySchema>;

export const categoryDefinitionsSchema = z.record(
  z.string(),
  z.string(),
);

// ── Research-data import schemas (raw JSON from research file) ──

export const evidenceTupleSchema = z.tuple([
  evidenceCategorySchema,
  z.string().min(1),
  z.string().url(),
  z.string().min(1),
]);

export const campaignStatementSourceSchema = z.object({
  campaign: z.string().min(1),
  url: z.string().url(),
});

export const registerSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  sourceUrl: z.string().url(),
  entryCount: z.number().int().positive(),
  entries: z.array(z.string().min(1)),
});

export const rawArtistEntrySchema = z.object({
  name: z.string().min(1),
  evidence: z.array(evidenceTupleSchema).min(1),
  tier: evidenceCategorySchema,
});

export const researchDataSchema = z.object({
  formatVersion: z.string().min(1),
  title: z.string().min(1),
  researchSnapshotDate: z.string().min(1),
  packagedOn: z.string().min(1),
  reviewStatus: z.string().min(1),
  manifest: z.object({
    artistEntryCount: z.number().int().positive(),
    evidenceRecordCount: z.number().int().positive(),
    registerEntryCount: z.number().int().positive(),
  }),
  evidenceTupleFields: z.array(z.string()).length(4),
  categoryDefinitions: categoryDefinitionsSchema,
  limitations: z.array(z.string()),
  campaignStatementSources: z.array(campaignStatementSourceSchema),
  artistIndex: z.array(rawArtistEntrySchema),
  registers: z.array(registerSchema),
});

// ── Internal canonical schemas (what the directory uses) ────────

export const campaignIdSchema = z.enum(['nmg', 'mfp', 'euro', 'a4c', 'other']);
export type CampaignId = z.infer<typeof campaignIdSchema>;

export const publicationStatusSchema = z.enum(['draft', 'published', 'withdrawn']);
export type PublicationStatus = z.infer<typeof publicationStatusSchema>;

export const canonicalEvidenceSchema = z.object({
  id: z.string().min(1),
  category: evidenceCategorySchema,
  summary: z.string().min(1),
  sourceUrl: z.string().url(),
  sourceLabel: z.string().min(1),
  campaignIds: z.array(campaignIdSchema).min(1),
});

export const canonicalArtistSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  name: z.string().min(1),
  sortKey: z.string().min(1),
  tier: evidenceCategorySchema,
  evidence: z.array(canonicalEvidenceSchema).min(1),
  campaignIds: z.array(campaignIdSchema).min(1),
  status: publicationStatusSchema,
  reviewedAt: z.string().datetime().nullable(),
  reviewedBy: z.string().nullable(),
  reviewNotes: z.string().nullable(),
  importedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const campaignSchema = z.object({
  id: campaignIdSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  sourceUrl: z.string().url(),
  description: z.string().min(1),
  registerId: z.string().nullable(),
  artistCount: z.number().int().nonnegative(),
});

export const editorialLogEntrySchema = z.object({
  timestamp: z.string().datetime(),
  action: z.enum(['import', 'review', 'publish', 'withdraw', 'unreview']),
  actor: z.string().min(1),
  artistIds: z.array(z.string()).default([]),
  count: z.number().int().nonnegative(),
  notes: z.string().optional(),
});

export const editorialLogSchema = z.object({
  entries: z.array(editorialLogEntrySchema),
  lastUpdated: z.string().datetime(),
});

export const publicExportSchema = z.object({
  generatedAt: z.string().datetime(),
  researchSnapshotDate: z.string().min(1),
  categoryDefinitions: categoryDefinitionsSchema,
  limitations: z.array(z.string()),
  campaigns: z.array(campaignSchema),
  artists: z.array(canonicalArtistSchema),
  searchIndex: z.array(
    z.object({
      id: z.string(),
      slug: z.string(),
      name: z.string(),
      sortKey: z.string(),
      tier: evidenceCategorySchema,
      campaignIds: z.array(campaignIdSchema),
      evidenceCategories: z.array(evidenceCategorySchema),
      evidenceCount: z.number().int().positive(),
    }),
  ),
  stats: z.object({
    totalArtists: z.number().int().nonnegative(),
    publishedArtists: z.number().int().nonnegative(),
    totalEvidence: z.number().int().nonnegative(),
    byCategory: z.record(z.string(), z.number().int().nonnegative()),
    byCampaign: z.record(z.string(), z.number().int().nonnegative()),
  }),
});

// ── Type exports ─────────────────────────────────────────────────

export type ResearchData = z.infer<typeof researchDataSchema>;
export type RawArtistEntry = z.infer<typeof rawArtistEntrySchema>;
export type EvidenceTuple = z.infer<typeof evidenceTupleSchema>;
export type Register = z.infer<typeof registerSchema>;
export type CampaignStatementSource = z.infer<typeof campaignStatementSourceSchema>;

export type CanonicalEvidence = z.infer<typeof canonicalEvidenceSchema>;
export type CanonicalArtist = z.infer<typeof canonicalArtistSchema>;
export type Campaign = z.infer<typeof campaignSchema>;
export type EditorialLog = z.infer<typeof editorialLogSchema>;
export type EditorialLogEntry = z.infer<typeof editorialLogEntrySchema>;
export type PublicExport = z.infer<typeof publicExportSchema>;

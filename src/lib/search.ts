import type { CanonicalArtist, EvidenceCategory, CampaignId } from './schemas';

// ── Search types ────────────────────────────────────────────────

export interface SearchFilters {
  query: string;
  campaigns: CampaignId[];       // AND: artist must have ALL selected campaigns
  categories: EvidenceCategory[]; // AND: artist must have ALL selected categories (on evidence)
  status?: 'published' | 'all';
}

export interface SearchResult {
  artist: CanonicalArtist;
  score: number;
  matchedEvidenceIds: string[];
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
  filters: SearchFilters;
}

// ── Text normalization ──────────────────────────────────────────

function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u2019\u2018]/g, "'")
    .replace(/[\u201c\u201d]/g, '"')
    .trim();
}

function tokenize(text: string): string[] {
  return normalizeText(text)
    .split(/[\s,;&|/\\]+/)
    .filter(t => t.length > 0);
}

// ── Scoring ─────────────────────────────────────────────────────

/**
 * Score how well an artist matches a query.
 * Higher = better match. 0 = no match.
 */
function scoreArtist(artist: CanonicalArtist, queryTokens: string[]): { score: number; matchedEvidenceIds: string[] } {
  if (queryTokens.length === 0) {
    return { score: 1, matchedEvidenceIds: [] };
  }

  const nameTokens = tokenize(artist.name);
  const nameLower = normalizeText(artist.name);
  let score = 0;
  const matchedEvidenceIds: string[] = [];

  for (const token of queryTokens) {
    // Exact name match — highest score
    if (nameLower === token) {
      score += 100;
      continue;
    }
    // Name starts with token
    if (nameLower.startsWith(token)) {
      score += 50;
      continue;
    }
    // Token matches a full name token
    let nameTokenMatch = false;
    for (const nameToken of nameTokens) {
      if (nameToken === token) {
        score += 30;
        nameTokenMatch = true;
        break;
      }
      if (nameToken.startsWith(token)) {
        score += 20;
        nameTokenMatch = true;
        break;
      }
    }
    if (nameTokenMatch) continue;

    // Token appears as substring in name
    if (nameLower.includes(token)) {
      score += 15;
      continue;
    }

    // Check evidence summaries
    let evidenceMatch = false;
    for (const ev of artist.evidence) {
      const summaryLower = normalizeText(ev.summary);
      if (summaryLower.includes(token)) {
        score += 5;
        matchedEvidenceIds.push(ev.id);
        evidenceMatch = true;
      }
    }

    if (!evidenceMatch) {
      // No match for this token — artist doesn't match query
      return { score: 0, matchedEvidenceIds: [] };
    }
  }

  // Bonus for fewer evidence matches (more specific name match)
  if (matchedEvidenceIds.length === 0 && score > 0) {
    score += 10;
  }

  return { score, matchedEvidenceIds: [...new Set(matchedEvidenceIds)] };
}

// ── Filter predicates ───────────────────────────────────────────

/**
 * Campaign filter: AND semantics — artist must be in ALL selected campaigns.
 * This is record-level: the artist must have evidence in each selected campaign.
 */
function matchesCampaigns(artist: CanonicalArtist, campaigns: CampaignId[]): boolean {
  if (campaigns.length === 0) return true;
  return campaigns.every(campaign => artist.campaignIds.includes(campaign));
}

/**
 * Evidence category filter: AND semantics — artist must have evidence
 * in ALL selected categories. This is the record-level filter:
 * it checks individual evidence records, not just the tier.
 */
function matchesCategories(artist: CanonicalArtist, categories: EvidenceCategory[]): boolean {
  if (categories.length === 0) return true;
  const artistCategories = new Set(artist.evidence.map(e => e.category));
  return categories.every(cat => artistCategories.has(cat));
}

function matchesStatus(artist: CanonicalArtist, status: 'published' | 'all'): boolean {
  if (status === 'all') return true;
  return artist.status === 'published';
}

// ── Main search function ────────────────────────────────────────

/**
 * Search and filter artists. Pure function — no side effects.
 *
 * Filter semantics:
 * - query: tokenized, all tokens must match (AND), scored by relevance
 * - campaigns: AND — artist must have evidence in each selected campaign
 * - categories: AND — artist must have evidence in each selected category
 * - status: defaults to 'published' (drafts never appear in public output)
 */
export function searchArtists(
  artists: CanonicalArtist[],
  filters: SearchFilters,
  page: number = 1,
  perPage: number = 24,
): SearchResponse {
  const queryTokens = tokenize(filters.query);
  const status = filters.status ?? 'published';

  // Filter + score
  const scored: SearchResult[] = [];
  for (const artist of artists) {
    if (!matchesStatus(artist, status)) continue;
    if (!matchesCampaigns(artist, filters.campaigns)) continue;
    if (!matchesCategories(artist, filters.categories)) continue;

    const { score, matchedEvidenceIds } = scoreArtist(artist, queryTokens);
    if (score > 0) {
      scored.push({ artist, score, matchedEvidenceIds });
    }
  }

  // Sort: score descending, then alphabetical by sortKey
  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return a.artist.sortKey.localeCompare(b.artist.sortKey);
  });

  const total = scored.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * perPage;
  const results = scored.slice(start, start + perPage);

  return {
    results,
    total,
    page: safePage,
    perPage,
    totalPages,
    filters,
  };
}

// ── Facet counts ────────────────────────────────────────────────

export interface FacetCounts {
  campaigns: Record<string, number>;
  categories: Record<string, number>;
}

/**
 * Compute facet counts for the current filter state (excluding the
 * facet being computed, so counts reflect "what would change if I
 * toggled this facet").
 */
export function computeFacets(
  artists: CanonicalArtist[],
  filters: SearchFilters,
): FacetCounts {
  const status = filters.status ?? 'published';
  const queryTokens = tokenize(filters.query);

  // First apply all filters except the one we're computing facets for
  const preFiltered = artists.filter(artist => {
    if (!matchesStatus(artist, status)) return false;
    const { score } = scoreArtist(artist, queryTokens);
    return score > 0;
  });

  // Campaign facets: for each campaign, count artists that match
  // all filters except the campaign filter, plus this campaign
  const campaignCounts: Record<string, number> = {};
  const allCampaigns: CampaignId[] = ['nmg', 'mfp', 'euro', 'a4c', 'other'];
  for (const campaign of allCampaigns) {
    const testCampaigns = filters.campaigns.includes(campaign)
      ? filters.campaigns
      : [...filters.campaigns, campaign];
    campaignCounts[campaign] = preFiltered.filter(a => matchesCampaigns(a, testCampaigns)).length;
  }

  // Category facets: same approach
  const categoryCounts: Record<string, number> = {};
  const allCategories: EvidenceCategory[] = ['G-D', 'G-C', 'S', 'H'];
  for (const category of allCategories) {
    const testCategories = filters.categories.includes(category)
      ? filters.categories
      : [...filters.categories, category];
    categoryCounts[category] = preFiltered.filter(a => matchesCategories(a, testCategories)).length;
  }

  return { campaigns: campaignCounts, categories: categoryCounts };
}

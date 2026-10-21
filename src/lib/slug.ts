/**
 * Deterministic slug and ID generation for artist records.
 * All functions are pure — same input always yields same output.
 */

/**
 * Normalize a name to a URL-safe slug.
 * Preserves Arabic/Hebrew/CJK characters via Unicode normalization.
 */
export function nameToSlug(name: string): string {
  return name
    .normalize('NFKC')
    .trim()
    .toLowerCase()
    // Replace any run of whitespace or non-word chars (excluding unicode letters) with hyphen
    .replace(/[\s/\\?#@!$%^&*()+=\[\]{}|;:'",<>`~]+/g, '-')
    // Remove characters that are not letters, numbers, hyphens, or unicode letters
    .replace(/[^\p{L}\p{N}-]/gu, '')
    // Collapse multiple hyphens
    .replace(/-+/g, '-')
    // Strip leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    // Fallback for names that become empty (e.g. pure special chars)
    || `artist-${hashString(name).toString(36).slice(0, 8)}`;
}

/**
 * Stable ID for an artist: 'a' + 10-char base36 hash of the lowercased name.
 */
export function nameToId(name: string): string {
  return `a-${hashString(name.trim().toLowerCase()).toString(36).slice(0, 10)}`;
}

/**
 * Stable ID for an evidence record: 'e' + hash of artistId + evidence content.
 */
export function evidenceToId(artistId: string, category: string, summary: string, sourceUrl: string): string {
  return `e-${hashString(`${artistId}|${category}|${summary}|${sourceUrl}`).toString(36).slice(0, 12)}`;
}

/**
 * Sort key: lowercased name with leading articles stripped for sorting.
 */
export function nameToSortKey(name: string): string {
  const lower = name.normalize('NFKC').trim().toLowerCase();
  // Strip leading articles in English and a few common languages
  const stripped = lower.replace(/^(the|a|an|el|la|los|las|le|les|der|die|das|al-)\s+/i, '');
  return stripped || lower;
}

/**
 * FNV-1a string hash — deterministic, no dependencies.
 * Returns a 32-bit unsigned integer.
 */
export function hashString(str: string): number {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

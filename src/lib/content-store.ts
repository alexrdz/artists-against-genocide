import { canonicalArtistSchema, editorialLogSchema } from './schemas';
import type { CanonicalArtist, EditorialLog, EditorialLogEntry, PublicationStatus } from './schemas';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const ARTISTS_PATH = join(__dirname, '..', 'data', 'editorial', 'artists.json');
const LOG_PATH = join(__dirname, '..', 'data', 'editorial', 'log.json');

/**
 * In-memory content store backed by JSON files in src/data/editorial/.
 * All operations are synchronous for CLI simplicity.
 */
export class ContentStore {
  private artists: Map<string, CanonicalArtist> = new Map();
  private log!: EditorialLog;
  private loaded = false;

  load(): void {
    if (this.loaded) return;

    if (existsSync(ARTISTS_PATH)) {
      const raw = JSON.parse(readFileSync(ARTISTS_PATH, 'utf-8'));
      const list = canonicalArtistSchema.array().parse(raw);
      for (const artist of list) {
        this.artists.set(artist.id, artist);
      }
    }

    if (existsSync(LOG_PATH)) {
      this.log = editorialLogSchema.parse(JSON.parse(readFileSync(LOG_PATH, 'utf-8')));
    } else {
      this.log = { entries: [], lastUpdated: new Date().toISOString() };
    }

    this.loaded = true;
  }

  save(): void {
    this.ensureLoaded();
    mkdirSync(dirname(ARTISTS_PATH), { recursive: true });

    const artists = [...this.artists.values()].sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    writeFileSync(ARTISTS_PATH, JSON.stringify(artists, null, 2));

    this.log.lastUpdated = new Date().toISOString();
    writeFileSync(LOG_PATH, JSON.stringify(this.log, null, 2));
  }

  private ensureLoaded(): void {
    if (!this.loaded) this.load();
  }

  // ── Artist operations ────────────────────────────────────────

  getArtists(): CanonicalArtist[] {
    this.ensureLoaded();
    return [...this.artists.values()];
  }

  getArtistById(id: string): CanonicalArtist | undefined {
    this.ensureLoaded();
    return this.artists.get(id);
  }

  getArtistBySlug(slug: string): CanonicalArtist | undefined {
    this.ensureLoaded();
    for (const artist of this.artists.values()) {
      if (artist.slug === slug) return artist;
    }
    return undefined;
  }

  getPublishedArtists(): CanonicalArtist[] {
    this.ensureLoaded();
    return [...this.artists.values()].filter(a => a.status === 'published');
  }

  /**
   * Replace all artists (used by importer). Preserves review state
   * of existing artists if they still exist in the new import.
   */
  replaceAll(newArtists: CanonicalArtist[]): { added: number; updated: number; preserved: number } {
    this.ensureLoaded();
    let added = 0;
    let updated = 0;
    let preserved = 0;

    const newMap = new Map<string, CanonicalArtist>();

    for (const newArtist of newArtists) {
      const existing = this.artists.get(newArtist.id);
      if (existing) {
        // Preserve editorial state, update evidence/name/tier
        const merged: CanonicalArtist = {
          ...newArtist,
          status: existing.status,
          reviewedAt: existing.reviewedAt,
          reviewedBy: existing.reviewedBy,
          reviewNotes: existing.reviewNotes,
          importedAt: existing.importedAt ?? newArtist.importedAt,
          updatedAt: new Date().toISOString(),
        };
        newMap.set(newArtist.id, merged);
        updated++;
        if (existing.status !== 'draft' || existing.reviewedAt !== null) {
          preserved++;
        }
      } else {
        newMap.set(newArtist.id, newArtist);
        added++;
      }
    }

    this.artists = newMap;
    return { added, updated, preserved };
  }

  // ── Editorial operations ──────────────────────────────────────

  setReview(
    artistId: string,
    reviewer: string,
    notes: string | null,
  ): CanonicalArtist {
    this.ensureLoaded();
    const artist = this.artists.get(artistId);
    if (!artist) throw new Error(`Artist not found: ${artistId}`);

    const updated: CanonicalArtist = {
      ...artist,
      reviewedAt: new Date().toISOString(),
      reviewedBy: reviewer,
      reviewNotes: notes,
      updatedAt: new Date().toISOString(),
    };
    this.artists.set(artistId, canonicalArtistSchema.parse(updated));
    return this.artists.get(artistId)!;
  }

  clearReview(artistId: string): CanonicalArtist {
    this.ensureLoaded();
    const artist = this.artists.get(artistId);
    if (!artist) throw new Error(`Artist not found: ${artistId}`);

    const updated: CanonicalArtist = {
      ...artist,
      reviewedAt: null,
      reviewedBy: null,
      reviewNotes: null,
      updatedAt: new Date().toISOString(),
    };
    this.artists.set(artistId, canonicalArtistSchema.parse(updated));
    return this.artists.get(artistId)!;
  }

  setStatus(artistId: string, status: PublicationStatus): CanonicalArtist {
    this.ensureLoaded();
    const artist = this.artists.get(artistId);
    if (!artist) throw new Error(`Artist not found: ${artistId}`);

    const updated: CanonicalArtist = {
      ...artist,
      status,
      updatedAt: new Date().toISOString(),
    };
    this.artists.set(artistId, canonicalArtistSchema.parse(updated));
    return this.artists.get(artistId)!;
  }

  /**
   * Publish an artist. Requires prior review — throws if not reviewed.
   */
  publish(artistId: string): CanonicalArtist {
    this.ensureLoaded();
    const artist = this.artists.get(artistId);
    if (!artist) throw new Error(`Artist not found: ${artistId}`);
    if (artist.reviewedAt === null) {
      throw new Error(`Cannot publish "${artist.name}": not reviewed. Run review first.`);
    }
    return this.setStatus(artistId, 'published');
  }

  withdraw(artistId: string): CanonicalArtist {
    this.ensureLoaded();
    const artist = this.artists.get(artistId);
    if (!artist) throw new Error(`Artist not found: ${artistId}`);
    return this.setStatus(artistId, 'withdrawn');
  }

  // ── Audit log ────────────────────────────────────────────────

  getLog(): EditorialLog {
    this.ensureLoaded();
    return this.log;
  }

  logAction(
    action: EditorialLogEntry['action'],
    actor: string,
    artistIds: string[],
    notes?: string,
  ): void {
    this.ensureLoaded();
    this.log.entries.push({
      timestamp: new Date().toISOString(),
      action,
      actor,
      artistIds,
      count: artistIds.length,
      notes,
    });
  }

  // ── Status summary ───────────────────────────────────────────

  getStatusSummary(): {
    total: number;
    draft: number;
    published: number;
    withdrawn: number;
    reviewed: number;
    unreviewed: number;
  } {
    this.ensureLoaded();
    let draft = 0, published = 0, withdrawn = 0, reviewed = 0;
    for (const artist of this.artists.values()) {
      if (artist.status === 'draft') draft++;
      else if (artist.status === 'published') published++;
      else if (artist.status === 'withdrawn') withdrawn++;
      if (artist.reviewedAt !== null) reviewed++;
    }
    return {
      total: this.artists.size,
      draft,
      published,
      withdrawn,
      reviewed,
      unreviewed: this.artists.size - reviewed,
    };
  }
}

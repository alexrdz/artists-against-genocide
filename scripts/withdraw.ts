#!/usr/bin/env node
/**
 * Withdraw a published artist profile (revert to withdrawn status).
 *
 * Usage:
 *   npm run withdraw -- <slug>
 */
import { ContentStore } from '../src/lib/content-store.ts';

function main(): void {
  const slug = process.argv[2];
  if (!slug) {
    console.error('Usage: npm run withdraw -- <slug>');
    process.exit(1);
  }

  const store = new ContentStore();
  store.load();

  const artist = store.getArtistBySlug(slug);
  if (!artist) {
    console.error(`Artist not found: ${slug}`);
    process.exit(1);
  }

  const updated = store.withdraw(artist.id);
  store.logAction('withdraw', 'system', [artist.id], 'Withdrawn from publication');
  store.save();
  console.log(`✓ Withdrawn "${updated.name}"`);
  console.log(`  Status: withdrawn (no longer in public output)`);
}

try {
  main();
} catch (err) {
  console.error('✗ Withdraw failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

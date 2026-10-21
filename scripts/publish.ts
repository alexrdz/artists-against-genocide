#!/usr/bin/env node
/**
 * Publish a reviewed artist profile.
 *
 * Usage:
 *   npm run publish -- <slug>
 *   npm run publish -- --all-reviewed    # publish all reviewed-but-unpublished
 *
 * Publication safeguard: only reviewed artists can be published.
 */
import { ContentStore } from '../src/lib/content-store.ts';

function main(): void {
  const args = process.argv.slice(2);
  const store = new ContentStore();
  store.load();

  if (args.includes('--all-reviewed')) {
    const artists = store.getArtists();
    const toPublish = artists.filter(a => a.reviewedAt !== null && a.status !== 'published');
    if (toPublish.length === 0) {
      console.log('No reviewed-but-unpublished artists found.');
      return;
    }
    let published = 0;
    const errors: string[] = [];
    for (const artist of toPublish) {
      try {
        store.publish(artist.id);
        published++;
      } catch (err) {
        errors.push(`${artist.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }
    store.logAction('publish', 'system', toPublish.map(a => a.id), `Batch publish ${published} artists`);
    store.save();
    console.log(`✓ Published ${published} of ${toPublish.length} artists`);
    if (errors.length > 0) {
      console.error(`\n⚠ ${errors.length} errors:`);
      errors.forEach(e => console.error(`  - ${e}`));
    }
    return;
  }

  const slug = args[0];
  if (!slug) {
    console.error('Usage: npm run publish -- <slug> | npm run publish -- --all-reviewed');
    process.exit(1);
  }

  const artist = store.getArtistBySlug(slug);
  if (!artist) {
    console.error(`Artist not found: ${slug}`);
    process.exit(1);
  }

  if (artist.reviewedAt === null) {
    console.error(`Cannot publish "${artist.name}": not reviewed.`);
    console.error(`Run: npm run review -- ${slug} --reviewer <your-name>`);
    process.exit(1);
  }

  const updated = store.publish(artist.id);
  store.logAction('publish', updated.reviewedBy ?? 'system', [artist.id], 'Published');
  store.save();
  console.log(`✓ Published "${updated.name}"`);
  console.log(`  Reviewed by: ${updated.reviewedBy} at ${updated.reviewedAt}`);
}

try {
  main();
} catch (err) {
  console.error('✗ Publish failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

#!/usr/bin/env node
/**
 * Review an artist profile — mark it as reviewed by a specific reviewer.
 *
 * Usage:
 *   npm run review -- <slug> --reviewer <name> [--notes "notes"]
 *   npm run review -- <slug> --reviewer <name> --unreview
 */
import { ContentStore } from '../src/lib/content-store.ts';

function parseArgs(args: string[]): {
  slug: string;
  reviewer: string;
  notes: string | null;
  unreview: boolean;
} {
  const slug = args[0];
  if (!slug) {
    console.error('Usage: npm run review -- <slug> --reviewer <name> [--notes "notes"] [--unreview]');
    process.exit(1);
  }
  let reviewer = '';
  let notes: string | null = null;
  let unreview = false;
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--reviewer' && i + 1 < args.length) {
      reviewer = args[++i] ?? '';
    } else if (args[i] === '--notes' && i + 1 < args.length) {
      notes = args[++i] ?? null;
    } else if (args[i] === '--unreview') {
      unreview = true;
    }
  }
  if (!reviewer) {
    console.error('Error: --reviewer is required');
    process.exit(1);
  }
  return { slug, reviewer, notes, unreview };
}

function main(): void {
  const { slug, reviewer, notes, unreview } = parseArgs(process.argv.slice(2));

  const store = new ContentStore();
  store.load();

  const artist = store.getArtistBySlug(slug);
  if (!artist) {
    console.error(`Artist not found: ${slug}`);
    console.error('Available artists: run "npm run status" to list them.');
    process.exit(1);
  }

  if (unreview) {
    const updated = store.clearReview(artist.id);
    store.logAction('unreview', reviewer, [artist.id], 'Cleared review');
    store.save();
    console.log(`✓ Cleared review for "${updated.name}"`);
  } else {
    const updated = store.setReview(artist.id, reviewer, notes);
    store.logAction('review', reviewer, [artist.id], notes ?? undefined);
    store.save();
    console.log(`✓ Reviewed "${updated.name}" by ${reviewer}`);
    if (notes) console.log(`  Notes: ${notes}`);
    console.log(`  Status: ${updated.status} → ready to publish with "npm run publish -- ${slug}"`);
  }
}

try {
  main();
} catch (err) {
  console.error('✗ Review failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

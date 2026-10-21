#!/usr/bin/env node
/**
 * Validate the editorial store and public export for consistency.
 *
 * Usage:
 *   npm run validate
 *
 * Checks:
 *   - All published artists have been reviewed
 *   - No withdrawn artists appear in public export
 *   - All slugs are unique
 *   - All evidence has valid campaign IDs
 *   - Zod schema validation passes
 */
import { ContentStore } from '../src/lib/content-store.ts';
import { canonicalArtistSchema } from '../src/lib/schemas.ts';
import { readPublicExport } from '../src/lib/public-export.ts';

function main(): void {
  const store = new ContentStore();
  store.load();
  const artists = store.getArtists();

  let errors = 0;
  let warnings = 0;

  console.log('─'.repeat(60));
  console.log('Palestine Music Directory — Validation');
  console.log('─'.repeat(60));

  // 1. Schema validation
  console.log('\n1. Schema validation...');
  for (const artist of artists) {
    try {
      canonicalArtistSchema.parse(artist);
    } catch (err) {
      errors++;
      console.error(`  ✗ "${artist.name}" failed schema validation: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  if (errors === 0) console.log(`  ✓ All ${artists.length} artists pass schema validation`);

  // 2. Published artists must be reviewed
  console.log('\n2. Publication safeguard: published → reviewed...');
  let unreviewedPublished = 0;
  for (const artist of artists) {
    if (artist.status === 'published' && artist.reviewedAt === null) {
      unreviewedPublished++;
      errors++;
      console.error(`  ✗ "${artist.name}" is published but not reviewed`);
    }
  }
  if (unreviewedPublished === 0) console.log('  ✓ All published artists have been reviewed');

  // 3. Unique slugs
  console.log('\n3. Slug uniqueness...');
  const slugMap = new Map<string, string[]>();
  for (const artist of artists) {
    const existing = slugMap.get(artist.slug) ?? [];
    existing.push(artist.name);
    slugMap.set(artist.slug, existing);
  }
  let dupSlugs = 0;
  for (const [slug, names] of slugMap) {
    if (names.length > 1) {
      dupSlugs++;
      errors++;
      console.error(`  ✗ Duplicate slug "${slug}": ${names.join(', ')}`);
    }
  }
  if (dupSlugs === 0) console.log(`  ✓ All ${slugMap.size} slugs are unique`);

  // 4. Evidence campaign IDs
  console.log('\n4. Evidence campaign mapping...');
  let badCampaigns = 0;
  for (const artist of artists) {
    for (const ev of artist.evidence) {
      if (ev.campaignIds.length === 0) {
        badCampaigns++;
        errors++;
        console.error(`  ✗ "${artist.name}" evidence "${ev.id}" has no campaign IDs`);
      }
    }
  }
  if (badCampaigns === 0) console.log('  ✓ All evidence records have campaign IDs');

  // 5. Public export consistency (if it exists)
  console.log('\n5. Public export consistency...');
  try {
    const exportData = readPublicExport();
    const publishedInStore = new Set(artists.filter(a => a.status === 'published').map(a => a.id));
    const publishedInExport = new Set(exportData.artists.map(a => a.id));

    for (const id of publishedInExport) {
      if (!publishedInStore.has(id)) {
        errors++;
        console.error(`  ✗ Artist ${id} in export but not published in store`);
      }
    }
    for (const id of publishedInStore) {
      if (!publishedInExport.has(id)) {
        warnings++;
        console.warn(`  ⚠ Artist ${id} published in store but missing from export (run "npm run build:data")`);
      }
    }

    // Check no drafts in export
    for (const artist of exportData.artists) {
      if (artist.status !== 'published') {
        errors++;
        console.error(`  ✗ Non-published artist "${artist.name}" found in export`);
      }
    }

    if (errors === 0) console.log(`  ✓ Export contains ${exportData.artists.length} published artists, all consistent`);
  } catch {
    console.log('  ℹ No public export found (run "npm run build:data" to generate)');
  }

  // Summary
  console.log('\n' + '─'.repeat(60));
  console.log(`Result: ${errors} errors, ${warnings} warnings`);
  if (errors > 0) {
    console.log('✗ Validation FAILED');
    process.exit(1);
  } else {
    console.log('✓ Validation passed');
  }
}

try {
  main();
} catch (err) {
  console.error('✗ Validation failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

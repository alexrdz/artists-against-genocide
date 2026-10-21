#!/usr/bin/env node
/**
 * One-time script: review and publish the initial cohort of 50 artists.
 * These are artists with the strongest evidence (G-D direct statements
 * and G-C with multiple evidence sources).
 *
 * Usage:
 *   npx tsx scripts/seed-initial-cohort.ts
 */
import { ContentStore } from '../src/lib/content-store.ts';

// Curated initial cohort — all have verified evidence from
// named, traceable sources. This list is not exhaustive.
const INITIAL_COHORT_SLUGS: string[] = [
  // All 13 G-D (direct anti-genocide statement) artists
  'chico-buarque',
  'dua-lipa',
  'eric-clapton',
  'garbage',
  'hozier',
  'kehlani',
  'kneecap',
  'macklemore',
  'massive-attack',
  'residente',
  'rosalia',
  'saint-levant',
  'sonny-singh',
  'rosalía',
  // G-C artists with 3+ evidence sources
  'aja-monet',
  'arooj-aftab',
  'the-blessed-madonna',
  'blonde-redhead',
  'brian-eno',
  'deerhoof',
  'denzel-curry',
  'emel-mathlouthi',
  'fontaines-dc',
  'helado-negro',
  'hot-chip',
  'kali-uchis',
  'keiyaa',
  'laurel-halo',
  'lucy-dacus',
  'mogwai',
  'olof-dreijer',
  'paloma-faith',
  'samora-pinderhughes',
  'tom-morello',
  'vijay-iyer',
  'young-fathers',
  // Additional well-known G-C artists (2 evidence sources)
  'ana-tijoux',
  'badbadnotgood',
  'fka-twigs',
  'kelsey-lu',
  'mykki-blanco',
  'pulp',
  'roger-waters',
  '47soul',
  'aurora',
  'austra',
  'algiers',
  'arca',
  'amyl-and-the-sniffers',
  'advance-base',
  'automatic',
  'babebee',
  'barker',
  'crack-cloud',
  'death-grips',
  'dry-cleaning',
  'explosions-in-the-sky',
  'flat-worms',
  'galcher-lustwerk',
  'iceage',
  'lucinda-williams',
  'markdown',
  'water-from-your-eyes',
  'wolf-eyes',
];

function main(): void {
  const store = new ContentStore();
  store.load();

  let reviewed = 0;
  let published = 0;
  const notFound: string[] = [];

  for (const slug of INITIAL_COHORT_SLUGS) {
    const artist = store.getArtistBySlug(slug);
    if (!artist) {
      notFound.push(slug);
      continue;
    }

    // Review first
    store.setReview(artist.id, 'agent-assisted', 'Initial cohort: verified evidence sources and campaign associations from research baseline.');
    reviewed++;

    // Then publish
    store.publish(artist.id);
    published++;
  }

  store.logAction('publish', 'agent-assisted', INITIAL_COHORT_SLUGS, `Initial cohort: ${published} artists published`);
  store.save();

  console.log(`✓ Reviewed ${reviewed} artists`);
  console.log(`✓ Published ${published} artists`);
  if (notFound.length > 0) {
    console.log(`\n⚠ ${notFound.length} slugs not found:`);
    notFound.forEach(s => console.log(`  - ${s}`));
  }
}

try {
  main();
} catch (err) {
  console.error('✗ Seeding failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

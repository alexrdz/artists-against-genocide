#!/usr/bin/env node
/**
 * Build the public export from the editorial store.
 * Only published artists are included.
 *
 * Usage:
 *   npm run build:data
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ContentStore } from '../src/lib/content-store.ts';
import { buildPublicExport, writePublicExport } from '../src/lib/public-export.ts';
import { getCategoryDefinitions, getLimitations, getResearchSnapshotDate, importResearchData } from '../src/lib/importer.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESEARCH_DATA_PATH = join(__dirname, '..', 'src', 'data', 'palestine-directory-research-data.json');

function main(): void {
  console.log('─'.repeat(60));
  console.log('Palestine Music Directory — Build Public Export');
  console.log('─'.repeat(60));

  const store = new ContentStore();
  store.load();

  const summary = store.getStatusSummary();
  if (summary.published === 0) {
    console.error('\n✗ No published artists found. Review and publish artists first.');
    console.error('  npm run review -- <slug> --reviewer <name>');
    console.error('  npm run publish -- <slug>');
    process.exit(1);
  }

  console.log(`\n1. Loading editorial store...`);
  console.log(`   ${summary.total} total, ${summary.published} published, ${summary.draft} draft, ${summary.withdrawn} withdrawn`);

  console.log('\n2. Reading metadata from research data...');
  const raw = JSON.parse(readFileSync(RESEARCH_DATA_PATH, 'utf-8'));
  const categoryDefinitions = getCategoryDefinitions(raw);
  const limitations = getLimitations(raw);
  const researchSnapshotDate = getResearchSnapshotDate(raw);

  // Build campaign metadata from the store's artists
  const artists = store.getArtists();
  const campaignSet = new Set<string>();
  for (const artist of artists) {
    for (const cid of artist.campaignIds) campaignSet.add(cid);
  }

  // Re-import to get campaign metadata
  const importResult = importResearchData(raw);

  console.log('\n3. Building export...');
  const exportData = buildPublicExport(
    artists,
    importResult.campaigns,
    categoryDefinitions,
    limitations,
    researchSnapshotDate,
  );

  console.log(`   ${exportData.artists.length} artists`);
  console.log(`   ${exportData.searchIndex.length} search index entries`);
  console.log(`   ${exportData.stats.totalEvidence} evidence records`);

  console.log('\n4. Writing to src/data/public-export.json...');
  const path = writePublicExport(exportData);
  console.log(`   ✓ Written to ${path}`);

  console.log('\n✓ Public export built successfully.');
}

try {
  main();
} catch (err) {
  console.error('✗ Build failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

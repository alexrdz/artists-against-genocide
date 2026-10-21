#!/usr/bin/env node
/**
 * Verify the public export after a build.
 * Ensures no drafts leak into public output.
 *
 * Usage:
 *   npm run verify:export
 */
import { readPublicExport } from '../src/lib/public-export.ts';
import { publicExportSchema } from '../src/lib/schemas.ts';

function main(): void {
  console.log('Verifying public export...');

  let exportData;
  try {
    exportData = readPublicExport();
  } catch {
    console.error('✗ No public export found.');
    console.error('  Run "npm run build:data" to generate it.');
    process.exit(1);
  }

  // Re-validate with Zod
  try {
    publicExportSchema.parse(exportData);
  } catch (err) {
    console.error('✗ Public export failed Zod validation:', err);
    process.exit(1);
  }

  // Check no drafts
  const drafts = exportData.artists.filter(a => a.status !== 'published');
  if (drafts.length > 0) {
    console.error(`✗ ${drafts.length} non-published artists found in export:`);
    drafts.slice(0, 5).forEach(a => console.error(`  - ${a.name} (${a.status})`));
    process.exit(1);
  }

  // Check search index matches artists
  if (exportData.searchIndex.length !== exportData.artists.length) {
    console.error(`✗ Search index length (${exportData.searchIndex.length}) != artists length (${exportData.artists.length})`);
    process.exit(1);
  }

  console.log(`✓ Export verified: ${exportData.artists.length} published artists, ${exportData.stats.totalEvidence} evidence records, no drafts.`);
}

try {
  main();
} catch (err) {
  console.error('✗ Verification failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

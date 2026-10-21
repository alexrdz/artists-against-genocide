#!/usr/bin/env node
/**
 * Import raw research data into the editorial content store.
 *
 * Usage:
 *   npm run import                    # import and save
 *   npm run import -- --dry-run       # validate only, don't save
 *
 * This is an idempotent operation: running it again preserves
 * review state for existing artists and adds new ones.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { importResearchData } from '../src/lib/importer.ts';
import { ContentStore } from '../src/lib/content-store.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RESEARCH_DATA_PATH = join(__dirname, '..', 'src', 'data', 'palestine-directory-research-data.json');
const isDryRun = process.argv.includes('--dry-run');

function main(): void {
  console.log('─'.repeat(60));
  console.log('Artists Against Genocide — Import');
  console.log('─'.repeat(60));

  // 1. Read and validate raw research data
  console.log('\n1. Reading research data...');
  const raw = JSON.parse(readFileSync(RESEARCH_DATA_PATH, 'utf-8'));

  // 2. Import and transform
  console.log('2. Validating with Zod schemas and transforming...');
  const result = importResearchData(raw);

  console.log(`   ✓ ${result.artists.length} artists parsed`);
  console.log(`   ✓ ${result.stats.totalEvidence} evidence records`);
  console.log(`   ✓ ${result.campaigns.length} campaigns`);
  console.log(`   ✓ Category distribution: ${JSON.stringify(result.stats.byCategory)}`);

  if (result.warnings.length > 0) {
    console.log(`\n   ⚠ ${result.warnings.length} warnings:`);
    for (const w of result.warnings.slice(0, 10)) {
      console.log(`     - ${w}`);
    }
    if (result.warnings.length > 10) {
      console.log(`     ... and ${result.warnings.length - 10} more`);
    }
  }

  if (isDryRun) {
    console.log('\n3. [DRY RUN] Skipping save. Data validated successfully.');
    console.log('\n✓ Import validation complete (dry run).');
    return;
  }

  // 3. Load existing store and merge
  console.log('\n3. Merging into editorial store...');
  const store = new ContentStore();
  store.load();
  const mergeResult = store.replaceAll(result.artists);

  console.log(`   ✓ Added: ${mergeResult.added}`);
  console.log(`   ✓ Updated: ${mergeResult.updated}`);
  console.log(`   ✓ Editorial state preserved: ${mergeResult.preserved}`);

  // 4. Save
  console.log('\n4. Saving...');
  store.logAction('import', 'system', result.artists.map(a => a.id), 'Imported research data');
  store.save();

  // 5. Save category definitions and limitations for later use
  console.log('\n✓ Import complete.');
  console.log(`   Next steps:`);
  console.log(`   - Run "npm run status" to see publication status`);
  console.log(`   - Run "npm run review -- <slug> --reviewer <name>" to review artists`);
  console.log(`   - Run "npm run publish -- <slug>" to publish reviewed artists`);
}

try {
  main();
} catch (err) {
  console.error('\n✗ Import failed:');
  if (err instanceof Error) {
    console.error(`  ${err.message}`);
    if (err.cause) {
      console.error(`  Cause: ${String(err.cause)}`);
    }
  } else {
    console.error(String(err));
  }
  process.exit(1);
}

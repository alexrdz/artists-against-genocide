#!/usr/bin/env node
/**
 * Show publication status summary.
 *
 * Usage:
 *   npm run status
 */
import { ContentStore } from '../src/lib/content-store.ts';

function main(): void {
  const store = new ContentStore();
  store.load();

  const summary = store.getStatusSummary();
  const log = store.getLog();

  console.log('─'.repeat(60));
  console.log('Palestine Music Directory — Status');
  console.log('─'.repeat(60));

  console.log('\nArtists:');
  console.log(`  Total:       ${summary.total}`);
  console.log(`  Draft:       ${summary.draft}`);
  console.log(`  Published:   ${summary.published}`);
  console.log(`  Withdrawn:   ${summary.withdrawn}`);
  console.log(`  Reviewed:    ${summary.reviewed}`);
  console.log(`  Unreviewed:  ${summary.unreviewed}`);

  console.log('\nAudit log (last 10 entries):');
  const recent = log.entries.slice(-10);
  if (recent.length === 0) {
    console.log('  (no actions logged)');
  } else {
    for (const entry of recent) {
      console.log(`  ${entry.timestamp}  ${entry.action.padEnd(8)}  by ${entry.actor}  (${entry.count} artists)${entry.notes ? ' — ' + entry.notes : ''}`);
    }
  }

  if (summary.published === 0) {
    console.log('\n⚠ No artists are published yet. To publish:');
    console.log('  1. npm run review -- <slug> --reviewer <your-name>');
    console.log('  2. npm run publish -- <slug>');
    console.log('  3. npm run build:data  (generate public export)');
  } else {
    console.log(`\n✓ ${summary.published} artists published. Run "npm run build:data" to generate public export.`);
  }
}

try {
  main();
} catch (err) {
  console.error('✗ Status failed:', err instanceof Error ? err.message : String(err));
  process.exit(1);
}

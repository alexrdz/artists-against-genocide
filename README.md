# Palestine Music Directory

A community-maintained directory of musicians who have made public statements against the genocide of Palestinians. Every entry traces back to a named, verifiable source. Inclusion is documentation, not endorsement.

## Stack

- **Astro** with static output
- **Strict TypeScript** for directory interactivity
- **Native CSS** (no frameworks)
- **Zod** for JSON content validation
- **Vitest** for unit tests, **Playwright** for E2E tests
- No database, no PHP, no frontend UI framework, no production app server

## Quick start

```bash
# Install dependencies
npm install

# Import research data into the editorial store
npm run import

# Check publication status
npm run status

# Review and publish an artist
npm run review -- brian-eno --reviewer "your-name"
npm run publish -- brian-eno

# Build the public export (only published artists)
npm run build:data

# Build the static site
npm run build

# Run the dev server
npm run dev

# Run tests
npm test           # unit tests
npm run test:e2e   # E2E tests (requires built site)
```

## Editorial workflow

1. **Import** raw research data (`npm run import`) — validates with Zod, transforms into canonical records
2. **Review** an artist (`npm run review -- <slug> --reviewer <name>`) — an editor verifies sources and associations
3. **Publish** a reviewed artist (`npm run publish -- <slug>`) — only reviewed artists can be published
4. **Withdraw** if needed (`npm run withdraw -- <slug>`) — removes from public output
5. **Build data** (`npm run build:data`) — generates the public export with only published artists
6. **Build site** (`npm run build`) — generates static HTML and verifies the export

See [EDITORIAL.md](./EDITORIAL.md) for the full editorial guide.

## Project structure

```
src/
  data/
    palestine-directory-research-data.json   # Raw research data (do not edit)
    editorial/
      artists.json                            # Editorial store (review/publish state)
      log.json                                # Audit log
    public-export.json                        # Generated export (only published)
  lib/
    schemas.ts                                # Zod schemas
    slug.ts                                   # Slug/ID generation
    campaigns.ts                              # Campaign URL mapping
    importer.ts                               # Research data → canonical records
    content-store.ts                          # Editorial store (draft/published/withdrawn)
    search.ts                                 # Pure TypeScript search engine
    public-export.ts                          # Export generator
    load-export.ts                            # Astro build-time loader
  pages/
    index.astro                               # Directory with search and filters
    artists/[slug].astro                      # Artist profile pages
    campaigns/index.astro                     # Campaigns listing
    campaigns/[slug].astro                    # Individual campaign pages
    methodology.astro                         # Methodology page
    changes.astro                             # Audit log page
    404.astro                                 # Not found page
    sitemap.txt.ts                            # Sitemap
  layouts/
    BaseLayout.astro                          # Site layout with header/footer
  styles/
    global.css                                # All styles (native CSS)
scripts/
  import.ts                                   # CLI: import research data
  review.ts                                   # CLI: review an artist
  publish.ts                                  # CLI: publish a reviewed artist
  withdraw.ts                                 # CLI: withdraw a published artist
  validate.ts                                 # CLI: validate store and export
  status.ts                                   # CLI: show publication status
  build-public-export.ts                      # CLI: build public export
  verify-export.ts                            # CLI: verify export has no drafts
  seed-initial-cohort.ts                      # One-time: seed initial published cohort
tests/
  unit/                                       # Vitest unit tests
  e2e/                                        # Playwright E2E tests
```

## Data

The research data (`src/data/palestine-directory-research-data.json`) contains:
- 919 artist entries with 1,043 evidence tuples
- 8,932 raw register entries across three campaign registers
- Evidence categories: G-D (direct), G-C (collective), S (solidarity), H (historical)
- Source links preserved for every evidence record

Only the 919 curated artist index entries become profiles. The 8,932 raw register entries are not published as profiles — they are reference data only.

See [DATA_MODEL.md](./DATA_MODEL.md) for the full data model.

## Publication safeguards

- **Zod validation**: All data validated at import time
- **Review gate**: Only reviewed artists can be published
- **Export filter**: Only published artists appear in the public export
- **Verification**: `npm run verify:export` checks no drafts leak into public output
- **Leakage tests**: Unit tests verify drafts, withdrawn, and unreviewed artists never appear in exports

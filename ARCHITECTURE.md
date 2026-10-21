# Architecture

## Locked stack

- **Astro** with static output — pages are prerendered at build time
- **Strict TypeScript** — directory interactivity runs client-side as plain TS
- **Native CSS** — all styles in `src/styles/global.css`, no frameworks
- **Zod** — JSON content validation at import, export, and write time
- **Vitest** — unit tests for schemas, importer, search, slug, campaigns, leakage
- **Playwright** — E2E tests for directory, profiles, campaigns, methodology

**Excluded by design**: database, PHP, frontend UI framework (React/Vue/Svelte), production app server.

## Data pipeline

```
Research JSON
    │
    ▼  Zod validation (researchDataSchema)
    │
Importer ── transform → canonical artists (draft)
    │
    ▼  Store to src/data/editorial/artists.json
    │
Editorial CLI ── review → publish → withdraw
    │
    ▼  Store updates (with audit log)
    │
buildPublicExport() ── filter published only
    │
    ▼  Write src/data/public-export.json (Zod validated)
    │
Astro build ── read export → generate static pages
    │
    ▼  verify-export.ts checks no drafts leak
    │
dist/ ── static HTML + client-side JS for search
```

## Search architecture

Search is **pure TypeScript** running client-side. No server, no index server, no database.

1. At build time, Astro reads `public-export.json` and passes the search index and full artist data to the page via `define:vars`
2. Client-side script implements:
   - Text search: tokenized, case-insensitive, scored by match quality
   - Campaign filter: AND semantics (artist must have evidence in ALL selected campaigns)
   - Category filter: AND semantics (artist must have evidence in ALL selected categories)
   - Record-level filtering: checks individual evidence records, not just the artist's tier
3. URL state: search query, filters, sort, and page are reflected in URL parameters
4. Pagination: 24 results per page

## Page generation

| Route | Type | Content |
|---|---|---|
| `/` | Static | Directory with search, filters, results |
| `/artists/[slug]` | Static (getStaticPaths) | One page per published artist |
| `/campaigns/` | Static | Campaign listing |
| `/campaigns/[slug]` | Static (getStaticPaths) | One page per campaign |
| `/methodology` | Static | Methodology and limitations |
| `/changes` | Static | Audit log from editorial store |
| `/404` | Static | Not found page |
| `/sitemap.txt` | Static endpoint | All published URLs |

## Editorial store

The editorial store (`src/data/editorial/`) is a file-based JSON store:

- `artists.json` — all 919 artists with their review/publication state
- `log.json` — audit log of all editorial actions

The store is managed exclusively through CLI commands. It is not committed to version control (added to `.gitignore` as it's regenerated from the research data + editorial actions).

## Idempotent import

Re-running `npm run import` preserves editorial state:
- Existing artists keep their `status`, `reviewedAt`, `reviewedBy`, `reviewNotes`
- New artists are added as drafts
- Updated evidence (name/tier/evidence changes) is applied while preserving review state

This allows the research data to be updated without losing editorial work.

## Architecture-change gates

Per the development prompt, the following changes require explicit approval:

1. **Substituting technologies** — the locked stack cannot be changed without approval
2. **Adding infrastructure** — no database, no server, no external services
3. **Changing the data model** — schema changes must preserve existing data
4. **Removing publication safeguards** — the review gate and export filter are non-negotiable

## Why no database?

The directory is a static site. The research data is a JSON file. The editorial store is JSON files. There is no need for a database — the data is read at build time and served as static files. Adding a database would introduce infrastructure complexity, security considerations, and operational overhead that this project does not need.

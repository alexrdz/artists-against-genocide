# ADR 0002: Kinetic Ledger Presentation with Dual Navigation and Retained Faceting

## Context
The mockup in `ui-design.html` presented directory results as an expandable kinetic ledger table with inline dossier drawers, whereas the Astro application had a card grid linking to dedicated artist profiles (`/artists/[slug]/`), backed by multi-select faceted filters (category and campaign checkboxes), sort options, pagination, and URL synchronization. Existing Playwright tests verify multi-select filtering and card-to-profile navigation.

## Decision
1. Retain the full multi-facet search engine, URL synchronization, sorting, and pagination logic.
2. Present results as Kinetic Ledger Rows (`.ledger-row`), retaining `.artist-card` as a companion class to preserve test and layout contracts.
3. Provide dual action on each row:
   - Primary heading/link navigates to the dedicated Artist Profile (`/artists/[slug]/`).
   - Accordion trigger expands the inline evidence dossier drawer (`.drawer-grid`, `.dossier-box`) for immediate inline reading without leaving the directory view.
4. Integrate mouse spotlight tracking (`--mouse-x`, `--mouse-y`) on the ledger rows.
5. Style the search and filter console using the design's `.console-bar` aesthetic combined with Elemental layout primitives (`[data-cluster]`, `[data-stack]`).

## Consequences
- Preserves 100% of test coverage and existing directory functionality (multi-facet selection, sorting, pagination, URL state).
- Incorporates the tactile, telemetry-style UX of the UI design mockup.
- Gives users fast inline reading without removing access to deep profile pages and related artist metadata.

# ADR 0001: Adopt Dark Architectural Aesthetic and Elemental Layout Primitives

## Context
The application previously used a light-mode vanilla CSS theme. A new high-fidelity visual design was created in `ui-deisgn/` featuring a dark architectural / classified archive aesthetic with high-contrast typography (`Space Grotesk`, `Instrument Serif`, `Inter`, `Geist Mono`), ambient luminescence, backdrop grids, and telemetry accents. Simultaneously, the workspace includes `src/styles/elemental`, an implementation of the Every Layout primitives (`[data-stack]`, `[data-cluster]`, `[data-split]`, `[data-grid]`, etc.).

## Decision
1. Apply the dark architectural theme globally across all routes (`BaseLayout.astro`, directory, artist profiles, campaigns, methodology, changes, 404).
2. Integrate `src/styles/elemental` as the standard layout primitive system across all pages and components.
3. Retain multi-page Astro routing and accessibility attributes in the site header, styling the navigation and status badges to match the UI design specification.

## Consequences
- Single unified design system across all views.
- Eliminates visual fragmentation between the homepage directory and deep profile/campaign pages.
- Standardizes layout logic using declarative data attributes instead of ad-hoc flex/grid wrappers.
- Preserves all automated test contracts and route navigation.

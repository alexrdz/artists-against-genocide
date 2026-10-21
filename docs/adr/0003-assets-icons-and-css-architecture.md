# ADR 0003: Asset Loading, Iconography, and CSS Architecture

## Context
The UI mockup loaded icons via an external Iconify CDN script and imported Google Fonts. The Astro application is an offline-capable, high-performance static site with locked dependencies and strict CSP considerations.

## Decision
1. **Fonts**: Load Google Fonts (`Space Grotesk`, `Instrument Serif`, `Inter`, `Geist Mono`) in `BaseLayout.astro` with `preconnect` resource hints and `display=swap`.
2. **Iconography**: Render Lucide icons as native inline SVG markup rather than loading client-side web components from an external CDN.
3. **CSS Architecture**: Import Elemental layout primitives (`@import './elemental/styles/index.css'`) within `src/styles/global.css`, layered with custom design tokens, dark architectural atmospheric layers, and component styles.

## Consequences
- Eliminates third-party runtime CDN dependencies and FOUC.
- Guaranteed offline and sandboxed build reliability.
- Zero extra JavaScript overhead for iconography.
- Preserves full fidelity with the Lucide icon shapes used in the design.

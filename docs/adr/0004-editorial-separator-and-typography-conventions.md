# ADR 0004: Standardize Editorial Separators and Typography Conventions

## Context
The design previously overused the programming-style double slash delimiter (`//`) across section coordinate headers, card badges, inline metadata, and drawer headers (e.g., `02 // SPOTLIGHT & EVIDENCE PILLARS`, `CAMPAIGN // 01`, `// Documented Record`, `Dec 2023 // #A4`). While suitable for cyber-brutalist tech interfaces, repetitive `//` diluted the serious archival and documentary character of Artists Against Genocide.

## Decision
Adopt a context-specific typographic separation system replacing `//`:

1. **Section Coordinate Markers:**
   - Use middle dots (`·`) instead of `//`:
   - `01 · START — PUBLIC ARCHIVE`
   - `02 · SPOTLIGHT & EVIDENCE PILLARS`
   - `03 · INTERACTIVE DIRECTORY LEDGER`
   - `04 · COLLECTIVE MOVEMENTS`
   - `05 · ARCHIVAL PROTOCOL & METHODOLOGY`
   - `06 · EDITORIAL AUDIT TIMELINE`
   - `ERROR · RECORD NOT LOCATED`

2. **Dossier & Profile Headers:**
   - Use middle dots (`·`):
   - `DOSSIER · ARTIST PROFILE`
   - `CAMPAIGN DOSSIER · [ID]`

3. **Campaign Badges:**
   - Use bracketed indexing (`CAMPAIGN [01]`, `CAMPAIGN [02]`, etc.) to convey structured catalog numbers.

4. **Inline Metadata & Audit Logs:**
   - Use middle dots (`·`) for inline attribute separation:
   - `Operator: {actor} · Impacted: {count} artists`
   - `Dec 2023 · #A4`
   - `{count} artists · Source: {domain}`

5. **Dossier Status Tags:**
   - Use status indicators (`● Documented Record`) rather than comment slashes.

## Consequences
- Creates a dignified, classical archival and Swiss editorial aesthetic.
- Eliminates visual noise and cliché comment delimiters without losing monospace precision.
- Maintains consistent conventions across both prototype files (`ui-deisgn/`) and production Astro routes (`src/pages/`).

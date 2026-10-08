# MFDCO Country Operations v11 test report

## Static checks
- JavaScript syntax: **45 files / 0 errors** (`node --check`)
- Top-level HTML: **33 files**
- Local CSS/JS missing references: **0**
  - Existing MFDCO shared asset `assets/logo.png` is intentionally supplied by the main site.
- v11 entry scripts verified:
  - `country-edit.html` → `country-v11.js` + `country-edit-v11.js`
  - `country.html` → `country-v11.js` + `country-view-v11.js`
  - `countries.html` → `country-v11.js` + `countries-v11.js`

## Local HTTP checks
Python local HTTP server returned HTTP 200 for:
- `countries.html`
- `country-edit.html`
- `country.html`
- `country-strength.html`
- `country-stats.html`
- `country-arsenal.html`
- `country-exchange.html`
- `index.html`

## Logic checks
- Auto-fill leaves existing values untouched and filled 30+ blank fields in a test country.
- Auto-fill created tax, welfare, police/security defaults when those lists were empty.
- Authoritarian/system, technology, wealth and economic stress classification paths executed.
- Daily market calculation is deterministic for the same country/date.
- Market OFF keeps configured values unchanged.
- Daieito sample regenerated as `schemaVersion: 11`.
- Daieito market dependencies and resource self-sufficiency records migrate to v11 records.

## SQL checks
- v11 incremental migration contains one transaction pair and balanced PostgreSQL dollar quotes.
- `mfdco_public_market_snapshots()` is present and grants execute only to anon/authenticated after revoking public default.
- Snapshot contains finance, social, technology, information, science, food, energy, military, companies, market dependencies, ports and resource-reserve context required by the simulation.

## Not executed here
- The SQL has **not** been run against the user's production Supabase project.
- Production RLS/Auth/Storage behavior must be verified after applying the migration.
- Headless Chromium rendering was attempted in the container but the environment did not complete reliably; page serving, file references and JavaScript syntax were verified instead.

# TEST REPORT v20.0 Foundation

## Static validation
- JavaScript: 51 / 51 passed `node --check`.
- HTML pages: 36.
- Missing local JS/CSS references: 0.
- All Country pages that load `country-core.js` also load `country-local-db.js`.
- All Country pages that load `country-cloud.js` also load `country-v20-data.js`.

## HTTP smoke test
HTTP 200:
- country-operations.html
- country-edit.html
- country-manage.html
- country-dashboard.html
- country.html
- country-market.html

## User storage
- IndexedDB database: `mfdco-country-user-v20`
- stores: drafts / ui / cache / queue / snapshots / files
- offline media fallback uses Blob in IndexedDB instead of DataURL in localStorage.
- editor drafts auto-save to IndexedDB.
- cloud save clears the matching editor draft.
- private archive target: Supabase Storage `country-user-data`.

## v20 database
Incremental SQL:
- 1 BEGIN / 1 COMMIT
- balanced PostgreSQL `$$` delimiters
Complete SQL:
- 15 BEGIN / 15 COMMIT
- balanced PostgreSQL `$$` delimiters

New tables:
- country_documents
- country_entities
- country_links
- country_metrics
- country_visibility_rules
- country_change_log
- country_market_events

## Feature foundation
The new operations page contains functional CRUD/data-entry foundations for:
- budget
- demographics
- food/power/resource supply-demand
- law/policy history
- regions
- cabinets/government history
- elections/parliament
- ministries/state organizations
- judiciary
- citizenship/residency rules
- trade partners/tariffs
- companies/market profiles
- national projects/goals
- technology/research
- disasters/crises
- public security/social stability
- embassies/diplomats
- treaty obligations
- diplomacy effects
- military inventory
- military organization
- official/draft/archive state
- visibility
- automatic calculated metrics
- diff/change history

## Security checks
- draft rows are not publicly readable merely because visibility=`public`.
- owner-only generic data requires the country owner for write access.
- user archive Storage path is restricted to the authenticated user's first folder.
- global market-event direct writes are not granted to normal authenticated users.

## Production not executed here
- SQL was not run against the production Supabase project.
- Production Auth/RLS/Storage behavior must be checked after applying the migration.

# MFDCO Country Operations v6

## Main changes
- Completed the missing shared runtime files (`country.css`, `country-core.js`, `country-cloud.js`, `country-v6.js`) so every country page can run.
- Product-level country editor with basic data, sovereignty, territory, population, government, administration, economy, currency, revenue/expenditure, industry, specialties, climate, culture, companies, parties, history, military, posts, systems and strength inputs.
- Compact history table designed for very large timelines.
- Era / period groups plus independent calendar and era-name conversion. A Gregorian year can automatically display an independent era year and “N years ago”.
- File-only media selection for flags, cover art, maps, capital images, national anthem, wiki images, company/party logos and post images.
- News post editor and individual article view.
- Country follow and post reaction schema.
- National-power analysis: unlimited total score, detailed factor breakdown, consistency warnings and explicit 100+/150+ guide labels.
- 33 chart templates plus automatic charts derived from budget, population, military and administration data.
- Wiki subpages for cities, people, companies, law, wars, equipment, ministries, regions, treaties, culture and more.
- National systems editor for education, healthcare, tax, transport, communications, finance, police, mobilization and other systems.
- MFDCO Map Data v1 JSON import/export bridge.
- International-organization schema and UI.
- Work official-adoption UI with branch and unit assignment.
- Country templates: blank, modern Japan base, island state, federation, resource state and military state.
- Version restore, archive and permanent-delete RPCs.
- v6 save RPC now UPSERTs stable country records instead of deleting/recreating every record.
- Search indexes and public-country search RPC.
- MFDCO header entry for Country Operations enabled.

## Compatibility
- LocalStorage mode still works when Supabase is not initialized.
- When the existing MFDCO `window.supabaseClient` is available, pages switch to cloud mode.
- Existing v5 installations can upgrade with `supabase/05_country_v6_features.sql`.

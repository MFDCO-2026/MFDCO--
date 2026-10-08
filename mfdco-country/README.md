# MFDCO Country Operations v15

v15 focuses on editor navigation reliability, multi-country context, diplomacy, and world-market history.

## Key changes
- Fixed left navigation in country editor.
- Main/active country selection in dashboard.
- Active country shown in global and country headers.
- Foreign-policy openness setting.
- Treaty creation fixed for local and Supabase modes.
- Fiction disclaimer on country-operation pages.
- YouTube links normalize to embedded YouTube privacy-enhanced player in the country overview.
- Monthly + daily + hourly world market simulation.
- Monthly/daily strong/weak resource selection.
- Main/active countries receive small deterministic simulation preference.
- Market history table + world-average screen.

## Database update
If v13 is already installed, run `MFDCO_country_v15_incremental.sql`.
For a fresh installation, use `MFDCO_country_supabase_v15.sql`.

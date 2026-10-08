# MFDCO Country v17.2 Test Report

## Static / syntax
- JavaScript: 47 / 47 files passed `node --check`.
- HTML pages scanned: 35.
- Unexpected missing local CSS/JS/HTML references: 0.
- Existing host-site dependency `assets/logo.png` remains external as before.

## HTTP smoke test
Local HTTP 200:
- country-edit.html
- country-history.html
- country-organizations.html
- country-market.html
- country-exchange.html
- country-dashboard.html

## Editor accordion
- `details` open/closed state stored in `detailState`.
- Add/delete/autofill capture current states before rerender.
- Tax and other table `＋追加` actions rerender the category while restoring the expanded card.

## History
- No `event` parameter => dedicated history editor.
- `event=<id>` => event detail page.
- Timeline / era / calendar add, edit, delete and save handlers present.
- History event images use the existing country media uploader.

## Organizations
- Founder is no longer excluded from Leave UI.
- Last active member shows `脱退して機関を削除`.
- Updated RPC returns `deleted` when active membership count becomes zero.
- Founder departure with remaining members transfers founder role and organization control.

## World economy
- 168 hourly points are reconstructed deterministically for anonymous display.
- World-average and selected-country SVG series are rendered.
- Login backfill uses `mfdco_backfill_market_history(jsonb)` in batches.
- Dashboard triggers background 72-hour backfill after login.
- Market page fills up to 168 hours within a 6000-row safety target.
- Hour transition automatically reloads the page.
- `country_market_history.country_id` is normalized to `text` to match `countries.id`.

## Diplomacy proposal
- Source country selector uses owner/admin-manageable countries.
- Active country is preferred as the initial source.
- Source preview includes flag, name and code.
- Changing proposal source does not change the global active-country preference.
- Relations and proposal history reload for the selected source country.

## Production-only checks
The following require the user's Supabase project:
1. Execute `MFDCO_country_v17_2_incremental.sql`.
2. Founder leave -> successor transfer under real Auth/RLS.
3. Final member leave -> organization cascade deletion.
4. Logged-in market history backfill RPC and subsequent anonymous read.
5. Proposal creation from a non-default managed country.

# MFDCO Country v17.3 Test Report

## Static
- JavaScript syntax: 47 / 47 passed with `node --check`.
- HTML pages: 35.
- Missing local JS/CSS references: 0.

## History
- Major period / minor period / regnal era structures are present.
- Timeline events support majorPeriodId / minorPeriodId / regnalEraId.
- Legacy flat era data remains compatible.

## Official Work adoption
- `mfdco_public_works_for_adoption(text, integer)` SQL RPC is included.
- Client uses the RPC first and direct approved-works SELECT as fallback.
- Picker includes reload/error state and up to 500 approved works.

## Hourly market
- Daily/monthly movement factors are no longer used by the market return model.
- Hourly settings: averageHourlyMovePct / maxHourlyMovePct.
- Test sample over 168 hours:
  - average absolute hourly move was about 0.01%
  - maximum observed hourly move stayed well below the 0.35% configured limit
  - material/regime changes occurred at irregular 1–10 hour gaps in the test window
- Market history backfill now updates conflicting old-model hourly rows.
- Market page renders stock index, company average, FX, world composite, company prices and OHLC-like values.

## Transport
- Highway and railway record types added to Country cloud serialization.
- Editor and public country page both render highway/railway details.

## HTTP smoke test
HTTP 200:
- country-edit.html
- country-history.html
- country-arsenal.html
- country-market.html
- country.html
- country-dashboard.html

## SQL
- Incremental SQL: balanced dollar quotes, 1 BEGIN / 1 COMMIT.
- Complete SQL v19: balanced dollar quotes, 14 BEGIN / 14 COMMIT.
- Includes Work adoption search RPC and hourly market backfill UPSERT.

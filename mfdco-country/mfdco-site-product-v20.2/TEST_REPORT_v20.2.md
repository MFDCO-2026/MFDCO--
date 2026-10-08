# MFDCO Country v20.2 Test Report

## JavaScript
- 51 / 51 files passed `node --check`.

## HTML
- 35 HTML pages checked.
- Missing local JS/CSS references: 0.
- Static HTTP smoke test: 200 OK
  - country-dashboard.html
  - country-manage.html
  - country-edit.html
  - country-operations.html
  - country.html
  - countries.html

## Collaboration
- MFDCO profile link helper present.
- Member search RPC accepts query + limit.
- Owner/admin/editor/viewer permission matrix enforced by RPC.
- Direct authenticated INSERT/UPDATE/DELETE on country_members revoked.
- Owner membership backfill included.
- Member update/remove/leave/revoke invitation RPCs included.
- Shared countries are returned by `mfdco_my_country_access()`.
- Dashboard displays owned and shared countries separately.

## Quotas
- Default owned-country limit: 5/account.
- Default account storage: 500 MiB.
- Default country shared storage: 250 MiB.
- Default single file: 25 MiB.
- Account usage includes country_media, country_assets, country-user-data.
- Shared-country uploads consume the uploader's account quota and country quota.
- country_assets DB quota trigger included.
- country_media compatibility quota RPC upgraded.
- private archive client preflight included.

## Lightweight data
- country_documents payload guard: 512 KiB.
- country_entities payload guard: 128 KiB.
- country_links payload guard: 128 KiB.

## SQL static checks
- v20.2 incremental dollar-quote count is balanced.
- v20.2 incremental top-level transaction: 1 BEGIN / 1 COMMIT.
- COMPLETE v21 dollar-quote count is balanced.
- COMPLETE v21 top-level migration blocks: balanced BEGIN / COMMIT count.

# MFDCO Country v20.3 Test Report

- JavaScript syntax: 51/51 passed.
- country-cloud offline owner fallback: removed.
- MFDCO account check: Auth user + profiles row.
- Country create button defaults hidden and only unlocks for MFDCO account.
- Template creation saves to Supabase before editor redirect.
- Public country page edit/manage actions are role-based.
- Country topbar edit/manage menu is role-based.
- Owner profile RPC exposes no email/auth secrets.
- Main editor/operations/manage/stats/wiki/geography/map/regions/systems/post-edit have access gates.
- Arsenal/exchange/organizations/rights no longer treat missing cloud connection as owner/admin/editor.
- Incremental SQL: 1 BEGIN / 1 COMMIT; balanced dollar quotes.
- Complete SQL v21.2: balanced dollar quotes.

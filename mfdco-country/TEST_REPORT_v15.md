# MFDCO Country v15 Test Report

## Critical editor navigation
- 14 navigation categories found.
- All 14 have a matching `cat-*` target section.
- Navigation uses explicit click handlers + `scrollIntoView()` rather than browser hash-only behavior.
- Active category tracking uses IntersectionObserver.
- Standalone `↳ 社会問題` entry removed; category is `社会・福祉・社会問題`.

## JavaScript
- All JavaScript files: `node --check` passed.
- Market v15 runtime smoke test passed: month/day/hour/resource themes generated and same seed/date produces same result.

## HTML/static references
- 35 HTML files checked.
- Duplicate HTML IDs: 0.
- Missing local references: only existing site asset `assets/logo.png` in `members.html` (expected to come from the main MFDCO site).

## HTTP
Local HTTP test returned 200 for:
- country-edit.html
- country.html
- country-dashboard.html
- country-organizations.html
- country-market.html
- countries.html

## Not executed
- Supabase v15 SQL has not been executed against the user's production database in this environment.
- Real RLS/auth integration must be checked after applying the incremental SQL.
- Visual Chromium automation was not used for this v15 pass; static/runtime/HTTP checks were used instead.

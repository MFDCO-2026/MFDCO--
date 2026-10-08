# MFDCO v13 Test Report

## Static validation
- JavaScript syntax: **46 files passed** (`node --check`, including integration JS).
- HTML pages scanned: **34**.
- Duplicate static HTML IDs: **0**.
- Unexpected local CSS/JS/file references: **0**.
- Remaining missing references are expected host-site files not bundled in this Country Operations package (`about.html`, `tools.html`, `news.html`, login/profile/submit pages and the existing `assets/logo.png`).

## Local HTTP validation
The following returned HTTP 200 from a local server:
- `countries.html`
- `country.html`
- `country-edit.html`
- `country-organizations.html`
- `country-rights.html`
- `country-arsenal.html`
- `country-stats.html`
- `country-dashboard.html`
- `country-media.html` (compatibility redirect page)
- `index.html`
- `mypage.html`
- `search.html`

## v13 assertions
- Country public page loads `country-media-inline.js`.
- Old `js/country-media.js` standalone uploader was removed from v13.
- Default media download setting is `deny`.
- Final quota constants are present: 250 MiB/country, 500 MiB/account, 25 MiB/file.
- Organization join modes and treaty tables/RPCs exist in v13 SQL.
- Founder-country RLS prevents claiming an unmanaged country as organization founder.
- Treaty-party direct writes are revoked; sign/withdraw uses RPC.

## Browser automation limitation
A Chromium headless DOM check was attempted. The container's Chromium process hung and timed out before returning DOM output. It was abandoned rather than blocking the build. This is the same class of environment-specific browser issue seen in earlier prototype validation. Therefore **no claim is made that automated Chromium visual testing passed**.

Do a final visual pass in the user's local Chromium/Chrome server before production deployment, especially:
- desktop + mobile header menus
- country topbar dropdowns
- country media cards and approval form
- organization/treaty cards
- long country names and many external links

## Production-only tests still required
These cannot be fully validated without the user's Supabase project and email secret:
1. Apply v13 SQL and run `supabase/16_v13_diagnostics.sql`.
2. Verify 25 MiB upload rejection.
3. Verify near-250 MiB country quota.
4. Verify near-500 MiB account quota across multiple countries.
5. Media `deny -> approval -> approved -> signed download` flow.
6. Contract email to requester + country owner.
7. Open / approval / closed organization membership.
8. Treaty create / sign / withdraw under real RLS.

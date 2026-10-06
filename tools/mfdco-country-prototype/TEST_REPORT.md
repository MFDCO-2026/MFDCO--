# MFDCO Country Operations v6 test report

## Static validation
- All JavaScript files passed `node --check`.
- All HTML-local CSS/JS references exist.
- 23 HTML pages and 27 JavaScript files are present.
- Every HTML page returned HTTP 200 from a local Python HTTP server.

## SQL packaging
- Fresh-install SQL: `supabase/01_country_module_v6.sql`
- v5 upgrade SQL: `supabase/05_country_v6_features.sql`
- Read-only diagnostics: `supabase/06_v6_diagnostics.sql`

## Not executed against production
The SQL was not executed against the user's real Supabase project. RLS behavior, existing schema conflicts, and real Storage uploads must be verified after applying to the actual project or a staging clone.

## Recommended manual acceptance tests
1. Anonymous user can list/open public countries but cannot edit.
2. Logged-in user can create up to 5 owned countries; 6th creation is blocked by DB.
3. editor can edit settings but cannot manage owners/members.
4. admin can invite editors/viewers; invitee must accept before access appears.
5. flag/cover/map/capital/anthem upload respects quota and signed URLs.
6. timeline handles hundreds of rows without expanding the whole page excessively.
7. custom era conversion shows Gregorian / era year / N years ago consistently.
8. diplomatic proposal can only be accepted by target-country managers.
9. accepted proposal creates one relation visible from both countries.
10. Work official adoption appears on country arsenal and Work integration output.
11. version restore creates a new current save while preserving history.
12. permanent delete requires exact country-name confirmation.

# v15 deployment

1. Back up the Supabase database.
2. If upgrading from v13, run `MFDCO_country_v15_incremental.sql`.
3. Run `MFDCO_country_v15_diagnostics.sql`.
4. Deploy the full v15 frontend tree.
5. Confirm login and set Main/Active country in `country-dashboard.html`.
6. Test `country-edit.html`: click every left category and confirm it scrolls to that section.
7. Test `country-organizations.html`: create a treaty in an organization you own.
8. Test `country-market.html`: confirm current country values and history.

The market feature is a fictional deterministic simulation and is not real financial information.

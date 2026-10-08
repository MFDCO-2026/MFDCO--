-- MFDCO Country v22 diagnostics
select to_regclass('public.countries') as countries, to_regclass('public.country_members') as country_members, to_regclass('public.country_account_limits') as account_limits;
select public.mfdco_is_mfdco_account(auth.uid()) as current_session_is_mfdco_account;
select auth.uid() as auth_user_id;

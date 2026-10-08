select to_regclass('public.country_user_preferences') as preferences_table, to_regclass('public.country_market_history') as market_history_table;
select count(*) as market_rows from public.country_market_history;

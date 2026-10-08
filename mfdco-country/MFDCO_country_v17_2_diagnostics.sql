select proname, prosecdef
from pg_proc
where proname in ('mfdco_leave_international_organization','mfdco_backfill_market_history')
order by proname;

select column_name,data_type
from information_schema.columns
where table_schema='public' and table_name='country_market_history'
order by ordinal_position;

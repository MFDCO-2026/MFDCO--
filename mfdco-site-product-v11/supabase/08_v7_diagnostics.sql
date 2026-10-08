-- MFDCO Country Operations v7 diagnostics
select 'countries' as item, count(*)::text as value from public.countries
union all select 'country_records', count(*)::text from public.country_records
union all select 'usage_requests', count(*)::text from public.country_usage_requests
union all select 'post_reactions', count(*)::text from public.country_post_reactions
union all select 'country_follows', count(*)::text from public.country_follows;

select proname, pg_get_function_identity_arguments(oid) as args
from pg_proc join pg_namespace n on n.oid=pronamespace
where n.nspname='public' and proname in (
 'mfdco_save_country','mfdco_public_country_feed','mfdco_respond_country_usage_request'
)
order by proname;

select tablename, policyname, cmd
from pg_policies
where schemaname='public' and tablename in ('countries','country_records','country_usage_requests')
order by tablename,policyname;

select id,name,schema_version,population,area_km2,strength_score,completeness_score
from public.countries
where archived_at is null
order by updated_at desc
limit 20;

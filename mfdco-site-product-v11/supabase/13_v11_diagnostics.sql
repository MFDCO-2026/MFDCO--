-- =========================================================
-- MFDCO Country Operations v11 diagnostics
-- Read-only checks after applying v11.
-- =========================================================

select 'countries' as object, count(*)::text as result from public.countries
union all
select 'country_records', count(*)::text from public.country_records
union all
select 'public_countries', count(*)::text from public.countries where is_public = true and archived_at is null;

select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname = 'mfdco_public_market_snapshots';

select record_type, count(*)
from public.country_records
where record_type in (
  'company','market_dependency','territory','dispute','border','overseas_base',
  'university','research_institution','welfare_program','policy','opinion_poll',
  'protest','trust_metric','equality_metric','police_org','criminal_org','ideology',
  'security_program','bank','conglomerate','resource_reserve','environment_issue',
  'sdg_goal','port','airport','heritage','social_platform'
)
group by record_type
order by record_type;

select id, name, is_public,
       core_data ->> 'schemaVersion' as schema_version,
       core_data #>> '{advanced,finance,autoMarketEnabled}' as market_auto
from public.countries
where archived_at is null
order by updated_at desc
limit 30;

-- MFDCO Country Operations v6 diagnostics (read-only)
select 'countries' item,to_regclass('public.countries')::text value union all
select 'country_records',to_regclass('public.country_records')::text union all
select 'country_media',to_regclass('public.country_media')::text union all
select 'country_relations',to_regclass('public.country_relations')::text union all
select 'country_member_invitations',to_regclass('public.country_member_invitations')::text union all
select 'country_work_adoptions',to_regclass('public.country_work_adoptions')::text union all
select 'international_organizations',to_regclass('public.international_organizations')::text union all
select 'international_organization_members',to_regclass('public.international_organization_members')::text union all
select 'country_follows',to_regclass('public.country_follows')::text union all
select 'country_post_reactions',to_regclass('public.country_post_reactions')::text;

select routine_name
from information_schema.routines
where routine_schema='public' and routine_name like 'mfdco_%country%'
order by routine_name;

select schemaname,tablename,policyname,roles,cmd
from pg_policies
where schemaname in ('public','storage')
  and (tablename like 'country%' or tablename like 'international_%' or policyname like 'country_%')
order by tablename,policyname;

select id,name,is_public,schema_version,population,area_km2,strength_score,completeness_score,updated_at
from public.countries
order by updated_at desc
limit 20;

select record_type,count(*)
from public.country_records
group by record_type
order by record_type;

select bucket_id,count(*) object_count,coalesce(sum((metadata->>'size')::bigint),0) bytes
from storage.objects
where bucket_id='country-media'
group by bucket_id;

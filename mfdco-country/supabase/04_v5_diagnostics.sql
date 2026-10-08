-- MFDCO Country v5 post-install diagnostics (read-only)
select 'countries' as item,count(*)::text as value from public.countries
union all select 'country_members',count(*)::text from public.country_members
union all select 'member_invitations',count(*)::text from public.country_member_invitations
union all select 'country_records',count(*)::text from public.country_records
union all select 'country_relations',count(*)::text from public.country_relations
union all select 'country_work_adoptions',count(*)::text from public.country_work_adoptions
union all select 'country_media',count(*)::text from public.country_media;

select
  proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and proname in (
    'mfdco_save_country',
    'mfdco_invite_country_member',
    'mfdco_respond_country_member_invitation',
    'mfdco_revoke_country_member_invitation',
    'mfdco_my_country_member_invitations',
    'mfdco_country_member_invitations',
    'mfdco_set_country_relation_status',
    'mfdco_public_country_feed'
  )
order by proname;

select id,name,is_public,population,area_km2,capital,government,strength_score,completeness_score,updated_at
from public.countries
where archived_at is null
order by updated_at desc
limit 20;

select id,name,public,file_size_limit,allowed_mime_types
from storage.buckets
where id='country-media';

select work_id,count(*) as active_country_adoptions
from public.country_work_adoptions
where status='active'
group by work_id
order by active_country_adoptions desc
limit 20;

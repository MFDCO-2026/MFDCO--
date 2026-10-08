-- =========================================================
-- MFDCO Country Operations v13 diagnostics
-- Read-only checks after applying v13.
-- =========================================================

-- 1. Core v13 tables
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'country_media_distribution_settings',
    'country_media_requests',
    'international_organizations',
    'international_organization_members',
    'international_organization_treaties',
    'international_treaty_parties'
  )
order by table_name;

-- 2. v13 columns
select table_name,column_name,data_type,column_default
from information_schema.columns
where table_schema='public'
  and (
    (table_name='country_media' and column_name in ('download_access_override','download_terms_override','display_name','updated_at'))
    or
    (table_name='international_organizations' and column_name in ('join_mode','headquarters','founded','website','founder_country_id'))
  )
order by table_name,column_name;

-- 3. Final Storage limits: expected 26,214,400 bytes = 25 MiB.
select id,name,public,file_size_limit,allowed_mime_types
from storage.buckets
where id in ('country-media','country-assets')
order by id;

-- 4. Quota function contains the final 250 MiB/country + 500 MiB/account constants.
select pg_get_functiondef('public.mfdco_check_country_media_quota(text,bigint,text)'::regprocedure) as quota_function;

-- 5. v13 RPC availability
select p.proname,
       pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'mfdco_list_country_page_media',
    'mfdco_set_country_media_defaults',
    'mfdco_set_country_media_rule',
    'mfdco_request_country_media',
    'mfdco_respond_country_media_request',
    'mfdco_get_country_media_download_path',
    'mfdco_join_international_organization',
    'mfdco_leave_international_organization',
    'mfdco_respond_international_org_member',
    'mfdco_sign_international_treaty',
    'mfdco_withdraw_international_treaty'
  )
order by p.proname;

-- 6. RLS policies relevant to v13
select schemaname,tablename,policyname,cmd,roles
from pg_policies
where schemaname='public'
  and tablename in (
    'country_media_distribution_settings',
    'country_media_requests',
    'international_organizations',
    'international_organization_members',
    'international_organization_treaties',
    'international_treaty_parties'
  )
order by tablename,policyname;

-- 7. Legacy standalone distribution upload is intentionally retired.
-- Expected: no INSERT/UPDATE policy for bucket country-assets.
select policyname,cmd,qual,with_check
from pg_policies
where schemaname='storage'
  and tablename='objects'
  and policyname like 'country_assets_objects_%'
order by policyname;

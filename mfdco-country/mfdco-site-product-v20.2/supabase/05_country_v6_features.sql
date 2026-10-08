-- ============================================================
-- MFDCO Country Operations v6 upgrade
-- Run AFTER 01_country_module_v5.sql + 03_country_v5_integrations.sql
-- ============================================================
begin;

create extension if not exists pg_trgm;

-- ------------------------------------------------------------
-- 1. Search / index improvements
-- ------------------------------------------------------------
create index if not exists countries_name_trgm_idx on public.countries using gin (name gin_trgm_ops);
create index if not exists countries_summary_trgm_idx on public.countries using gin (summary gin_trgm_ops);
create index if not exists country_records_payload_gin_idx on public.country_records using gin (payload jsonb_path_ops);
create index if not exists country_records_title_trgm_idx on public.country_records using gin (title gin_trgm_ops);

alter table public.country_work_adoptions
  add column if not exists unit_name text not null default '';

-- ------------------------------------------------------------
-- 2. International organizations
-- ------------------------------------------------------------
create table if not exists public.international_organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text not null default '',
  org_type text not null default 'その他',
  summary text not null default '',
  charter text not null default '',
  logo_key text not null default '',
  is_public boolean not null default true,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.international_organization_members (
  organization_id uuid not null references public.international_organizations(id) on delete cascade,
  country_id text not null references public.countries(id) on delete cascade,
  role text not null default 'member',
  status text not null default 'active' check(status in ('invited','active','suspended','left')),
  joined_at timestamptz not null default now(),
  primary key(organization_id,country_id)
);

create index if not exists international_org_members_country_idx
  on public.international_organization_members(country_id,status);

create or replace function public.mfdco_org_touch_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists international_org_touch on public.international_organizations;
create trigger international_org_touch before update on public.international_organizations
for each row execute function public.mfdco_org_touch_updated_at();

-- ------------------------------------------------------------
-- 3. Country follow + post reactions
-- ------------------------------------------------------------
create table if not exists public.country_follows (
  country_id text not null references public.countries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key(country_id,user_id)
);
create index if not exists country_follows_user_idx on public.country_follows(user_id,created_at desc);

create table if not exists public.country_post_reactions (
  record_id text not null references public.country_records(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'like' check(reaction in ('like')),
  created_at timestamptz not null default now(),
  primary key(record_id,user_id)
);
create index if not exists country_post_reactions_record_idx on public.country_post_reactions(record_id);

-- ------------------------------------------------------------
-- 4. v6 save RPC: UPSERT records instead of delete-all/insert-all.
-- Stable record ids allow reactions / references to survive saves.
-- ------------------------------------------------------------
create or replace function public.mfdco_save_country(
  p_core jsonb,
  p_records jsonb,
  p_snapshot jsonb
)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id text;
  v_owner uuid;
  v_exists boolean:=false;
  v_tags text[]:='{}'::text[];
  v_keep_ids text[]:='{}'::text[];
  r jsonb;
  v_record_id text;
  v_record_type text;
  v_is_new boolean;
  v_population bigint:=0;
  v_area numeric:=0;
  v_strength numeric:=0;
  v_completeness integer:=0;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if pg_column_size(coalesce(p_core,'{}'::jsonb)) > 1048576 then raise exception 'COUNTRY_CORE_TOO_LARGE: core data exceeds 1 MiB'; end if;
  if jsonb_typeof(coalesce(p_records,'[]'::jsonb)) <> 'array' then raise exception 'COUNTRY_RECORDS_INVALID'; end if;
  if jsonb_array_length(coalesce(p_records,'[]'::jsonb)) > 5000 then raise exception 'COUNTRY_RECORD_LIMIT_REACHED'; end if;
  if pg_column_size(coalesce(p_records,'[]'::jsonb)) > 5242880 then raise exception 'COUNTRY_RECORDS_TOO_LARGE'; end if;
  if pg_column_size(coalesce(p_snapshot,p_core,'{}'::jsonb)) > 6291456 then raise exception 'COUNTRY_SNAPSHOT_TOO_LARGE'; end if;

  v_id:=coalesce(nullif(p_core->>'id',''),gen_random_uuid()::text);
  select c.owner_id into v_owner from public.countries c where c.id=v_id;
  v_exists:=found;

  if jsonb_typeof(coalesce(p_core->'tags','[]'::jsonb))='array' then
    select coalesce(array_agg(value),'{}'::text[]) into v_tags
    from jsonb_array_elements_text(coalesce(p_core->'tags','[]'::jsonb)) as t(value);
  end if;

  begin v_population:=greatest(0,coalesce(nullif(p_core->>'population','')::bigint,0)); exception when others then v_population:=0; end;
  begin v_area:=greatest(0,coalesce(nullif(p_core #>> '{territory,area}','')::numeric,0)); exception when others then v_area:=0; end;
  begin v_strength:=greatest(0,coalesce(nullif(p_core #>> '{_index,strength}','')::numeric,0)); exception when others then v_strength:=0; end;
  begin v_completeness:=least(100,greatest(0,coalesce(nullif(p_core #>> '{_index,completeness}','')::integer,0))); exception when others then v_completeness:=0; end;

  if v_exists then
    if not public.mfdco_country_can_edit(v_id) then raise exception 'not allowed'; end if;
    update public.countries set
      name=coalesce(nullif(p_core->>'name',''),'名称未設定'),
      short_name=coalesce(p_core->>'shortName',''),
      english_name=coalesce(p_core->>'englishName',''),
      code=coalesce(p_core->>'code',''),
      slug=coalesce(nullif(p_core->>'slug',''),slug),
      summary=coalesce(p_core->>'summary',''),
      is_public=coalesce((coalesce(p_core->>'isPublic',p_core->>'public','false'))::boolean,false),
      tags=v_tags,
      schema_version=6,
      core_data=p_core,
      population=v_population,
      area_km2=v_area,
      capital=coalesce(p_core #>> '{capital,name}',p_core #>> '{basic,capital}',''),
      government=coalesce(p_core #>> '{government,system}',p_core #>> '{basic,government}',''),
      strength_score=v_strength,
      completeness_score=v_completeness,
      flag_key=coalesce(p_core #>> '{media,flagKey}',''),
      cover_key=coalesce(p_core #>> '{media,coverKey}','')
    where id=v_id;
  else
    insert into public.countries(
      id,owner_id,slug,name,short_name,english_name,code,summary,is_public,tags,schema_version,core_data,
      population,area_km2,capital,government,strength_score,completeness_score,flag_key,cover_key
    ) values (
      v_id,auth.uid(),nullif(p_core->>'slug',''),coalesce(nullif(p_core->>'name',''),'名称未設定'),
      coalesce(p_core->>'shortName',''),coalesce(p_core->>'englishName',''),coalesce(p_core->>'code',''),coalesce(p_core->>'summary',''),
      coalesce((coalesce(p_core->>'isPublic',p_core->>'public','false'))::boolean,false),v_tags,6,p_core,
      v_population,v_area,coalesce(p_core #>> '{capital,name}',p_core #>> '{basic,capital}',''),
      coalesce(p_core #>> '{government,system}',p_core #>> '{basic,government}',''),v_strength,v_completeness,
      coalesce(p_core #>> '{media,flagKey}',''),coalesce(p_core #>> '{media,coverKey}','')
    );
  end if;

  for r in select * from jsonb_array_elements(coalesce(p_records,'[]'::jsonb)) loop
    v_record_id:=coalesce(nullif(r->>'id',''),gen_random_uuid()::text);
    v_record_type:=coalesce(nullif(r->>'record_type',''),'other');
    if exists(select 1 from public.country_records cr where cr.id=v_record_id and cr.country_id<>v_id) then
      raise exception 'COUNTRY_RECORD_ID_COLLISION';
    end if;
    v_is_new:=not exists(select 1 from public.country_records cr where cr.id=v_record_id and cr.country_id=v_id);
    v_keep_ids:=array_append(v_keep_ids,v_record_id);

    insert into public.country_records(id,country_id,record_type,title,sort_order,payload,created_by)
    values(v_record_id,v_id,v_record_type,coalesce(r->>'title',''),coalesce((r->>'sort_order')::int,0),coalesce(r->'payload','{}'::jsonb),auth.uid())
    on conflict(id) do update set
      record_type=excluded.record_type,
      title=excluded.title,
      sort_order=excluded.sort_order,
      payload=excluded.payload,
      updated_at=now();

    if v_is_new and v_record_type='post' and coalesce((r->'payload'->>'published')::boolean,true) then
      insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
      select f.user_id,v_id,'country_post','フォロー中の国家が投稿しました',coalesce(r->>'title','新しい投稿'),'country-post.html?id='||v_id||'&post='||v_record_id
      from public.country_follows f
      where f.country_id=v_id and f.user_id<>auth.uid();
    end if;
  end loop;

  delete from public.country_records
  where country_id=v_id
    and not (id=any(v_keep_ids));

  insert into public.country_versions(country_id,created_by,snapshot)
  values(v_id,auth.uid(),coalesce(p_snapshot,p_core));
  delete from public.country_versions where id in (
    select id from public.country_versions where country_id=v_id order by created_at desc,id desc offset 30
  );
  return v_id;
end
$$;

-- ------------------------------------------------------------
-- 5. Public country search RPC
-- ------------------------------------------------------------
create or replace function public.mfdco_search_public_countries(p_query text default '',p_limit integer default 50,p_offset integer default 0)
returns table(
  id text,name text,short_name text,code text,summary text,tags text[],population bigint,area_km2 numeric,
  capital text,government text,strength_score numeric,completeness_score integer,flag_key text,cover_key text,updated_at timestamptz
)
language sql stable security definer set search_path=public as $$
 select c.id,c.name,c.short_name,c.code,c.summary,c.tags,c.population,c.area_km2,c.capital,c.government,c.strength_score,c.completeness_score,c.flag_key,c.cover_key,c.updated_at
 from public.countries c
 where c.is_public=true and c.archived_at is null
   and (coalesce(p_query,'')='' or c.name ilike '%'||p_query||'%' or c.summary ilike '%'||p_query||'%' or c.code ilike '%'||p_query||'%')
 order by c.updated_at desc
 limit least(greatest(coalesce(p_limit,50),1),100)
 offset greatest(coalesce(p_offset,0),0)
$$;

-- ------------------------------------------------------------
-- 6. RLS
-- ------------------------------------------------------------
alter table public.international_organizations enable row level security;
alter table public.international_organization_members enable row level security;
alter table public.country_follows enable row level security;
alter table public.country_post_reactions enable row level security;

drop policy if exists international_org_select on public.international_organizations;
create policy international_org_select on public.international_organizations for select to anon,authenticated
using(is_public=true or created_by=auth.uid());
drop policy if exists international_org_insert on public.international_organizations;
create policy international_org_insert on public.international_organizations for insert to authenticated with check(created_by=auth.uid());
drop policy if exists international_org_update on public.international_organizations;
create policy international_org_update on public.international_organizations for update to authenticated using(created_by=auth.uid()) with check(created_by=auth.uid());
drop policy if exists international_org_delete on public.international_organizations;
create policy international_org_delete on public.international_organizations for delete to authenticated using(created_by=auth.uid());

drop policy if exists international_org_members_select on public.international_organization_members;
create policy international_org_members_select on public.international_organization_members for select to anon,authenticated
using(exists(select 1 from public.international_organizations o where o.id=organization_id and (o.is_public or o.created_by=auth.uid())));
drop policy if exists international_org_members_insert on public.international_organization_members;
create policy international_org_members_insert on public.international_organization_members for insert to authenticated
with check(
  exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid())
  or public.mfdco_country_can_manage(country_id)
);
drop policy if exists international_org_members_update on public.international_organization_members;
create policy international_org_members_update on public.international_organization_members for update to authenticated
using(exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid()) or public.mfdco_country_can_manage(country_id));
drop policy if exists international_org_members_delete on public.international_organization_members;
create policy international_org_members_delete on public.international_organization_members for delete to authenticated
using(exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid()) or public.mfdco_country_can_manage(country_id));

drop policy if exists country_follows_select on public.country_follows;
create policy country_follows_select on public.country_follows for select to authenticated using(user_id=auth.uid());
drop policy if exists country_follows_insert on public.country_follows;
create policy country_follows_insert on public.country_follows for insert to authenticated with check(user_id=auth.uid() and public.mfdco_country_can_view(country_id));
drop policy if exists country_follows_delete on public.country_follows;
create policy country_follows_delete on public.country_follows for delete to authenticated using(user_id=auth.uid());

drop policy if exists country_post_reactions_select on public.country_post_reactions;
create policy country_post_reactions_select on public.country_post_reactions for select to anon,authenticated
using(exists(select 1 from public.country_records r where r.id=record_id and r.record_type='post' and public.mfdco_country_can_view(r.country_id)));
drop policy if exists country_post_reactions_insert on public.country_post_reactions;
create policy country_post_reactions_insert on public.country_post_reactions for insert to authenticated
with check(user_id=auth.uid() and exists(select 1 from public.country_records r where r.id=record_id and r.record_type='post' and public.mfdco_country_can_view(r.country_id)));
drop policy if exists country_post_reactions_delete on public.country_post_reactions;
create policy country_post_reactions_delete on public.country_post_reactions for delete to authenticated using(user_id=auth.uid());

-- ------------------------------------------------------------
-- 7. Grants
-- ------------------------------------------------------------
grant select on public.international_organizations to anon,authenticated;
grant insert,update,delete on public.international_organizations to authenticated;
grant select on public.international_organization_members to anon,authenticated;
grant insert,update,delete on public.international_organization_members to authenticated;
grant select,insert,delete on public.country_follows to authenticated;
grant select on public.country_post_reactions to anon,authenticated;
grant insert,delete on public.country_post_reactions to authenticated;
revoke execute on function public.mfdco_search_public_countries(text,integer,integer) from public;
grant execute on function public.mfdco_search_public_countries(text,integer,integer) to anon,authenticated;

commit;

-- Diagnostics
select 'v6 installed' as status,
  to_regclass('public.international_organizations') as organizations,
  to_regclass('public.country_follows') as follows,
  to_regclass('public.country_post_reactions') as reactions;

-- ------------------------------------------------------------
-- 8. Lifecycle / restore RPCs
-- ------------------------------------------------------------
begin;

create or replace function public.mfdco_archive_country(p_country_id text,p_archive boolean default true)
returns boolean
language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not exists(select 1 from public.countries c where c.id=p_country_id and c.owner_id=auth.uid()) then
    raise exception 'owner required';
  end if;
  update public.countries set archived_at=case when p_archive then now() else null end where id=p_country_id;
  return true;
end $$;

create or replace function public.mfdco_delete_country(p_country_id text,p_confirmation text)
returns boolean
language plpgsql security definer set search_path=public as $$
declare v_name text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select name into v_name from public.countries where id=p_country_id and owner_id=auth.uid() for update;
  if not found then raise exception 'owner required'; end if;
  if coalesce(p_confirmation,'')<>v_name then raise exception 'COUNTRY_NAME_CONFIRMATION_MISMATCH'; end if;
  delete from public.countries where id=p_country_id and owner_id=auth.uid();
  return true;
end $$;

create or replace function public.mfdco_country_version_snapshot(p_version_id bigint)
returns jsonb
language plpgsql stable security definer set search_path=public as $$
declare v_country text; v_snapshot jsonb;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select country_id,snapshot into v_country,v_snapshot from public.country_versions where id=p_version_id;
  if not found then raise exception 'version not found'; end if;
  if not public.mfdco_country_can_edit(v_country) then raise exception 'not allowed'; end if;
  return v_snapshot;
end $$;

revoke execute on function public.mfdco_archive_country(text,boolean) from public;
revoke execute on function public.mfdco_delete_country(text,text) from public;
revoke execute on function public.mfdco_country_version_snapshot(bigint) from public;
grant execute on function public.mfdco_archive_country(text,boolean) to authenticated;
grant execute on function public.mfdco_delete_country(text,text) to authenticated;
grant execute on function public.mfdco_country_version_snapshot(bigint) to authenticated;

commit;

-- MFDCO Country complete DB v20: v19 + v20 lightweight foundation
-- =====================================================================
-- MFDCO COUNTRY OPERATIONS / COMPLETE DATABASE SCHEMA v19-organized
-- Generated from the current v17.2 production schema.
--
-- PURPOSE
--   One paste-ready SQL file for the MFDCO Country module.
--   It supports both:
--     1) a fresh Country-module install in the existing MFDCO project, and
--     2) normalization/update of an existing Country-module installation.
--
-- IMPORTANT EXISTING MFDCO DEPENDENCIES
--   * Supabase Auth: auth.users
--   * public.profiles
--   * public.works
--
-- COUNTRY ID TYPE
--   public.countries.id is TEXT.
--   Every country_id / main_country_id / active_country_id in this file
--   is normalized to TEXT. Do not change only one of them to UUID.
--
-- STORAGE
--   country-media  : primary country media
--   country-assets : licensed/downloadable country assets
--
-- THIS SCRIPT
--   * preserves existing data
--   * uses CREATE TABLE IF NOT EXISTS / ALTER / CREATE OR REPLACE
--   * rebuilds current RLS policies, RPCs, triggers and grants
--   * includes v17.2 organization-leave and market-history behavior
--
-- Recommended before production execution:
--   Take a Supabase database backup.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- PREFLIGHT: this Country module integrates with the existing MFDCO DB.
-- Fail before schema changes if the two external application tables are
-- not present.
-- ---------------------------------------------------------------------
do $mfdco_preflight$
begin
  if to_regclass('public.profiles') is null then
    raise exception 'MFDCO dependency missing: public.profiles';
  end if;

  if to_regclass('public.works') is null then
    raise exception 'MFDCO dependency missing: public.works';
  end if;
end
$mfdco_preflight$;

-- ------------------------------------------------------------
-- TABLES
-- ------------------------------------------------------------

create table if not exists public.countries (
  id text primary key default gen_random_uuid()::text,
  owner_id uuid not null references auth.users(id) on delete cascade,
  slug text unique,
  name text not null,
  short_name text not null default '',
  english_name text not null default '',
  code text not null default '',
  summary text not null default '',
  is_public boolean not null default false,
  tags text[] not null default '{}',
  schema_version integer not null default 3,
  core_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz
);

create index if not exists countries_owner_idx
  on public.countries(owner_id);
create index if not exists countries_public_updated_idx
  on public.countries(is_public, updated_at desc)
  where archived_at is null;
create index if not exists countries_slug_idx
  on public.countries(slug)
  where slug is not null;

create table if not exists public.country_members (
  country_id text not null references public.countries(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','editor','viewer')),
  display_role text not null default '',
  joined_at timestamptz not null default now(),
  invited_by uuid references auth.users(id) on delete set null,
  primary key (country_id,user_id)
);

create index if not exists country_members_user_idx
  on public.country_members(user_id);

create table if not exists public.country_records (
  id text primary key,
  country_id text not null references public.countries(id) on delete cascade,
  record_type text not null,
  title text not null default '',
  sort_order integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists country_records_country_type_idx
  on public.country_records(country_id,record_type,sort_order);

create table if not exists public.country_versions (
  id bigint generated always as identity primary key,
  country_id text not null references public.countries(id) on delete cascade,
  created_by uuid references auth.users(id) on delete set null,
  snapshot jsonb not null,
  created_at timestamptz not null default now()
);

create index if not exists country_versions_country_idx
  on public.country_versions(country_id,created_at desc);

create table if not exists public.country_media (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  uploader_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  slot text not null default '',
  kind text not null default 'image' check(kind in ('image','audio','file')),
  mime_type text not null default '',
  original_name text not null default '',
  size_bytes bigint not null default 0 check(size_bytes >= 0),
  created_at timestamptz not null default now()
);

create index if not exists country_media_country_idx
  on public.country_media(country_id);
create index if not exists country_media_uploader_idx
  on public.country_media(uploader_id);
create index if not exists country_media_slot_idx
  on public.country_media(country_id,slot)
  where slot <> '';

create table if not exists public.country_proposals (
  id uuid primary key default gen_random_uuid(),
  source_country_id text not null references public.countries(id) on delete cascade,
  target_country_id text not null references public.countries(id) on delete cascade,
  proposal_type text not null,
  title text not null default '',
  body text not null default '',
  terms jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check(status in ('pending','accepted','rejected','cancelled','expired')),
  proposed_by uuid not null references auth.users(id) on delete cascade,
  responded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  check(source_country_id <> target_country_id)
);

create index if not exists country_proposals_source_idx
  on public.country_proposals(source_country_id,created_at desc);
create index if not exists country_proposals_target_idx
  on public.country_proposals(target_country_id,created_at desc);
create index if not exists country_proposals_pending_target_idx
  on public.country_proposals(target_country_id,created_at desc)
  where status='pending';

create table if not exists public.country_relations (
  id uuid primary key default gen_random_uuid(),
  country_a_id text not null references public.countries(id) on delete cascade,
  country_b_id text not null references public.countries(id) on delete cascade,
  relation_type text not null,
  title text not null default '',
  body text not null default '',
  terms jsonb not null default '{}'::jsonb,
  source_proposal_id uuid unique references public.country_proposals(id) on delete set null,
  status text not null default 'active' check(status in ('active','ended','suspended')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  check(country_a_id <> country_b_id)
);

create index if not exists country_relations_a_idx
  on public.country_relations(country_a_id,status);
create index if not exists country_relations_b_idx
  on public.country_relations(country_b_id,status);

create table if not exists public.country_notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  country_id text references public.countries(id) on delete cascade,
  notification_type text not null default 'info',
  title text not null,
  body text not null default '',
  link text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists country_notifications_user_idx
  on public.country_notifications(user_id,created_at desc);
create index if not exists country_notifications_unread_idx
  on public.country_notifications(user_id,created_at desc)
  where read_at is null;

-- ------------------------------------------------------------
-- SECURITY HELPERS
-- SECURITY DEFINER avoids recursive RLS checks on members.
-- ------------------------------------------------------------

create or replace function public.mfdco_country_role(p_country_id text)
returns text
language sql
stable
security definer
set search_path=public
as $$
  select case
    when c.owner_id = auth.uid() then 'owner'
    else (
      select cm.role
      from public.country_members cm
      where cm.country_id=c.id
        and cm.user_id=auth.uid()
      limit 1
    )
  end
  from public.countries c
  where c.id=p_country_id
    and c.archived_at is null
$$;

create or replace function public.mfdco_country_can_view(p_country_id text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.countries c
    where c.id=p_country_id
      and c.archived_at is null
      and (
        c.is_public
        or c.owner_id=auth.uid()
        or exists(
          select 1
          from public.country_members cm
          where cm.country_id=c.id
            and cm.user_id=auth.uid()
        )
      )
  )
$$;

create or replace function public.mfdco_country_can_edit(p_country_id text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.countries c
    where c.id=p_country_id
      and c.archived_at is null
      and (
        c.owner_id=auth.uid()
        or exists(
          select 1
          from public.country_members cm
          where cm.country_id=c.id
            and cm.user_id=auth.uid()
            and cm.role in ('owner','admin','editor')
        )
      )
  )
$$;

create or replace function public.mfdco_country_can_manage(p_country_id text)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select exists(
    select 1
    from public.countries c
    where c.id=p_country_id
      and c.archived_at is null
      and (
        c.owner_id=auth.uid()
        or exists(
          select 1
          from public.country_members cm
          where cm.country_id=c.id
            and cm.user_id=auth.uid()
            and cm.role in ('owner','admin')
        )
      )
  )
$$;

-- ------------------------------------------------------------
-- COMMON TRIGGERS
-- ------------------------------------------------------------

create or replace function public.mfdco_country_touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at=now();
  return new;
end
$$;

drop trigger if exists countries_touch_updated_at on public.countries;
create trigger countries_touch_updated_at
before update on public.countries
for each row execute function public.mfdco_country_touch_updated_at();

drop trigger if exists country_records_touch_updated_at on public.country_records;
create trigger country_records_touch_updated_at
before update on public.country_records
for each row execute function public.mfdco_country_touch_updated_at();

-- 5 owned countries / account. Advisory lock closes the concurrent-insert gap.
create or replace function public.mfdco_country_limit_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  n integer;
begin
  if auth.uid() is not null and new.owner_id <> auth.uid() then
    raise exception 'owner_id must be the signed-in user';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,0));

  select count(*) into n
  from public.countries
  where owner_id=new.owner_id
    and archived_at is null;

  if n >= 5 then
    raise exception 'COUNTRY_LIMIT_REACHED: one account can own up to 5 countries';
  end if;

  return new;
end
$$;

drop trigger if exists countries_limit_guard on public.countries;
create trigger countries_limit_guard
before insert on public.countries
for each row execute function public.mfdco_country_limit_guard();

-- country owner cannot silently be changed by an editor/admin.
create or replace function public.mfdco_country_protect_owner()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  if new.owner_id is distinct from old.owner_id then
    raise exception 'country owner cannot be changed directly';
  end if;
  return new;
end
$$;

drop trigger if exists countries_protect_owner on public.countries;
create trigger countries_protect_owner
before update on public.countries
for each row execute function public.mfdco_country_protect_owner();

-- Mirror the owner into country_members so UI queries can use one membership table.
create or replace function public.mfdco_country_seed_owner()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.country_members(country_id,user_id,role,display_role,invited_by)
  values(new.id,new.owner_id,'owner','所有者',new.owner_id)
  on conflict(country_id,user_id)
  do update set role='owner';
  return new;
end
$$;

drop trigger if exists countries_seed_owner on public.countries;
create trigger countries_seed_owner
after insert on public.countries
for each row execute function public.mfdco_country_seed_owner();

create or replace function public.mfdco_country_protect_owner_member()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_owner uuid;
  v_country_id text;
begin
  v_country_id := case when tg_op='DELETE' then old.country_id else new.country_id end;
  select owner_id into v_owner from public.countries where id=v_country_id;

  if tg_op='DELETE' and old.user_id=v_owner then
    raise exception 'country owner membership cannot be deleted';
  end if;

  if tg_op in ('INSERT','UPDATE') and new.user_id=v_owner and new.role<>'owner' then
    raise exception 'country owner must keep owner role';
  end if;

  if tg_op in ('INSERT','UPDATE') and new.user_id<>v_owner and new.role='owner' then
    raise exception 'owner role is reserved for countries.owner_id';
  end if;

  if tg_op='DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists country_members_protect_owner on public.country_members;
create trigger country_members_protect_owner
before insert or update or delete on public.country_members
for each row execute function public.mfdco_country_protect_owner_member();

-- ------------------------------------------------------------
-- MEDIA QUOTA
-- ------------------------------------------------------------

-- Friendly preflight check. p_slot lets replacement uploads subtract the old slot.
create or replace function public.mfdco_check_country_media_quota(
  p_country_id text,
  p_added_bytes bigint,
  p_slot text default ''
)
returns jsonb
language plpgsql
stable
security definer
set search_path=public
as $$
declare
  country_used bigint;
  account_used bigint;
  replaced_country bigint:=0;
  replaced_account bigint:=0;
  country_limit constant bigint:=262144000; -- 250 MiB
  account_limit constant bigint:=524288000; -- 500 MiB
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if not public.mfdco_country_can_edit(p_country_id) then
    raise exception 'not allowed';
  end if;

  select coalesce(sum(size_bytes),0) into country_used
  from public.country_media
  where country_id=p_country_id;

  select coalesce(sum(size_bytes),0) into account_used
  from public.country_media
  where uploader_id=auth.uid();

  if coalesce(p_slot,'') <> '' then
    select coalesce(sum(size_bytes),0) into replaced_country
    from public.country_media
    where country_id=p_country_id and slot=p_slot;

    select coalesce(sum(size_bytes),0) into replaced_account
    from public.country_media
    where country_id=p_country_id and slot=p_slot and uploader_id=auth.uid();
  end if;

  country_used := greatest(0,country_used-replaced_country);
  account_used := greatest(0,account_used-replaced_account);

  return jsonb_build_object(
    'allowed',
      country_used+greatest(0,coalesce(p_added_bytes,0))<=country_limit
      and account_used+greatest(0,coalesce(p_added_bytes,0))<=account_limit,
    'country_used',country_used,
    'country_limit',country_limit,
    'account_used',account_used,
    'account_limit',account_limit,
    'projected_country',country_used+greatest(0,coalesce(p_added_bytes,0)),
    'projected_account',account_used+greatest(0,coalesce(p_added_bytes,0))
  );
end
$$;

-- Final DB-side guard for media metadata inserts.
-- This closes normal concurrent insert races in country_media.
create or replace function public.mfdco_country_media_quota_guard()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  q jsonb;
begin
  -- service-role / SQL maintenance sessions have no auth.uid(); let them bypass this user quota guard.
  if auth.uid() is null then
    return new;
  end if;

  if new.uploader_id <> auth.uid() then
    raise exception 'uploader_id must be the signed-in user';
  end if;
  if not public.mfdco_country_can_edit(new.country_id) then
    raise exception 'not allowed';
  end if;

  perform pg_advisory_xact_lock(hashtextextended(new.country_id,0));
  perform pg_advisory_xact_lock(hashtextextended(new.uploader_id::text,1));

  q := public.mfdco_check_country_media_quota(new.country_id,new.size_bytes,new.slot);
  if not coalesce((q->>'allowed')::boolean,false) then
    raise exception 'COUNTRY_MEDIA_QUOTA_REACHED';
  end if;

  return new;
end
$$;

drop trigger if exists country_media_quota_guard on public.country_media;
create trigger country_media_quota_guard
before insert on public.country_media
for each row execute function public.mfdco_country_media_quota_guard();

-- ------------------------------------------------------------
-- COUNTRY SAVE RPC
-- country core JSON + variable record rows + full snapshot.
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
  r jsonb;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  -- Database payload limits. Images/audio are kept in Storage, not inside JSON.
  if pg_column_size(coalesce(p_core,'{}'::jsonb)) > 1048576 then
    raise exception 'COUNTRY_CORE_TOO_LARGE: core data exceeds 1 MiB';
  end if;
  if jsonb_typeof(coalesce(p_records,'[]'::jsonb)) <> 'array' then
    raise exception 'COUNTRY_RECORDS_INVALID: records must be a JSON array';
  end if;
  if jsonb_array_length(coalesce(p_records,'[]'::jsonb)) > 5000 then
    raise exception 'COUNTRY_RECORD_LIMIT_REACHED: maximum 5000 variable records';
  end if;
  if pg_column_size(coalesce(p_records,'[]'::jsonb)) > 5242880 then
    raise exception 'COUNTRY_RECORDS_TOO_LARGE: records exceed 5 MiB';
  end if;
  if pg_column_size(coalesce(p_snapshot,p_core,'{}'::jsonb)) > 6291456 then
    raise exception 'COUNTRY_SNAPSHOT_TOO_LARGE: snapshot exceeds 6 MiB';
  end if;

  v_id:=coalesce(nullif(p_core->>'id',''),gen_random_uuid()::text);

  select c.owner_id
    into v_owner
  from public.countries c
  where c.id=v_id;
  v_exists := found;

  if jsonb_typeof(coalesce(p_core->'tags','[]'::jsonb))='array' then
    select coalesce(array_agg(value),'{}'::text[])
      into v_tags
    from jsonb_array_elements_text(coalesce(p_core->'tags','[]'::jsonb)) as t(value);
  end if;

  if v_exists then
    if not public.mfdco_country_can_edit(v_id) then
      raise exception 'not allowed';
    end if;

    update public.countries
    set
      name=coalesce(nullif(p_core->>'name',''),'名称未設定'),
      short_name=coalesce(p_core->>'shortName',''),
      english_name=coalesce(p_core->>'englishName',''),
      code=coalesce(p_core->>'code',''),
      summary=coalesce(p_core->>'summary',''),
      is_public=coalesce((p_core->>'public')::boolean,false),
      tags=v_tags,
      schema_version=coalesce((p_core->>'schemaVersion')::int,3),
      core_data=p_core
    where id=v_id;
  else
    insert into public.countries(
      id,owner_id,name,short_name,english_name,code,summary,
      is_public,tags,schema_version,core_data
    ) values (
      v_id,
      auth.uid(),
      coalesce(nullif(p_core->>'name',''),'名称未設定'),
      coalesce(p_core->>'shortName',''),
      coalesce(p_core->>'englishName',''),
      coalesce(p_core->>'code',''),
      coalesce(p_core->>'summary',''),
      coalesce((p_core->>'public')::boolean,false),
      v_tags,
      coalesce((p_core->>'schemaVersion')::int,3),
      p_core
    );
  end if;

  delete from public.country_records where country_id=v_id;

  if jsonb_typeof(coalesce(p_records,'[]'::jsonb))='array' then
    for r in select * from jsonb_array_elements(coalesce(p_records,'[]'::jsonb))
    loop
      insert into public.country_records(
        id,country_id,record_type,title,sort_order,payload,created_by
      ) values (
        coalesce(nullif(r->>'id',''),gen_random_uuid()::text),
        v_id,
        coalesce(nullif(r->>'record_type',''),'other'),
        coalesce(r->>'title',''),
        coalesce((r->>'sort_order')::int,0),
        coalesce(r->'payload','{}'::jsonb),
        auth.uid()
      );
    end loop;
  end if;

  insert into public.country_versions(country_id,created_by,snapshot)
  values(v_id,auth.uid(),coalesce(p_snapshot,p_core));

  delete from public.country_versions
  where id in (
    select id
    from public.country_versions
    where country_id=v_id
    order by created_at desc,id desc
    offset 30
  );

  return v_id;
end
$$;

-- ------------------------------------------------------------
-- DIPLOMACY
-- Relations are generated server-side when the target accepts.
-- ------------------------------------------------------------

create or replace function public.mfdco_respond_country_proposal(
  p_proposal_id uuid,
  p_status text
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  p public.country_proposals%rowtype;
  rel_id uuid;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;
  if p_status not in ('accepted','rejected') then
    raise exception 'invalid response';
  end if;

  select * into p
  from public.country_proposals
  where id=p_proposal_id
  for update;

  if not found then
    raise exception 'proposal not found';
  end if;
  if p.status <> 'pending' then
    raise exception 'proposal already resolved';
  end if;
  if not public.mfdco_country_can_manage(p.target_country_id) then
    raise exception 'not allowed';
  end if;

  update public.country_proposals
  set status=p_status,
      responded_by=auth.uid(),
      responded_at=now()
  where id=p.id;

  if p_status='accepted' then
    insert into public.country_relations(
      country_a_id,country_b_id,relation_type,title,body,terms,source_proposal_id
    ) values (
      p.source_country_id,p.target_country_id,p.proposal_type,p.title,p.body,p.terms,p.id
    )
    returning id into rel_id;
  end if;

  insert into public.country_notifications(
    user_id,country_id,notification_type,title,body,link
  )
  select
    cm.user_id,
    p.source_country_id,
    'diplomacy_response',
    case
      when p_status='accepted' then '外交提案が受理されました'
      else '外交提案が拒否されました'
    end,
    coalesce(p.title,''),
    'country-exchange.html?from='||p.source_country_id
  from public.country_members cm
  where cm.country_id=p.source_country_id
    and cm.role in ('owner','admin');

  return rel_id;
end
$$;

create or replace function public.mfdco_notify_proposal()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.country_notifications(
    user_id,country_id,notification_type,title,body,link
  )
  select
    cm.user_id,
    new.target_country_id,
    'diplomacy',
    '外交提案が届きました',
    coalesce(new.title,''),
    'country-exchange.html?from='||new.target_country_id
  from public.country_members cm
  where cm.country_id=new.target_country_id
    and cm.role in ('owner','admin');

  return new;
end
$$;

drop trigger if exists country_proposal_notify on public.country_proposals;
create trigger country_proposal_notify
after insert on public.country_proposals
for each row execute function public.mfdco_notify_proposal();

-- ------------------------------------------------------------
-- OPTIONAL PROFILE-AWARE MEMBER DIRECTORY
-- public.profiles is already present in the MFDCO project.
-- Only id + activity_name are exposed by these RPCs.
-- ------------------------------------------------------------

create or replace function public.mfdco_country_members_with_profiles(p_country_id text)
returns table(
  user_id uuid,
  role text,
  display_role text,
  joined_at timestamptz,
  activity_name text
)
language sql
stable
security definer
set search_path=public
as $$
  select
    cm.user_id,
    cm.role,
    cm.display_role,
    cm.joined_at,
    coalesce(p.activity_name,'')::text as activity_name
  from public.country_members cm
  left join public.profiles p on p.id=cm.user_id
  where cm.country_id=p_country_id
    and public.mfdco_country_role(p_country_id) is not null
  order by
    case cm.role when 'owner' then 0 when 'admin' then 1 when 'editor' then 2 else 3 end,
    cm.joined_at
$$;

create or replace function public.mfdco_search_country_member_profiles(p_query text)
returns table(
  user_id uuid,
  activity_name text
)
language sql
stable
security definer
set search_path=public
as $$
  select p.id,coalesce(p.activity_name,'')::text
  from public.profiles p
  where auth.uid() is not null
    and (
      p.id::text = trim(coalesce(p_query,''))
      or (
        length(trim(coalesce(p_query,''))) >= 2
        and p.activity_name ilike '%'||trim(coalesce(p_query,''))||'%'
      )
    )
  order by
    case when lower(p.activity_name)=lower(trim(coalesce(p_query,''))) then 0 else 1 end,
    p.activity_name
  limit 10
$$;

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------

alter table public.countries enable row level security;
alter table public.country_members enable row level security;
alter table public.country_records enable row level security;
alter table public.country_versions enable row level security;
alter table public.country_media enable row level security;
alter table public.country_proposals enable row level security;
alter table public.country_relations enable row level security;
alter table public.country_notifications enable row level security;

-- Countries
drop policy if exists countries_select on public.countries;
create policy countries_select
on public.countries for select
using(public.mfdco_country_can_view(id));

drop policy if exists countries_insert on public.countries;
create policy countries_insert
on public.countries for insert
to authenticated
with check(auth.uid() is not null and owner_id=auth.uid());

drop policy if exists countries_update on public.countries;
create policy countries_update
on public.countries for update
to authenticated
using(public.mfdco_country_can_edit(id))
with check(public.mfdco_country_can_edit(id));

drop policy if exists countries_delete on public.countries;
create policy countries_delete
on public.countries for delete
to authenticated
using(owner_id=auth.uid());

-- Members: not public, even if the country is public.
drop policy if exists country_members_select on public.country_members;
create policy country_members_select
on public.country_members for select
to authenticated
using(public.mfdco_country_role(country_id) is not null);

drop policy if exists country_members_manage on public.country_members;
create policy country_members_manage
on public.country_members for all
to authenticated
using(public.mfdco_country_can_manage(country_id))
with check(public.mfdco_country_can_manage(country_id));

-- Variable records follow country visibility.
drop policy if exists country_records_select on public.country_records;
create policy country_records_select
on public.country_records for select
using(public.mfdco_country_can_view(country_id));

drop policy if exists country_records_write on public.country_records;
create policy country_records_write
on public.country_records for all
to authenticated
using(public.mfdco_country_can_edit(country_id))
with check(public.mfdco_country_can_edit(country_id));

-- Version history is private to editors.
drop policy if exists country_versions_select on public.country_versions;
create policy country_versions_select
on public.country_versions for select
to authenticated
using(public.mfdco_country_can_edit(country_id));

drop policy if exists country_versions_insert on public.country_versions;
create policy country_versions_insert
on public.country_versions for insert
to authenticated
with check(public.mfdco_country_can_edit(country_id));

-- Media metadata is private to country members.
-- Public viewers do not need metadata because the country JSON already stores cloud:path keys.
drop policy if exists country_media_select on public.country_media;
create policy country_media_select
on public.country_media for select
to authenticated
using(public.mfdco_country_role(country_id) is not null);

drop policy if exists country_media_write on public.country_media;
create policy country_media_write
on public.country_media for all
to authenticated
using(public.mfdco_country_can_edit(country_id))
with check(
  public.mfdco_country_can_edit(country_id)
  and uploader_id=auth.uid()
);

-- Diplomacy proposals are private to participants.
drop policy if exists country_proposals_select on public.country_proposals;
create policy country_proposals_select
on public.country_proposals for select
to authenticated
using(
  public.mfdco_country_role(source_country_id) is not null
  or public.mfdco_country_role(target_country_id) is not null
);

drop policy if exists country_proposals_insert on public.country_proposals;
create policy country_proposals_insert
on public.country_proposals for insert
to authenticated
with check(
  public.mfdco_country_can_manage(source_country_id)
  and proposed_by=auth.uid()
  and source_country_id<>target_country_id
);

-- No direct proposal update policy: acceptance/rejection goes through RPC.

-- Active relations can be read when at least one side can be viewed.
drop policy if exists country_relations_select on public.country_relations;
create policy country_relations_select
on public.country_relations for select
using(
  public.mfdco_country_can_view(country_a_id)
  or public.mfdco_country_can_view(country_b_id)
);

-- Notifications are always private to the user.
drop policy if exists country_notifications_select on public.country_notifications;
create policy country_notifications_select
on public.country_notifications for select
to authenticated
using(user_id=auth.uid());

drop policy if exists country_notifications_update on public.country_notifications;
create policy country_notifications_update
on public.country_notifications for update
to authenticated
using(user_id=auth.uid())
with check(user_id=auth.uid());

-- ------------------------------------------------------------
-- STORAGE
-- ------------------------------------------------------------

insert into storage.buckets(
  id,name,public,file_size_limit,allowed_mime_types
)
values(
  'country-media',
  'country-media',
  false,
  26214400,
  array[
    'image/png','image/jpeg','image/webp','image/gif',
    'audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/x-m4a'
  ]
)
on conflict(id) do update set
  public=false,
  file_size_limit=26214400,
  allowed_mime_types=excluded.allowed_mime_types;

-- Path format used by JS:
--   <country_id>/<uploader_uuid>/<timestamp>-<uuid>-<filename>

drop policy if exists country_media_objects_select on storage.objects;
create policy country_media_objects_select
on storage.objects for select
using(
  bucket_id='country-media'
  and public.mfdco_country_can_view((storage.foldername(name))[1])
);

drop policy if exists country_media_objects_insert on storage.objects;
create policy country_media_objects_insert
on storage.objects for insert
to authenticated
with check(
  bucket_id='country-media'
  and public.mfdco_country_can_edit((storage.foldername(name))[1])
  and (storage.foldername(name))[2]=auth.uid()::text
);

drop policy if exists country_media_objects_update on storage.objects;
create policy country_media_objects_update
on storage.objects for update
to authenticated
using(
  bucket_id='country-media'
  and public.mfdco_country_can_edit((storage.foldername(name))[1])
  and (storage.foldername(name))[2]=auth.uid()::text
)
with check(
  bucket_id='country-media'
  and public.mfdco_country_can_edit((storage.foldername(name))[1])
  and (storage.foldername(name))[2]=auth.uid()::text
);

drop policy if exists country_media_objects_delete on storage.objects;
create policy country_media_objects_delete
on storage.objects for delete
to authenticated
using(
  bucket_id='country-media'
  and public.mfdco_country_can_edit((storage.foldername(name))[1])
);

-- ------------------------------------------------------------
-- API GRANTS
-- ------------------------------------------------------------

-- Tables. RLS remains authoritative.
grant select on public.countries to anon,authenticated;
grant insert,update,delete on public.countries to authenticated;

grant select,insert,update,delete on public.country_records to authenticated;
grant select on public.country_records to anon;

grant select,insert,update,delete on public.country_members to authenticated;
grant select,insert on public.country_versions to authenticated;
grant select,insert,update,delete on public.country_media to authenticated;
grant select,insert on public.country_proposals to authenticated;
grant select on public.country_relations to anon,authenticated;
grant select,update on public.country_notifications to authenticated;

grant usage,select on sequence public.country_versions_id_seq to authenticated;
grant usage,select on sequence public.country_notifications_id_seq to authenticated;

-- Lock down SECURITY DEFINER RPCs then explicitly grant only what is needed.
revoke execute on function public.mfdco_country_role(text) from public;
revoke execute on function public.mfdco_country_can_view(text) from public;
revoke execute on function public.mfdco_country_can_edit(text) from public;
revoke execute on function public.mfdco_country_can_manage(text) from public;
revoke execute on function public.mfdco_check_country_media_quota(text,bigint,text) from public;
revoke execute on function public.mfdco_save_country(jsonb,jsonb,jsonb) from public;
revoke execute on function public.mfdco_respond_country_proposal(uuid,text) from public;
revoke execute on function public.mfdco_country_members_with_profiles(text) from public;
revoke execute on function public.mfdco_search_country_member_profiles(text) from public;

grant execute on function public.mfdco_country_role(text) to anon,authenticated;
grant execute on function public.mfdco_country_can_view(text) to anon,authenticated;
grant execute on function public.mfdco_country_can_edit(text) to authenticated;
grant execute on function public.mfdco_country_can_manage(text) to authenticated;
grant execute on function public.mfdco_check_country_media_quota(text,bigint,text) to authenticated;
grant execute on function public.mfdco_save_country(jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.mfdco_respond_country_proposal(uuid,text) to authenticated;
grant execute on function public.mfdco_country_members_with_profiles(text) to authenticated;
grant execute on function public.mfdco_search_country_member_profiles(text) to authenticated;

-- ------------------------------------------------------------
-- DONE
-- ------------------------------------------------------------
-- Do NOT put the service-role key in browser JavaScript.
-- Browser code uses the normal Supabase anon/publishable key + RLS.
-- ============================================================
-- MFDCO COUNTRY OPERATIONS / v5 integrations upgrade
-- Run AFTER 01_country_module.sql on an existing v4 install.
-- Adds:
--   * lightweight country-list index columns
--   * member invitation workflow
--   * country-level official Work adoptions
--   * public country news feed RPC
--   * relation suspend/end RPC
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. LIGHTWEIGHT LIST / SEARCH INDEX
-- ------------------------------------------------------------

alter table public.countries
  add column if not exists population bigint not null default 0,
  add column if not exists area_km2 numeric not null default 0,
  add column if not exists capital text not null default '',
  add column if not exists government text not null default '',
  add column if not exists strength_score numeric not null default 0,
  add column if not exists completeness_score integer not null default 0,
  add column if not exists flag_key text not null default '',
  add column if not exists cover_key text not null default '';

create index if not exists countries_strength_idx
  on public.countries(strength_score desc,updated_at desc)
  where archived_at is null and is_public=true;
create index if not exists countries_population_idx
  on public.countries(population desc,updated_at desc)
  where archived_at is null and is_public=true;

update public.countries
set
  population = greatest(0,coalesce(nullif(core_data->>'population','')::bigint,0)),
  area_km2 = greatest(0,coalesce(nullif(core_data #>> '{territory,area}','')::numeric,0)),
  capital = coalesce(core_data #>> '{basic,capital}',''),
  government = coalesce(core_data #>> '{basic,government}',''),
  strength_score = greatest(0,coalesce(nullif(core_data #>> '{_index,strength}','')::numeric,0)),
  completeness_score = least(100,greatest(0,coalesce(nullif(core_data #>> '{_index,completeness}','')::integer,0))),
  flag_key = coalesce(core_data #>> '{media,flagKey}',''),
  cover_key = coalesce(core_data #>> '{media,coverKey}','');

-- ------------------------------------------------------------
-- 2. MEMBER INVITATIONS
-- ------------------------------------------------------------

create table if not exists public.country_member_invitations (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  invitee_id uuid not null references auth.users(id) on delete cascade,
  role text not null check(role in ('admin','editor','viewer')),
  display_role text not null default '',
  invited_by uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending'
    check(status in ('pending','accepted','declined','revoked','expired')),
  created_at timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists country_member_invitations_invitee_idx
  on public.country_member_invitations(invitee_id,status,created_at desc);
create index if not exists country_member_invitations_country_idx
  on public.country_member_invitations(country_id,status,created_at desc);
create unique index if not exists country_member_invitations_pending_unique
  on public.country_member_invitations(country_id,invitee_id)
  where status='pending';

-- ------------------------------------------------------------
-- 3. COUNTRY-LEVEL OFFICIAL WORK ADOPTION
-- ------------------------------------------------------------

create table if not exists public.country_work_adoptions (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  work_id uuid not null references public.works(id) on delete cascade,
  designation text not null default '',
  category text not null default '',
  branch_name text not null default '',
  notes text not null default '',
  status text not null default 'active' check(status in ('active','retired','experimental')),
  adopted_at date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(country_id,work_id)
);

create index if not exists country_work_adoptions_country_idx
  on public.country_work_adoptions(country_id,status,adopted_at desc);
create index if not exists country_work_adoptions_work_idx
  on public.country_work_adoptions(work_id,status,created_at desc);

alter table public.works
  add column if not exists country_adoption_count bigint not null default 0;

create index if not exists works_country_adoption_count_idx
  on public.works(country_adoption_count desc,created_at desc);

create or replace function public.mfdco_touch_country_work_adoption()
returns trigger
language plpgsql
as $$
begin
  new.updated_at=now();
  return new;
end
$$;

drop trigger if exists country_work_adoptions_touch on public.country_work_adoptions;
create trigger country_work_adoptions_touch
before update on public.country_work_adoptions
for each row execute function public.mfdco_touch_country_work_adoption();

create or replace function public.mfdco_sync_country_adoption_count()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_work uuid;
begin
  v_work:=coalesce(new.work_id,old.work_id);
  update public.works
  set country_adoption_count=(
    select count(*)
    from public.country_work_adoptions a
    join public.countries c on c.id=a.country_id
    where a.work_id=v_work
      and a.status='active'
      and c.archived_at is null
  )
  where id=v_work;
  if tg_op='DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists country_work_adoptions_sync_count on public.country_work_adoptions;
create trigger country_work_adoptions_sync_count
after insert or update of status or delete on public.country_work_adoptions
for each row execute function public.mfdco_sync_country_adoption_count();

update public.works w
set country_adoption_count=(
  select count(*)
  from public.country_work_adoptions a
  join public.countries c on c.id=a.country_id
  where a.work_id=w.id and a.status='active' and c.archived_at is null
);

-- ------------------------------------------------------------
-- 4. INVITATION RPCS
-- ------------------------------------------------------------

create or replace function public.mfdco_invite_country_member(
  p_country_id text,
  p_invitee_id uuid,
  p_role text,
  p_display_role text default ''
)
returns uuid
language plpgsql
security definer
set search_path=public
as $$
declare
  v_id uuid;
  v_name text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.mfdco_country_can_manage(p_country_id) then raise exception 'not allowed'; end if;
  if p_role not in ('admin','editor','viewer') then raise exception 'invalid member role'; end if;
  if p_invitee_id is null or p_invitee_id=auth.uid() then raise exception 'invalid invitee'; end if;
  if exists(select 1 from public.country_members where country_id=p_country_id and user_id=p_invitee_id) then
    raise exception 'USER_ALREADY_COUNTRY_MEMBER';
  end if;

  update public.country_member_invitations
  set role=p_role,display_role=coalesce(p_display_role,''),invited_by=auth.uid(),created_at=now(),responded_at=null
  where country_id=p_country_id and invitee_id=p_invitee_id and status='pending'
  returning id into v_id;

  if v_id is null then
    insert into public.country_member_invitations(country_id,invitee_id,role,display_role,invited_by)
    values(p_country_id,p_invitee_id,p_role,coalesce(p_display_role,''),auth.uid())
    returning id into v_id;
  end if;

  select name into v_name from public.countries where id=p_country_id;
  insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
  values(
    p_invitee_id,p_country_id,'member_invitation','国家共同編集への招待',
    coalesce(v_name,'国家')||' から '||p_role||' 権限の招待が届きました。',
    'country-dashboard.html'
  );

  return v_id;
end
$$;

create or replace function public.mfdco_respond_country_member_invitation(
  p_invitation_id uuid,
  p_status text
)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  i public.country_member_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_status not in ('accepted','declined') then raise exception 'invalid response'; end if;

  select * into i
  from public.country_member_invitations
  where id=p_invitation_id
  for update;

  if not found then raise exception 'invitation not found'; end if;
  if i.invitee_id<>auth.uid() then raise exception 'not allowed'; end if;
  if i.status<>'pending' then raise exception 'invitation already resolved'; end if;

  update public.country_member_invitations
  set status=p_status,responded_at=now()
  where id=i.id;

  if p_status='accepted' then
    insert into public.country_members(country_id,user_id,role,display_role,invited_by)
    values(i.country_id,i.invitee_id,i.role,i.display_role,i.invited_by)
    on conflict(country_id,user_id) do update
      set role=excluded.role,display_role=excluded.display_role,invited_by=excluded.invited_by;

    insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
    select cm.user_id,i.country_id,'member_invitation_accepted','共同編集の招待が受理されました','新しい国家メンバーが参加しました。','country-manage.html?id='||i.country_id
    from public.country_members cm
    where cm.country_id=i.country_id and cm.role in ('owner','admin') and cm.user_id<>auth.uid();
  end if;

  return i.country_id;
end
$$;

create or replace function public.mfdco_revoke_country_member_invitation(p_invitation_id uuid)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  i public.country_member_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into i from public.country_member_invitations where id=p_invitation_id for update;
  if not found then return false; end if;
  if not public.mfdco_country_can_manage(i.country_id) then raise exception 'not allowed'; end if;
  if i.status<>'pending' then return false; end if;
  update public.country_member_invitations set status='revoked',responded_at=now() where id=i.id;
  return true;
end
$$;

create or replace function public.mfdco_my_country_member_invitations()
returns table(
  id uuid,country_id text,country_name text,country_code text,role text,display_role text,status text,created_at timestamptz,responded_at timestamptz
)
language sql
stable
security definer
set search_path=public
as $$
  select i.id,i.country_id,c.name,c.code,i.role,i.display_role,i.status,i.created_at,i.responded_at
  from public.country_member_invitations i
  join public.countries c on c.id=i.country_id
  where i.invitee_id=auth.uid()
  order by case when i.status='pending' then 0 else 1 end,i.created_at desc
$$;

create or replace function public.mfdco_country_member_invitations(p_country_id text)
returns table(
  id uuid,invitee_id uuid,activity_name text,role text,display_role text,status text,created_at timestamptz,responded_at timestamptz
)
language sql
stable
security definer
set search_path=public
as $$
  select i.id,i.invitee_id,coalesce(p.activity_name,'')::text,i.role,i.display_role,i.status,i.created_at,i.responded_at
  from public.country_member_invitations i
  left join public.profiles p on p.id=i.invitee_id
  where i.country_id=p_country_id and public.mfdco_country_can_manage(p_country_id)
  order by case when i.status='pending' then 0 else 1 end,i.created_at desc
$$;

-- ------------------------------------------------------------
-- 5. DIPLOMATIC RELATION STATUS RPC
-- ------------------------------------------------------------

create or replace function public.mfdco_set_country_relation_status(
  p_relation_id uuid,
  p_status text
)
returns boolean
language plpgsql
security definer
set search_path=public
as $$
declare
  r public.country_relations%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_status not in ('active','suspended','ended') then raise exception 'invalid relation status'; end if;
  select * into r from public.country_relations where id=p_relation_id for update;
  if not found then return false; end if;
  if not (public.mfdco_country_can_manage(r.country_a_id) or public.mfdco_country_can_manage(r.country_b_id)) then
    raise exception 'not allowed';
  end if;
  update public.country_relations
  set status=p_status,
      ended_at=case when p_status='ended' then now() else null end
  where id=r.id;
  return true;
end
$$;

-- ------------------------------------------------------------
-- 6. PUBLIC NEWS FEED RPC
-- ------------------------------------------------------------

create or replace function public.mfdco_public_country_feed(
  p_limit integer default 40,
  p_offset integer default 0
)
returns table(
  record_id text,
  country_id text,
  country_name text,
  country_code text,
  flag_key text,
  post_title text,
  post_date text,
  category text,
  body text,
  image_key text,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path=public
as $$
  select
    r.id,c.id,c.name,c.code,c.flag_key,r.title,
    coalesce(r.payload->>'date',''),
    coalesce(r.payload->>'category','更新'),
    coalesce(r.payload->>'body',''),
    coalesce(r.payload->>'imageKey',''),
    r.updated_at
  from public.country_records r
  join public.countries c on c.id=r.country_id
  where r.record_type='post'
    and c.is_public=true
    and c.archived_at is null
    and coalesce((r.payload->>'published')::boolean,true)=true
  order by coalesce(nullif(r.payload->>'date',''),'0000-00-00') desc,r.updated_at desc
  limit least(greatest(coalesce(p_limit,40),1),100)
  offset greatest(coalesce(p_offset,0),0)
$$;

-- ------------------------------------------------------------
-- 7. REPLACE SAVE RPC TO MAINTAIN INDEX COLUMNS
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
  r jsonb;
  v_population bigint:=0;
  v_area numeric:=0;
  v_strength numeric:=0;
  v_completeness integer:=0;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;

  if pg_column_size(coalesce(p_core,'{}'::jsonb)) > 1048576 then raise exception 'COUNTRY_CORE_TOO_LARGE: core data exceeds 1 MiB'; end if;
  if jsonb_typeof(coalesce(p_records,'[]'::jsonb)) <> 'array' then raise exception 'COUNTRY_RECORDS_INVALID: records must be a JSON array'; end if;
  if jsonb_array_length(coalesce(p_records,'[]'::jsonb)) > 5000 then raise exception 'COUNTRY_RECORD_LIMIT_REACHED: maximum 5000 variable records'; end if;
  if pg_column_size(coalesce(p_records,'[]'::jsonb)) > 5242880 then raise exception 'COUNTRY_RECORDS_TOO_LARGE: records exceed 5 MiB'; end if;
  if pg_column_size(coalesce(p_snapshot,p_core,'{}'::jsonb)) > 6291456 then raise exception 'COUNTRY_SNAPSHOT_TOO_LARGE: snapshot exceeds 6 MiB'; end if;

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
      short_name=coalesce(p_core->>'shortName',''),english_name=coalesce(p_core->>'englishName',''),code=coalesce(p_core->>'code',''),summary=coalesce(p_core->>'summary',''),
      is_public=coalesce((p_core->>'public')::boolean,false),tags=v_tags,schema_version=coalesce((p_core->>'schemaVersion')::int,3),core_data=p_core,
      population=v_population,area_km2=v_area,capital=coalesce(p_core #>> '{basic,capital}',''),government=coalesce(p_core #>> '{basic,government}',''),
      strength_score=v_strength,completeness_score=v_completeness,flag_key=coalesce(p_core #>> '{media,flagKey}',''),cover_key=coalesce(p_core #>> '{media,coverKey}','')
    where id=v_id;
  else
    insert into public.countries(
      id,owner_id,name,short_name,english_name,code,summary,is_public,tags,schema_version,core_data,
      population,area_km2,capital,government,strength_score,completeness_score,flag_key,cover_key
    ) values (
      v_id,auth.uid(),coalesce(nullif(p_core->>'name',''),'名称未設定'),coalesce(p_core->>'shortName',''),coalesce(p_core->>'englishName',''),coalesce(p_core->>'code',''),coalesce(p_core->>'summary',''),
      coalesce((p_core->>'public')::boolean,false),v_tags,coalesce((p_core->>'schemaVersion')::int,3),p_core,
      v_population,v_area,coalesce(p_core #>> '{basic,capital}',''),coalesce(p_core #>> '{basic,government}',''),v_strength,v_completeness,coalesce(p_core #>> '{media,flagKey}',''),coalesce(p_core #>> '{media,coverKey}','')
    );
  end if;

  delete from public.country_records where country_id=v_id;
  if jsonb_typeof(coalesce(p_records,'[]'::jsonb))='array' then
    for r in select * from jsonb_array_elements(coalesce(p_records,'[]'::jsonb)) loop
      insert into public.country_records(id,country_id,record_type,title,sort_order,payload,created_by)
      values(
        coalesce(nullif(r->>'id',''),gen_random_uuid()::text),v_id,coalesce(nullif(r->>'record_type',''),'other'),coalesce(r->>'title',''),
        coalesce((r->>'sort_order')::int,0),coalesce(r->'payload','{}'::jsonb),auth.uid()
      );
    end loop;
  end if;

  insert into public.country_versions(country_id,created_by,snapshot)
  values(v_id,auth.uid(),coalesce(p_snapshot,p_core));
  delete from public.country_versions where id in (
    select id from public.country_versions where country_id=v_id order by created_at desc,id desc offset 30
  );
  return v_id;
end
$$;

-- ------------------------------------------------------------
-- 8. RLS
-- ------------------------------------------------------------

alter table public.country_member_invitations enable row level security;
alter table public.country_work_adoptions enable row level security;

drop policy if exists country_member_invitations_select on public.country_member_invitations;
create policy country_member_invitations_select
on public.country_member_invitations for select to authenticated
using(invitee_id=auth.uid() or public.mfdco_country_can_manage(country_id));

-- All writes use RPCs.
drop policy if exists country_member_invitations_direct_insert on public.country_member_invitations;
drop policy if exists country_member_invitations_direct_update on public.country_member_invitations;
drop policy if exists country_member_invitations_direct_delete on public.country_member_invitations;

-- A country adoption is public only when the country itself is viewable and the Work is approved.
drop policy if exists country_work_adoptions_select on public.country_work_adoptions;
create policy country_work_adoptions_select
on public.country_work_adoptions for select to anon,authenticated
using(
  public.mfdco_country_can_view(country_id)
  and exists(select 1 from public.works w where w.id=work_id and w.status='approved')
);

drop policy if exists country_work_adoptions_insert on public.country_work_adoptions;
create policy country_work_adoptions_insert
on public.country_work_adoptions for insert to authenticated
with check(public.mfdco_country_can_manage(country_id) and created_by=auth.uid());

drop policy if exists country_work_adoptions_update on public.country_work_adoptions;
create policy country_work_adoptions_update
on public.country_work_adoptions for update to authenticated
using(public.mfdco_country_can_manage(country_id))
with check(public.mfdco_country_can_manage(country_id));

drop policy if exists country_work_adoptions_delete on public.country_work_adoptions;
create policy country_work_adoptions_delete
on public.country_work_adoptions for delete to authenticated
using(public.mfdco_country_can_manage(country_id));

-- ------------------------------------------------------------
-- 9. GRANTS
-- ------------------------------------------------------------

grant select on public.country_member_invitations to authenticated;
grant select on public.country_work_adoptions to anon,authenticated;
grant insert,update,delete on public.country_work_adoptions to authenticated;

revoke execute on function public.mfdco_invite_country_member(text,uuid,text,text) from public;
revoke execute on function public.mfdco_respond_country_member_invitation(uuid,text) from public;
revoke execute on function public.mfdco_revoke_country_member_invitation(uuid) from public;
revoke execute on function public.mfdco_my_country_member_invitations() from public;
revoke execute on function public.mfdco_country_member_invitations(text) from public;
revoke execute on function public.mfdco_set_country_relation_status(uuid,text) from public;
revoke execute on function public.mfdco_public_country_feed(integer,integer) from public;

grant execute on function public.mfdco_invite_country_member(text,uuid,text,text) to authenticated;
grant execute on function public.mfdco_respond_country_member_invitation(uuid,text) to authenticated;
grant execute on function public.mfdco_revoke_country_member_invitation(uuid) to authenticated;
grant execute on function public.mfdco_my_country_member_invitations() to authenticated;
grant execute on function public.mfdco_country_member_invitations(text) to authenticated;
grant execute on function public.mfdco_set_country_relation_status(uuid,text) to authenticated;
grant execute on function public.mfdco_public_country_feed(integer,integer) to anon,authenticated;

commit;


-- ==================== V6 UPGRADE ====================
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


-- ============================================================
-- MFDCO Country Operations v7 - upgrade from v6
-- ============================================================

alter table public.countries alter column schema_version set default 7;

-- Keep the v7 schema version when country data is saved.
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
  v_was_published boolean:=false;
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
      schema_version=7,
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
      coalesce((coalesce(p_core->>'isPublic',p_core->>'public','false'))::boolean,false),v_tags,7,p_core,
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
    select coalesce((cr.payload->>'published')::boolean,false) into v_was_published
    from public.country_records cr where cr.id=v_record_id and cr.country_id=v_id;
    v_was_published:=coalesce(v_was_published,false);
    v_keep_ids:=array_append(v_keep_ids,v_record_id);

    insert into public.country_records(id,country_id,record_type,title,sort_order,payload,created_by)
    values(v_record_id,v_id,v_record_type,coalesce(r->>'title',''),coalesce((r->>'sort_order')::int,0),coalesce(r->'payload','{}'::jsonb),auth.uid())
    on conflict(id) do update set
      record_type=excluded.record_type,
      title=excluded.title,
      sort_order=excluded.sort_order,
      payload=excluded.payload,
      updated_at=now();

    if v_record_type='post' and coalesce((r->'payload'->>'published')::boolean,true) and (v_is_new or not v_was_published) then
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
-- Usage / appearance requests
-- ------------------------------------------------------------
create table if not exists public.country_usage_requests (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  work_title text not null default '',
  intended_use text not null default '',
  message text not null default '',
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  response_message text not null default '',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists country_usage_requests_country_idx on public.country_usage_requests(country_id,status,created_at desc);
create index if not exists country_usage_requests_requester_idx on public.country_usage_requests(requester_id,created_at desc);
create unique index if not exists country_usage_requests_one_pending_idx on public.country_usage_requests(country_id,requester_id) where status='pending';

create or replace function public.mfdco_usage_request_touch()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists country_usage_requests_touch on public.country_usage_requests;
create trigger country_usage_requests_touch before update on public.country_usage_requests
for each row execute function public.mfdco_usage_request_touch();

create or replace function public.mfdco_notify_usage_request()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
  select u.user_id,new.country_id,'usage_request','国家設定の利用申請が届きました',
         coalesce(nullif(new.work_title,''),new.intended_use),
         'country-rights.html?id='||new.country_id
  from (
    select owner_id as user_id from public.countries where id=new.country_id
    union
    select user_id from public.country_members where country_id=new.country_id and role in ('owner','admin')
  ) u
  where u.user_id<>new.requester_id;
  return new;
end $$;
drop trigger if exists country_usage_request_notify on public.country_usage_requests;
create trigger country_usage_request_notify after insert on public.country_usage_requests
for each row execute function public.mfdco_notify_usage_request();

create or replace function public.mfdco_respond_country_usage_request(p_request_id uuid,p_status text,p_response text default '')
returns boolean language plpgsql security definer set search_path=public as $$
declare r public.country_usage_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  select * into r from public.country_usage_requests where id=p_request_id for update;
  if not found then return false; end if;
  if not public.mfdco_country_can_manage(r.country_id) then raise exception 'not allowed'; end if;
  if r.status<>'pending' then raise exception 'request is not pending'; end if;
  update public.country_usage_requests set status=p_status,response_message=coalesce(p_response,''),decided_by=auth.uid(),decided_at=now() where id=p_request_id;
  insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
  values(r.requester_id,r.country_id,'usage_request_response',case when p_status='approved' then '国家設定の利用申請が承認されました' else '国家設定の利用申請が拒否されました' end,coalesce(p_response,''),'country-rights.html?id='||r.country_id);
  return true;
end $$;

alter table public.country_usage_requests enable row level security;
drop policy if exists country_usage_requests_select on public.country_usage_requests;
create policy country_usage_requests_select on public.country_usage_requests for select to authenticated
using(requester_id=auth.uid() or public.mfdco_country_can_manage(country_id));
drop policy if exists country_usage_requests_insert on public.country_usage_requests;
create policy country_usage_requests_insert on public.country_usage_requests for insert to authenticated
with check(requester_id=auth.uid() and exists(select 1 from public.countries c where c.id=country_id and c.is_public=true and c.archived_at is null and coalesce(c.core_data #>> '{usagePolicy,appearance}','')='application'));
drop policy if exists country_usage_requests_delete on public.country_usage_requests;
create policy country_usage_requests_delete on public.country_usage_requests for delete to authenticated
using(requester_id=auth.uid() and status='pending');

grant select,insert,delete on public.country_usage_requests to authenticated;
revoke all on function public.mfdco_respond_country_usage_request(uuid,text,text) from public;
grant execute on function public.mfdco_respond_country_usage_request(uuid,text,text) to authenticated;

-- ------------------------------------------------------------
-- Expanded public feed fields for article summary/detail/URL
-- ------------------------------------------------------------
drop function if exists public.mfdco_public_country_feed(integer,integer);
create function public.mfdco_public_country_feed(p_limit integer default 40,p_offset integer default 0)
returns table(
  record_id text,country_id text,country_name text,country_code text,flag_key text,
  post_title text,post_date text,category text,summary text,body text,details text,url text,image_key text,updated_at timestamptz
)
language sql stable security definer set search_path=public as $$
  select r.id,c.id,c.name,c.code,c.flag_key,r.title,
    coalesce(r.payload->>'date',''),coalesce(r.payload->>'category','更新'),
    coalesce(r.payload->>'summary',''),coalesce(r.payload->>'body',''),coalesce(r.payload->>'details',''),coalesce(r.payload->>'url',''),
    coalesce(r.payload->>'imageKey',''),r.updated_at
  from public.country_records r join public.countries c on c.id=r.country_id
  where r.record_type='post' and c.is_public=true and c.archived_at is null
    and coalesce((r.payload->>'published')::boolean,true)=true
  order by coalesce(nullif(r.payload->>'date',''),'0000-00-00') desc,r.updated_at desc
  limit least(greatest(coalesce(p_limit,40),1),100) offset greatest(coalesce(p_offset,0),0)
$$;
revoke execute on function public.mfdco_public_country_feed(integer,integer) from public;
grant execute on function public.mfdco_public_country_feed(integer,integer) to anon,authenticated;

update public.countries set schema_version=7 where coalesce(core_data->>'schemaVersion','') ~ '^[0-9]+$' and (core_data->>'schemaVersion')::integer>=7;


-- ============================================================
-- MFDCO Country Operations v8 - data schema upgrade from v7
-- ============================================================

alter table public.countries alter column schema_version set default 8;

-- Keep the v8 schema version when country data is saved.
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
  v_was_published boolean:=false;
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
      schema_version=8,
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
      coalesce((coalesce(p_core->>'isPublic',p_core->>'public','false'))::boolean,false),v_tags,8,p_core,
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
    select coalesce((cr.payload->>'published')::boolean,false) into v_was_published
    from public.country_records cr where cr.id=v_record_id and cr.country_id=v_id;
    v_was_published:=coalesce(v_was_published,false);
    v_keep_ids:=array_append(v_keep_ids,v_record_id);

    insert into public.country_records(id,country_id,record_type,title,sort_order,payload,created_by)
    values(v_record_id,v_id,v_record_type,coalesce(r->>'title',''),coalesce((r->>'sort_order')::int,0),coalesce(r->'payload','{}'::jsonb),auth.uid())
    on conflict(id) do update set
      record_type=excluded.record_type,
      title=excluded.title,
      sort_order=excluded.sort_order,
      payload=excluded.payload,
      updated_at=now();

    if v_record_type='post' and coalesce((r->'payload'->>'published')::boolean,true) and (v_is_new or not v_was_published) then
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
-- Usage / appearance requests
-- ------------------------------------------------------------
create table if not exists public.country_usage_requests (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  work_title text not null default '',
  intended_use text not null default '',
  message text not null default '',
  status text not null default 'pending' check(status in ('pending','approved','rejected','cancelled')),
  response_message text not null default '',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists country_usage_requests_country_idx on public.country_usage_requests(country_id,status,created_at desc);
create index if not exists country_usage_requests_requester_idx on public.country_usage_requests(requester_id,created_at desc);
create unique index if not exists country_usage_requests_one_pending_idx on public.country_usage_requests(country_id,requester_id) where status='pending';

create or replace function public.mfdco_usage_request_touch()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;
drop trigger if exists country_usage_requests_touch on public.country_usage_requests;
create trigger country_usage_requests_touch before update on public.country_usage_requests
for each row execute function public.mfdco_usage_request_touch();

create or replace function public.mfdco_notify_usage_request()
returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
  select u.user_id,new.country_id,'usage_request','国家設定の利用申請が届きました',
         coalesce(nullif(new.work_title,''),new.intended_use),
         'country-rights.html?id='||new.country_id
  from (
    select owner_id as user_id from public.countries where id=new.country_id
    union
    select user_id from public.country_members where country_id=new.country_id and role in ('owner','admin')
  ) u
  where u.user_id<>new.requester_id;
  return new;
end $$;
drop trigger if exists country_usage_request_notify on public.country_usage_requests;
create trigger country_usage_request_notify after insert on public.country_usage_requests
for each row execute function public.mfdco_notify_usage_request();

create or replace function public.mfdco_respond_country_usage_request(p_request_id uuid,p_status text,p_response text default '')
returns boolean language plpgsql security definer set search_path=public as $$
declare r public.country_usage_requests%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  select * into r from public.country_usage_requests where id=p_request_id for update;
  if not found then return false; end if;
  if not public.mfdco_country_can_manage(r.country_id) then raise exception 'not allowed'; end if;
  if r.status<>'pending' then raise exception 'request is not pending'; end if;
  update public.country_usage_requests set status=p_status,response_message=coalesce(p_response,''),decided_by=auth.uid(),decided_at=now() where id=p_request_id;
  insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
  values(r.requester_id,r.country_id,'usage_request_response',case when p_status='approved' then '国家設定の利用申請が承認されました' else '国家設定の利用申請が拒否されました' end,coalesce(p_response,''),'country-rights.html?id='||r.country_id);
  return true;
end $$;

alter table public.country_usage_requests enable row level security;
drop policy if exists country_usage_requests_select on public.country_usage_requests;
create policy country_usage_requests_select on public.country_usage_requests for select to authenticated
using(requester_id=auth.uid() or public.mfdco_country_can_manage(country_id));
drop policy if exists country_usage_requests_insert on public.country_usage_requests;
create policy country_usage_requests_insert on public.country_usage_requests for insert to authenticated
with check(requester_id=auth.uid() and exists(select 1 from public.countries c where c.id=country_id and c.is_public=true and c.archived_at is null and coalesce(c.core_data #>> '{usagePolicy,appearance}','')='application'));
drop policy if exists country_usage_requests_delete on public.country_usage_requests;
create policy country_usage_requests_delete on public.country_usage_requests for delete to authenticated
using(requester_id=auth.uid() and status='pending');

grant select,insert,delete on public.country_usage_requests to authenticated;
revoke all on function public.mfdco_respond_country_usage_request(uuid,text,text) from public;
grant execute on function public.mfdco_respond_country_usage_request(uuid,text,text) to authenticated;

-- ------------------------------------------------------------
-- Expanded public feed fields for article summary/detail/URL
-- ------------------------------------------------------------
drop function if exists public.mfdco_public_country_feed(integer,integer);
create function public.mfdco_public_country_feed(p_limit integer default 40,p_offset integer default 0)
returns table(
  record_id text,country_id text,country_name text,country_code text,flag_key text,
  post_title text,post_date text,category text,summary text,body text,details text,url text,image_key text,updated_at timestamptz
)
language sql stable security definer set search_path=public as $$
  select r.id,c.id,c.name,c.code,c.flag_key,r.title,
    coalesce(r.payload->>'date',''),coalesce(r.payload->>'category','更新'),
    coalesce(r.payload->>'summary',''),coalesce(r.payload->>'body',''),coalesce(r.payload->>'details',''),coalesce(r.payload->>'url',''),
    coalesce(r.payload->>'imageKey',''),r.updated_at
  from public.country_records r join public.countries c on c.id=r.country_id
  where r.record_type='post' and c.is_public=true and c.archived_at is null
    and coalesce((r.payload->>'published')::boolean,true)=true
  order by coalesce(nullif(r.payload->>'date',''),'0000-00-00') desc,r.updated_at desc
  limit least(greatest(coalesce(p_limit,40),1),100) offset greatest(coalesce(p_offset,0),0)
$$;
revoke execute on function public.mfdco_public_country_feed(integer,integer) from public;
grant execute on function public.mfdco_public_country_feed(integer,integer) to anon,authenticated;

update public.countries set schema_version=8 where coalesce(core_data->>'schemaVersion','') ~ '^[0-9]+$' and (core_data->>'schemaVersion')::integer>=8;


-- MFDCO Country Operations v9 - site integration layer
begin;

create or replace function public.mfdco_profile_public_countries(p_user_id uuid)
returns table(id text,name text,short_name text,code text,summary text,population bigint,capital text,strength_score numeric,completeness_score integer,flag_key text,updated_at timestamptz)
language sql stable security definer set search_path=public as $$
 select c.id,c.name,c.short_name,c.code,c.summary,c.population,c.capital,c.strength_score,c.completeness_score,c.flag_key,c.updated_at
 from public.countries c
 where c.owner_id=p_user_id and c.is_public=true and c.archived_at is null
 order by c.updated_at desc;
$$;
revoke execute on function public.mfdco_profile_public_countries(uuid) from public;
grant execute on function public.mfdco_profile_public_countries(uuid) to anon,authenticated;

create or replace function public.mfdco_site_country_counts()
returns table(public_countries bigint,public_posts bigint,official_adoptions bigint)
language sql stable security definer set search_path=public as $$
 select
  (select count(*) from public.countries where is_public=true and archived_at is null),
  (select count(*) from public.country_records r join public.countries c on c.id=r.country_id where r.record_type='post' and coalesce(r.payload->>'status','published')='published' and c.is_public=true and c.archived_at is null),
  (select count(*) from public.country_work_adoptions a join public.countries c on c.id=a.country_id where a.status='active' and c.is_public=true and c.archived_at is null);
$$;
revoke execute on function public.mfdco_site_country_counts() from public;
grant execute on function public.mfdco_site_country_counts() to anon,authenticated;
commit;
-- =========================================================
-- MFDCO Country Operations v10 incremental migration
-- v9 -> v10
-- =========================================================
begin;

-- Formal equipment can now be grouped more finely and assigned to a unit.
alter table if exists public.country_work_adoptions
  add column if not exists unit_name text not null default '';

-- v10 UI adds a reserve state in addition to active / experimental / retired.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='country_work_adoptions'
  ) then
    alter table public.country_work_adoptions
      drop constraint if exists country_work_adoptions_status_check;
    alter table public.country_work_adoptions
      add constraint country_work_adoptions_status_check
      check (status in ('active','reserve','retired','experimental'));
  end if;
end $$;

create index if not exists country_work_adoptions_category_idx
  on public.country_work_adoptions(country_id,category,status,adopted_at desc);

commit;

-- Quick verification
select column_name,data_type
from information_schema.columns
where table_schema='public'
  and table_name='country_work_adoptions'
  and column_name in ('category','unit_name','status')
order by column_name;
-- =========================================================
-- MFDCO Country Operations v11 incremental
-- v10 -> v11
-- Advanced national statistics are stored in existing core_data / country_records.
-- This migration adds a compact public market snapshot RPC only.
-- =========================================================

begin;

create or replace function public.mfdco_public_market_snapshots()
returns table (
    id uuid,
    name text,
    payload jsonb
)
language sql
stable
security definer
set search_path = public
as $$
    select
        c.id,
        c.name,
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'isPublic', true,
            'population', c.population,
            'territory', jsonb_build_object('area', c.area_km2),
            'sovereignty', coalesce(c.core_data -> 'sovereignty', '{}'::jsonb),
            'economy', coalesce(c.core_data -> 'economy', '{}'::jsonb),
            'advanced', jsonb_build_object(
                'finance', coalesce(c.core_data #> '{advanced,finance}', '{}'::jsonb),
                'social', coalesce(c.core_data #> '{advanced,social}', '{}'::jsonb),
                'technology', coalesce(c.core_data #> '{advanced,technology}', '{}'::jsonb),
                'information', coalesce(c.core_data #> '{advanced,information}', '{}'::jsonb)
            ),
            'strength', coalesce(c.core_data -> 'strength', '{}'::jsonb),
            'science', coalesce(c.core_data -> 'science', '{}'::jsonb),
            'food', coalesce(c.core_data -> 'food', '{}'::jsonb),
            'energy', coalesce(c.core_data -> 'energy', '{}'::jsonb),
            'military', coalesce(c.core_data -> 'military', '{}'::jsonb),
            'industries', coalesce(c.core_data -> 'industries', '[]'::jsonb),
            'products', coalesce(c.core_data -> 'products', '[]'::jsonb),
            'resources', coalesce(c.core_data -> 'resources', '[]'::jsonb),
            'companies', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'company'
            ), '[]'::jsonb),
            'marketDependencies', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'market_dependency'
            ), '[]'::jsonb),
            'ports', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'port'
            ), '[]'::jsonb),
            'resourceReserves', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'resource_reserve'
            ), '[]'::jsonb)
        ) as payload
    from public.countries c
    where c.is_public = true
      and c.archived_at is null;
$$;

revoke all on function public.mfdco_public_market_snapshots() from public;
grant execute on function public.mfdco_public_market_snapshots() to anon, authenticated;

commit;

-- Check
select proname
from pg_proc
where proname = 'mfdco_public_market_snapshots';


-- =========================================================
-- MFDCO Country Operations v12 incremental migration
-- v11 -> v12
-- Formal adoption multi-select + country asset licensing
-- =========================================================
begin;

alter table if exists public.country_work_adoptions
  add column if not exists branch_names text[] not null default '{}'::text[],
  add column if not exists unit_names text[] not null default '{}'::text[];
update public.country_work_adoptions set branch_names=array[branch_name] where coalesce(branch_name,'')<>'' and cardinality(branch_names)=0;
update public.country_work_adoptions set unit_names=array[unit_name] where coalesce(unit_name,'')<>'' and cardinality(unit_names)=0;

create table if not exists public.country_assets (
 id uuid primary key default gen_random_uuid(),
 country_id text not null references public.countries(id) on delete cascade,
 uploader_id uuid not null references auth.users(id) on delete cascade,
 storage_path text not null unique,
 title text not null default '', description text not null default '',
 kind text not null default 'image' check(kind in ('image','audio','file')),
 mime_type text not null default '', original_name text not null default '', size_bytes bigint not null default 0,
 tags text[] not null default '{}'::text[],
 download_access text not null default 'deny' check(download_access in ('allow','deny','approval')),
 terms text not null default '', preview_allowed boolean not null default true, is_listed boolean not null default true,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists country_assets_country_idx on public.country_assets(country_id,is_listed,created_at desc);

create table if not exists public.country_asset_requests (
 id uuid primary key default gen_random_uuid(),
 country_id text not null references public.countries(id) on delete cascade,
 asset_id uuid not null references public.country_assets(id) on delete cascade,
 requester_id uuid not null references auth.users(id) on delete cascade,
 requester_name text not null default '', purpose text not null, details text not null default '',
 status text not null default 'pending' check(status in ('pending','approved','rejected','expired','revoked')),
 expires_at timestamptz, decision_note text not null default '', decided_by uuid references auth.users(id) on delete set null, decided_at timestamptz,
 contract_snapshot jsonb not null default '{}'::jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists country_asset_requests_country_idx on public.country_asset_requests(country_id,status,created_at desc);
create index if not exists country_asset_requests_requester_idx on public.country_asset_requests(requester_id,status,created_at desc);
create unique index if not exists country_asset_requests_pending_unique on public.country_asset_requests(asset_id,requester_id) where status='pending';

alter table public.country_assets enable row level security;
alter table public.country_asset_requests enable row level security;

drop policy if exists country_assets_read on public.country_assets;
create policy country_assets_read on public.country_assets for select to anon,authenticated using(
 public.mfdco_country_role(country_id) is not null or (is_listed and public.mfdco_country_can_view(country_id))
);
drop policy if exists country_assets_write on public.country_assets;
create policy country_assets_write on public.country_assets for all to authenticated using(public.mfdco_country_can_edit(country_id)) with check(public.mfdco_country_can_edit(country_id) and uploader_id=auth.uid());

drop policy if exists country_asset_requests_read on public.country_asset_requests;
create policy country_asset_requests_read on public.country_asset_requests for select to authenticated using(requester_id=auth.uid() or public.mfdco_country_role(country_id) is not null);
drop policy if exists country_asset_requests_insert on public.country_asset_requests;
create policy country_asset_requests_insert on public.country_asset_requests for insert to authenticated with check(requester_id=auth.uid() and status='pending' and char_length(btrim(purpose))>0 and exists(select 1 from public.country_assets a where a.id=asset_id and a.country_id=country_id and a.download_access='approval' and a.is_listed));

grant select on public.country_assets to anon,authenticated;
grant insert,update,delete on public.country_assets to authenticated;
grant select,insert on public.country_asset_requests to authenticated;

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('country-assets','country-assets',false,104857600,array['image/png','image/jpeg','image/webp','image/gif','audio/mpeg','audio/ogg','audio/wav','audio/mp4','audio/x-m4a','application/zip','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=104857600,allowed_mime_types=excluded.allowed_mime_types;

create or replace function public.mfdco_country_asset_can_download(p_path text)
returns boolean language sql stable security definer set search_path=public as $$
 select exists(
   select 1 from public.country_assets a
   where a.storage_path=p_path and (
     public.mfdco_country_role(a.country_id) is not null
     or (a.is_listed and a.download_access='allow' and public.mfdco_country_can_view(a.country_id))
     or exists(select 1 from public.country_asset_requests r where r.asset_id=a.id and r.requester_id=auth.uid() and r.status='approved' and (r.expires_at is null or r.expires_at>now()))
   )
 )
$$;
revoke all on function public.mfdco_country_asset_can_download(text) from public;
grant execute on function public.mfdco_country_asset_can_download(text) to anon,authenticated;

drop policy if exists country_assets_objects_select on storage.objects;
create policy country_assets_objects_select on storage.objects for select to anon,authenticated using(bucket_id='country-assets' and public.mfdco_country_asset_can_download(name));
drop policy if exists country_assets_objects_insert on storage.objects;
create policy country_assets_objects_insert on storage.objects for insert to authenticated with check(bucket_id='country-assets' and public.mfdco_country_can_edit((storage.foldername(name))[1]) and (storage.foldername(name))[2]=auth.uid()::text);
drop policy if exists country_assets_objects_delete on storage.objects;
create policy country_assets_objects_delete on storage.objects for delete to authenticated using(bucket_id='country-assets' and public.mfdco_country_can_edit((storage.foldername(name))[1]));

create or replace function public.mfdco_list_country_assets(p_country_id text)
returns setof public.country_assets language sql stable security definer set search_path=public as $$
 select * from public.country_assets a where a.country_id=p_country_id and (public.mfdco_country_role(p_country_id) is not null or (a.is_listed and public.mfdco_country_can_view(p_country_id))) order by a.created_at desc
$$;
revoke all on function public.mfdco_list_country_assets(text) from public;
grant execute on function public.mfdco_list_country_assets(text) to anon,authenticated;

create or replace function public.mfdco_get_country_asset_path(p_asset_id uuid)
returns text language plpgsql stable security definer set search_path=public as $$
declare a public.country_assets%rowtype;
begin select * into a from public.country_assets where id=p_asset_id;if not found then return null;end if;if public.mfdco_country_asset_can_download(a.storage_path) then return a.storage_path;end if;return null;end $$;
revoke all on function public.mfdco_get_country_asset_path(uuid) from public;
grant execute on function public.mfdco_get_country_asset_path(uuid) to anon,authenticated;

create or replace function public.mfdco_respond_country_asset_request(p_request_id uuid,p_status text,p_expires_at timestamptz default null,p_note text default '')
returns uuid language plpgsql security definer set search_path=public as $$
declare r public.country_asset_requests%rowtype; a public.country_assets%rowtype;
begin
 if p_status not in ('approved','rejected','revoked') then raise exception 'invalid status';end if;
 select * into r from public.country_asset_requests where id=p_request_id for update;
 if not found then raise exception 'request not found';end if;
 if not public.mfdco_country_can_edit(r.country_id) then raise exception 'not allowed';end if;
 select * into a from public.country_assets where id=r.asset_id;
 update public.country_asset_requests set status=p_status,expires_at=case when p_status='approved' then p_expires_at else null end,decision_note=coalesce(p_note,''),decided_by=auth.uid(),decided_at=now(),updated_at=now(),contract_snapshot=jsonb_build_object('country_id',r.country_id,'asset_id',r.asset_id,'asset_title',a.title,'terms',a.terms,'requester_name',r.requester_name,'purpose',r.purpose,'details',r.details,'status',p_status,'expires_at',p_expires_at,'decision_note',p_note,'decided_at',now()) where id=p_request_id;
 return p_request_id;
end $$;
revoke all on function public.mfdco_respond_country_asset_request(uuid,text,timestamptz,text) from public;
grant execute on function public.mfdco_respond_country_asset_request(uuid,text,timestamptz,text) to authenticated;

commit;
-- =========================================================
-- MFDCO Country Operations v13 incremental migration
-- v12 -> v13
-- Header/UI changes require no DB migration.
-- =========================================================
begin;

-- ---------------------------------------------------------
-- 1. Finalized media limits
--    250 MiB / country, 500 MiB / account are enforced by
--    the existing country_media quota guard.
--    This migration fixes every country media bucket to 25 MiB/file.
-- ---------------------------------------------------------
update storage.buckets
set file_size_limit = 26214400
where id in ('country-media','country-assets');

-- Legacy country-assets upload flow is retired in v13.
-- Existing objects remain readable by the old compatibility policies,
-- but new distribution uses media already attached to the country page.
drop policy if exists country_assets_objects_insert on storage.objects;
drop policy if exists country_assets_objects_update on storage.objects;

-- ---------------------------------------------------------
-- 2. Distribution settings on page-attached country_media
-- ---------------------------------------------------------
alter table public.country_media
  add column if not exists download_access_override text null,
  add column if not exists download_terms_override text null,
  add column if not exists display_name text not null default '',
  add column if not exists updated_at timestamptz not null default now();

alter table public.country_media
  drop constraint if exists country_media_download_access_override_check;
alter table public.country_media
  add constraint country_media_download_access_override_check
  check(download_access_override is null or download_access_override in ('deny','approval','allow'));

create table if not exists public.country_media_distribution_settings (
  country_id text primary key references public.countries(id) on delete cascade,
  default_access text not null default 'deny'
    check(default_access in ('deny','approval','allow')),
  default_terms text not null default '',
  request_note text not null default '',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.country_media_requests (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  media_id uuid not null references public.country_media(id) on delete cascade,
  requester_id uuid not null references auth.users(id) on delete cascade,
  requester_name text not null,
  purpose text not null,
  details text not null default '',
  status text not null default 'pending'
    check(status in ('pending','approved','rejected','expired','cancelled')),
  expires_at timestamptz null,
  decision_note text not null default '',
  decided_by uuid references auth.users(id) on delete set null,
  decided_at timestamptz null,
  contract_snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists country_media_requests_country_idx
  on public.country_media_requests(country_id,status,created_at desc);
create index if not exists country_media_requests_requester_idx
  on public.country_media_requests(requester_id,created_at desc);
create unique index if not exists country_media_requests_one_pending_idx
  on public.country_media_requests(media_id,requester_id)
  where status='pending';

create or replace function public.mfdco_v13_touch_updated_at()
returns trigger language plpgsql set search_path=public as $$
begin new.updated_at=now(); return new; end $$;

drop trigger if exists country_media_v13_touch on public.country_media;
create trigger country_media_v13_touch before update on public.country_media
for each row execute function public.mfdco_v13_touch_updated_at();
drop trigger if exists country_media_settings_v13_touch on public.country_media_distribution_settings;
create trigger country_media_settings_v13_touch before update on public.country_media_distribution_settings
for each row execute function public.mfdco_v13_touch_updated_at();
drop trigger if exists country_media_requests_v13_touch on public.country_media_requests;
create trigger country_media_requests_v13_touch before update on public.country_media_requests
for each row execute function public.mfdco_v13_touch_updated_at();

create or replace function public.mfdco_country_media_effective_access(p_media_id uuid)
returns text language sql stable security definer set search_path=public as $$
  select coalesce(m.download_access_override,s.default_access,'deny')
  from public.country_media m
  left join public.country_media_distribution_settings s on s.country_id=m.country_id
  where m.id=p_media_id
$$;

create or replace function public.mfdco_country_media_effective_terms(p_media_id uuid)
returns text language sql stable security definer set search_path=public as $$
  select coalesce(nullif(m.download_terms_override,''),s.default_terms,'')
  from public.country_media m
  left join public.country_media_distribution_settings s on s.country_id=m.country_id
  where m.id=p_media_id
$$;

create or replace function public.mfdco_list_country_page_media(
  p_country_id text,
  p_paths text[]
)
returns table(
  id uuid,
  storage_path text,
  slot text,
  kind text,
  mime_type text,
  original_name text,
  size_bytes bigint,
  display_name text,
  download_access_override text,
  download_terms_override text,
  effective_access text,
  effective_terms text,
  default_access text,
  default_terms text,
  can_download boolean
)
language sql stable security definer set search_path=public as $$
  select
    m.id,m.storage_path,m.slot,m.kind,m.mime_type,m.original_name,m.size_bytes,m.display_name,
    m.download_access_override,m.download_terms_override,
    coalesce(m.download_access_override,s.default_access,'deny') as effective_access,
    coalesce(nullif(m.download_terms_override,''),s.default_terms,'') as effective_terms,
    coalesce(s.default_access,'deny') as default_access,
    coalesce(s.default_terms,'') as default_terms,
    case
      when coalesce(m.download_access_override,s.default_access,'deny')='allow' then true
      when coalesce(m.download_access_override,s.default_access,'deny')='approval' and auth.uid() is not null then exists(
        select 1 from public.country_media_requests r
        where r.media_id=m.id and r.requester_id=auth.uid() and r.status='approved'
          and (r.expires_at is null or r.expires_at>now())
      )
      else false
    end as can_download
  from public.country_media m
  left join public.country_media_distribution_settings s on s.country_id=m.country_id
  where m.country_id=p_country_id
    and m.storage_path=any(coalesce(p_paths,'{}'::text[]))
    and public.mfdco_country_can_view(m.country_id)
  order by m.created_at asc
$$;

create or replace function public.mfdco_set_country_media_defaults(
  p_country_id text,
  p_access text,
  p_terms text default ''
)
returns void language plpgsql security definer set search_path=public as $$
begin
  if auth.uid() is null or not public.mfdco_country_can_manage(p_country_id) then raise exception 'not allowed'; end if;
  if p_access not in ('deny','approval','allow') then raise exception 'invalid access'; end if;
  insert into public.country_media_distribution_settings(country_id,default_access,default_terms,updated_by)
  values(p_country_id,p_access,coalesce(p_terms,''),auth.uid())
  on conflict(country_id) do update set default_access=excluded.default_access,default_terms=excluded.default_terms,updated_by=auth.uid(),updated_at=now();
end $$;

create or replace function public.mfdco_set_country_media_rule(
  p_media_id uuid,
  p_access text default null,
  p_terms text default null
)
returns void language plpgsql security definer set search_path=public as $$
declare cid text;
begin
  select country_id into cid from public.country_media where id=p_media_id;
  if cid is null or auth.uid() is null or not public.mfdco_country_can_manage(cid) then raise exception 'not allowed'; end if;
  if p_access is not null and p_access not in ('deny','approval','allow') then raise exception 'invalid access'; end if;
  update public.country_media set download_access_override=p_access,download_terms_override=nullif(coalesce(p_terms,''),'') where id=p_media_id;
end $$;

create or replace function public.mfdco_request_country_media(
  p_media_id uuid,
  p_requester_name text,
  p_purpose text,
  p_details text default ''
)
returns uuid language plpgsql security definer set search_path=public as $$
declare cid text; rid uuid; access text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select country_id into cid from public.country_media where id=p_media_id;
  if cid is null or not public.mfdco_country_can_view(cid) then raise exception 'not allowed'; end if;
  access:=public.mfdco_country_media_effective_access(p_media_id);
  if access<>'approval' then raise exception 'this media does not require approval'; end if;
  if char_length(btrim(coalesce(p_requester_name,'')))<1 or char_length(btrim(coalesce(p_purpose,'')))<2 then raise exception 'requester name and purpose are required'; end if;
  insert into public.country_media_requests(country_id,media_id,requester_id,requester_name,purpose,details)
  values(cid,p_media_id,auth.uid(),btrim(p_requester_name),btrim(p_purpose),coalesce(p_details,''))
  returning id into rid;
  insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
  select c.owner_id,cid,'country_media_request','国家素材の利用申請があります',btrim(p_requester_name)||' / '||btrim(p_purpose),'country.html?id='||cid||'#country-media-downloads'
  from public.countries c where c.id=cid and c.owner_id<>auth.uid();
  return rid;
end $$;

create or replace function public.mfdco_respond_country_media_request(
  p_request_id uuid,
  p_status text,
  p_expires_at timestamptz default null,
  p_note text default ''
)
returns void language plpgsql security definer set search_path=public as $$
declare r public.country_media_requests%rowtype; m public.country_media%rowtype; terms text; access text;
begin
  select * into r from public.country_media_requests where id=p_request_id for update;
  if r.id is null or auth.uid() is null or not public.mfdco_country_can_manage(r.country_id) then raise exception 'not allowed'; end if;
  if r.status<>'pending' then raise exception 'request already decided'; end if;
  if p_status not in ('approved','rejected') then raise exception 'invalid status'; end if;
  select * into m from public.country_media where id=r.media_id;
  terms:=public.mfdco_country_media_effective_terms(r.media_id);
  access:=public.mfdco_country_media_effective_access(r.media_id);
  update public.country_media_requests set
    status=p_status,expires_at=case when p_status='approved' then p_expires_at else null end,
    decision_note=coalesce(p_note,''),decided_by=auth.uid(),decided_at=now(),
    contract_snapshot=jsonb_build_object(
      'country_id',r.country_id,'media_id',r.media_id,'media_name',m.original_name,
      'requester_name',r.requester_name,'purpose',r.purpose,'details',r.details,
      'access',access,'terms',terms,'expires_at',case when p_status='approved' then p_expires_at else null end,
      'decision_note',coalesce(p_note,''),'decided_at',now()
    )
  where id=p_request_id;
  insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
  values(r.requester_id,r.country_id,'country_media_response',case when p_status='approved' then '国家素材の利用申請が承認されました' else '国家素材の利用申請が否認されました' end,coalesce(p_note,''),'country.html?id='||r.country_id||'#country-media-downloads');
end $$;

create or replace function public.mfdco_get_country_media_download_path(p_media_id uuid)
returns text language plpgsql stable security definer set search_path=public as $$
declare m public.country_media%rowtype; access text;
begin
  select * into m from public.country_media where id=p_media_id;
  if m.id is null or not public.mfdco_country_can_view(m.country_id) then return null; end if;
  access:=public.mfdco_country_media_effective_access(m.id);
  if access='allow' then return m.storage_path; end if;
  if access='approval' and auth.uid() is not null and exists(
    select 1 from public.country_media_requests r where r.media_id=m.id and r.requester_id=auth.uid() and r.status='approved' and (r.expires_at is null or r.expires_at>now())
  ) then return m.storage_path; end if;
  return null;
end $$;

alter table public.country_media_distribution_settings enable row level security;
alter table public.country_media_requests enable row level security;

drop policy if exists country_media_settings_select on public.country_media_distribution_settings;
create policy country_media_settings_select on public.country_media_distribution_settings for select to authenticated using(public.mfdco_country_can_manage(country_id));
drop policy if exists country_media_settings_write on public.country_media_distribution_settings;
create policy country_media_settings_write on public.country_media_distribution_settings for all to authenticated using(public.mfdco_country_can_manage(country_id)) with check(public.mfdco_country_can_manage(country_id));

drop policy if exists country_media_requests_select on public.country_media_requests;
create policy country_media_requests_select on public.country_media_requests for select to authenticated using(requester_id=auth.uid() or public.mfdco_country_can_manage(country_id));

-- RPCs perform all request writes. Do not grant direct inserts/updates.
revoke all on public.country_media_requests from anon,authenticated;
grant select on public.country_media_requests to authenticated;
grant select,insert,update,delete on public.country_media_distribution_settings to authenticated;

-- ---------------------------------------------------------
-- 3. International organizations / communities / treaties
-- ---------------------------------------------------------
alter table public.international_organizations
  add column if not exists join_mode text not null default 'approval',
  add column if not exists headquarters text not null default '',
  add column if not exists founded text not null default '',
  add column if not exists website text not null default '',
  add column if not exists founder_country_id text null references public.countries(id) on delete set null;

alter table public.international_organizations drop constraint if exists international_organizations_join_mode_check;
alter table public.international_organizations add constraint international_organizations_join_mode_check check(join_mode in ('open','approval','closed'));

create table if not exists public.international_organization_treaties (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.international_organizations(id) on delete cascade,
  title text not null,
  treaty_type text not null default 'その他',
  summary text not null default '',
  body text not null default '',
  status text not null default 'active' check(status in ('draft','active','suspended','ended')),
  effective_date date null,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.international_treaty_parties (
  treaty_id uuid not null references public.international_organization_treaties(id) on delete cascade,
  country_id text not null references public.countries(id) on delete cascade,
  status text not null default 'signed' check(status in ('signed','withdrawn')),
  signed_at timestamptz not null default now(),
  withdrawn_at timestamptz null,
  primary key(treaty_id,country_id)
);

create index if not exists international_treaties_org_idx on public.international_organization_treaties(organization_id,status,created_at desc);
create index if not exists international_treaty_parties_country_idx on public.international_treaty_parties(country_id,status);

drop trigger if exists international_treaties_touch on public.international_organization_treaties;
create trigger international_treaties_touch before update on public.international_organization_treaties for each row execute function public.mfdco_v13_touch_updated_at();

create or replace function public.mfdco_join_international_organization(p_organization_id uuid,p_country_id text)
returns text language plpgsql security definer set search_path=public as $$
declare mode text; st text;
begin
 if auth.uid() is null or not public.mfdco_country_can_manage(p_country_id) then raise exception 'not allowed'; end if;
 select join_mode into mode from public.international_organizations where id=p_organization_id and is_public=true;
 if mode is null then raise exception 'organization not found'; end if;
 if mode='closed' then raise exception 'joining is closed'; end if;
 st:=case when mode='open' then 'active' else 'invited' end;
 insert into public.international_organization_members(organization_id,country_id,role,status,joined_at)
 values(p_organization_id,p_country_id,'member',st,now())
 on conflict(organization_id,country_id) do update set status=excluded.status,role='member',joined_at=now();
 return st;
end $$;

create or replace function public.mfdco_leave_international_organization(p_organization_id uuid,p_country_id text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not public.mfdco_country_can_manage(p_country_id) then raise exception 'not allowed'; end if;
 update public.international_organization_members set status='left' where organization_id=p_organization_id and country_id=p_country_id and role<>'founder';
end $$;

create or replace function public.mfdco_respond_international_org_member(p_organization_id uuid,p_country_id text,p_accept boolean)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not exists(select 1 from public.international_organizations where id=p_organization_id and created_by=auth.uid()) then raise exception 'not allowed'; end if;
 if p_accept then update public.international_organization_members set status='active',joined_at=now() where organization_id=p_organization_id and country_id=p_country_id and status='invited';
 else delete from public.international_organization_members where organization_id=p_organization_id and country_id=p_country_id and status='invited'; end if;
end $$;

create or replace function public.mfdco_sign_international_treaty(p_treaty_id uuid,p_country_id text)
returns void language plpgsql security definer set search_path=public as $$
declare oid uuid;
begin
 if auth.uid() is null or not public.mfdco_country_can_manage(p_country_id) then raise exception 'not allowed'; end if;
 select organization_id into oid from public.international_organization_treaties where id=p_treaty_id and status='active';
 if oid is null or not exists(select 1 from public.international_organization_members where organization_id=oid and country_id=p_country_id and status='active') then raise exception 'active organization membership required'; end if;
 insert into public.international_treaty_parties(treaty_id,country_id,status,signed_at,withdrawn_at) values(p_treaty_id,p_country_id,'signed',now(),null)
 on conflict(treaty_id,country_id) do update set status='signed',signed_at=now(),withdrawn_at=null;
end $$;

create or replace function public.mfdco_withdraw_international_treaty(p_treaty_id uuid,p_country_id text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if auth.uid() is null or not public.mfdco_country_can_manage(p_country_id) then raise exception 'not allowed'; end if;
 update public.international_treaty_parties set status='withdrawn',withdrawn_at=now() where treaty_id=p_treaty_id and country_id=p_country_id;
end $$;

alter table public.international_organization_treaties enable row level security;
alter table public.international_treaty_parties enable row level security;

drop policy if exists international_treaties_select on public.international_organization_treaties;
create policy international_treaties_select on public.international_organization_treaties for select to anon,authenticated using(exists(select 1 from public.international_organizations o where o.id=organization_id and (o.is_public or o.created_by=auth.uid())));
drop policy if exists international_treaties_write on public.international_organization_treaties;
create policy international_treaties_write on public.international_organization_treaties for all to authenticated using(exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid())) with check(created_by=auth.uid() and exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid()));

drop policy if exists international_treaty_parties_select on public.international_treaty_parties;
create policy international_treaty_parties_select on public.international_treaty_parties for select to anon,authenticated using(exists(select 1 from public.international_organization_treaties t join public.international_organizations o on o.id=t.organization_id where t.id=treaty_id and o.is_public));

revoke all on function public.mfdco_list_country_page_media(text,text[]) from public;
revoke all on function public.mfdco_set_country_media_defaults(text,text,text) from public;
revoke all on function public.mfdco_set_country_media_rule(uuid,text,text) from public;
revoke all on function public.mfdco_request_country_media(uuid,text,text,text) from public;
revoke all on function public.mfdco_respond_country_media_request(uuid,text,timestamptz,text) from public;
revoke all on function public.mfdco_get_country_media_download_path(uuid) from public;
revoke all on function public.mfdco_join_international_organization(uuid,text) from public;
revoke all on function public.mfdco_leave_international_organization(uuid,text) from public;
revoke all on function public.mfdco_respond_international_org_member(uuid,text,boolean) from public;
revoke all on function public.mfdco_sign_international_treaty(uuid,text) from public;
revoke all on function public.mfdco_withdraw_international_treaty(uuid,text) from public;

grant execute on function public.mfdco_list_country_page_media(text,text[]) to anon,authenticated;
grant execute on function public.mfdco_get_country_media_download_path(uuid) to anon,authenticated;
grant execute on function public.mfdco_set_country_media_defaults(text,text,text) to authenticated;
grant execute on function public.mfdco_set_country_media_rule(uuid,text,text) to authenticated;
grant execute on function public.mfdco_request_country_media(uuid,text,text,text) to authenticated;
grant execute on function public.mfdco_respond_country_media_request(uuid,text,timestamptz,text) to authenticated;
grant execute on function public.mfdco_join_international_organization(uuid,text) to authenticated;
grant execute on function public.mfdco_leave_international_organization(uuid,text) to authenticated;
grant execute on function public.mfdco_respond_international_org_member(uuid,text,boolean) to authenticated;
grant execute on function public.mfdco_sign_international_treaty(uuid,text) to authenticated;
grant execute on function public.mfdco_withdraw_international_treaty(uuid,text) to authenticated;

grant select on public.international_organization_treaties to anon,authenticated;
grant insert,update,delete on public.international_organization_treaties to authenticated;
grant select on public.international_treaty_parties to anon,authenticated;

commit;

begin;
-- Lock direct membership writes so join_mode cannot be bypassed from the client.
drop policy if exists international_org_members_insert on public.international_organization_members;
create policy international_org_members_insert on public.international_organization_members for insert to authenticated
with check(exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid()));
drop policy if exists international_org_members_update on public.international_organization_members;
create policy international_org_members_update on public.international_organization_members for update to authenticated
using(exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid()))
with check(exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid()));
drop policy if exists international_org_members_delete on public.international_organization_members;
create policy international_org_members_delete on public.international_organization_members for delete to authenticated
using(exists(select 1 from public.international_organizations o where o.id=organization_id and o.created_by=auth.uid()));

commit;

begin;
-- Final organization ownership guard: an organization founder country must be
-- a country the creator can manage. This prevents assigning another user's
-- nation as the founder while keeping legacy rows with NULL founder_country_id valid.
drop policy if exists international_org_insert on public.international_organizations;
create policy international_org_insert on public.international_organizations
for insert to authenticated
with check(
  created_by=auth.uid()
  and (founder_country_id is null or public.mfdco_country_can_manage(founder_country_id))
);

drop policy if exists international_org_update on public.international_organizations;
create policy international_org_update on public.international_organizations
for update to authenticated
using(created_by=auth.uid())
with check(
  created_by=auth.uid()
  and (founder_country_id is null or public.mfdco_country_can_manage(founder_country_id))
);

-- Treaty parties are changed only through the signed/withdraw RPCs.
revoke insert,update,delete on public.international_treaty_parties from anon,authenticated;
commit;


-- v15 incremental
begin;
create table if not exists public.country_user_preferences (
 user_id uuid primary key references auth.users(id) on delete cascade,
 main_country_id text null references public.countries(id) on delete set null,
 active_country_id text null references public.countries(id) on delete set null,
 updated_at timestamptz not null default now()
);

-- Normalize older v15 installations where these two columns were created as UUID.
-- Drop dependent objects first so ALTER TYPE also works on already-deployed DBs.
drop policy if exists "country prefs own" on public.country_user_preferences;
drop function if exists public.mfdco_public_country_market_priorities();
alter table public.country_user_preferences
  drop constraint if exists country_user_preferences_main_country_id_fkey;
alter table public.country_user_preferences
  drop constraint if exists country_user_preferences_active_country_id_fkey;

alter table public.country_user_preferences
  alter column main_country_id type text using main_country_id::text;
alter table public.country_user_preferences
  alter column active_country_id type text using active_country_id::text;

alter table public.country_user_preferences
  add constraint country_user_preferences_main_country_id_fkey
  foreign key(main_country_id) references public.countries(id) on delete set null;
alter table public.country_user_preferences
  add constraint country_user_preferences_active_country_id_fkey
  foreign key(active_country_id) references public.countries(id) on delete set null;
alter table public.country_user_preferences enable row level security;
drop policy if exists "country prefs own" on public.country_user_preferences;
create policy "country prefs own" on public.country_user_preferences for all to authenticated using (user_id=auth.uid()) with check (user_id=auth.uid());
grant select,insert,update,delete on public.country_user_preferences to authenticated;

-- Preference values must point to countries the user can manage.
drop policy if exists "country prefs own" on public.country_user_preferences;
create policy "country prefs own" on public.country_user_preferences for all to authenticated
using (user_id=auth.uid())
with check (
 user_id=auth.uid()
 and (main_country_id is null or exists(select 1 from public.countries c where c.id=main_country_id and (c.owner_id=auth.uid() or exists(select 1 from public.country_members m where m.country_id=c.id and m.user_id=auth.uid() and m.role in ('owner','admin','editor')))))
 and (active_country_id is null or exists(select 1 from public.countries c where c.id=active_country_id and (c.owner_id=auth.uid() or exists(select 1 from public.country_members m where m.country_id=c.id and m.user_id=auth.uid() and m.role in ('owner','admin','editor')))))
);

drop function if exists public.mfdco_public_country_market_priorities();

create function public.mfdco_public_country_market_priorities()
returns table(country_id text,is_main boolean,is_active boolean)
language sql stable security definer set search_path=public
as $$
 select c.id,(p.main_country_id=c.id),(p.active_country_id=c.id)
 from public.countries c
 left join public.country_user_preferences p on p.user_id=c.owner_id
 where c.is_public=true and c.archived_at is null;
$$;
revoke all on function public.mfdco_public_country_market_priorities() from public;
grant execute on function public.mfdco_public_country_market_priorities() to anon,authenticated;


create table if not exists public.country_market_history (
 id bigint generated by default as identity primary key,
 country_id text not null references public.countries(id) on delete cascade,
 captured_hour timestamptz not null,
 market_date date not null,
 market_month text not null,
 market_hour text not null,
 change_pct numeric(9,4) not null default 0,
 fx_value numeric null,
 stock_value numeric null,
 world_average_pct numeric(9,4) null,
 themes jsonb not null default '{}'::jsonb,
 recorded_by uuid null references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 unique(country_id,captured_hour)
);
create index if not exists country_market_history_country_time_idx on public.country_market_history(country_id,captured_hour desc);
alter table public.country_market_history enable row level security;
drop policy if exists "public market history read" on public.country_market_history;
create policy "public market history read" on public.country_market_history for select to anon,authenticated using (exists(select 1 from public.countries c where c.id=country_id and c.is_public=true and c.archived_at is null));
drop policy if exists "auth market history write" on public.country_market_history;
create policy "auth market history write" on public.country_market_history for insert to authenticated with check (recorded_by=auth.uid());
drop policy if exists "auth market history update" on public.country_market_history;
create policy "auth market history update" on public.country_market_history for update to authenticated using (recorded_by=auth.uid()) with check (recorded_by=auth.uid());
grant select on public.country_market_history to anon,authenticated;
grant insert,update on public.country_market_history to authenticated;
commit;


-- =========================================================
-- MFDCO Country Operations v17.2 incremental
-- Requires the v15/v17.1 database baseline.
-- - Organization founders may leave; empty organizations auto-delete.
-- - Founder control transfers to the oldest remaining active member.
-- - Logged-in clients can safely backfill deterministic market history.
-- =========================================================
begin;

-- v15の初期案では country_market_history.country_id が uuid になっていましたが、
-- countries.id は text です。既存環境と新規環境の両方を text に統一します。
create table if not exists public.country_market_history (
 id bigint generated by default as identity primary key,
 country_id text not null references public.countries(id) on delete cascade,
 captured_hour timestamptz not null,
 market_date date not null,
 market_month text not null,
 market_hour text not null,
 change_pct numeric(9,4) not null default 0,
 fx_value numeric null,
 stock_value numeric null,
 world_average_pct numeric(9,4) null,
 themes jsonb not null default '{}'::jsonb,
 recorded_by uuid null references auth.users(id) on delete set null,
 created_at timestamptz not null default now(),
 unique(country_id,captured_hour)
);

drop policy if exists "public market history read" on public.country_market_history;
drop policy if exists "auth market history write" on public.country_market_history;
drop policy if exists "auth market history update" on public.country_market_history;

alter table public.country_market_history
  drop constraint if exists country_market_history_country_id_fkey;
alter table public.country_market_history
  alter column country_id type text using country_id::text;
alter table public.country_market_history
  add constraint country_market_history_country_id_fkey
  foreign key(country_id) references public.countries(id) on delete cascade;

create index if not exists country_market_history_country_time_idx
  on public.country_market_history(country_id,captured_hour desc);

alter table public.country_market_history enable row level security;
drop policy if exists "public market history read" on public.country_market_history;
create policy "public market history read" on public.country_market_history
  for select to anon,authenticated
  using (exists(select 1 from public.countries c where c.id=country_id and c.is_public=true and c.archived_at is null));
drop policy if exists "auth market history write" on public.country_market_history;
create policy "auth market history write" on public.country_market_history
  for insert to authenticated with check(recorded_by=auth.uid());
drop policy if exists "auth market history update" on public.country_market_history;
create policy "auth market history update" on public.country_market_history
  for update to authenticated using(recorded_by=auth.uid()) with check(recorded_by=auth.uid());
grant select on public.country_market_history to anon,authenticated;
grant insert,update on public.country_market_history to authenticated;

create or replace function public.mfdco_leave_international_organization(
  p_organization_id uuid,
  p_country_id text
)
returns text
language plpgsql
security definer
set search_path=public
as $$
declare
  v_role text;
  v_remaining integer:=0;
  v_successor_country text;
  v_successor_owner uuid;
begin
  if auth.uid() is null or not public.mfdco_country_can_manage(p_country_id) then
    raise exception 'not allowed';
  end if;

  update public.international_organization_members
  set status='left'
  where organization_id=p_organization_id
    and country_id=p_country_id
    and status='active'
  returning role into v_role;

  if v_role is null then
    raise exception 'active organization membership not found';
  end if;

  select count(*) into v_remaining
  from public.international_organization_members
  where organization_id=p_organization_id
    and status='active';

  if v_remaining=0 then
    delete from public.international_organizations
    where id=p_organization_id;
    return 'deleted';
  end if;

  if v_role='founder' then
    select m.country_id,c.owner_id
    into v_successor_country,v_successor_owner
    from public.international_organization_members m
    join public.countries c on c.id=m.country_id
    where m.organization_id=p_organization_id
      and m.status='active'
    order by m.joined_at asc,m.country_id asc
    limit 1;

    if v_successor_country is not null and v_successor_owner is not null then
      update public.international_organization_members
      set role='founder'
      where organization_id=p_organization_id
        and country_id=v_successor_country;

      update public.international_organizations
      set founder_country_id=v_successor_country,
          created_by=v_successor_owner,
          updated_at=now()
      where id=p_organization_id;
    end if;
  end if;

  return 'left';
end
$$;

revoke all on function public.mfdco_leave_international_organization(uuid,text) from public;
grant execute on function public.mfdco_leave_international_organization(uuid,text) to authenticated;

create or replace function public.mfdco_backfill_market_history(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  r jsonb;
  v_inserted integer:=0;
  v_rowcount integer:=0;
  v_country_id public.countries.id%type;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(coalesce(p_rows,'[]'::jsonb))<>'array' then
    raise exception 'rows must be an array';
  end if;

  if jsonb_array_length(coalesce(p_rows,'[]'::jsonb))>500 then
    raise exception 'too many rows; maximum is 500 per call';
  end if;

  for r in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb))
  loop
    begin
      v_country_id:=r->>'country_id';

      if not exists(
        select 1 from public.countries c
        where c.id=v_country_id
          and c.is_public=true
          and c.archived_at is null
      ) then
        continue;
      end if;

      insert into public.country_market_history(
        country_id,captured_hour,market_date,market_month,market_hour,
        change_pct,fx_value,stock_value,world_average_pct,themes,recorded_by
      ) values(
        v_country_id,
        (r->>'captured_hour')::timestamptz,
        (r->>'market_date')::date,
        coalesce(r->>'market_month',''),
        coalesce(r->>'market_hour',''),
        coalesce((r->>'change_pct')::numeric,0),
        nullif(r->>'fx_value','')::numeric,
        nullif(r->>'stock_value','')::numeric,
        nullif(r->>'world_average_pct','')::numeric,
        coalesce(r->'themes','{}'::jsonb),
        auth.uid()
      )
      on conflict(country_id,captured_hour) do nothing;

      get diagnostics v_rowcount = row_count;
      v_inserted:=v_inserted+v_rowcount;
    exception when others then
      raise exception 'invalid market history row: %', sqlerrm;
    end;
  end loop;

  return v_inserted;
end
$$;

revoke all on function public.mfdco_backfill_market_history(jsonb) from public;
grant execute on function public.mfdco_backfill_market_history(jsonb) to authenticated;

commit;

-- Quick verification
select proname
from pg_proc
where proname in (
  'mfdco_leave_international_organization',
  'mfdco_backfill_market_history'
)
order by proname;

-- =====================================================================
-- FINAL NORMALIZATION / v18-organized
-- The historical migration blocks above are retained because they are
-- battle-tested and preserve old installations. This section declares
-- the authoritative final non-destructive state.
-- =====================================================================
begin;

-- Current indexed data-schema default. Existing rows retain their values.
alter table public.countries
  alter column schema_version set default 15;

-- Rebuild the final market-priority helper with TEXT country ids.
drop function if exists public.mfdco_public_country_market_priorities();

create function public.mfdco_public_country_market_priorities()
returns table(
  country_id text,
  is_main boolean,
  is_active boolean
)
language sql
stable
security definer
set search_path=public
as $$
  select
    c.id,
    (p.main_country_id=c.id),
    (p.active_country_id=c.id)
  from public.countries c
  left join public.country_user_preferences p
    on p.user_id=c.owner_id
  where c.is_public=true
    and c.archived_at is null
$$;

revoke all on function public.mfdco_public_country_market_priorities() from public;
grant execute on function public.mfdco_public_country_market_priorities()
  to anon,authenticated;

commit;

-- =====================================================================
-- v17.3 / HOURLY MARKET + OFFICIAL WORK SEARCH
-- =====================================================================
-- =========================================================
-- MFDCO Country Operations v17.3 incremental
-- Requires the current Country DB baseline (v17.2 / complete v18).
--
-- Adds:
--   * approved Work search RPC for official adoption
--   * market-history backfill updates existing hourly rows
-- =========================================================
begin;

-- ---------------------------------------------------------
-- 1. PUBLIC APPROVED WORK SEARCH FOR OFFICIAL ADOPTION
-- ---------------------------------------------------------
-- This SECURITY DEFINER RPC only returns works with status='approved'.
-- It avoids an empty picker caused by unrelated Works-page RLS details.
create or replace function public.mfdco_public_works_for_adoption(
  p_query text default '',
  p_limit integer default 250
)
returns table(payload jsonb)
language sql
stable
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'id', w.id,
    'title', coalesce(to_jsonb(w)->>'title',''),
    'image_url', coalesce(to_jsonb(w)->>'image_url',''),
    'tags', coalesce(to_jsonb(w)->'tags','[]'::jsonb),
    'description', coalesce(to_jsonb(w)->>'description',''),
    'submission_type', coalesce(to_jsonb(w)->>'submission_type',''),
    'download_access', coalesce(to_jsonb(w)->>'download_access',''),
    'status', coalesce(to_jsonb(w)->>'status',''),
    'created_at', w.created_at
  ) as payload
  from public.works w
  where w.status='approved'
    and (
      btrim(coalesce(p_query,''))=''
      or coalesce(to_jsonb(w)->>'title','') ilike '%'||btrim(p_query)||'%'
      or coalesce(to_jsonb(w)->>'description','') ilike '%'||btrim(p_query)||'%'
      or coalesce((to_jsonb(w)->'tags')::text,'') ilike '%'||btrim(p_query)||'%'
    )
  order by w.created_at desc
  limit least(greatest(coalesce(p_limit,250),1),500)
$$;

revoke all on function public.mfdco_public_works_for_adoption(text,integer) from public;
grant execute on function public.mfdco_public_works_for_adoption(text,integer)
  to anon,authenticated;

-- ---------------------------------------------------------
-- 2. HOURLY MARKET HISTORY UPSERT
-- ---------------------------------------------------------
-- v17.3 changed the market model from daily/monthly influence to a
-- deterministic hourly-only model. Re-running a backfill must therefore
-- be able to refresh rows that were written by the older model.
create or replace function public.mfdco_backfill_market_history(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  r jsonb;
  v_processed integer:=0;
  v_country_id public.countries.id%type;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(coalesce(p_rows,'[]'::jsonb))<>'array' then
    raise exception 'rows must be an array';
  end if;

  if jsonb_array_length(coalesce(p_rows,'[]'::jsonb))>500 then
    raise exception 'too many rows; maximum is 500 per call';
  end if;

  for r in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb))
  loop
    v_country_id:=r->>'country_id';

    if not exists(
      select 1 from public.countries c
      where c.id=v_country_id
        and c.is_public=true
        and c.archived_at is null
    ) then
      continue;
    end if;

    insert into public.country_market_history(
      country_id,captured_hour,market_date,market_month,market_hour,
      change_pct,fx_value,stock_value,world_average_pct,themes,recorded_by
    ) values(
      v_country_id,
      (r->>'captured_hour')::timestamptz,
      (r->>'market_date')::date,
      coalesce(r->>'market_month',''),
      coalesce(r->>'market_hour',''),
      coalesce((r->>'change_pct')::numeric,0),
      nullif(r->>'fx_value','')::numeric,
      nullif(r->>'stock_value','')::numeric,
      nullif(r->>'world_average_pct','')::numeric,
      coalesce(r->'themes','{}'::jsonb),
      auth.uid()
    )
    on conflict(country_id,captured_hour) do update
      set market_date=excluded.market_date,
          market_month=excluded.market_month,
          market_hour=excluded.market_hour,
          change_pct=excluded.change_pct,
          fx_value=excluded.fx_value,
          stock_value=excluded.stock_value,
          world_average_pct=excluded.world_average_pct,
          themes=excluded.themes,
          recorded_by=excluded.recorded_by;

    v_processed:=v_processed+1;
  end loop;

  return v_processed;
end
$$;

revoke all on function public.mfdco_backfill_market_history(jsonb) from public;
grant execute on function public.mfdco_backfill_market_history(jsonb) to authenticated;

commit;

-- =====================================================================
-- FINAL DIAGNOSTICS
-- These SELECTs are safe: they only show the installed state.
-- =====================================================================

-- 1) Main Country-module tables.
select
  table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
    'countries',
    'country_members',
    'country_member_invitations',
    'country_records',
    'country_versions',
    'country_media',
    'country_assets',
    'country_asset_requests',
    'country_media_distribution_settings',
    'country_media_requests',
    'country_proposals',
    'country_relations',
    'country_notifications',
    'country_work_adoptions',
    'country_follows',
    'country_post_reactions',
    'country_usage_requests',
    'international_organizations',
    'international_organization_members',
    'international_organization_treaties',
    'international_treaty_parties',
    'country_user_preferences',
    'country_market_history'
  )
order by table_name;

-- 2) Critical country-id types. All should report text.
select
  table_name,
  column_name,
  data_type
from information_schema.columns
where table_schema='public'
  and (
    (table_name='countries' and column_name='id')
    or
    (table_name='country_user_preferences'
      and column_name in ('main_country_id','active_country_id'))
    or
    (table_name='country_market_history' and column_name='country_id')
  )
order by table_name,column_name;

-- 3) Critical v17.2 RPCs.
select
  p.proname as function_name,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'mfdco_leave_international_organization',
    'mfdco_backfill_market_history',
    'mfdco_public_country_market_priorities',
    'mfdco_save_country',
    'mfdco_public_works_for_adoption'
  )
order by p.proname;

-- =====================================================================
-- END OF MFDCO COUNTRY OPERATIONS COMPLETE DATABASE SCHEMA v19
-- =====================================================================

-- =====================================================================
-- MFDCO COUNTRY OPERATIONS v20 FOUNDATION
-- v17.3 / DB v19 -> v20
-- Lightweight documents + reusable entities + IndexedDB/private Storage bridge
-- =====================================================================
begin;

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. VISIBILITY / STATUS HELPERS
-- ---------------------------------------------------------------------
create or replace function public.mfdco_country_visibility_allowed(
  p_country_id text,
  p_visibility text
)
returns boolean
language sql
stable
security definer
set search_path=public
as $$
  select case coalesce(p_visibility,'owner')
    when 'public' then exists(
      select 1 from public.countries c
      where c.id=p_country_id
        and c.archived_at is null
        and (c.is_public=true or c.owner_id=auth.uid()
          or exists(select 1 from public.country_members m where m.country_id=c.id and m.user_id=auth.uid()))
    )
    when 'members' then auth.uid() is not null and exists(
      select 1 from public.countries c
      where c.id=p_country_id and c.archived_at is null
        and (c.owner_id=auth.uid()
          or exists(select 1 from public.country_members m where m.country_id=c.id and m.user_id=auth.uid()))
    )
    when 'collaborators' then public.mfdco_country_can_edit(p_country_id)
    when 'owner' then exists(
      select 1 from public.countries c
      where c.id=p_country_id and c.archived_at is null and c.owner_id=auth.uid()
    )
    else false
  end
$$;

revoke all on function public.mfdco_country_visibility_allowed(text,text) from public;
grant execute on function public.mfdco_country_visibility_allowed(text,text) to anon,authenticated;

-- ---------------------------------------------------------------------
-- 2. LIGHTWEIGHT DOCUMENTS
-- One current JSON document per country / domain.
-- Budget, demography, supply-demand etc. live here instead of inflating core_data.
-- ---------------------------------------------------------------------
create table if not exists public.country_documents (
  country_id text not null references public.countries(id) on delete cascade,
  document_key text not null,
  status text not null default 'draft'
    check(status in ('official','draft','archived')),
  visibility text not null default 'owner'
    check(visibility in ('public','members','collaborators','owner')),
  payload jsonb not null default '{}'::jsonb,
  revision integer not null default 1,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key(country_id,document_key)
);

create index if not exists country_documents_country_status_idx
  on public.country_documents(country_id,status,document_key);

-- ---------------------------------------------------------------------
-- 3. REUSABLE ENTITIES
-- Regions, governments, elections, ministries, courts, projects, tech,
-- embassies, military units/inventory etc. share this structure.
-- ---------------------------------------------------------------------
create table if not exists public.country_entities (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  parent_id uuid references public.country_entities(id) on delete set null,
  entity_type text not null,
  name text not null default '',
  status text not null default 'draft'
    check(status in ('official','draft','archived')),
  visibility text not null default 'owner'
    check(visibility in ('public','members','collaborators','owner')),
  valid_from text,
  valid_to text,
  sort_order integer not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists country_entities_country_type_idx
  on public.country_entities(country_id,entity_type,status,sort_order,updated_at);
create index if not exists country_entities_parent_idx
  on public.country_entities(parent_id)
  where parent_id is not null;

-- ---------------------------------------------------------------------
-- 4. CROSS-COUNTRY / CROSS-ENTITY LINKS
-- Trade, diplomacy effects, treaty references and future graph data.
-- ---------------------------------------------------------------------
create table if not exists public.country_links (
  id uuid primary key default gen_random_uuid(),
  country_id text not null references public.countries(id) on delete cascade,
  target_country_id text references public.countries(id) on delete cascade,
  source_entity_id uuid references public.country_entities(id) on delete cascade,
  target_entity_id uuid references public.country_entities(id) on delete set null,
  link_type text not null,
  status text not null default 'draft'
    check(status in ('official','draft','archived')),
  visibility text not null default 'owner'
    check(visibility in ('public','members','collaborators','owner')),
  payload jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists country_links_source_idx
  on public.country_links(country_id,link_type,status,updated_at);
create index if not exists country_links_target_idx
  on public.country_links(target_country_id,link_type)
  where target_country_id is not null;

-- ---------------------------------------------------------------------
-- 5. CALCULATED CURRENT METRICS
-- Only searchable/rankable current values are cached.
-- Reconstructable calculations remain client-side.
-- ---------------------------------------------------------------------
create table if not exists public.country_metrics (
  country_id text not null references public.countries(id) on delete cascade,
  metric_key text not null,
  value numeric,
  details jsonb not null default '{}'::jsonb,
  computed_at timestamptz not null default now(),
  primary key(country_id,metric_key)
);

create index if not exists country_metrics_key_value_idx
  on public.country_metrics(metric_key,value desc);

-- ---------------------------------------------------------------------
-- 6. FIELD-LEVEL VISIBILITY OVERRIDES
-- Only exceptions to the default document/entity visibility are stored.
-- ---------------------------------------------------------------------
create table if not exists public.country_visibility_rules (
  country_id text not null references public.countries(id) on delete cascade,
  path text not null,
  visibility text not null
    check(visibility in ('public','members','collaborators','owner')),
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now(),
  primary key(country_id,path)
);

-- ---------------------------------------------------------------------
-- 7. DIFF LOG
-- Stores diffs/events, not a full country snapshot each time.
-- ---------------------------------------------------------------------
create table if not exists public.country_change_log (
  id bigint generated by default as identity primary key,
  country_id text not null references public.countries(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  change_type text not null,
  document_key text,
  entity_type text,
  entity_id uuid,
  path text not null default '',
  old_value jsonb,
  new_value jsonb,
  changed_at timestamptz not null default now()
);

create index if not exists country_change_log_country_idx
  on public.country_change_log(country_id,changed_at desc);

-- ---------------------------------------------------------------------
-- 8. MARKET EVENT STORAGE
-- Hourly prices remain reconstructable. Only meaningful material/regime
-- changes need permanent rows.
-- ---------------------------------------------------------------------
create table if not exists public.country_market_events (
  id uuid primary key default gen_random_uuid(),
  country_id text references public.countries(id) on delete cascade,
  event_hour timestamptz not null,
  event_type text not null,
  strength numeric not null default 0,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists country_market_events_hour_idx
  on public.country_market_events(event_hour desc,country_id);

-- ---------------------------------------------------------------------
-- 9. TOUCH / REVISION TRIGGERS
-- ---------------------------------------------------------------------
create or replace function public.mfdco_v20_touch_document()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  new.updated_at=now();
  new.updated_by=auth.uid();
  if tg_op='UPDATE' then new.revision=old.revision+1; end if;
  return new;
end
$$;

drop trigger if exists country_documents_v20_touch on public.country_documents;
create trigger country_documents_v20_touch
before insert or update on public.country_documents
for each row execute function public.mfdco_v20_touch_document();

create or replace function public.mfdco_v20_touch_entity()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  new.updated_at=now();
  new.updated_by=auth.uid();
  if tg_op='INSERT' and new.created_by is null then new.created_by=auth.uid(); end if;
  return new;
end
$$;

drop trigger if exists country_entities_v20_touch on public.country_entities;
create trigger country_entities_v20_touch
before insert or update on public.country_entities
for each row execute function public.mfdco_v20_touch_entity();

drop trigger if exists country_links_v20_touch on public.country_links;
create trigger country_links_v20_touch
before insert or update on public.country_links
for each row execute function public.mfdco_v20_touch_entity();

create or replace function public.mfdco_v20_touch_visibility()
returns trigger
language plpgsql
set search_path=public
as $$
begin
  new.updated_at=now();
  new.updated_by=auth.uid();
  return new;
end
$$;

drop trigger if exists country_visibility_v20_touch on public.country_visibility_rules;
create trigger country_visibility_v20_touch
before insert or update on public.country_visibility_rules
for each row execute function public.mfdco_v20_touch_visibility();

-- ---------------------------------------------------------------------
-- 10. CHANGE LOG TRIGGERS
-- ---------------------------------------------------------------------
create or replace function public.mfdco_v20_log_change()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
declare
  v_country_id text;
  v_document_key text;
  v_entity_type text;
  v_entity_id uuid;
  v_old jsonb;
  v_new jsonb;
  v_key text;
begin
  if tg_op='DELETE' then
    v_country_id:=old.country_id;
  else
    v_country_id:=new.country_id;
  end if;

  if tg_table_name='country_documents' then
    v_document_key:=case when tg_op='DELETE' then old.document_key else new.document_key end;
    v_old:=case when tg_op in ('UPDATE','DELETE') then old.payload else '{}'::jsonb end;
    v_new:=case when tg_op in ('INSERT','UPDATE') then new.payload else '{}'::jsonb end;
  elsif tg_table_name='country_entities' then
    v_entity_type:=case when tg_op='DELETE' then old.entity_type else new.entity_type end;
    v_entity_id:=case when tg_op='DELETE' then old.id else new.id end;
    v_old:=case when tg_op in ('UPDATE','DELETE') then old.payload else '{}'::jsonb end;
    v_new:=case when tg_op in ('INSERT','UPDATE') then new.payload else '{}'::jsonb end;
  elsif tg_table_name='country_links' then
    v_entity_type:=case when tg_op='DELETE' then old.link_type else new.link_type end;
    v_entity_id:=case when tg_op='DELETE' then old.id else new.id end;
    v_old:=case when tg_op in ('UPDATE','DELETE') then old.payload else '{}'::jsonb end;
    v_new:=case when tg_op in ('INSERT','UPDATE') then new.payload else '{}'::jsonb end;
  end if;

  -- INSERT/DELETE: record a compact event only.
  if tg_op in ('INSERT','DELETE') then
    insert into public.country_change_log(
      country_id,actor_id,change_type,document_key,entity_type,entity_id,path,old_value,new_value
    ) values (
      v_country_id,auth.uid(),lower(tg_op),v_document_key,v_entity_type,v_entity_id,'',
      null,
      null
    );
  else
    -- Common metadata diffs.
    if tg_table_name='country_documents' then
      if old.status is distinct from new.status then
        insert into public.country_change_log(country_id,actor_id,change_type,document_key,path,old_value,new_value)
        values(v_country_id,auth.uid(),'update',v_document_key,'status',to_jsonb(old.status),to_jsonb(new.status));
      end if;
      if old.visibility is distinct from new.visibility then
        insert into public.country_change_log(country_id,actor_id,change_type,document_key,path,old_value,new_value)
        values(v_country_id,auth.uid(),'update',v_document_key,'visibility',to_jsonb(old.visibility),to_jsonb(new.visibility));
      end if;
    elsif tg_table_name='country_entities' then
      if old.name is distinct from new.name then
        insert into public.country_change_log(country_id,actor_id,change_type,entity_type,entity_id,path,old_value,new_value)
        values(v_country_id,auth.uid(),'update',v_entity_type,v_entity_id,'name',to_jsonb(old.name),to_jsonb(new.name));
      end if;
      if old.status is distinct from new.status then
        insert into public.country_change_log(country_id,actor_id,change_type,entity_type,entity_id,path,old_value,new_value)
        values(v_country_id,auth.uid(),'update',v_entity_type,v_entity_id,'status',to_jsonb(old.status),to_jsonb(new.status));
      end if;
      if old.visibility is distinct from new.visibility then
        insert into public.country_change_log(country_id,actor_id,change_type,entity_type,entity_id,path,old_value,new_value)
        values(v_country_id,auth.uid(),'update',v_entity_type,v_entity_id,'visibility',to_jsonb(old.visibility),to_jsonb(new.visibility));
      end if;
    elsif tg_table_name='country_links' then
      if old.status is distinct from new.status then
        insert into public.country_change_log(country_id,actor_id,change_type,entity_type,entity_id,path,old_value,new_value)
        values(v_country_id,auth.uid(),'update',v_entity_type,v_entity_id,'status',to_jsonb(old.status),to_jsonb(new.status));
      end if;
      if old.visibility is distinct from new.visibility then
        insert into public.country_change_log(country_id,actor_id,change_type,entity_type,entity_id,path,old_value,new_value)
        values(v_country_id,auth.uid(),'update',v_entity_type,v_entity_id,'visibility',to_jsonb(old.visibility),to_jsonb(new.visibility));
      end if;
    end if;

    -- Payload top-level diffs only. This avoids storing whole snapshots.
    for v_key in
      select key from (
        select jsonb_object_keys(coalesce(v_old,'{}'::jsonb)) as key
        union
        select jsonb_object_keys(coalesce(v_new,'{}'::jsonb)) as key
      ) s
    loop
      if (v_old->v_key) is distinct from (v_new->v_key) then
        insert into public.country_change_log(
          country_id,actor_id,change_type,document_key,entity_type,entity_id,path,old_value,new_value
        ) values (
          v_country_id,auth.uid(),'update',v_document_key,v_entity_type,v_entity_id,
          'payload.'||v_key,v_old->v_key,v_new->v_key
        );
      end if;
    end loop;
  end if;

  if tg_op='DELETE' then return old; end if;
  return new;
end
$$;

drop trigger if exists country_documents_v20_log on public.country_documents;
create trigger country_documents_v20_log
after insert or update or delete on public.country_documents
for each row execute function public.mfdco_v20_log_change();

drop trigger if exists country_entities_v20_log on public.country_entities;
create trigger country_entities_v20_log
after insert or update or delete on public.country_entities
for each row execute function public.mfdco_v20_log_change();

drop trigger if exists country_links_v20_log on public.country_links;
create trigger country_links_v20_log
after insert or update or delete on public.country_links
for each row execute function public.mfdco_v20_log_change();

-- ---------------------------------------------------------------------
-- 11. ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
alter table public.country_documents enable row level security;
alter table public.country_entities enable row level security;
alter table public.country_links enable row level security;
alter table public.country_metrics enable row level security;
alter table public.country_visibility_rules enable row level security;
alter table public.country_change_log enable row level security;
alter table public.country_market_events enable row level security;

drop policy if exists country_documents_read_v20 on public.country_documents;
create policy country_documents_read_v20 on public.country_documents
for select to anon,authenticated
using(
  (
    public.mfdco_country_can_edit(country_id)
    and (
      visibility<>'owner'
      or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid())
    )
  )
  or (status='official' and public.mfdco_country_visibility_allowed(country_id,visibility))
);

drop policy if exists country_documents_write_v20 on public.country_documents;
create policy country_documents_write_v20 on public.country_documents
for all to authenticated
using(
  public.mfdco_country_can_edit(country_id)
  and (visibility<>'owner' or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid()))
)
with check(
  public.mfdco_country_can_edit(country_id)
  and (visibility<>'owner' or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid()))
);

drop policy if exists country_entities_read_v20 on public.country_entities;
create policy country_entities_read_v20 on public.country_entities
for select to anon,authenticated
using(
  (
    public.mfdco_country_can_edit(country_id)
    and (
      visibility<>'owner'
      or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid())
    )
  )
  or (status='official' and public.mfdco_country_visibility_allowed(country_id,visibility))
);

drop policy if exists country_entities_write_v20 on public.country_entities;
create policy country_entities_write_v20 on public.country_entities
for all to authenticated
using(
  public.mfdco_country_can_edit(country_id)
  and (visibility<>'owner' or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid()))
)
with check(
  public.mfdco_country_can_edit(country_id)
  and (visibility<>'owner' or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid()))
);

drop policy if exists country_links_read_v20 on public.country_links;
create policy country_links_read_v20 on public.country_links
for select to anon,authenticated
using(
  (
    public.mfdco_country_can_edit(country_id)
    and (
      visibility<>'owner'
      or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid())
    )
  )
  or (status='official' and public.mfdco_country_visibility_allowed(country_id,visibility))
);

drop policy if exists country_links_write_v20 on public.country_links;
create policy country_links_write_v20 on public.country_links
for all to authenticated
using(
  public.mfdco_country_can_edit(country_id)
  and (visibility<>'owner' or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid()))
)
with check(
  public.mfdco_country_can_edit(country_id)
  and (visibility<>'owner' or exists(select 1 from public.countries c where c.id=country_id and c.owner_id=auth.uid()))
);

drop policy if exists country_metrics_read_v20 on public.country_metrics;
create policy country_metrics_read_v20 on public.country_metrics
for select to anon,authenticated
using(public.mfdco_country_can_view(country_id));

drop policy if exists country_metrics_write_v20 on public.country_metrics;
create policy country_metrics_write_v20 on public.country_metrics
for all to authenticated
using(public.mfdco_country_can_edit(country_id))
with check(public.mfdco_country_can_edit(country_id));

drop policy if exists country_visibility_read_v20 on public.country_visibility_rules;
create policy country_visibility_read_v20 on public.country_visibility_rules
for select to authenticated
using(public.mfdco_country_can_edit(country_id));

drop policy if exists country_visibility_write_v20 on public.country_visibility_rules;
create policy country_visibility_write_v20 on public.country_visibility_rules
for all to authenticated
using(public.mfdco_country_can_manage(country_id))
with check(public.mfdco_country_can_manage(country_id));

drop policy if exists country_change_log_read_v20 on public.country_change_log;
create policy country_change_log_read_v20 on public.country_change_log
for select to authenticated
using(public.mfdco_country_can_edit(country_id));

drop policy if exists country_market_events_read_v20 on public.country_market_events;
create policy country_market_events_read_v20 on public.country_market_events
for select to anon,authenticated
using(country_id is null or public.mfdco_country_can_view(country_id));

drop policy if exists country_market_events_write_v20 on public.country_market_events;
create policy country_market_events_write_v20 on public.country_market_events
for all to authenticated
using(country_id is not null and public.mfdco_country_can_edit(country_id))
with check(country_id is not null and public.mfdco_country_can_edit(country_id));

-- ---------------------------------------------------------------------
-- 12. GRANTS
-- ---------------------------------------------------------------------
grant select on public.country_documents,public.country_entities,public.country_links,public.country_metrics,public.country_market_events to anon,authenticated;
grant insert,update,delete on public.country_documents,public.country_entities,public.country_links,public.country_metrics,public.country_visibility_rules,public.country_market_events to authenticated;
grant select on public.country_visibility_rules,public.country_change_log to authenticated;
grant usage,select on sequence public.country_change_log_id_seq to authenticated;

-- ---------------------------------------------------------------------
-- 13. PRIVATE USER STORAGE
-- Draft archives and exports live outside the relational DB.
-- Path convention: <auth.uid>/<country_id>/archives/...
-- ---------------------------------------------------------------------
insert into storage.buckets(id,name,public,file_size_limit)
values('country-user-data','country-user-data',false,26214400)
on conflict(id) do update
set public=false,file_size_limit=excluded.file_size_limit;

drop policy if exists country_user_data_read_v20 on storage.objects;
create policy country_user_data_read_v20 on storage.objects
for select to authenticated
using(
  bucket_id='country-user-data'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists country_user_data_insert_v20 on storage.objects;
create policy country_user_data_insert_v20 on storage.objects
for insert to authenticated
with check(
  bucket_id='country-user-data'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists country_user_data_update_v20 on storage.objects;
create policy country_user_data_update_v20 on storage.objects
for update to authenticated
using(
  bucket_id='country-user-data'
  and (storage.foldername(name))[1]=auth.uid()::text
)
with check(
  bucket_id='country-user-data'
  and (storage.foldername(name))[1]=auth.uid()::text
);

drop policy if exists country_user_data_delete_v20 on storage.objects;
create policy country_user_data_delete_v20 on storage.objects
for delete to authenticated
using(
  bucket_id='country-user-data'
  and (storage.foldername(name))[1]=auth.uid()::text
);

commit;

-- Verification
select table_name
from information_schema.tables
where table_schema='public'
  and table_name in (
   'country_documents','country_entities','country_links','country_metrics',
   'country_visibility_rules','country_change_log','country_market_events'
  )
order by table_name;

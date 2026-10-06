-- ============================================================
-- MFDCO COUNTRY OPERATIONS / Supabase production schema v4
-- ============================================================
-- Run this file in Supabase SQL Editor.
-- It is designed for the existing MFDCO auth.users + public.profiles setup.
-- Default limits:
--   * 5 owned countries / account
--   * 250 MiB media / country
--   * 500 MiB media / uploader account
--   * 25 MiB / uploaded file (Storage bucket limit)
--   * 30 country snapshots / country
-- ============================================================

create extension if not exists pgcrypto;

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

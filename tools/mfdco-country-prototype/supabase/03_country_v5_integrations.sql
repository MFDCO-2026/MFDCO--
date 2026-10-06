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

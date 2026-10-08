-- =====================================================================
-- MFDCO Country Operations v20.2
-- MFDCO account-linked collaboration + unified storage quotas
-- Run after v20.0 foundation / COMPLETE v20.
-- =====================================================================

begin;

-- ---------------------------------------------------------------------
-- 1. ACCOUNT LIMIT OVERRIDES
-- No row is required for normal users; defaults are applied by RPCs.
-- Service role can insert overrides in the future without changing JS.
-- ---------------------------------------------------------------------
create table if not exists public.country_account_limits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  max_owned_countries integer not null default 5 check(max_owned_countries between 1 and 100),
  account_storage_limit_bytes bigint not null default 524288000 check(account_storage_limit_bytes > 0),
  country_storage_limit_bytes bigint not null default 262144000 check(country_storage_limit_bytes > 0),
  max_file_size_bytes bigint not null default 26214400 check(max_file_size_bytes > 0),
  updated_at timestamptz not null default now()
);

alter table public.country_account_limits enable row level security;
drop policy if exists country_account_limits_own_read_v20_2 on public.country_account_limits;
create policy country_account_limits_own_read_v20_2
on public.country_account_limits for select to authenticated
using(user_id=auth.uid());

revoke insert,update,delete on public.country_account_limits from anon,authenticated;
grant select on public.country_account_limits to authenticated;

create or replace function public.mfdco_country_account_limits_touch()
returns trigger language plpgsql set search_path=public as $$
begin
  new.updated_at=now();
  return new;
end
$$;

drop trigger if exists country_account_limits_touch on public.country_account_limits;
create trigger country_account_limits_touch
before update on public.country_account_limits
for each row execute function public.mfdco_country_account_limits_touch();

-- ---------------------------------------------------------------------
-- 2. MFDCO ACCOUNT LINK
-- A Country editor must map to an existing MFDCO profile.
-- We intentionally require profile existence, not a specific membership_status,
-- so existing legitimate accounts are not locked out by profile-state changes.
-- ---------------------------------------------------------------------
create or replace function public.mfdco_is_mfdco_account(p_user_id uuid default auth.uid())
returns boolean
language sql stable security definer set search_path=public
as $$
  select p_user_id is not null
    and exists(select 1 from public.profiles p where p.id=p_user_id)
$$;

revoke all on function public.mfdco_is_mfdco_account(uuid) from public;
grant execute on function public.mfdco_is_mfdco_account(uuid) to authenticated;

-- Editing and management now require an authenticated MFDCO profile.
create or replace function public.mfdco_country_can_edit(p_country_id text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select public.mfdco_is_mfdco_account(auth.uid()) and exists(
    select 1
    from public.countries c
    where c.id=p_country_id
      and c.archived_at is null
      and (
        c.owner_id=auth.uid()
        or exists(
          select 1 from public.country_members cm
          where cm.country_id=c.id
            and cm.user_id=auth.uid()
            and cm.role in ('owner','admin','editor')
        )
      )
  )
$$;

create or replace function public.mfdco_country_can_manage(p_country_id text)
returns boolean
language sql stable security definer set search_path=public
as $$
  select public.mfdco_is_mfdco_account(auth.uid()) and exists(
    select 1
    from public.countries c
    where c.id=p_country_id
      and c.archived_at is null
      and (
        c.owner_id=auth.uid()
        or exists(
          select 1 from public.country_members cm
          where cm.country_id=c.id
            and cm.user_id=auth.uid()
            and cm.role in ('owner','admin')
        )
      )
  )
$$;

revoke all on function public.mfdco_country_can_edit(text) from public;
revoke all on function public.mfdco_country_can_manage(text) from public;
grant execute on function public.mfdco_country_can_edit(text) to authenticated;
grant execute on function public.mfdco_country_can_manage(text) to authenticated;

-- Backfill owner rows for countries created before owner-mirroring was introduced.
insert into public.country_members(country_id,user_id,role,display_role,invited_by)
select c.id,c.owner_id,'owner','所有者',c.owner_id
from public.countries c
on conflict(country_id,user_id)
do update set role='owner',display_role=case when public.country_members.display_role='' then '所有者' else public.country_members.display_role end;

-- ---------------------------------------------------------------------
-- 3. COUNTRY OWNERSHIP LIMIT TIED TO ACCOUNT
-- ---------------------------------------------------------------------
create or replace function public.mfdco_country_limit_guard()
returns trigger
language plpgsql security definer set search_path=public
as $$
declare
  n integer;
  v_limit integer:=5;
begin
  if auth.uid() is not null and new.owner_id<>auth.uid() then
    raise exception 'owner_id must be the signed-in user';
  end if;
  if not public.mfdco_is_mfdco_account(new.owner_id) then
    raise exception 'MFDCO_ACCOUNT_REQUIRED';
  end if;

  select coalesce(l.max_owned_countries,5) into v_limit
  from public.country_account_limits l
  where l.user_id=new.owner_id;
  v_limit:=coalesce(v_limit,5);

  perform pg_advisory_xact_lock(hashtextextended(new.owner_id::text,0));
  select count(*) into n
  from public.countries
  where owner_id=new.owner_id and archived_at is null;

  if n>=v_limit then
    raise exception 'COUNTRY_LIMIT_REACHED: this MFDCO account can own up to % countries',v_limit;
  end if;
  return new;
end
$$;

-- ---------------------------------------------------------------------
-- 4. MEMBER DIRECTORY / ROLE MANAGEMENT
-- Direct writes to country_members are disabled for clients.
-- All role changes use the RPCs below.
-- ---------------------------------------------------------------------
drop function if exists public.mfdco_search_country_member_profiles(text);
drop function if exists public.mfdco_search_country_member_profiles(text,integer);
create function public.mfdco_search_country_member_profiles(
  p_query text,
  p_limit integer default 10
)
returns table(user_id uuid,activity_name text)
language sql stable security definer set search_path=public
as $$
  select p.id,coalesce(p.activity_name,'')::text
  from public.profiles p
  where public.mfdco_is_mfdco_account(auth.uid())
    and p.id<>auth.uid()
    and (
      p.id::text=trim(coalesce(p_query,''))
      or (
        length(trim(coalesce(p_query,'')))>=2
        and p.activity_name ilike '%'||trim(coalesce(p_query,''))||'%'
      )
    )
  order by
    case when lower(p.activity_name)=lower(trim(coalesce(p_query,''))) then 0 else 1 end,
    p.activity_name
  limit least(greatest(coalesce(p_limit,10),1),25)
$$;

revoke all on function public.mfdco_search_country_member_profiles(text,integer) from public;
grant execute on function public.mfdco_search_country_member_profiles(text,integer) to authenticated;

create or replace function public.mfdco_invite_country_member(
  p_country_id text,
  p_invitee_id uuid,
  p_role text,
  p_display_role text default ''
)
returns uuid
language plpgsql security definer set search_path=public
as $$
declare
  v_id uuid;
  v_name text;
  v_actor_role text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.mfdco_is_mfdco_account(auth.uid()) then raise exception 'MFDCO_ACCOUNT_REQUIRED'; end if;
  if not public.mfdco_is_mfdco_account(p_invitee_id) then raise exception 'INVITEE_MFDCO_ACCOUNT_REQUIRED'; end if;

  v_actor_role:=public.mfdco_country_role(p_country_id);
  if v_actor_role not in ('owner','admin') then raise exception 'not allowed'; end if;
  if p_role not in ('admin','editor','viewer') then raise exception 'invalid member role'; end if;
  if v_actor_role='admin' and p_role='admin' then raise exception 'ONLY_OWNER_CAN_GRANT_ADMIN'; end if;
  if v_actor_role='admin' and exists(
    select 1 from public.country_member_invitations
    where country_id=p_country_id and invitee_id=p_invitee_id and status='pending' and role='admin'
  ) then raise exception 'ONLY_OWNER_CAN_MANAGE_ADMIN'; end if;
  if p_invitee_id is null or p_invitee_id=auth.uid() then raise exception 'invalid invitee'; end if;
  if exists(select 1 from public.country_members where country_id=p_country_id and user_id=p_invitee_id) then
    raise exception 'USER_ALREADY_COUNTRY_MEMBER';
  end if;

  update public.country_member_invitations
  set role=p_role,display_role=left(coalesce(p_display_role,''),80),invited_by=auth.uid(),created_at=now(),responded_at=null
  where country_id=p_country_id and invitee_id=p_invitee_id and status='pending'
  returning id into v_id;

  if v_id is null then
    insert into public.country_member_invitations(country_id,invitee_id,role,display_role,invited_by)
    values(p_country_id,p_invitee_id,p_role,left(coalesce(p_display_role,''),80),auth.uid())
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
language plpgsql security definer set search_path=public
as $$
declare
  i public.country_member_invitations%rowtype;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.mfdco_is_mfdco_account(auth.uid()) then raise exception 'MFDCO_ACCOUNT_REQUIRED'; end if;
  if p_status not in ('accepted','declined') then raise exception 'invalid response'; end if;

  select * into i from public.country_member_invitations where id=p_invitation_id for update;
  if not found then raise exception 'invitation not found'; end if;
  if i.invitee_id<>auth.uid() then raise exception 'not allowed'; end if;
  if i.status<>'pending' then raise exception 'invitation already resolved'; end if;

  update public.country_member_invitations set status=p_status,responded_at=now() where id=i.id;
  if p_status='accepted' then
    insert into public.country_members(country_id,user_id,role,display_role,invited_by)
    values(i.country_id,i.invitee_id,i.role,i.display_role,i.invited_by)
    on conflict(country_id,user_id) do update
      set role=excluded.role,display_role=excluded.display_role,invited_by=excluded.invited_by;

    insert into public.country_notifications(user_id,country_id,notification_type,title,body,link)
    select cm.user_id,i.country_id,'member_invitation_accepted','共同編集の招待が受理されました',
      '新しい国家メンバーが参加しました。','country-manage.html?id='||i.country_id
    from public.country_members cm
    where cm.country_id=i.country_id and cm.role in ('owner','admin') and cm.user_id<>auth.uid();
  end if;
  return i.country_id;
end
$$;

create or replace function public.mfdco_update_country_member(
  p_country_id text,
  p_user_id uuid,
  p_role text,
  p_display_role text default null
)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare
  v_actor_role text;
  v_target_role text;
  v_owner uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  v_actor_role:=public.mfdco_country_role(p_country_id);
  if v_actor_role not in ('owner','admin') then raise exception 'not allowed'; end if;
  if p_role not in ('admin','editor','viewer') then raise exception 'invalid member role'; end if;

  select owner_id into v_owner from public.countries where id=p_country_id;
  if p_user_id=v_owner then raise exception 'COUNTRY_OWNER_ROLE_FIXED'; end if;
  select role into v_target_role from public.country_members where country_id=p_country_id and user_id=p_user_id;
  if v_target_role is null then raise exception 'member not found'; end if;
  if v_actor_role='admin' and (v_target_role='admin' or p_role='admin') then
    raise exception 'ONLY_OWNER_CAN_MANAGE_ADMIN';
  end if;

  update public.country_members
  set role=p_role,
      display_role=case when p_display_role is null then display_role else left(p_display_role,80) end
  where country_id=p_country_id and user_id=p_user_id;
  return found;
end
$$;

create or replace function public.mfdco_remove_country_member(
  p_country_id text,
  p_user_id uuid
)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare
  v_actor_role text;
  v_target_role text;
  v_owner uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  v_actor_role:=public.mfdco_country_role(p_country_id);
  if v_actor_role not in ('owner','admin') then raise exception 'not allowed'; end if;
  select owner_id into v_owner from public.countries where id=p_country_id;
  if p_user_id=v_owner then raise exception 'COUNTRY_OWNER_CANNOT_BE_REMOVED'; end if;
  select role into v_target_role from public.country_members where country_id=p_country_id and user_id=p_user_id;
  if v_target_role is null then return false; end if;
  if v_actor_role='admin' and v_target_role='admin' then raise exception 'ONLY_OWNER_CAN_MANAGE_ADMIN'; end if;

  delete from public.country_members where country_id=p_country_id and user_id=p_user_id;
  update public.country_user_preferences
  set main_country_id=case when main_country_id=p_country_id then null else main_country_id end,
      active_country_id=case when active_country_id=p_country_id then null else active_country_id end,
      updated_at=now()
  where user_id=p_user_id;
  return true;
end
$$;

create or replace function public.mfdco_leave_country(p_country_id text)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare
  v_owner uuid;
  v_left boolean:=false;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select owner_id into v_owner from public.countries where id=p_country_id;
  if not found then return false; end if;
  if v_owner=auth.uid() then raise exception 'COUNTRY_OWNER_CANNOT_LEAVE'; end if;

  delete from public.country_members where country_id=p_country_id and user_id=auth.uid();
  v_left:=found;
  update public.country_user_preferences
  set main_country_id=case when main_country_id=p_country_id then null else main_country_id end,
      active_country_id=case when active_country_id=p_country_id then null else active_country_id end,
      updated_at=now()
  where user_id=auth.uid();
  return v_left;
end
$$;

create or replace function public.mfdco_revoke_country_member_invitation(p_invitation_id uuid)
returns boolean
language plpgsql security definer set search_path=public
as $$
declare
  i public.country_member_invitations%rowtype;
  v_actor_role text;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  select * into i from public.country_member_invitations where id=p_invitation_id for update;
  if not found then return false; end if;
  v_actor_role:=public.mfdco_country_role(i.country_id);
  if v_actor_role not in ('owner','admin') then raise exception 'not allowed'; end if;
  if v_actor_role='admin' and i.role='admin' then raise exception 'ONLY_OWNER_CAN_MANAGE_ADMIN'; end if;
  if i.status<>'pending' then return false; end if;
  update public.country_member_invitations set status='revoked',responded_at=now() where id=i.id;
  return true;
end
$$;

-- Lock direct member mutations: client-side membership changes must use RPCs.
drop policy if exists country_members_manage on public.country_members;
revoke insert,update,delete on public.country_members from authenticated;
grant select on public.country_members to authenticated;

revoke all on function public.mfdco_invite_country_member(text,uuid,text,text) from public;
revoke all on function public.mfdco_respond_country_member_invitation(uuid,text) from public;
revoke all on function public.mfdco_update_country_member(text,uuid,text,text) from public;
revoke all on function public.mfdco_remove_country_member(text,uuid) from public;
revoke all on function public.mfdco_leave_country(text) from public;
revoke all on function public.mfdco_revoke_country_member_invitation(uuid) from public;
grant execute on function public.mfdco_invite_country_member(text,uuid,text,text) to authenticated;
grant execute on function public.mfdco_respond_country_member_invitation(uuid,text) to authenticated;
grant execute on function public.mfdco_update_country_member(text,uuid,text,text) to authenticated;
grant execute on function public.mfdco_remove_country_member(text,uuid) to authenticated;
grant execute on function public.mfdco_leave_country(text) to authenticated;
grant execute on function public.mfdco_revoke_country_member_invitation(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- 5. MY COUNTRY ACCESS
-- Used by dashboard so shared countries are discoverable without guessing URLs.
-- ---------------------------------------------------------------------
create or replace function public.mfdco_my_country_access()
returns table(
  id text,name text,short_name text,code text,summary text,is_public boolean,
  updated_at timestamptz,flag_key text,cover_key text,
  strength_score numeric,completeness_score integer,
  role text,display_role text,can_edit boolean,can_manage boolean
)
language sql stable security definer set search_path=public
as $$
  select
    c.id,c.name,c.short_name,c.code,c.summary,c.is_public,c.updated_at,
    c.flag_key,c.cover_key,c.strength_score,c.completeness_score,
    cm.role,cm.display_role,
    cm.role in ('owner','admin','editor') as can_edit,
    cm.role in ('owner','admin') as can_manage
  from public.country_members cm
  join public.countries c on c.id=cm.country_id
  where cm.user_id=auth.uid() and c.archived_at is null
  order by case cm.role when 'owner' then 0 when 'admin' then 1 when 'editor' then 2 else 3 end,c.updated_at desc
$$;

revoke all on function public.mfdco_my_country_access() from public;
grant execute on function public.mfdco_my_country_access() to authenticated;

-- ---------------------------------------------------------------------
-- 6. UNIFIED STORAGE QUOTA
-- Account 500 MiB by default across Country media + assets + private archives.
-- Each country 250 MiB by default across shared country media + assets.
-- Each individual uploaded file 25 MiB by default.
-- Collaborators spend their OWN account quota while also consuming the
-- shared country quota.
-- ---------------------------------------------------------------------
create or replace function public.mfdco_country_user_data_bytes(p_user_id uuid)
returns bigint
language sql stable security definer set search_path=public,storage
as $$
  select coalesce(sum(
    case
      when coalesce(o.metadata->>'size','') ~ '^[0-9]+$' then (o.metadata->>'size')::bigint
      else 0
    end
  ),0)::bigint
  from storage.objects o
  where o.bucket_id='country-user-data'
    and (storage.foldername(o.name))[1]=p_user_id::text
$$;

create or replace function public.mfdco_account_storage_usage()
returns jsonb
language plpgsql stable security definer set search_path=public,storage
as $$
declare
  v_user uuid:=auth.uid();
  v_media bigint:=0;
  v_assets bigint:=0;
  v_private bigint:=0;
  v_total bigint:=0;
  v_account_limit bigint:=524288000;
  v_country_limit bigint:=262144000;
  v_file_limit bigint:=26214400;
  v_owned_limit integer:=5;
  v_owned integer:=0;
  v_collab integer:=0;
  v_activity text:='';
begin
  if v_user is null then raise exception 'authentication required'; end if;
  if not public.mfdco_is_mfdco_account(v_user) then raise exception 'MFDCO_ACCOUNT_REQUIRED'; end if;

  select coalesce(l.account_storage_limit_bytes,524288000),
         coalesce(l.country_storage_limit_bytes,262144000),
         coalesce(l.max_file_size_bytes,26214400),
         coalesce(l.max_owned_countries,5)
  into v_account_limit,v_country_limit,v_file_limit,v_owned_limit
  from public.country_account_limits l where l.user_id=v_user;
  v_account_limit:=coalesce(v_account_limit,524288000);
  v_country_limit:=coalesce(v_country_limit,262144000);
  v_file_limit:=coalesce(v_file_limit,26214400);
  v_owned_limit:=coalesce(v_owned_limit,5);

  select coalesce(sum(size_bytes),0) into v_media from public.country_media where uploader_id=v_user;
  select coalesce(sum(size_bytes),0) into v_assets from public.country_assets where uploader_id=v_user;
  v_private:=public.mfdco_country_user_data_bytes(v_user);
  v_total:=v_media+v_assets+v_private;

  select count(*) into v_owned from public.countries where owner_id=v_user and archived_at is null;
  select count(*) into v_collab from public.country_members cm join public.countries c on c.id=cm.country_id
    where cm.user_id=v_user and cm.role<>'owner' and c.archived_at is null;
  select coalesce(activity_name,'') into v_activity from public.profiles where id=v_user;

  return jsonb_build_object(
    'user_id',v_user,'activity_name',coalesce(v_activity,''),
    'owned_countries',v_owned,'max_owned_countries',v_owned_limit,
    'collaborations',v_collab,
    'media_bytes',v_media,'asset_bytes',v_assets,'private_archive_bytes',v_private,
    'total_bytes',v_total,'account_limit_bytes',v_account_limit,
    'country_limit_bytes',v_country_limit,'max_file_bytes',v_file_limit,
    'remaining_bytes',greatest(0,v_account_limit-v_total),
    'allowed',v_total<=v_account_limit
  );
end
$$;

create or replace function public.mfdco_country_storage_usage(p_country_id text)
returns jsonb
language plpgsql stable security definer set search_path=public
as $$
declare
  v_media bigint:=0;
  v_assets bigint:=0;
  v_total bigint:=0;
  v_limit bigint:=262144000;
  v_owner uuid;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if public.mfdco_country_role(p_country_id) is null then raise exception 'not allowed'; end if;
  select owner_id into v_owner from public.countries where id=p_country_id;
  if v_owner is null then raise exception 'country not found'; end if;
  select coalesce(l.country_storage_limit_bytes,262144000) into v_limit
    from public.country_account_limits l where l.user_id=v_owner;
  v_limit:=coalesce(v_limit,262144000);
  select coalesce(sum(size_bytes),0) into v_media from public.country_media where country_id=p_country_id;
  select coalesce(sum(size_bytes),0) into v_assets from public.country_assets where country_id=p_country_id;
  v_total:=v_media+v_assets;
  return jsonb_build_object(
    'country_id',p_country_id,'media_bytes',v_media,'asset_bytes',v_assets,
    'total_bytes',v_total,'country_limit_bytes',v_limit,
    'remaining_bytes',greatest(0,v_limit-v_total),'allowed',v_total<=v_limit
  );
end
$$;

create or replace function public.mfdco_check_account_storage_quota(p_added_bytes bigint)
returns jsonb
language plpgsql stable security definer set search_path=public
as $$
declare
  u jsonb;
  v_add bigint:=greatest(0,coalesce(p_added_bytes,0));
  v_total bigint;
  v_limit bigint;
  v_file bigint;
begin
  u:=public.mfdco_account_storage_usage();
  v_total:=coalesce((u->>'total_bytes')::bigint,0);
  v_limit:=coalesce((u->>'account_limit_bytes')::bigint,524288000);
  v_file:=coalesce((u->>'max_file_bytes')::bigint,26214400);
  return u || jsonb_build_object(
    'added_bytes',v_add,
    'projected_account',v_total+v_add,
    'allowed',v_add<=v_file and v_total+v_add<=v_limit,
    'file_allowed',v_add<=v_file
  );
end
$$;

create or replace function public.mfdco_check_country_upload_quota(
  p_country_id text,
  p_added_bytes bigint,
  p_replace_country_bytes bigint default 0,
  p_replace_account_bytes bigint default 0
)
returns jsonb
language plpgsql stable security definer set search_path=public
as $$
declare
  v_add bigint:=greatest(0,coalesce(p_added_bytes,0));
  v_country jsonb;
  v_account jsonb;
  v_country_used bigint;
  v_country_limit bigint;
  v_account_used bigint;
  v_account_limit bigint;
  v_file_limit bigint;
  v_country_projected bigint;
  v_account_projected bigint;
begin
  if auth.uid() is null then raise exception 'authentication required'; end if;
  if not public.mfdco_country_can_edit(p_country_id) then raise exception 'not allowed'; end if;
  v_country:=public.mfdco_country_storage_usage(p_country_id);
  v_account:=public.mfdco_account_storage_usage();
  v_country_used:=greatest(0,coalesce((v_country->>'total_bytes')::bigint,0)-greatest(0,coalesce(p_replace_country_bytes,0)));
  v_country_limit:=coalesce((v_country->>'country_limit_bytes')::bigint,262144000);
  v_account_used:=greatest(0,coalesce((v_account->>'total_bytes')::bigint,0)-greatest(0,coalesce(p_replace_account_bytes,0)));
  v_account_limit:=coalesce((v_account->>'account_limit_bytes')::bigint,524288000);
  v_file_limit:=coalesce((v_account->>'max_file_bytes')::bigint,26214400);
  v_country_projected:=v_country_used+v_add;
  v_account_projected:=v_account_used+v_add;
  return jsonb_build_object(
    'allowed',v_add<=v_file_limit and v_country_projected<=v_country_limit and v_account_projected<=v_account_limit,
    'file_allowed',v_add<=v_file_limit,
    'country_used',v_country_used,'country_limit',v_country_limit,'projected_country',v_country_projected,
    'account_used',v_account_used,'account_limit',v_account_limit,'projected_account',v_account_projected,
    'max_file_bytes',v_file_limit
  );
end
$$;

-- Compatibility wrapper used by existing uploadMedia() client code.
create or replace function public.mfdco_check_country_media_quota(
  p_country_id text,
  p_added_bytes bigint,
  p_slot text default ''
)
returns jsonb
language plpgsql stable security definer set search_path=public
as $$
declare
  v_replace_country bigint:=0;
  v_replace_account bigint:=0;
begin
  if coalesce(p_slot,'')<>'' then
    select coalesce(sum(size_bytes),0) into v_replace_country
      from public.country_media where country_id=p_country_id and slot=p_slot;
    select coalesce(sum(size_bytes),0) into v_replace_account
      from public.country_media where country_id=p_country_id and slot=p_slot and uploader_id=auth.uid();
  end if;
  return public.mfdco_check_country_upload_quota(p_country_id,p_added_bytes,v_replace_country,v_replace_account);
end
$$;

create or replace function public.mfdco_country_asset_quota_guard()
returns trigger
language plpgsql security definer set search_path=public
as $$
declare
  q jsonb;
  v_replace_country bigint:=0;
  v_replace_account bigint:=0;
begin
  if auth.uid() is null then return new; end if;
  if new.uploader_id<>auth.uid() then raise exception 'uploader_id must be the signed-in user'; end if;
  if not public.mfdco_country_can_edit(new.country_id) then raise exception 'not allowed'; end if;
  if tg_op='UPDATE' then
    v_replace_country:=case when old.country_id=new.country_id then old.size_bytes else 0 end;
    v_replace_account:=case when old.uploader_id=auth.uid() then old.size_bytes else 0 end;
  end if;
  perform pg_advisory_xact_lock(hashtextextended(new.country_id,0));
  perform pg_advisory_xact_lock(hashtextextended(new.uploader_id::text,1));
  q:=public.mfdco_check_country_upload_quota(new.country_id,new.size_bytes,v_replace_country,v_replace_account);
  if not coalesce((q->>'allowed')::boolean,false) then raise exception 'COUNTRY_STORAGE_QUOTA_REACHED'; end if;
  return new;
end
$$;

drop trigger if exists country_assets_quota_guard_v20_2 on public.country_assets;
create trigger country_assets_quota_guard_v20_2
before insert or update of country_id,uploader_id,size_bytes on public.country_assets
for each row execute function public.mfdco_country_asset_quota_guard();

-- country-user-data is private but still account-owned. Exact incoming byte
-- enforcement is done by the client preflight; this policy also rejects uploads
-- after the account is already full.
drop policy if exists country_user_data_insert_v20 on storage.objects;
create policy country_user_data_insert_v20 on storage.objects
for insert to authenticated
with check(
  bucket_id='country-user-data'
  and (storage.foldername(name))[1]=auth.uid()::text
  and public.mfdco_is_mfdco_account(auth.uid())
);

revoke all on function public.mfdco_country_user_data_bytes(uuid) from public;
revoke all on function public.mfdco_account_storage_usage() from public;
revoke all on function public.mfdco_country_storage_usage(text) from public;
revoke all on function public.mfdco_check_account_storage_quota(bigint) from public;
revoke all on function public.mfdco_check_country_upload_quota(text,bigint,bigint,bigint) from public;
revoke all on function public.mfdco_check_country_media_quota(text,bigint,text) from public;
grant execute on function public.mfdco_account_storage_usage() to authenticated;
grant execute on function public.mfdco_country_storage_usage(text) to authenticated;
grant execute on function public.mfdco_check_account_storage_quota(bigint) to authenticated;
grant execute on function public.mfdco_check_country_upload_quota(text,bigint,bigint,bigint) to authenticated;
grant execute on function public.mfdco_check_country_media_quota(text,bigint,text) to authenticated;

-- ---------------------------------------------------------------------
-- 7. LIGHTWEIGHT STRUCTURED-DATA GUARDS
-- Keep user-entered JSON small; files belong in Storage / IndexedDB.
-- ---------------------------------------------------------------------
create or replace function public.mfdco_v20_payload_size_guard()
returns trigger
language plpgsql set search_path=public
as $$
begin
  if tg_table_name='country_documents' and pg_column_size(coalesce(new.payload,'{}'::jsonb))>524288 then
    raise exception 'COUNTRY_DOCUMENT_TOO_LARGE: document payload exceeds 512 KiB';
  elsif tg_table_name in ('country_entities','country_links') and pg_column_size(coalesce(new.payload,'{}'::jsonb))>131072 then
    raise exception 'COUNTRY_ENTITY_TOO_LARGE: entity/link payload exceeds 128 KiB';
  end if;
  return new;
end
$$;

drop trigger if exists country_documents_size_guard_v20_2 on public.country_documents;
create trigger country_documents_size_guard_v20_2
before insert or update of payload on public.country_documents
for each row execute function public.mfdco_v20_payload_size_guard();

drop trigger if exists country_entities_size_guard_v20_2 on public.country_entities;
create trigger country_entities_size_guard_v20_2
before insert or update of payload on public.country_entities
for each row execute function public.mfdco_v20_payload_size_guard();

drop trigger if exists country_links_size_guard_v20_2 on public.country_links;
create trigger country_links_size_guard_v20_2
before insert or update of payload on public.country_links
for each row execute function public.mfdco_v20_payload_size_guard();

commit;

-- Diagnostics
select public.mfdco_is_mfdco_account(auth.uid()) as signed_in_profile_linked;
select proname,pg_get_function_identity_arguments(oid) arguments
from pg_proc join pg_namespace n on n.oid=pg_proc.pronamespace
where n.nspname='public' and proname in (
 'mfdco_my_country_access','mfdco_account_storage_usage','mfdco_country_storage_usage',
 'mfdco_update_country_member','mfdco_remove_country_member','mfdco_leave_country'
)
order by proname;

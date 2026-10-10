-- ============================================================
-- MFDCO Country v23.6 HOTFIX
-- Fix: owned countries missing from Country Dashboard
-- Safe for existing v23.x databases.
-- ============================================================

begin;

-- countries.owner_id is the canonical ownership source.
-- Keep a mirror row in country_members for collaboration UI compatibility.
create or replace function public.mfdco_country_seed_owner()
returns trigger
language plpgsql
security definer
set search_path=public
as $$
begin
  insert into public.country_members(
    country_id,user_id,role,display_role,invited_by
  )
  values(
    new.id,new.owner_id,'owner','所有者',new.owner_id
  )
  on conflict(country_id,user_id)
  do update set
    role='owner',
    display_role=case
      when coalesce(public.country_members.display_role,'')='' then '所有者'
      else public.country_members.display_role
    end;
  return new;
end
$$;

drop trigger if exists countries_seed_owner on public.countries;
create trigger countries_seed_owner
after insert on public.countries
for each row execute function public.mfdco_country_seed_owner();

-- Repair countries created while the owner mirror was missing.
insert into public.country_members(
  country_id,user_id,role,display_role,invited_by
)
select
  c.id,c.owner_id,'owner','所有者',c.owner_id
from public.countries c
where c.archived_at is null
on conflict(country_id,user_id)
do update set
  role='owner',
  display_role=case
    when coalesce(public.country_members.display_role,'')='' then '所有者'
    else public.country_members.display_role
  end;

-- Dashboard RPC:
-- ownership comes directly from countries.owner_id;
-- collaborator access comes from country_members.
create or replace function public.mfdco_my_country_access()
returns table(
  id text,
  name text,
  short_name text,
  code text,
  summary text,
  is_public boolean,
  updated_at timestamptz,
  flag_key text,
  cover_key text,
  strength_score numeric,
  completeness_score integer,
  role text,
  display_role text,
  can_edit boolean,
  can_manage boolean
)
language sql
stable
security definer
set search_path=public
as $$
  with owned as (
    select
      c.id,
      c.name,
      c.short_name,
      c.code,
      c.summary,
      c.is_public,
      c.updated_at,
      c.flag_key,
      c.cover_key,
      c.strength_score,
      c.completeness_score,
      'owner'::text as role,
      '所有者'::text as display_role,
      true as can_edit,
      true as can_manage
    from public.countries c
    where c.owner_id=auth.uid()
      and c.archived_at is null
  ),
  shared as (
    select
      c.id,
      c.name,
      c.short_name,
      c.code,
      c.summary,
      c.is_public,
      c.updated_at,
      c.flag_key,
      c.cover_key,
      c.strength_score,
      c.completeness_score,
      cm.role,
      cm.display_role,
      cm.role in ('owner','admin','editor') as can_edit,
      cm.role in ('owner','admin') as can_manage
    from public.country_members cm
    join public.countries c on c.id=cm.country_id
    where cm.user_id=auth.uid()
      and c.owner_id<>auth.uid()
      and c.archived_at is null
  )
  select * from owned
  union all
  select * from shared
  order by
    case role
      when 'owner' then 0
      when 'admin' then 1
      when 'editor' then 2
      else 3
    end,
    updated_at desc
$$;

revoke all on function public.mfdco_my_country_access() from public;
grant execute on function public.mfdco_my_country_access() to authenticated;

commit;

notify pgrst, 'reload schema';

-- Verification.
select
  c.id,
  c.name,
  c.owner_id,
  p.activity_name as owner_activity_name,
  cm.role as mirrored_member_role
from public.countries c
left join public.profiles p on p.id=c.owner_id
left join public.country_members cm
  on cm.country_id=c.id and cm.user_id=c.owner_id
where c.archived_at is null
order by c.updated_at desc;

-- ============================================================
-- MFDCO Country v20.3 / MFDCO account authorization hardening
-- Requires v20.2 / v21.1 base.
-- ============================================================
begin;

-- A Country editor/owner must be a real MFDCO account:
-- Supabase Auth user + matching public.profiles row.
create or replace function public.mfdco_country_role(p_country_id text)
returns text
language sql
stable
security definer
set search_path=public
as $$
  select case
    when not public.mfdco_is_mfdco_account(auth.uid()) then null
    when c.owner_id=auth.uid() then 'owner'
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

revoke all on function public.mfdco_country_role(text) from public;
grant execute on function public.mfdco_country_role(text) to authenticated;

-- Direct country creation also requires an MFDCO profile.
drop policy if exists countries_insert on public.countries;
create policy countries_insert
on public.countries for insert
to authenticated
with check(
  auth.uid() is not null
  and owner_id=auth.uid()
  and public.mfdco_is_mfdco_account(auth.uid())
);

-- Public/private owner profile used by the country information page.
-- No email or authentication secrets are exposed.
drop function if exists public.mfdco_public_country_owner_profile(text);
create function public.mfdco_public_country_owner_profile(p_country_id text)
returns table(
  user_id uuid,
  activity_name text,
  icon_url text,
  fictional_country text,
  flag_url text,
  permanent_member boolean
)
language sql
stable
security definer
set search_path=public
as $$
  select
    p.id,
    coalesce(p.activity_name,''),
    coalesce(p.icon_url,''),
    coalesce(p.fictional_country,''),
    coalesce(p.flag_url,''),
    coalesce(p.permanent_member,false)
  from public.countries c
  join public.profiles p on p.id=c.owner_id
  where c.id=p_country_id
    and c.archived_at is null
    and public.mfdco_country_can_view(c.id)
  limit 1
$$;

revoke all on function public.mfdco_public_country_owner_profile(text) from public;
grant execute on function public.mfdco_public_country_owner_profile(text) to anon,authenticated;

commit;

-- Diagnostics
select
  p.proname,
  pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'mfdco_is_mfdco_account',
    'mfdco_country_role',
    'mfdco_public_country_owner_profile'
  )
order by p.proname;

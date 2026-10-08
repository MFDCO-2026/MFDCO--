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

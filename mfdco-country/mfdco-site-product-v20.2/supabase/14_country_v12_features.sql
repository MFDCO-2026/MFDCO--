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

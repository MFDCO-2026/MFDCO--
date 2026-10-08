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

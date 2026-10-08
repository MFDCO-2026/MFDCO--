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

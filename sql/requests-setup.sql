begin;
create extension if not exists pgcrypto;

create table if not exists public.requests (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references auth.users(id) on delete cascade,
    title text not null check (char_length(title) between 1 and 120),
    description text not null default '' check (char_length(description) <= 5000),
    category text,
    tags text[] not null default '{}'::text[],
    status text not null default 'open' check (status in ('open','in_progress','review','completed')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    completed_at timestamptz
);
create index if not exists requests_status_idx on public.requests(status);
create index if not exists requests_user_id_idx on public.requests(user_id);
create index if not exists requests_created_at_idx on public.requests(created_at desc);

create table if not exists public.request_workers (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references public.requests(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    joined_at timestamptz not null default now(),
    unique(request_id,user_id)
);
create index if not exists request_workers_request_id_idx on public.request_workers(request_id);
create index if not exists request_workers_user_id_idx on public.request_workers(user_id);

create table if not exists public.request_submissions (
    id uuid primary key default gen_random_uuid(),
    request_id uuid not null references public.requests(id) on delete cascade,
    user_id uuid not null references auth.users(id) on delete cascade,
    work_id uuid not null references public.works(id) on delete restrict,
    message text check (message is null or char_length(message) <= 1000),
    status text not null default 'pending' check (status in ('pending','accepted','revision')),
    created_at timestamptz not null default now(),
    reviewed_at timestamptz
);
create index if not exists request_submissions_request_id_idx on public.request_submissions(request_id);
create index if not exists request_submissions_work_id_idx on public.request_submissions(work_id);
create unique index if not exists request_submissions_one_pending_idx on public.request_submissions(request_id) where status='pending';

create or replace function public.touch_request_updated_at()
returns trigger language plpgsql security invoker set search_path=public as $$
begin
    new.updated_at=now();
    if new.status='completed' and old.status is distinct from 'completed' then
        new.completed_at=coalesce(new.completed_at,now());
    elsif new.status<>'completed' then
        new.completed_at=null;
    end if;
    return new;
end;$$;
drop trigger if exists trg_requests_touch_updated_at on public.requests;
create trigger trg_requests_touch_updated_at before update on public.requests for each row execute function public.touch_request_updated_at();

alter table public.requests enable row level security;
alter table public.request_workers enable row level security;
alter table public.request_submissions enable row level security;

drop policy if exists requests_public_read on public.requests;
create policy requests_public_read on public.requests for select to anon,authenticated using(true);
drop policy if exists requests_authenticated_insert on public.requests;
create policy requests_authenticated_insert on public.requests for insert to authenticated with check(user_id=auth.uid());
drop policy if exists requests_owner_update on public.requests;
create policy requests_owner_update on public.requests for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
drop policy if exists requests_owner_delete on public.requests;
create policy requests_owner_delete on public.requests for delete to authenticated using(user_id=auth.uid());

drop policy if exists request_workers_public_read on public.request_workers;
create policy request_workers_public_read on public.request_workers for select to anon,authenticated using(true);
drop policy if exists request_submissions_public_read on public.request_submissions;
create policy request_submissions_public_read on public.request_submissions for select to anon,authenticated using(true);

create or replace function public.join_request(p_request_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_owner uuid; v_status text;
begin
    if v_user is null then raise exception 'not authenticated'; end if;
    select user_id,status into v_owner,v_status from public.requests where id=p_request_id for update;
    if not found then raise exception 'request not found'; end if;
    if v_owner=v_user then raise exception 'owner cannot join own request'; end if;
    if v_status='completed' then raise exception 'request is completed'; end if;
    if v_status='review' then raise exception 'request is under review'; end if;
    insert into public.request_workers(request_id,user_id) values(p_request_id,v_user) on conflict(request_id,user_id) do nothing;
    if v_status='open' then update public.requests set status='in_progress' where id=p_request_id; end if;
end;$$;

create or replace function public.leave_request(p_request_id uuid)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_status text; v_remaining integer;
begin
    if v_user is null then raise exception 'not authenticated'; end if;
    select status into v_status from public.requests where id=p_request_id for update;
    if not found then raise exception 'request not found'; end if;
    if v_status='completed' then raise exception 'request is completed'; end if;
    if v_status='review' then raise exception 'request is under review'; end if;
    delete from public.request_workers where request_id=p_request_id and user_id=v_user;
    select count(*) into v_remaining from public.request_workers where request_id=p_request_id;
    if v_remaining=0 and v_status='in_progress' then update public.requests set status='open' where id=p_request_id; end if;
end;$$;

create or replace function public.submit_request_work(p_request_id uuid,p_work_id uuid,p_message text default null)
returns uuid language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_request_status text; v_is_worker boolean; v_work_owner uuid; v_work_status text; v_submission_id uuid;
begin
    if v_user is null then raise exception 'not authenticated'; end if;
    select status into v_request_status from public.requests where id=p_request_id for update;
    if not found then raise exception 'request not found'; end if;
    if v_request_status='completed' then raise exception 'request is completed'; end if;
    if v_request_status='review' then raise exception 'request is under review'; end if;
    select exists(select 1 from public.request_workers where request_id=p_request_id and user_id=v_user) into v_is_worker;
    if not v_is_worker then raise exception 'not a worker'; end if;
    select user_id,status into v_work_owner,v_work_status from public.works where id=p_work_id;
    if not found then raise exception 'work not found'; end if;
    if v_work_owner<>v_user then raise exception 'work is not owned by current user'; end if;
    if v_work_status<>'approved' then raise exception 'work is not approved'; end if;
    update public.request_submissions set status='revision',reviewed_at=now() where request_id=p_request_id and status='pending';
    insert into public.request_submissions(request_id,user_id,work_id,message,status)
    values(p_request_id,v_user,p_work_id,nullif(trim(coalesce(p_message,'')),''),'pending') returning id into v_submission_id;
    update public.requests set status='review' where id=p_request_id;
    return v_submission_id;
end;$$;

create or replace function public.review_request_submission(p_submission_id uuid,p_action text)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_request_id uuid; v_request_owner uuid; v_submission_status text; v_workers integer;
begin
    if v_user is null then raise exception 'not authenticated'; end if;
    if p_action not in ('accept','revision') then raise exception 'invalid action'; end if;
    select s.request_id,s.status,r.user_id into v_request_id,v_submission_status,v_request_owner
    from public.request_submissions s join public.requests r on r.id=s.request_id
    where s.id=p_submission_id for update of s,r;
    if not found then raise exception 'submission not found'; end if;
    if v_request_owner<>v_user then raise exception 'not owner'; end if;
    if v_submission_status<>'pending' then raise exception 'submission is not pending'; end if;
    if p_action='accept' then
        update public.request_submissions set status='accepted',reviewed_at=now() where id=p_submission_id;
        update public.requests set status='completed' where id=v_request_id;
    else
        update public.request_submissions set status='revision',reviewed_at=now() where id=p_submission_id;
        select count(*) into v_workers from public.request_workers where request_id=v_request_id;
        update public.requests set status=case when v_workers>0 then 'in_progress' else 'open' end where id=v_request_id;
    end if;
end;$$;

create or replace function public.set_request_status(p_request_id uuid,p_status text)
returns void language plpgsql security definer set search_path=public as $$
declare v_user uuid:=auth.uid(); v_owner uuid;
begin
    if v_user is null then raise exception 'not authenticated'; end if;
    if p_status not in ('open','in_progress','review','completed') then raise exception 'invalid status'; end if;
    select user_id into v_owner from public.requests where id=p_request_id for update;
    if not found then raise exception 'request not found'; end if;
    if v_owner<>v_user then raise exception 'not owner'; end if;
    update public.requests set status=p_status where id=p_request_id;
end;$$;

revoke all on function public.join_request(uuid) from public;
revoke all on function public.leave_request(uuid) from public;
revoke all on function public.submit_request_work(uuid,uuid,text) from public;
revoke all on function public.review_request_submission(uuid,text) from public;
revoke all on function public.set_request_status(uuid,text) from public;
grant execute on function public.join_request(uuid) to authenticated;
grant execute on function public.leave_request(uuid) to authenticated;
grant execute on function public.submit_request_work(uuid,uuid,text) to authenticated;
grant execute on function public.review_request_submission(uuid,text) to authenticated;
grant execute on function public.set_request_status(uuid,text) to authenticated;
commit;

-- =========================================================
-- MFDCO Country Operations v17.3 incremental
-- Requires the current Country DB baseline (v17.2 / complete v18).
--
-- Adds:
--   * approved Work search RPC for official adoption
--   * market-history backfill updates existing hourly rows
-- =========================================================
begin;

-- ---------------------------------------------------------
-- 1. PUBLIC APPROVED WORK SEARCH FOR OFFICIAL ADOPTION
-- ---------------------------------------------------------
-- This SECURITY DEFINER RPC only returns works with status='approved'.
-- It avoids an empty picker caused by unrelated Works-page RLS details.
create or replace function public.mfdco_public_works_for_adoption(
  p_query text default '',
  p_limit integer default 250
)
returns table(payload jsonb)
language sql
stable
security definer
set search_path=public
as $$
  select jsonb_build_object(
    'id', w.id,
    'title', coalesce(to_jsonb(w)->>'title',''),
    'image_url', coalesce(to_jsonb(w)->>'image_url',''),
    'tags', coalesce(to_jsonb(w)->'tags','[]'::jsonb),
    'description', coalesce(to_jsonb(w)->>'description',''),
    'submission_type', coalesce(to_jsonb(w)->>'submission_type',''),
    'download_access', coalesce(to_jsonb(w)->>'download_access',''),
    'status', coalesce(to_jsonb(w)->>'status',''),
    'created_at', w.created_at
  ) as payload
  from public.works w
  where w.status='approved'
    and (
      btrim(coalesce(p_query,''))=''
      or coalesce(to_jsonb(w)->>'title','') ilike '%'||btrim(p_query)||'%'
      or coalesce(to_jsonb(w)->>'description','') ilike '%'||btrim(p_query)||'%'
      or coalesce((to_jsonb(w)->'tags')::text,'') ilike '%'||btrim(p_query)||'%'
    )
  order by w.created_at desc
  limit least(greatest(coalesce(p_limit,250),1),500)
$$;

revoke all on function public.mfdco_public_works_for_adoption(text,integer) from public;
grant execute on function public.mfdco_public_works_for_adoption(text,integer)
  to anon,authenticated;

-- ---------------------------------------------------------
-- 2. HOURLY MARKET HISTORY UPSERT
-- ---------------------------------------------------------
-- v17.3 changed the market model from daily/monthly influence to a
-- deterministic hourly-only model. Re-running a backfill must therefore
-- be able to refresh rows that were written by the older model.
create or replace function public.mfdco_backfill_market_history(p_rows jsonb)
returns integer
language plpgsql
security definer
set search_path=public
as $$
declare
  r jsonb;
  v_processed integer:=0;
  v_country_id public.countries.id%type;
begin
  if auth.uid() is null then
    raise exception 'authentication required';
  end if;

  if jsonb_typeof(coalesce(p_rows,'[]'::jsonb))<>'array' then
    raise exception 'rows must be an array';
  end if;

  if jsonb_array_length(coalesce(p_rows,'[]'::jsonb))>500 then
    raise exception 'too many rows; maximum is 500 per call';
  end if;

  for r in select value from jsonb_array_elements(coalesce(p_rows,'[]'::jsonb))
  loop
    v_country_id:=r->>'country_id';

    if not exists(
      select 1 from public.countries c
      where c.id=v_country_id
        and c.is_public=true
        and c.archived_at is null
    ) then
      continue;
    end if;

    insert into public.country_market_history(
      country_id,captured_hour,market_date,market_month,market_hour,
      change_pct,fx_value,stock_value,world_average_pct,themes,recorded_by
    ) values(
      v_country_id,
      (r->>'captured_hour')::timestamptz,
      (r->>'market_date')::date,
      coalesce(r->>'market_month',''),
      coalesce(r->>'market_hour',''),
      coalesce((r->>'change_pct')::numeric,0),
      nullif(r->>'fx_value','')::numeric,
      nullif(r->>'stock_value','')::numeric,
      nullif(r->>'world_average_pct','')::numeric,
      coalesce(r->'themes','{}'::jsonb),
      auth.uid()
    )
    on conflict(country_id,captured_hour) do update
      set market_date=excluded.market_date,
          market_month=excluded.market_month,
          market_hour=excluded.market_hour,
          change_pct=excluded.change_pct,
          fx_value=excluded.fx_value,
          stock_value=excluded.stock_value,
          world_average_pct=excluded.world_average_pct,
          themes=excluded.themes,
          recorded_by=excluded.recorded_by;

    v_processed:=v_processed+1;
  end loop;

  return v_processed;
end
$$;

revoke all on function public.mfdco_backfill_market_history(jsonb) from public;
grant execute on function public.mfdco_backfill_market_history(jsonb) to authenticated;

commit;

-- Verification
select p.proname,pg_get_function_identity_arguments(p.oid) as arguments
from pg_proc p
join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public'
  and p.proname in (
    'mfdco_public_works_for_adoption',
    'mfdco_backfill_market_history'
  )
order by p.proname;

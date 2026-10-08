-- =========================================================
-- MFDCO Country Operations v11 incremental
-- v10 -> v11
-- Advanced national statistics are stored in existing core_data / country_records.
-- This migration adds a compact public market snapshot RPC only.
-- =========================================================

begin;

create or replace function public.mfdco_public_market_snapshots()
returns table (
    id uuid,
    name text,
    payload jsonb
)
language sql
stable
security definer
set search_path = public
as $$
    select
        c.id,
        c.name,
        jsonb_build_object(
            'id', c.id,
            'name', c.name,
            'isPublic', true,
            'population', c.population,
            'territory', jsonb_build_object('area', c.area_km2),
            'sovereignty', coalesce(c.core_data -> 'sovereignty', '{}'::jsonb),
            'economy', coalesce(c.core_data -> 'economy', '{}'::jsonb),
            'advanced', jsonb_build_object(
                'finance', coalesce(c.core_data #> '{advanced,finance}', '{}'::jsonb),
                'social', coalesce(c.core_data #> '{advanced,social}', '{}'::jsonb),
                'technology', coalesce(c.core_data #> '{advanced,technology}', '{}'::jsonb),
                'information', coalesce(c.core_data #> '{advanced,information}', '{}'::jsonb)
            ),
            'strength', coalesce(c.core_data -> 'strength', '{}'::jsonb),
            'science', coalesce(c.core_data -> 'science', '{}'::jsonb),
            'food', coalesce(c.core_data -> 'food', '{}'::jsonb),
            'energy', coalesce(c.core_data -> 'energy', '{}'::jsonb),
            'military', coalesce(c.core_data -> 'military', '{}'::jsonb),
            'industries', coalesce(c.core_data -> 'industries', '[]'::jsonb),
            'products', coalesce(c.core_data -> 'products', '[]'::jsonb),
            'resources', coalesce(c.core_data -> 'resources', '[]'::jsonb),
            'companies', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'company'
            ), '[]'::jsonb),
            'marketDependencies', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'market_dependency'
            ), '[]'::jsonb),
            'ports', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'port'
            ), '[]'::jsonb),
            'resourceReserves', coalesce((
                select jsonb_agg(r.payload || jsonb_build_object('id', r.id) order by r.sort_order)
                from public.country_records r
                where r.country_id = c.id
                  and r.record_type = 'resource_reserve'
            ), '[]'::jsonb)
        ) as payload
    from public.countries c
    where c.is_public = true
      and c.archived_at is null;
$$;

revoke all on function public.mfdco_public_market_snapshots() from public;
grant execute on function public.mfdco_public_market_snapshots() to anon, authenticated;

commit;

-- Check
select proname
from pg_proc
where proname = 'mfdco_public_market_snapshots';

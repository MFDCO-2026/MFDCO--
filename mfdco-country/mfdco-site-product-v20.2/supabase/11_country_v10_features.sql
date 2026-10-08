-- =========================================================
-- MFDCO Country Operations v10 incremental migration
-- v9 -> v10
-- =========================================================
begin;

-- Formal equipment can now be grouped more finely and assigned to a unit.
alter table if exists public.country_work_adoptions
  add column if not exists unit_name text not null default '';

-- v10 UI adds a reserve state in addition to active / experimental / retired.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema='public' and table_name='country_work_adoptions'
  ) then
    alter table public.country_work_adoptions
      drop constraint if exists country_work_adoptions_status_check;
    alter table public.country_work_adoptions
      add constraint country_work_adoptions_status_check
      check (status in ('active','reserve','retired','experimental'));
  end if;
end $$;

create index if not exists country_work_adoptions_category_idx
  on public.country_work_adoptions(country_id,category,status,adopted_at desc);

commit;

-- Quick verification
select column_name,data_type
from information_schema.columns
where table_schema='public'
  and table_name='country_work_adoptions'
  and column_name in ('category','unit_name','status')
order by column_name;

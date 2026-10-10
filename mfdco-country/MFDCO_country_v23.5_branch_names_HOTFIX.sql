-- ============================================================
-- MFDCO Country v23.5 HOTFIX
-- Fix: country_work_adoptions.branch_names schema cache error
-- Safe for an existing / partially-installed Country DB.
-- ============================================================

begin;

alter table public.country_work_adoptions
  add column if not exists unit_name text not null default '',
  add column if not exists branch_names text[] not null default '{}'::text[],
  add column if not exists unit_names text[] not null default '{}'::text[];

alter table public.country_work_adoptions
  drop constraint if exists country_work_adoptions_status_check;

alter table public.country_work_adoptions
  add constraint country_work_adoptions_status_check
  check(status in ('active','reserve','retired','experimental'));

update public.country_work_adoptions
set branch_names=array[branch_name]
where coalesce(branch_name,'')<>''
  and cardinality(branch_names)=0;

update public.country_work_adoptions
set unit_names=array[unit_name]
where coalesce(unit_name,'')<>''
  and cardinality(unit_names)=0;

commit;

notify pgrst, 'reload schema';

select column_name,data_type,udt_name
from information_schema.columns
where table_schema='public'
  and table_name='country_work_adoptions'
  and column_name in (
    'branch_name','unit_name','branch_names','unit_names','status'
  )
order by column_name;

-- MFDCO Country Operations v9 - site integration layer
begin;

create or replace function public.mfdco_profile_public_countries(p_user_id uuid)
returns table(id text,name text,short_name text,code text,summary text,population bigint,capital text,strength_score numeric,completeness_score integer,flag_key text,updated_at timestamptz)
language sql stable security definer set search_path=public as $$
 select c.id,c.name,c.short_name,c.code,c.summary,c.population,c.capital,c.strength_score,c.completeness_score,c.flag_key,c.updated_at
 from public.countries c
 where c.owner_id=p_user_id and c.is_public=true and c.archived_at is null
 order by c.updated_at desc;
$$;
revoke execute on function public.mfdco_profile_public_countries(uuid) from public;
grant execute on function public.mfdco_profile_public_countries(uuid) to anon,authenticated;

create or replace function public.mfdco_site_country_counts()
returns table(public_countries bigint,public_posts bigint,official_adoptions bigint)
language sql stable security definer set search_path=public as $$
 select
  (select count(*) from public.countries where is_public=true and archived_at is null),
  (select count(*) from public.country_records r join public.countries c on c.id=r.country_id where r.record_type='post' and coalesce(r.payload->>'status','published')='published' and c.is_public=true and c.archived_at is null),
  (select count(*) from public.country_work_adoptions a join public.countries c on c.id=a.country_id where a.status='active' and c.is_public=true and c.archived_at is null);
$$;
revoke execute on function public.mfdco_site_country_counts() from public;
grant execute on function public.mfdco_site_country_counts() to anon,authenticated;
commit;

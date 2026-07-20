-- Sharbo Auto DMS V4.2
-- Correctif non destructif : permet à l'utilisateur connecté de lire les types
-- de contrats et d'utiliser le module Contrats.

begin;

alter table public.contract_types enable row level security;
alter table public.contracts enable row level security;

grant select on table public.contract_types to authenticated;
grant select, insert, update, delete on table public.contracts to authenticated;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='contract_types'
      and policyname='Authenticated users can read contract types'
  ) then
    create policy "Authenticated users can read contract types"
      on public.contract_types for select
      to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='contracts'
      and policyname='Authenticated users can read contracts'
  ) then
    create policy "Authenticated users can read contracts"
      on public.contracts for select
      to authenticated using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='contracts'
      and policyname='Authenticated users can insert contracts'
  ) then
    create policy "Authenticated users can insert contracts"
      on public.contracts for insert
      to authenticated with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='contracts'
      and policyname='Authenticated users can update contracts'
  ) then
    create policy "Authenticated users can update contracts"
      on public.contracts for update
      to authenticated using (true) with check (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='contracts'
      and policyname='Authenticated users can delete contracts'
  ) then
    create policy "Authenticated users can delete contracts"
      on public.contracts for delete
      to authenticated using (true);
  end if;
end $$;

commit;

notify pgrst, 'reload schema';

select code, french_name, english_name
from public.contract_types
order by french_name;

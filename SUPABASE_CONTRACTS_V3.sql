-- Sharbo Auto Admin V3 - Contracts Engine
-- Run once in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.contracts (
  id uuid primary key default gen_random_uuid(),
  contract_number text unique,
  customer_id uuid not null references public.customers(id) on delete restrict,
  vehicle_id uuid not null references public.vehicles(id) on delete restrict,
  contract_type text not null default 'Vente',
  language text not null default 'fr' check (language in ('fr','en')),
  status text not null default 'Brouillon' check (status in ('Brouillon','Signé','Annulé')),
  sale_price numeric(12,2) not null default 0,
  deposit numeric(12,2) not null default 0,
  fees numeric(12,2) not null default 0,
  discount numeric(12,2) not null default 0,
  gst_rate numeric(7,3) not null default 5,
  qst_rate numeric(7,3) not null default 9.975,
  gst_amount numeric(12,2) not null default 0,
  qst_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  notes text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence if not exists public.contract_number_seq start 1001;

create or replace function public.set_contract_number()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.contract_number is null or btrim(new.contract_number) = '' then
    new.contract_number := 'SA-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.contract_number_seq')::text, 5, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_contract_number on public.contracts;
create trigger trg_set_contract_number
before insert on public.contracts
for each row execute function public.set_contract_number();

create index if not exists idx_contracts_customer_id on public.contracts(customer_id);
create index if not exists idx_contracts_vehicle_id on public.contracts(vehicle_id);
create index if not exists idx_contracts_status on public.contracts(status);
create index if not exists idx_contracts_created_at on public.contracts(created_at desc);

alter table public.contracts enable row level security;

do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contracts' and policyname='Authenticated users can read contracts') then
    create policy "Authenticated users can read contracts" on public.contracts for select to authenticated using (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contracts' and policyname='Authenticated users can create contracts') then
    create policy "Authenticated users can create contracts" on public.contracts for insert to authenticated with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contracts' and policyname='Authenticated users can update contracts') then
    create policy "Authenticated users can update contracts" on public.contracts for update to authenticated using (true) with check (true);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='contracts' and policyname='Authenticated users can delete contracts') then
    create policy "Authenticated users can delete contracts" on public.contracts for delete to authenticated using (true);
  end if;
end $$;

-- SHARBO AUTO DMS 2.1 — Payment Center & Profit Center
-- Réexécutable, sans suppression de données.
begin;
create extension if not exists pgcrypto;
create table if not exists public.payments (id uuid primary key default gen_random_uuid());
alter table public.payments add column if not exists sales_file_id uuid;
alter table public.payments add column if not exists contract_id uuid;
alter table public.payments add column if not exists payment_type text default 'Dépôt';
alter table public.payments add column if not exists payment_method text;
alter table public.payments add column if not exists amount numeric(12,2) default 0;
alter table public.payments add column if not exists receipt_number text;
alter table public.payments add column if not exists paid_at timestamptz default now();
alter table public.payments add column if not exists notes text;
alter table public.payments add column if not exists created_at timestamptz default now();
create unique index if not exists payments_receipt_number_uidx on public.payments(receipt_number) where receipt_number is not null;
create index if not exists payments_sales_file_idx on public.payments(sales_file_id,paid_at desc);
create table if not exists public.vehicle_expenses (id uuid primary key default gen_random_uuid());
alter table public.vehicle_expenses add column if not exists vehicle_id uuid;
alter table public.vehicle_expenses add column if not exists category text;
alter table public.vehicle_expenses add column if not exists supplier text;
alter table public.vehicle_expenses add column if not exists description text;
alter table public.vehicle_expenses add column if not exists amount numeric(12,2) default 0;
alter table public.vehicle_expenses add column if not exists expense_date date default current_date;
alter table public.vehicle_expenses add column if not exists created_at timestamptz default now();
create index if not exists vehicle_expenses_vehicle_idx on public.vehicle_expenses(vehicle_id,expense_date desc);
do $$ begin
 if not exists(select 1 from pg_constraint where conname='payments_sales_file_id_fkey') then alter table public.payments add constraint payments_sales_file_id_fkey foreign key(sales_file_id) references public.sales_files(id) on delete cascade; end if;
 if not exists(select 1 from pg_constraint where conname='payments_contract_id_fkey') then alter table public.payments add constraint payments_contract_id_fkey foreign key(contract_id) references public.contracts(id) on delete cascade; end if;
 if not exists(select 1 from pg_constraint where conname='vehicle_expenses_vehicle_id_fkey') then alter table public.vehicle_expenses add constraint vehicle_expenses_vehicle_id_fkey foreign key(vehicle_id) references public.vehicles(id) on delete cascade; end if;
end $$;
alter table public.payments enable row level security;alter table public.vehicle_expenses enable row level security;
do $$ begin
 drop policy if exists authenticated_all on public.payments; create policy authenticated_all on public.payments for all to authenticated using(true) with check(true);
 drop policy if exists authenticated_all on public.vehicle_expenses; create policy authenticated_all on public.vehicle_expenses for all to authenticated using(true) with check(true);
end $$;
commit;

-- Sharbo Auto Admin V2 - Customers module
-- Run once in Supabase SQL Editor.

alter table public.customers add column if not exists customer_type text default 'Particulier';
alter table public.customers add column if not exists updated_at timestamptz default now();

create index if not exists idx_customers_name on public.customers(last_name, first_name);
create index if not exists idx_customers_phone on public.customers(phone);
create index if not exists idx_customers_email on public.customers(email);
create index if not exists idx_customers_created_at on public.customers(created_at desc);

-- Sharbo Auto DMS 3.2 — Factures, reçus et livraison
create extension if not exists pgcrypto;

create table if not exists public.sales_billing (
  id uuid primary key default gen_random_uuid(),
  sales_file_id uuid not null unique references public.sales_files(id) on delete cascade,
  contract_id uuid references public.contracts(id) on delete cascade,
  vehicle_id uuid references public.vehicles(id) on delete set null,
  admin_fee numeric(12,2) not null default 150,
  admin_fee_enabled boolean not null default true,
  warranty_amount numeric(12,2) not null default 0,
  warranty_provider text,
  warranty_term text,
  tax_mode text not null default 'gst_only' check (tax_mode in ('gst_only','gst_qst','none')),
  payment_method text default 'Comptant',
  billing_notes text,
  delivery_date date,
  delivery_mileage integer,
  keys_count integer not null default 1,
  manual_delivered boolean not null default false,
  vehicle_clean boolean not null default false,
  second_key boolean not null default false,
  trade_enabled boolean not null default false,
  trade_make text,
  trade_model text,
  trade_year integer,
  trade_vin text,
  trade_mileage integer,
  trade_value numeric(12,2) not null default 0,
  trade_loan_balance numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  gst_amount numeric(12,2) not null default 0,
  qst_amount numeric(12,2) not null default 0,
  total_amount numeric(12,2) not null default 0,
  balance_amount numeric(12,2) not null default 0,
  delivery_checklist jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_sales_billing_contract on public.sales_billing(contract_id);
create index if not exists idx_sales_billing_vehicle on public.sales_billing(vehicle_id);
alter table public.sales_billing enable row level security;
do $$ begin
  if not exists(select 1 from pg_policies where schemaname='public' and tablename='sales_billing' and policyname='Authenticated manage sales billing') then
    create policy "Authenticated manage sales billing" on public.sales_billing for all to authenticated using (true) with check (true);
  end if;
end $$;

-- Company defaults supplied by Sharbo Auto. Updates the first settings row only.
update public.company_settings set
  business_name='Sharbo Auto', legal_name='9503-3296 QUÉBEC INC.', phone='438-927-7272',
  email='hashem@sharboauto.com', address='2260 Boulevard des Laurentides', city='Laval',
  province='Québec', postal_code='H7M 2Y7', neq='1179272175',
  gst_number='77742 8756 RT 0001', qst_number='1231147582 TQ 0001',
  licence_number='OPC A1600', default_admin_fee=150, gst_rate=5, qst_rate=0,
  updated_at=now()
where id=(select id from public.company_settings order by created_at nulls last limit 1);

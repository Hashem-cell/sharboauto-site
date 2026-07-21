-- SHARBO AUTO DMS 1.0 STABLE
-- Migration réparée et réexécutable.
-- À exécuter dans Supabase > SQL Editor.

begin;

create extension if not exists pgcrypto;

-- =========================================================
-- 1) INVENTAIRE PRO
-- =========================================================
alter table public.vehicles add column if not exists display_order integer;
alter table public.vehicles add column if not exists pinned boolean default false;
alter table public.vehicles add column if not exists acquisition_date date;
alter table public.vehicles add column if not exists purchase_price numeric(12,2) default 0;
alter table public.vehicles add column if not exists preparation_cost numeric(12,2) default 0;
alter table public.vehicles add column if not exists transport_cost numeric(12,2) default 0;
alter table public.vehicles add column if not exists inspection_cost numeric(12,2) default 0;
alter table public.vehicles add column if not exists other_cost numeric(12,2) default 0;

update public.vehicles
set pinned = false
where pinned is null;

update public.vehicles
set display_order = ranked.rn
from (
  select id,
         row_number() over (
           order by coalesce(featured,false) desc, created_at desc nulls last, id
         )::integer as rn
  from public.vehicles
) ranked
where public.vehicles.id = ranked.id
  and public.vehicles.display_order is null;

alter table public.vehicles alter column display_order set default 9999;
alter table public.vehicles alter column pinned set default false;
create index if not exists vehicles_public_order_idx
  on public.vehicles(pinned desc, display_order asc, created_at desc);

-- =========================================================
-- 2) TABLES DMS
-- Les CREATE minimaux permettent de réparer une installation partielle.
-- =========================================================
create table if not exists public.sales_files (
  id uuid primary key default gen_random_uuid()
);

alter table public.sales_files add column if not exists file_number text;
alter table public.sales_files add column if not exists contract_id uuid;
alter table public.sales_files add column if not exists customer_id uuid;
alter table public.sales_files add column if not exists vehicle_id uuid;
alter table public.sales_files add column if not exists status text default 'En cours';
alter table public.sales_files add column if not exists delivery_date date;
alter table public.sales_files add column if not exists assigned_to uuid;
alter table public.sales_files add column if not exists internal_notes text;
alter table public.sales_files add column if not exists created_at timestamptz default now();
alter table public.sales_files add column if not exists updated_at timestamptz default now();

create unique index if not exists sales_files_file_number_uidx
  on public.sales_files(file_number) where file_number is not null;
create unique index if not exists sales_files_contract_uidx
  on public.sales_files(contract_id) where contract_id is not null;
create index if not exists sales_files_customer_idx on public.sales_files(customer_id);
create index if not exists sales_files_vehicle_idx on public.sales_files(vehicle_id);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid()
);

-- Important: ceci corrige précisément l'erreur « sales_file_id does not exist ».
alter table public.payments add column if not exists sales_file_id uuid;
alter table public.payments add column if not exists contract_id uuid;
alter table public.payments add column if not exists payment_type text default 'Dépôt';
alter table public.payments add column if not exists payment_method text;
alter table public.payments add column if not exists amount numeric(12,2) default 0;
alter table public.payments add column if not exists receipt_number text;
alter table public.payments add column if not exists paid_at timestamptz default now();
alter table public.payments add column if not exists notes text;
alter table public.payments add column if not exists created_by uuid;
alter table public.payments add column if not exists created_at timestamptz default now();
create unique index if not exists payments_receipt_number_uidx
  on public.payments(receipt_number) where receipt_number is not null;
create index if not exists payments_sales_file_idx
  on public.payments(sales_file_id, paid_at desc);

create table if not exists public.financing_applications (
  id uuid primary key default gen_random_uuid()
);
alter table public.financing_applications add column if not exists sales_file_id uuid;
alter table public.financing_applications add column if not exists lender text;
alter table public.financing_applications add column if not exists status text default 'En attente';
alter table public.financing_applications add column if not exists requested_amount numeric(12,2) default 0;
alter table public.financing_applications add column if not exists approved_amount numeric(12,2) default 0;
alter table public.financing_applications add column if not exists interest_rate numeric(7,3);
alter table public.financing_applications add column if not exists term_months integer;
alter table public.financing_applications add column if not exists payment_frequency text;
alter table public.financing_applications add column if not exists payment_amount numeric(12,2);
alter table public.financing_applications add column if not exists reference_number text;
alter table public.financing_applications add column if not exists notes text;
alter table public.financing_applications add column if not exists submitted_at timestamptz;
alter table public.financing_applications add column if not exists decided_at timestamptz;
alter table public.financing_applications add column if not exists created_at timestamptz default now();
alter table public.financing_applications add column if not exists updated_at timestamptz default now();
create index if not exists financing_sales_file_idx
  on public.financing_applications(sales_file_id, created_at desc);

create table if not exists public.sales_documents (
  id uuid primary key default gen_random_uuid()
);
alter table public.sales_documents add column if not exists sales_file_id uuid;
alter table public.sales_documents add column if not exists document_type text default 'Autre';
alter table public.sales_documents add column if not exists file_name text;
alter table public.sales_documents add column if not exists file_url text;
alter table public.sales_documents add column if not exists mime_type text;
alter table public.sales_documents add column if not exists file_size bigint;
alter table public.sales_documents add column if not exists notes text;
alter table public.sales_documents add column if not exists uploaded_by uuid;
alter table public.sales_documents add column if not exists created_at timestamptz default now();
create index if not exists sales_documents_file_idx
  on public.sales_documents(sales_file_id, created_at desc);

create table if not exists public.vehicle_expenses (
  id uuid primary key default gen_random_uuid()
);
alter table public.vehicle_expenses add column if not exists vehicle_id uuid;
alter table public.vehicle_expenses add column if not exists category text;
alter table public.vehicle_expenses add column if not exists supplier text;
alter table public.vehicle_expenses add column if not exists description text;
alter table public.vehicle_expenses add column if not exists amount numeric(12,2) default 0;
alter table public.vehicle_expenses add column if not exists expense_date date default current_date;
alter table public.vehicle_expenses add column if not exists invoice_url text;
alter table public.vehicle_expenses add column if not exists created_by uuid;
alter table public.vehicle_expenses add column if not exists created_at timestamptz default now();
create index if not exists vehicle_expenses_vehicle_idx
  on public.vehicle_expenses(vehicle_id, expense_date desc);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid()
);
alter table public.activity_log add column if not exists sales_file_id uuid;
alter table public.activity_log add column if not exists entity_type text;
alter table public.activity_log add column if not exists entity_id uuid;
alter table public.activity_log add column if not exists action text;
alter table public.activity_log add column if not exists description text;
alter table public.activity_log add column if not exists metadata jsonb default '{}'::jsonb;
alter table public.activity_log add column if not exists user_id uuid;
alter table public.activity_log add column if not exists created_at timestamptz default now();
create index if not exists activity_log_sales_file_idx
  on public.activity_log(sales_file_id, created_at desc);

create table if not exists public.contract_signatures (
  id uuid primary key default gen_random_uuid()
);
alter table public.contract_signatures add column if not exists contract_id uuid;
alter table public.contract_signatures add column if not exists signer_role text;
alter table public.contract_signatures add column if not exists signer_name text;
alter table public.contract_signatures add column if not exists signature_data text;
alter table public.contract_signatures add column if not exists signed_at timestamptz default now();
alter table public.contract_signatures add column if not exists ip_address text;
alter table public.contract_signatures add column if not exists user_agent text;
create unique index if not exists contract_signatures_contract_role_uidx
  on public.contract_signatures(contract_id, signer_role)
  where contract_id is not null and signer_role is not null;

-- =========================================================
-- 3) CLÉS ÉTRANGÈRES (ajoutées seulement si absentes)
-- =========================================================
do $$
begin
  if not exists (select 1 from pg_constraint where conname='sales_files_contract_id_fkey') then
    alter table public.sales_files add constraint sales_files_contract_id_fkey
      foreign key (contract_id) references public.contracts(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='sales_files_customer_id_fkey') then
    alter table public.sales_files add constraint sales_files_customer_id_fkey
      foreign key (customer_id) references public.customers(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='sales_files_vehicle_id_fkey') then
    alter table public.sales_files add constraint sales_files_vehicle_id_fkey
      foreign key (vehicle_id) references public.vehicles(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='sales_files_assigned_to_fkey') then
    alter table public.sales_files add constraint sales_files_assigned_to_fkey
      foreign key (assigned_to) references auth.users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='payments_sales_file_id_fkey') then
    alter table public.payments add constraint payments_sales_file_id_fkey
      foreign key (sales_file_id) references public.sales_files(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='payments_contract_id_fkey') then
    alter table public.payments add constraint payments_contract_id_fkey
      foreign key (contract_id) references public.contracts(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='payments_created_by_fkey') then
    alter table public.payments add constraint payments_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;

  if not exists (select 1 from pg_constraint where conname='financing_applications_sales_file_id_fkey') then
    alter table public.financing_applications add constraint financing_applications_sales_file_id_fkey
      foreign key (sales_file_id) references public.sales_files(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='sales_documents_sales_file_id_fkey') then
    alter table public.sales_documents add constraint sales_documents_sales_file_id_fkey
      foreign key (sales_file_id) references public.sales_files(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='sales_documents_uploaded_by_fkey') then
    alter table public.sales_documents add constraint sales_documents_uploaded_by_fkey
      foreign key (uploaded_by) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='vehicle_expenses_vehicle_id_fkey') then
    alter table public.vehicle_expenses add constraint vehicle_expenses_vehicle_id_fkey
      foreign key (vehicle_id) references public.vehicles(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='vehicle_expenses_created_by_fkey') then
    alter table public.vehicle_expenses add constraint vehicle_expenses_created_by_fkey
      foreign key (created_by) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='activity_log_sales_file_id_fkey') then
    alter table public.activity_log add constraint activity_log_sales_file_id_fkey
      foreign key (sales_file_id) references public.sales_files(id) on delete cascade;
  end if;
  if not exists (select 1 from pg_constraint where conname='activity_log_user_id_fkey') then
    alter table public.activity_log add constraint activity_log_user_id_fkey
      foreign key (user_id) references auth.users(id) on delete set null;
  end if;
  if not exists (select 1 from pg_constraint where conname='contract_signatures_contract_id_fkey') then
    alter table public.contract_signatures add constraint contract_signatures_contract_id_fkey
      foreign key (contract_id) references public.contracts(id) on delete cascade;
  end if;
end $$;

-- =========================================================
-- 4) NUMÉROTATION + DOSSIER AUTOMATIQUE
-- =========================================================
create sequence if not exists public.sales_file_number_seq start 1001;

create or replace function public.create_sales_file_for_contract()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  mapped_status text;
begin
  mapped_status := case
    when lower(coalesce(new.status::text,'')) in ('signé','signe','signed','complété','complete','completed')
      then 'Prêt à livrer'
    else 'En cours'
  end;

  insert into public.sales_files(
    file_number, contract_id, customer_id, vehicle_id, status, created_at, updated_at
  )
  values(
    'DV-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.sales_file_number_seq')::text,5,'0'),
    new.id, new.customer_id, new.vehicle_id, mapped_status, now(), now()
  )
  on conflict (contract_id) do update set
    customer_id = excluded.customer_id,
    vehicle_id = excluded.vehicle_id,
    status = excluded.status,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_contract_sales_file on public.contracts;
create trigger trg_contract_sales_file
after insert or update of customer_id, vehicle_id, status on public.contracts
for each row execute function public.create_sales_file_for_contract();

insert into public.sales_files(
  file_number, contract_id, customer_id, vehicle_id, status, created_at, updated_at
)
select
  'DV-' || to_char(current_date,'YYYY') || '-' || lpad(nextval('public.sales_file_number_seq')::text,5,'0'),
  c.id,
  c.customer_id,
  c.vehicle_id,
  case
    when lower(coalesce(c.status::text,'')) in ('signé','signe','signed','complété','complete','completed')
      then 'Prêt à livrer'
    else 'En cours'
  end,
  now(),
  now()
from public.contracts c
where not exists (
  select 1 from public.sales_files sf where sf.contract_id = c.id
);

-- =========================================================
-- 5) RLS
-- =========================================================
alter table public.sales_files enable row level security;
alter table public.payments enable row level security;
alter table public.financing_applications enable row level security;
alter table public.sales_documents enable row level security;
alter table public.vehicle_expenses enable row level security;
alter table public.activity_log enable row level security;
alter table public.contract_signatures enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array[
    'sales_files','payments','financing_applications','sales_documents',
    'vehicle_expenses','activity_log','contract_signatures'
  ] loop
    execute format('drop policy if exists authenticated_all on public.%I', t);
    execute format(
      'create policy authenticated_all on public.%I for all to authenticated using (true) with check (true)',
      t
    );
  end loop;
end $$;

commit;

-- Vérification rapide après exécution:
-- select table_name from information_schema.tables
-- where table_schema='public' and table_name in
-- ('sales_files','payments','financing_applications','sales_documents','vehicle_expenses','activity_log','contract_signatures');

-- Sharbo Auto DMS 3.0 Complete Sales Workflow
create extension if not exists pgcrypto;
create table if not exists public.sales_documents (id uuid primary key default gen_random_uuid(), sales_file_id uuid not null references public.sales_files(id) on delete cascade, document_type text not null default 'Autre', file_name text not null, display_name text, mime_type text, size_bytes bigint, storage_path text not null, public_url text, created_at timestamptz not null default now());
create table if not exists public.sales_signatures (id uuid primary key default gen_random_uuid(), sales_file_id uuid not null references public.sales_files(id) on delete cascade, contract_id uuid references public.contracts(id) on delete set null, signer_role text not null check (signer_role in ('customer','seller')), signer_name text, signature_url text not null, storage_path text not null, signed_at timestamptz not null default now(), unique(sales_file_id, signer_role));
create table if not exists public.sales_timeline (id uuid primary key default gen_random_uuid(), sales_file_id uuid not null references public.sales_files(id) on delete cascade, event_type text not null, title text not null, description text, created_at timestamptz not null default now());
create index if not exists sales_documents_file_idx on public.sales_documents(sales_file_id,created_at desc);
create index if not exists sales_timeline_file_idx on public.sales_timeline(sales_file_id,created_at desc);
alter table public.sales_documents enable row level security;alter table public.sales_signatures enable row level security;alter table public.sales_timeline enable row level security;
drop policy if exists authenticated_all_sales_documents on public.sales_documents;create policy authenticated_all_sales_documents on public.sales_documents for all to authenticated using (true) with check (true);
drop policy if exists authenticated_all_sales_signatures on public.sales_signatures;create policy authenticated_all_sales_signatures on public.sales_signatures for all to authenticated using (true) with check (true);
drop policy if exists authenticated_all_sales_timeline on public.sales_timeline;create policy authenticated_all_sales_timeline on public.sales_timeline for all to authenticated using (true) with check (true);
-- Existing public Vehicles bucket is reused for sales documents and signatures.

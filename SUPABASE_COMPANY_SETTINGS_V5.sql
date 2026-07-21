-- Sharbo Auto DMS V5 - Company Settings
create extension if not exists pgcrypto;

create table if not exists public.company_settings (
  id uuid primary key default gen_random_uuid(),
  business_name text not null default 'Sharbo Auto',
  legal_name text, phone text, mobile text, email text, website text,
  address text, city text, province text default 'Québec', postal_code text, country text default 'Canada',
  logo_url text, neq text, gst_number text, qst_number text, saaq_dealer_number text, licence_number text, amvoq_number text,
  gst_rate numeric(7,3) not null default 5, qst_rate numeric(7,3) not null default 9.975,
  default_admin_fee numeric(12,2) not null default 0, currency text not null default 'CAD',
  document_footer text, terms_fr text, terms_en text,
  default_seller_name text, default_seller_email text, default_seller_phone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

alter table public.company_settings enable row level security;
drop policy if exists "Authenticated users can read company settings" on public.company_settings;
create policy "Authenticated users can read company settings" on public.company_settings for select to authenticated using (true);
drop policy if exists "Authenticated users can insert company settings" on public.company_settings;
create policy "Authenticated users can insert company settings" on public.company_settings for insert to authenticated with check (true);
drop policy if exists "Authenticated users can update company settings" on public.company_settings;
create policy "Authenticated users can update company settings" on public.company_settings for update to authenticated using (true) with check (true);

insert into public.company_settings (business_name,phone,email,website,province,country,gst_rate,qst_rate)
select 'Sharbo Auto','438-927-7272','hashem@sharboauto.com','https://sharboauto.com','Québec','Canada',5,9.975
where not exists (select 1 from public.company_settings);

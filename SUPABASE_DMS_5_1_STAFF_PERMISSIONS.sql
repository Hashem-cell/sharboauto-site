-- Sharbo Auto DMS 5.1 — Employés & permissions
create table if not exists public.staff_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  full_name text,
  phone text,
  role text not null default 'read_only' check (role in ('admin','sales','finance','read_only','custom')),
  permissions jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  invited_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists staff_profiles_email_idx on public.staff_profiles(lower(email));

alter table public.staff_profiles enable row level security;

drop policy if exists "staff can read own profile" on public.staff_profiles;
create policy "staff can read own profile" on public.staff_profiles for select to authenticated
using (user_id = auth.uid());

drop policy if exists "admins can read all staff" on public.staff_profiles;
create policy "admins can read all staff" on public.staff_profiles for select to authenticated
using (
  lower(coalesce(auth.jwt()->>'email','')) = 'hashem@sharboauto.com'
  or exists (select 1 from public.staff_profiles me where me.user_id=auth.uid() and me.active=true and (me.role='admin' or me.permissions ? 'staff.view'))
);

-- Changes to employees are intentionally performed only by the secure Netlify function
-- using SUPABASE_SERVICE_ROLE_KEY. No direct browser insert/update/delete policy is created.

grant select on public.staff_profiles to authenticated;

-- Owner profile (created/updated after the owner has logged in at least once)
insert into public.staff_profiles(user_id,email,full_name,role,permissions,active)
select id,email,'Hashem Sharbo','admin',
 '["dashboard.view","dashboard.financials","inventory.view","inventory.create","inventory.edit","inventory.delete","inventory.costs","customers.view","customers.manage","contracts.view","contracts.manage","sales.deliver","payments.manage","reports.view","reports.financials","operations.view","operations.manage","backup.manage","marketing.view","marketing.manage","settings.view","settings.manage","staff.view","staff.manage","audit.view"]'::jsonb,true
from auth.users where lower(email)='hashem@sharboauto.com'
on conflict (user_id) do update set role='admin', permissions=excluded.permissions, active=true, updated_at=now();

-- Sharbo Auto DMS 2.3
-- Safe migration: archive support and ordering indexes

alter table public.vehicles add column if not exists archived_at timestamptz;
alter table public.vehicles add column if not exists display_order integer default 0;
alter table public.vehicles add column if not exists pinned boolean default false;
alter table public.vehicles add column if not exists featured boolean default false;

create index if not exists vehicles_public_order_idx
  on public.vehicles (pinned desc, display_order asc, created_at desc)
  where archived_at is null;

create index if not exists vehicle_images_order_idx
  on public.vehicle_images (vehicle_id, sort_order);

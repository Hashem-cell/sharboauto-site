-- Run this once in Supabase SQL Editor before using Admin V2.

alter table public.vehicles add column if not exists title text;
alter table public.vehicles add column if not exists carfax text;
alter table public.vehicles add column if not exists updated_at timestamptz default now();

create index if not exists idx_vehicles_status on public.vehicles(status);
create index if not exists idx_vehicles_created_at on public.vehicles(created_at desc);
create index if not exists idx_vehicle_images_vehicle_id on public.vehicle_images(vehicle_id);

-- Storage policies for bucket created as "Vehicles".
-- Only authenticated admin users can upload/update/delete.
create policy "Authenticated upload vehicle photos"
on storage.objects for insert to authenticated
with check (bucket_id = 'Vehicles');

create policy "Authenticated update vehicle photos"
on storage.objects for update to authenticated
using (bucket_id = 'Vehicles')
with check (bucket_id = 'Vehicles');

create policy "Authenticated delete vehicle photos"
on storage.objects for delete to authenticated
using (bucket_id = 'Vehicles');

create policy "Public read vehicle photos"
on storage.objects for select to public
using (bucket_id = 'Vehicles');

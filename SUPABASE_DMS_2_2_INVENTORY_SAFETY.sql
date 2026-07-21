-- Sharbo Auto DMS 2.2 - Inventory Safety
-- Safe to run more than once.

alter table public.vehicles add column if not exists archived boolean not null default false;
alter table public.vehicles add column if not exists archived_at timestamptz;

update public.vehicles set archived=false where archived is null;

create index if not exists vehicles_archived_order_idx
on public.vehicles(archived, pinned desc, display_order asc, created_at desc);

-- Automatically record archive date.
create or replace function public.set_vehicle_archived_at()
returns trigger
language plpgsql
as $$
begin
  if new.archived is true and coalesce(old.archived,false) is false then
    new.archived_at = now();
    new.pinned = false;
    new.featured = false;
  elsif new.archived is false then
    new.archived_at = null;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_vehicle_archived_at on public.vehicles;
create trigger trg_vehicle_archived_at
before update of archived on public.vehicles
for each row execute function public.set_vehicle_archived_at();

-- Sharbo Auto DMS 4.0 — non-destructive migration
alter table public.vehicles add column if not exists published boolean not null default true;
alter table public.vehicles add column if not exists purchase_date date;

create table if not exists public.vehicle_price_history (
  id uuid primary key default gen_random_uuid(),
  vehicle_id uuid not null references public.vehicles(id) on delete cascade,
  old_price numeric(12,2),
  new_price numeric(12,2) not null,
  changed_at timestamptz not null default now(),
  changed_by uuid default auth.uid()
);
create index if not exists vehicle_price_history_vehicle_idx on public.vehicle_price_history(vehicle_id,changed_at desc);

create or replace function public.log_vehicle_price_change() returns trigger language plpgsql security definer as $$
begin
  if old.price is distinct from new.price then
    insert into public.vehicle_price_history(vehicle_id,old_price,new_price) values(new.id,old.price,new.price);
  end if;
  return new;
end;$$;
drop trigger if exists trg_vehicle_price_history on public.vehicles;
create trigger trg_vehicle_price_history after update of price on public.vehicles for each row execute function public.log_vehicle_price_change();

alter table public.vehicle_price_history enable row level security;
drop policy if exists "authenticated manage price history" on public.vehicle_price_history;
create policy "authenticated manage price history" on public.vehicle_price_history for all to authenticated using (true) with check (true);

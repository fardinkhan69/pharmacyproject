-- ============================================================
-- Pharmacy Management System — Full Database Migration
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- ============================================================

-- ============================================================
-- 1. MEDICINES TABLE
-- ============================================================
create table if not exists medicines (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  generic_name  text not null,
  category      text not null,
  selling_price numeric(10, 2) not null check (selling_price >= 0),
  quantity      integer not null check (quantity >= 0),
  expiry_date   date not null,
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Trigger to auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists medicines_updated_at on medicines;
create trigger medicines_updated_at
  before update on medicines
  for each row execute function update_updated_at();

-- Indexes for medicine search and filtering
create index if not exists idx_medicines_active     on medicines (is_active);
create index if not exists idx_medicines_name       on medicines (name);
create index if not exists idx_medicines_generic    on medicines (generic_name);
create index if not exists idx_medicines_expiry     on medicines (expiry_date);

-- ============================================================
-- 2. BILLS TABLE
-- ============================================================
create table if not exists bills (
  id            uuid primary key default gen_random_uuid(),
  bill_number   text not null unique,
  total_amount  numeric(12, 2) not null check (total_amount >= 0),
  created_at    timestamptz not null default now()
);

create index if not exists idx_bills_created_at on bills (created_at desc);

-- ============================================================
-- 3. BILL_ITEMS TABLE
-- ============================================================
create table if not exists bill_items (
  id             uuid primary key default gen_random_uuid(),
  bill_id        uuid not null references bills (id) on delete cascade,
  medicine_id    uuid not null references medicines (id),
  medicine_name  text not null,
  unit_price     numeric(10, 2) not null check (unit_price >= 0),
  quantity       integer not null check (quantity >= 1),
  line_total     numeric(12, 2) not null check (line_total >= 0)
);

create index if not exists idx_bill_items_bill_id      on bill_items (bill_id);
create index if not exists idx_bill_items_medicine_id  on bill_items (medicine_id);

-- ============================================================
-- 4. ROW LEVEL SECURITY
-- ============================================================

-- medicines
alter table medicines enable row level security;

drop policy if exists "Authenticated users can read medicines"  on medicines;
drop policy if exists "Authenticated users can insert medicines" on medicines;
drop policy if exists "Authenticated users can update medicines" on medicines;

create policy "Authenticated users can read medicines"
  on medicines for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert medicines"
  on medicines for insert
  with check (auth.role() = 'authenticated');

create policy "Authenticated users can update medicines"
  on medicines for update
  using (auth.role() = 'authenticated');

-- bills
alter table bills enable row level security;

drop policy if exists "Authenticated users can read bills"   on bills;
drop policy if exists "Authenticated users can insert bills" on bills;

create policy "Authenticated users can read bills"
  on bills for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert bills"
  on bills for insert
  with check (auth.role() = 'authenticated');

-- bill_items
alter table bill_items enable row level security;

drop policy if exists "Authenticated users can read bill_items"   on bill_items;
drop policy if exists "Authenticated users can insert bill_items" on bill_items;

create policy "Authenticated users can read bill_items"
  on bill_items for select
  using (auth.role() = 'authenticated');

create policy "Authenticated users can insert bill_items"
  on bill_items for insert
  with check (auth.role() = 'authenticated');

-- ============================================================
-- 5. BILL NUMBER GENERATION (concurrency-safe)
-- ============================================================
create sequence if not exists bill_number_seq start 1;

create or replace function generate_bill_number()
returns text language plpgsql security definer as $$
declare
  seq_val bigint;
begin
  seq_val := nextval('bill_number_seq');
  return 'BILL-' || lpad(seq_val::text, 3, '0');
end;
$$;

-- ============================================================
-- 6. ATOMIC BILLING RPC
-- create_bill(items JSONB) → uuid (new bill id)
--
-- items format:
-- [{"medicine_id": "uuid", "quantity": 5}, ...]
-- ============================================================
create or replace function create_bill(items jsonb)
returns uuid language plpgsql security definer as $$
declare
  item          jsonb;
  med           medicines%rowtype;
  qty           integer;
  line_tot      numeric;
  grand_total   numeric := 0;
  new_bill_id   uuid;
  bill_num      text;
  seen_ids      uuid[] := '{}';
begin
  -- Validate: at least one item
  if jsonb_array_length(items) = 0 then
    raise exception 'Bill must contain at least one item';
  end if;

  -- Validate each item
  for item in select * from jsonb_array_elements(items)
  loop
    -- Parse quantity
    qty := (item->>'quantity')::integer;
    if qty is null or qty < 1 then
      raise exception 'Quantity must be at least 1 for each item';
    end if;

    -- Fetch medicine with lock to prevent concurrent updates
    select * into med
    from medicines
    where id = (item->>'medicine_id')::uuid
    for update;

    if not found then
      raise exception 'Medicine not found: %', item->>'medicine_id';
    end if;

    -- Duplicate check
    if (item->>'medicine_id')::uuid = any(seen_ids) then
      raise exception 'Duplicate medicine in bill: %', med.name;
    end if;
    seen_ids := array_append(seen_ids, (item->>'medicine_id')::uuid);

    -- Active check
    if not med.is_active then
      raise exception 'Medicine is inactive: %', med.name;
    end if;

    -- Expiry check
    if med.expiry_date < current_date then
      raise exception 'Medicine is expired: %', med.name;
    end if;

    -- Stock check
    if med.quantity = 0 then
      raise exception 'Medicine is out of stock: %', med.name;
    end if;

    if med.quantity < qty then
      raise exception 'Insufficient stock for %: available %, requested %',
        med.name, med.quantity, qty;
    end if;
  end loop;

  -- Generate bill number and create bill
  bill_num := generate_bill_number();

  insert into bills (bill_number, total_amount)
  values (bill_num, 0)
  returning id into new_bill_id;

  -- Insert items and reduce stock
  for item in select * from jsonb_array_elements(items)
  loop
    qty := (item->>'quantity')::integer;

    select * into med from medicines where id = (item->>'medicine_id')::uuid for update;

    line_tot := med.selling_price * qty;
    grand_total := grand_total + line_tot;

    insert into bill_items (bill_id, medicine_id, medicine_name, unit_price, quantity, line_total)
    values (new_bill_id, med.id, med.name, med.selling_price, qty, line_tot);

    update medicines
    set quantity = quantity - qty, updated_at = now()
    where id = med.id;
  end loop;

  -- Update total
  update bills set total_amount = grand_total where id = new_bill_id;

  return new_bill_id;
end;
$$;

-- Grant execute to authenticated users
grant execute on function create_bill(jsonb) to authenticated;
grant execute on function generate_bill_number() to authenticated;

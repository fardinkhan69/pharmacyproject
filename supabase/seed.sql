-- ============================================================
-- PharmaCare demo data
-- Safe to run more than once: fixed demo UUIDs are inserted once.
-- Run after supabase/migrations/001_initial_schema.sql.
-- ============================================================

begin;

-- A varied inventory for dashboard, medicine-status, search, and billing demos.
insert into public.medicines
  (id, name, generic_name, category, selling_price, quantity, expiry_date, is_active)
values
  ('10000000-0000-4000-8000-000000000001', 'Napa Extra',       'Paracetamol 500 mg + Caffeine 65 mg', 'Tablet',    3.00,  84, current_date +  interval '18 months', true),
  ('10000000-0000-4000-8000-000000000002', 'Seclo 20',         'Omeprazole 20 mg',                     'Capsule',   7.00,  42, current_date +  interval '14 months', true),
  ('10000000-0000-4000-8000-000000000003', 'Ace 500',          'Paracetamol 500 mg',                    'Tablet',    2.50, 120, current_date +  interval '20 months', true),
  ('10000000-0000-4000-8000-000000000004', 'Maxpro 20',        'Esomeprazole 20 mg',                    'Capsule',   8.00,  35, current_date +  interval '16 months', true),
  ('10000000-0000-4000-8000-000000000005', 'Sergel 20',        'Esomeprazole 20 mg',                    'Capsule',   7.50,   5, current_date +  interval '10 months', true),
  ('10000000-0000-4000-8000-000000000006', 'Napa Extend',      'Paracetamol 665 mg',                    'Tablet',    4.00,   3, current_date +  interval '12 months', true),
  ('10000000-0000-4000-8000-000000000007', 'Histacin',         'Chlorpheniramine Maleate 4 mg',         'Tablet',    1.50,  60, current_date +  interval '22 months', true),
  ('10000000-0000-4000-8000-000000000008', 'Fexo 120',         'Fexofenadine Hydrochloride 120 mg',     'Tablet',   10.00,  28, current_date +  interval '15 months', true),
  ('10000000-0000-4000-8000-000000000009', 'Azithrocin 500',   'Azithromycin 500 mg',                   'Tablet',   35.00,  18, current_date +  interval '11 months', true),
  ('10000000-0000-4000-8000-000000000010', 'Monas 10',         'Montelukast Sodium 10 mg',              'Tablet',   16.00,  22, current_date +  interval '17 months', true),
  ('10000000-0000-4000-8000-000000000011', 'Ceevit 250',       'Vitamin C 250 mg',                      'Tablet',    2.00,  95, current_date +  interval '24 months', true),
  ('10000000-0000-4000-8000-000000000012', 'SMC OrSaline-N',   'Oral Rehydration Salts',                'Other',     5.00,  75, current_date +  interval '13 months', true),
  ('10000000-0000-4000-8000-000000000013', 'Savlon Liquid',    'Chlorhexidine + Cetrimide',             'Other',   100.00,  14, current_date +  interval '19 months', true),
  ('10000000-0000-4000-8000-000000000014', 'Insulin Mixtard',  'Human Insulin 30/70',                   'Injection',550.00,  4, current_date +  interval '8 months',  true),
  ('10000000-0000-4000-8000-000000000015', 'Losar 50',         'Losartan Potassium 50 mg',              'Tablet',    8.00,  30, current_date +  interval '21 months', true),
  ('10000000-0000-4000-8000-000000000016', 'DP Done 10',       'Domperidone 10 mg',                     'Tablet',    3.00,   0, current_date +  interval '9 months',  true),
  ('10000000-0000-4000-8000-000000000017', 'Amoxil 500',       'Amoxicillin 500 mg',                    'Capsule',  12.00,  12, current_date -  interval '2 months',  true),
  ('10000000-0000-4000-8000-000000000018', 'Legacy Pain Balm', 'Menthol + Methyl Salicylate',           'Cream',    65.00,   9, current_date +  interval '6 months',  false)
on conflict (id) do nothing;

-- Historical demo bills. High numbers leave room for existing early bills.
insert into public.bills (id, bill_number, total_amount, created_at)
values
  ('20000000-0000-4000-8000-000000000101', 'BILL-101',  54.00, now() - interval '12 days'),
  ('20000000-0000-4000-8000-000000000102', 'BILL-102',  61.00, now() - interval '9 days'),
  ('20000000-0000-4000-8000-000000000103', 'BILL-103', 137.00, now() - interval '6 days'),
  ('20000000-0000-4000-8000-000000000104', 'BILL-104', 150.00, now() - interval '3 days'),
  ('20000000-0000-4000-8000-000000000105', 'BILL-105', 574.00, now() - interval '1 day'),
  ('20000000-0000-4000-8000-000000000106', 'BILL-106',  75.00, now() - interval '2 hours')
on conflict (id) do nothing;

-- Snapshot rows exercise single- and multi-item bill detail views.
insert into public.bill_items
  (id, bill_id, medicine_id, medicine_name, unit_price, quantity, line_total)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000001', 'Napa Extra',      3.00, 10,  30.00),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000002', 'Seclo 20',        7.00,  2,  14.00),
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000101', '10000000-0000-4000-8000-000000000011', 'Ceevit 250',       2.00,  5,  10.00),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000008', 'Fexo 120',        10.00,  3,  30.00),
  ('30000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000007', 'Histacin',         1.50,  4,   6.00),
  ('30000000-0000-4000-8000-000000000006', '20000000-0000-4000-8000-000000000102', '10000000-0000-4000-8000-000000000012', 'SMC OrSaline-N',   5.00,  5,  25.00),
  ('30000000-0000-4000-8000-000000000007', '20000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000009', 'Azithrocin 500',  35.00,  3, 105.00),
  ('30000000-0000-4000-8000-000000000008', '20000000-0000-4000-8000-000000000103', '10000000-0000-4000-8000-000000000010', 'Monas 10',        16.00,  2,  32.00),
  ('30000000-0000-4000-8000-000000000009', '20000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000013', 'Savlon Liquid',  100.00,  1, 100.00),
  ('30000000-0000-4000-8000-000000000010', '20000000-0000-4000-8000-000000000104', '10000000-0000-4000-8000-000000000012', 'SMC OrSaline-N',   5.00, 10,  50.00),
  ('30000000-0000-4000-8000-000000000011', '20000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000014', 'Insulin Mixtard',550.00,  1, 550.00),
  ('30000000-0000-4000-8000-000000000012', '20000000-0000-4000-8000-000000000105', '10000000-0000-4000-8000-000000000015', 'Losar 50',         8.00,  3,  24.00),
  ('30000000-0000-4000-8000-000000000013', '20000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000001', 'Napa Extra',       3.00,  6,  18.00),
  ('30000000-0000-4000-8000-000000000014', '20000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000003', 'Ace 500',          2.50, 10,  25.00),
  ('30000000-0000-4000-8000-000000000015', '20000000-0000-4000-8000-000000000106', '10000000-0000-4000-8000-000000000004', 'Maxpro 20',        8.00,  4,  32.00)
on conflict (id) do nothing;

-- Keep the next automatically generated bill number above seeded/real bills.
do $$
declare
  current_value bigint;
  highest_bill_number bigint;
begin
  select last_value into current_value from public.bill_number_seq;

  select coalesce(max(substring(bill_number from '^BILL-([0-9]+)$')::bigint), 0)
    into highest_bill_number
    from public.bills
    where bill_number ~ '^BILL-[0-9]+$';

  perform setval(
    'public.bill_number_seq',
    greatest(current_value, highest_bill_number),
    true
  );
end;
$$;

commit;

-- Compact verification output for the SQL Editor.
select
  (select count(*) from public.medicines) as medicines,
  (select count(*) from public.medicines where is_active) as active_medicines,
  (select count(*) from public.medicines where is_active and quantity between 1 and 5) as low_stock,
  (select count(*) from public.bills) as bills,
  (select count(*) from public.bill_items) as bill_items;

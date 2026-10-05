-- Jalankan SEKALI di Supabase SQL Editor (setelah migrasi-v4.sql). Fitur merchant.
create table if not exists settings(key text primary key, value text);
alter table settings enable row level security;

create table if not exists merchants(
  id uuid primary key default gen_random_uuid(), user_id uuid unique references auth.users on delete cascade,
  store_name text not null, logo_url text, description text, sell_desc text,
  status text default 'pending', reject_reason text, ban_reason text, appeal text, appeal_at timestamptz,
  balance int default 0, bank_type text, bank_name text, account_number text, account_name text,
  created_at timestamptz default now());
create unique index if not exists merchants_name_uq on merchants (lower(store_name));
alter table merchants enable row level security;

create table if not exists merchant_tx(id uuid primary key default gen_random_uuid(), merchant_id uuid references merchants on delete cascade, type text, amount int, note text, order_id uuid, created_at timestamptz default now());
alter table merchant_tx enable row level security;

create table if not exists payouts(id uuid primary key default gen_random_uuid(), merchant_id uuid references merchants on delete cascade, amount int not null, status text default 'pending', bank_type text, bank_name text, account_number text, account_name text, proof_url text, note text, created_at timestamptz default now(), processed_at timestamptz);
alter table payouts enable row level security;

alter table products add column if not exists merchant_id uuid references merchants on delete cascade;

drop view if exists product_stock;
create view product_stock as
  select p.*, m.store_name, m.logo_url as store_logo,
    (select count(*) from stocks s where s.product_id=p.id and s.order_id is null)::int as stock
  from products p left join merchants m on m.id=p.merchant_id
  where p.merchant_id is null or m.status='approved';
grant select on product_stock to anon, authenticated;

drop view if exists merchants_public;
create view merchants_public as select id, store_name, logo_url, description, created_at from merchants where status='approved';
grant select on merchants_public to anon, authenticated;

create or replace function fulfill_order(oid uuid) returns void language plpgsql as $$
declare o orders; it jsonb; got jsonb := '[]'; r record; n int; fee int; mid uuid; net int;
begin
  select * into o from orders where id=oid for update;
  if o.status <> 'pending' then return; end if;
  select coalesce((select value::int from settings where key='fee_percent'),0) into fee;
  for it in select * from jsonb_array_elements(o.items) loop
    n := 0;
    for r in select id,data from stocks where product_id=(it->>'product_id')::uuid and order_id is null limit (it->>'qty')::int for update skip locked loop
      update stocks set order_id=oid where id=r.id;
      got := got || jsonb_build_object('product', it->>'name', 'data', r.data);
      n := n + 1;
    end loop;
    mid := nullif(it->>'merchant_id','')::uuid;
    if mid is not null and n > 0 then
      net := n * floor((it->>'price')::int * (100 - fee) / 100.0);
      update merchants set balance = balance + net where id = mid and status = 'approved';
      if found then insert into merchant_tx(merchant_id,type,amount,note,order_id) values(mid,'sale',net,(it->>'name')||' x'||n,oid); end if;
    end if;
  end loop;
  update orders set status='paid', delivered=got, expires_at=now()+interval '24 hours' where id=oid;
end $$;

create or replace function request_payout(mid uuid, amt int) returns uuid language plpgsql as $$
declare m merchants; pid uuid;
begin
  select * into m from merchants where id=mid for update;
  if m.status <> 'approved' or m.balance < amt then return null; end if;
  update merchants set balance = balance - amt where id = mid;
  insert into payouts(merchant_id,amount,bank_type,bank_name,account_number,account_name) values(mid,amt,m.bank_type,m.bank_name,m.account_number,m.account_name) returning id into pid;
  return pid;
end $$;

create or replace function reject_payout(pid uuid, nt text) returns boolean language plpgsql as $$
declare p payouts;
begin
  select * into p from payouts where id=pid for update;
  if p.status <> 'pending' then return false; end if;
  update payouts set status='rejected', note=nt, processed_at=now() where id=pid;
  update merchants set balance = balance + p.amount where id = p.merchant_id and status = 'approved';
  return true;
end $$;

create or replace function ban_merchant(mid uuid, reason text) returns void language plpgsql as $$
declare m merchants;
begin
  select * into m from merchants where id=mid for update;
  if m.status <> 'approved' then return; end if;
  if m.balance > 0 then insert into merchant_tx(merchant_id,type,amount,note) values(mid,'forfeit',-m.balance,'Saldo hangus karena banned'); end if;
  update merchants set status='banned', ban_reason=reason, balance=0, appeal=null where id=mid;
  update payouts set status='rejected', note='Merchant dibanned', processed_at=now() where merchant_id=mid and status='pending';
end $$;

revoke execute on function fulfill_order, request_payout, reject_payout, ban_merchant from public, anon, authenticated;

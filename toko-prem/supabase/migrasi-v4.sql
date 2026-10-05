-- Jalankan SEKALI di Supabase SQL Editor (untuk database yang sudah ada)
alter table products add column if not exists image_url text;
drop view if exists product_stock;
create view product_stock as select p.*, (select count(*) from stocks s where s.product_id=p.id and s.order_id is null)::int as stock from products p;
grant select on product_stock to anon, authenticated;

insert into storage.buckets(id,name,public) values('images','images',true) on conflict (id) do nothing;

create table if not exists topups(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, amount int not null, ref text unique, qris text, status text default 'pending', created_at timestamptz default now());
alter table topups enable row level security;

create or replace function fulfill_topup(tid uuid) returns void language plpgsql as $$
declare t topups;
begin
  select * into t from topups where id=tid for update;
  if t.status <> 'pending' then return; end if;
  update topups set status='paid' where id=tid;
  update profiles set balance=balance+t.amount where id=t.user_id;
end $$;
revoke execute on function fulfill_topup from public, anon, authenticated;

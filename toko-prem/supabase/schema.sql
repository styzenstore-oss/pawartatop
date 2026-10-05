create table profiles(id uuid primary key references auth.users on delete cascade, name text, email text, role text default 'member', balance int default 0);
create table products(id uuid primary key default gen_random_uuid(), name text not null, price int not null, discount int default 0, image_url text, created_at timestamptz default now());
create table stocks(id uuid primary key default gen_random_uuid(), product_id uuid references products on delete cascade, data text not null, order_id uuid, created_at timestamptz default now());
create table vouchers(code text primary key, amount int not null, created_at timestamptz default now());
create table announcements(id uuid primary key default gen_random_uuid(), text text not null, created_at timestamptz default now());
create table posters(id uuid primary key default gen_random_uuid(), image_url text not null, created_at timestamptz default now());
create table orders(id uuid primary key default gen_random_uuid(), user_id uuid references auth.users, buyer_name text, wa text, items jsonb, total int, voucher text, method text, status text default 'pending', gateway_ref text, qris text, delivered jsonb, expires_at timestamptz, created_at timestamptz default now());

create view product_stock as select p.*, (select count(*) from stocks s where s.product_id=p.id and s.order_id is null)::int as stock from products p;

alter table profiles enable row level security; alter table products enable row level security; alter table stocks enable row level security;
alter table vouchers enable row level security; alter table announcements enable row level security; alter table posters enable row level security; alter table orders enable row level security;
create policy "own profile" on profiles for select using (auth.uid()=id);
create policy "read products" on products for select using (true);
create policy "read ann" on announcements for select using (true);
create policy "read posters" on posters for select using (true);
grant select on product_stock to anon, authenticated;
-- stocks, vouchers, orders: tanpa policy = hanya service role (lewat API server)

create function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$ begin insert into public.profiles(id,name,email) values(new.id, coalesce(new.raw_user_meta_data->>'name',''), new.email); return new; end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function public.handle_new_user();

create function change_balance(uid uuid, amt int) returns boolean language plpgsql as $$ begin update profiles set balance=balance+amt where id=uid and balance+amt>=0; return found; end $$;

create function fulfill_order(oid uuid) returns void language plpgsql as $$
declare o orders; it jsonb; got jsonb := '[]'; r record;
begin
  select * into o from orders where id=oid for update;
  if o.status <> 'pending' then return; end if;
  for it in select * from jsonb_array_elements(o.items) loop
    for r in select id,data from stocks where product_id=(it->>'product_id')::uuid and order_id is null limit (it->>'qty')::int for update skip locked loop
      update stocks set order_id=oid where id=r.id;
      got := got || jsonb_build_object('product', it->>'name', 'data', r.data);
    end loop;
  end loop;
  update orders set status='paid', delivered=got, expires_at=now()+interval '24 hours' where id=oid;
end $$;

revoke execute on function change_balance, fulfill_order from public, anon, authenticated;
-- jadikan admin: update profiles set role='admin' where email='emailkamu@gmail.com';


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

create table brands(id uuid primary key default gen_random_uuid(),name text not null,color text not null default '#6366f1',created_at timestamptz default now());
create table products(
 id uuid primary key default gen_random_uuid(),
 name text not null, image_url text,
 suggested_price numeric(14,2) not null default 0,
 real_price numeric(14,2),
 payment_method text default '',
 sold boolean not null default false, sold_at timestamptz,
 color text, brand_id uuid references brands(id) on delete set null,
 position bigint not null default extract(epoch from now())*1000,
 created_at timestamptz default now());
alter table brands enable row level security; alter table products enable row level security;
-- Lectura pública
create policy "brands read" on brands for select using (true);
create policy "products read" on products for select using (true);
-- Marcas: solo admin
create policy "brands write" on brands for all to authenticated using (true) with check (true);
-- Productos: cualquiera puede actualizar (vender, mover, editar); crear/borrar solo admin
create policy "products update" on products for update using (true) with check (true);
create policy "products insert" on products for insert to authenticated with check (true);
create policy "products delete" on products for delete to authenticated using (true);
-- Imágenes
insert into storage.buckets(id,name,public) values('products','products',true);
create policy "img read" on storage.objects for select using (bucket_id='products');
create policy "img insert" on storage.objects for insert with check (bucket_id='products');

-- ============================================================
-- Sneaker Interaction — настройка базы Supabase
-- Откройте проект на supabase.com → SQL Editor → New query,
-- вставьте этот файл целиком и нажмите Run.
-- ============================================================

-- Таблица каталога: ID товара + все его поля в JSON.
create table if not exists public.products (
  id         text primary key,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

-- Включаем Row Level Security (защита на уровне строк).
alter table public.products enable row level security;

-- Чтение каталога — всем (витрина публичная).
drop policy if exists "public read products" on public.products;
create policy "public read products"
  on public.products for select
  to anon, authenticated
  using (true);

-- Изменения — только вошедшим модераторам.
drop policy if exists "auth insert products" on public.products;
create policy "auth insert products"
  on public.products for insert
  to authenticated with check (true);

drop policy if exists "auth update products" on public.products;
create policy "auth update products"
  on public.products for update
  to authenticated using (true) with check (true);

drop policy if exists "auth delete products" on public.products;
create policy "auth delete products"
  on public.products for delete
  to authenticated using (true);

-- RW PC Trading complete Supabase setup
-- Run this in the Supabase SQL editor after creating your project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  avatar_url text,
  role text not null default 'customer' check (role in ('customer', 'staff', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  brand text,
  model text,
  description text,
  price numeric(12,2) not null default 0 check (price >= 0),
  warranty_months integer not null default 0 check (warranty_months >= 0),
  stock_quantity integer not null default 0 check (stock_quantity >= 0),
  part_type text check (
    part_type is null or part_type in ('CPU', 'Motherboard', 'RAM', 'GPU', 'PSU', 'Storage', 'Case', 'CPU Cooler')
  ),
  power_draw_watts integer not null default 0 check (power_draw_watts >= 0),
  compatibility jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  is_archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  storage_path text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price_from numeric(12,2),
  icon text default 'Wrench',
  image_url text,
  storage_path text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cart_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  quantity integer not null default 1 check (quantity > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, product_id)
);

create table if not exists public.reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'Pending Deposit' check (
    status in ('Pending Deposit', 'Under Verification', 'Approved', 'Rejected', 'Ready for Pickup', 'Claimed')
  ),
  total_amount numeric(12,2) not null default 0,
  deposit_amount numeric(12,2) not null default 0,
  notes text,
  admin_notes text,
  inventory_deducted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.reservation_items (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity integer not null check (quantity > 0),
  price_each numeric(12,2) not null check (price_each >= 0),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.payment_proofs (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reservations(id) on delete cascade,
  uploaded_by uuid not null references public.profiles(id) on delete cascade,
  payment_method text not null,
  reference_no text,
  note text,
  image_url text not null,
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory_logs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  changed_by uuid references public.profiles(id) on delete set null,
  change_type text not null check (change_type in ('stock_in', 'stock_out', 'adjustment', 'reservation_approved')),
  quantity_change integer not null,
  previous_quantity integer not null,
  new_quantity integer not null,
  reason text,
  created_at timestamptz not null default now()
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  reservation_id uuid references public.reservations(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  message text not null,
  image_url text,
  storage_path text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  name text,
  contact text,
  message text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_builds (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  total_price numeric(12,2) not null default 0,
  estimated_wattage integer not null default 0,
  recommended_psu_wattage integer not null default 0,
  compatibility_report jsonb not null default '{}'::jsonb,
  items jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists touch_profiles_updated_at on public.profiles;
create trigger touch_profiles_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

drop trigger if exists touch_categories_updated_at on public.categories;
create trigger touch_categories_updated_at
before update on public.categories
for each row execute function public.touch_updated_at();

drop trigger if exists touch_products_updated_at on public.products;
create trigger touch_products_updated_at
before update on public.products
for each row execute function public.touch_updated_at();

drop trigger if exists touch_services_updated_at on public.services;
create trigger touch_services_updated_at
before update on public.services
for each row execute function public.touch_updated_at();

drop trigger if exists touch_cart_items_updated_at on public.cart_items;
create trigger touch_cart_items_updated_at
before update on public.cart_items
for each row execute function public.touch_updated_at();

drop trigger if exists touch_reservations_updated_at on public.reservations;
create trigger touch_reservations_updated_at
before update on public.reservations
for each row execute function public.touch_updated_at();

drop trigger if exists touch_payment_proofs_updated_at on public.payment_proofs;
create trigger touch_payment_proofs_updated_at
before update on public.payment_proofs
for each row execute function public.touch_updated_at();

drop trigger if exists touch_reviews_updated_at on public.reviews;
create trigger touch_reviews_updated_at
before update on public.reviews
for each row execute function public.touch_updated_at();

drop trigger if exists touch_saved_builds_updated_at on public.saved_builds;
create trigger touch_saved_builds_updated_at
before update on public.saved_builds
for each row execute function public.touch_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, phone, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'phone', ''),
    'customer'
  )
  on conflict (id) do update
  set email = excluded.email,
      full_name = coalesce(public.profiles.full_name, excluded.full_name),
      phone = coalesce(public.profiles.phone, excluded.phone);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff_or_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('staff', 'admin')
  );
$$;

create or replace function public.admin_adjust_stock(
  p_product_id uuid,
  p_quantity_change integer,
  p_change_type text,
  p_reason text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_previous integer;
  v_new integer;
begin
  if not public.is_staff_or_admin() then
    raise exception 'Only staff or admin users can adjust inventory.';
  end if;

  select stock_quantity into v_previous
  from public.products
  where id = p_product_id
  for update;

  if v_previous is null then
    raise exception 'Product not found.';
  end if;

  v_new := v_previous + p_quantity_change;

  if v_new < 0 then
    raise exception 'Stock cannot go below zero.';
  end if;

  update public.products
  set stock_quantity = v_new
  where id = p_product_id;

  insert into public.inventory_logs (
    product_id,
    changed_by,
    change_type,
    quantity_change,
    previous_quantity,
    new_quantity,
    reason
  )
  values (
    p_product_id,
    auth.uid(),
    p_change_type,
    p_quantity_change,
    v_previous,
    v_new,
    p_reason
  );
end;
$$;

create or replace function public.admin_approve_reservation(
  p_reservation_id uuid,
  p_admin_note text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_reservation public.reservations%rowtype;
  v_item record;
  v_previous integer;
  v_new integer;
begin
  if not public.is_staff_or_admin() then
    raise exception 'Only staff or admin users can approve reservations.';
  end if;

  select * into v_reservation
  from public.reservations
  where id = p_reservation_id
  for update;

  if v_reservation.id is null then
    raise exception 'Reservation not found.';
  end if;

  if v_reservation.inventory_deducted then
    update public.reservations
    set status = 'Approved',
        admin_notes = p_admin_note
    where id = p_reservation_id;
    return;
  end if;

  for v_item in
    select ri.product_id, ri.quantity, p.stock_quantity, p.name
    from public.reservation_items ri
    join public.products p on p.id = ri.product_id
    where ri.reservation_id = p_reservation_id
    for update of p
  loop
    if v_item.stock_quantity < v_item.quantity then
      raise exception 'Insufficient stock for %.', v_item.name;
    end if;
  end loop;

  for v_item in
    select ri.product_id, ri.quantity, p.stock_quantity
    from public.reservation_items ri
    join public.products p on p.id = ri.product_id
    where ri.reservation_id = p_reservation_id
    for update of p
  loop
    v_previous := v_item.stock_quantity;
    v_new := v_previous - v_item.quantity;

    update public.products
    set stock_quantity = v_new
    where id = v_item.product_id;

    insert into public.inventory_logs (
      product_id,
      changed_by,
      change_type,
      quantity_change,
      previous_quantity,
      new_quantity,
      reason
    )
    values (
      v_item.product_id,
      auth.uid(),
      'reservation_approved',
      -v_item.quantity,
      v_previous,
      v_new,
      'Reservation approved: ' || p_reservation_id::text
    );
  end loop;

  update public.reservations
  set status = 'Approved',
      admin_notes = p_admin_note,
      inventory_deducted = true
  where id = p_reservation_id;
end;
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.services enable row level security;
alter table public.cart_items enable row level security;
alter table public.reservations enable row level security;
alter table public.reservation_items enable row level security;
alter table public.payment_proofs enable row level security;
alter table public.inventory_logs enable row level security;
alter table public.reviews enable row level security;
alter table public.feedback enable row level security;
alter table public.saved_builds enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Profiles are viewable by owner and staff" on public.profiles;
create policy "Profiles are viewable by owner and staff"
on public.profiles for select
using (id = auth.uid() or public.is_staff_or_admin());

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

drop policy if exists "Admin can manage profiles" on public.profiles;
create policy "Admin can manage profiles"
on public.profiles for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read active categories" on public.categories;
create policy "Public can read active categories"
on public.categories for select
using (is_active = true or public.is_staff_or_admin());

drop policy if exists "Admin can manage categories" on public.categories;
create policy "Admin can manage categories"
on public.categories for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "Public can read visible products" on public.products;
create policy "Public can read visible products"
on public.products for select
using ((is_active = true and is_archived = false) or public.is_staff_or_admin());

drop policy if exists "Staff can manage products" on public.products;
create policy "Staff can manage products"
on public.products for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "Public can read product images" on public.product_images;
create policy "Public can read product images"
on public.product_images for select
using (true);

drop policy if exists "Staff can manage product images" on public.product_images;
create policy "Staff can manage product images"
on public.product_images for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "Public can read active services" on public.services;
create policy "Public can read active services"
on public.services for select
using (is_active = true or public.is_staff_or_admin());

drop policy if exists "Staff can manage services" on public.services;
create policy "Staff can manage services"
on public.services for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "Users can manage own cart" on public.cart_items;
create policy "Users can manage own cart"
on public.cart_items for all
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "Users can read own reservations" on public.reservations;
create policy "Users can read own reservations"
on public.reservations for select
using (user_id = auth.uid() or public.is_staff_or_admin());

drop policy if exists "Users can create own reservations" on public.reservations;
create policy "Users can create own reservations"
on public.reservations for insert
with check (user_id = auth.uid());

drop policy if exists "Staff can update reservations" on public.reservations;
create policy "Staff can update reservations"
on public.reservations for update
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "Reservation items are visible to owner and staff" on public.reservation_items;
create policy "Reservation items are visible to owner and staff"
on public.reservation_items for select
using (
  public.is_staff_or_admin() or exists (
    select 1 from public.reservations r
    where r.id = reservation_id and r.user_id = auth.uid()
  )
);

drop policy if exists "Users can create items for own reservation" on public.reservation_items;
create policy "Users can create items for own reservation"
on public.reservation_items for insert
with check (
  exists (
    select 1 from public.reservations r
    where r.id = reservation_id and r.user_id = auth.uid()
  )
);

drop policy if exists "Payment proofs visible to owner and staff" on public.payment_proofs;
create policy "Payment proofs visible to owner and staff"
on public.payment_proofs for select
using (
  uploaded_by = auth.uid() or public.is_staff_or_admin()
);

drop policy if exists "Users can upload payment proofs" on public.payment_proofs;
create policy "Users can upload payment proofs"
on public.payment_proofs for insert
with check (
  uploaded_by = auth.uid() and exists (
    select 1 from public.reservations r
    where r.id = reservation_id and r.user_id = auth.uid()
  )
);

drop policy if exists "Staff can update payment proofs" on public.payment_proofs;
create policy "Staff can update payment proofs"
on public.payment_proofs for update
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "Staff can read inventory logs" on public.inventory_logs;
create policy "Staff can read inventory logs"
on public.inventory_logs for select
using (public.is_staff_or_admin());

drop policy if exists "Users can create reviews" on public.reviews;
create policy "Users can create reviews"
on public.reviews for insert
with check (user_id = auth.uid());

drop policy if exists "Public reads approved reviews" on public.reviews;
create policy "Public reads approved reviews"
on public.reviews for select
using (status = 'approved' or user_id = auth.uid() or public.is_staff_or_admin());

drop policy if exists "Staff can manage reviews" on public.reviews;
create policy "Staff can manage reviews"
on public.reviews for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "Anyone can submit feedback" on public.feedback;
create policy "Anyone can submit feedback"
on public.feedback for insert
with check (true);

drop policy if exists "Staff can manage feedback" on public.feedback;
create policy "Staff can manage feedback"
on public.feedback for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

drop policy if exists "Users can manage saved builds" on public.saved_builds;
create policy "Users can manage saved builds"
on public.saved_builds for all
using (user_id = auth.uid() or public.is_staff_or_admin())
with check (user_id = auth.uid() or public.is_staff_or_admin());

drop policy if exists "Staff can manage settings" on public.site_settings;
create policy "Staff can manage settings"
on public.site_settings for all
using (public.is_staff_or_admin())
with check (public.is_staff_or_admin());

insert into storage.buckets (id, name, public)
values
  ('product-images', 'product-images', true),
  ('service-images', 'service-images', true),
  ('review-proofs', 'review-proofs', true),
  ('payment-proofs', 'payment-proofs', true),
  ('profile-images', 'profile-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "Public can read public bucket files" on storage.objects;
create policy "Public can read public bucket files"
on storage.objects for select
using (bucket_id in ('product-images', 'service-images', 'review-proofs', 'payment-proofs', 'profile-images'));

drop policy if exists "Authenticated users can upload user files" on storage.objects;
create policy "Authenticated users can upload user files"
on storage.objects for insert
with check (
  auth.role() = 'authenticated'
  and bucket_id in ('review-proofs', 'payment-proofs', 'profile-images')
);

drop policy if exists "Staff can manage catalog files" on storage.objects;
create policy "Staff can manage catalog files"
on storage.objects for all
using (
  public.is_staff_or_admin()
  and bucket_id in ('product-images', 'service-images')
)
with check (
  public.is_staff_or_admin()
  and bucket_id in ('product-images', 'service-images')
);

insert into public.categories (name, slug, description)
values
  ('CPU', 'cpu', 'Processors for productivity, gaming, and workstation builds.'),
  ('Motherboard', 'motherboard', 'Boards for Intel and AMD platforms.'),
  ('RAM', 'ram', 'Desktop and laptop memory kits.'),
  ('GPU', 'gpu', 'Graphics cards for gaming, editing, and rendering.'),
  ('PSU', 'psu', 'Power supplies for reliable PC builds.'),
  ('Storage', 'storage', 'SSD, NVMe, and hard drive storage.'),
  ('Case', 'case', 'Desktop cases with airflow and style.'),
  ('CPU Cooler', 'cpu-cooler', 'Air and liquid coolers.'),
  ('Accessories', 'accessories', 'Keyboards, mice, fans, and peripherals.')
on conflict (slug) do nothing;

insert into public.services (title, description, price_from, icon, image_url)
values
  ('PC Assembly', 'Professional desktop build assembly with cable management and boot testing.', 800, 'Cpu', 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'),
  ('Laptop Repair', 'Diagnosis and repair for common laptop hardware and software problems.', 500, 'Laptop', 'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?auto=format&fit=crop&w=900&q=80'),
  ('Windows Installation', 'Fresh OS installation, driver setup, and essential software configuration.', 400, 'MonitorCog', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80')
on conflict do nothing;

with category_ids as (
  select slug, id from public.categories
)
insert into public.products (
  category_id,
  name,
  brand,
  model,
  description,
  price,
  warranty_months,
  stock_quantity,
  part_type,
  power_draw_watts,
  compatibility
)
select id, 'AMD Ryzen 5 5600', 'AMD', 'Ryzen 5 5600',
  '6-core AM4 processor for gaming and productivity builds.', 5995, 12, 8, 'CPU', 65,
  '{"cpu_socket":"AM4"}'::jsonb
from category_ids where slug = 'cpu'
union all
select id, 'MSI B550M PRO-VDH WiFi', 'MSI', 'B550M PRO-VDH WiFi',
  'Micro-ATX AM4 motherboard with DDR4 support and WiFi.', 6495, 12, 5, 'Motherboard', 35,
  '{"cpu_socket":"AM4","ram_type":"DDR4","form_factor":"mATX"}'::jsonb
from category_ids where slug = 'motherboard'
union all
select id, 'Kingston Fury Beast 16GB DDR4', 'Kingston', 'Fury Beast 16GB',
  'Reliable DDR4 memory kit for gaming and office PCs.', 2495, 12, 12, 'RAM', 8,
  '{"ram_type":"DDR4","capacity_gb":16}'::jsonb
from category_ids where slug = 'ram'
union all
select id, 'NVIDIA GeForce RTX 4060 8GB', 'NVIDIA', 'RTX 4060',
  'Efficient 1080p gaming graphics card with ray tracing support.', 18995, 24, 3, 'GPU', 115,
  '{"gpu_length_mm":240}'::jsonb
from category_ids where slug = 'gpu'
union all
select id, 'Corsair CX650 650W Bronze', 'Corsair', 'CX650',
  '650W 80+ Bronze PSU for mainstream gaming builds.', 3795, 36, 6, 'PSU', 0,
  '{"max_wattage":650}'::jsonb
from category_ids where slug = 'psu'
union all
select id, 'Crucial P3 Plus 1TB NVMe SSD', 'Crucial', 'P3 Plus 1TB',
  'Fast NVMe storage for boot drives and game libraries.', 3495, 36, 10, 'Storage', 5,
  '{"storage_interface":"M.2 NVMe"}'::jsonb
from category_ids where slug = 'storage'
union all
select id, 'Tecware Forge M Airflow Case', 'Tecware', 'Forge M',
  'Compact airflow case with tempered glass panel.', 2595, 12, 4, 'Case', 0,
  '{"supported_form_factors":["mATX","Mini-ITX"],"max_gpu_length_mm":320}'::jsonb
from category_ids where slug = 'case'
union all
select id, 'DeepCool AK400 CPU Cooler', 'DeepCool', 'AK400',
  'Tower air cooler with broad socket support.', 1695, 12, 6, 'CPU Cooler', 5,
  '{"supported_sockets":["AM4","AM5","LGA1700","LGA1200"]}'::jsonb
from category_ids where slug = 'cpu-cooler'
on conflict do nothing;

insert into public.product_images (product_id, image_url, is_primary, sort_order)
select p.id,
  case
    when p.part_type = 'CPU' then 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?auto=format&fit=crop&w=900&q=80'
    when p.part_type = 'Motherboard' then 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=900&q=80'
    when p.part_type = 'RAM' then 'https://images.unsplash.com/photo-1562976540-1502c2145186?auto=format&fit=crop&w=900&q=80'
    when p.part_type = 'GPU' then 'https://images.unsplash.com/photo-1591488320449-011701bb6704?auto=format&fit=crop&w=900&q=80'
    when p.part_type = 'PSU' then 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?auto=format&fit=crop&w=900&q=80'
    when p.part_type = 'Storage' then 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?auto=format&fit=crop&w=900&q=80'
    when p.part_type = 'Case' then 'https://images.unsplash.com/photo-1587202372616-b43abea06c2a?auto=format&fit=crop&w=900&q=80'
    else 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80'
  end,
  true,
  0
from public.products p
where not exists (
  select 1 from public.product_images pi where pi.product_id = p.id
);

insert into public.site_settings (key, value)
values (
  'business',
  '{
    "name": "RW PC Trading",
    "phone": "09687262353",
    "email": "rwpctrading@gmail.com",
    "facebook": "https://www.facebook.com/profile.php?id=61575260983217",
    "address": "Unit 2B 2nd Floor One Santiago Place Building Gov I Santiago St. Brgy Malinta Valenzuela City",
    "hours": "9:00 AM to 7:00 PM",
    "days": "Monday to Saturday"
  }'::jsonb
)
on conflict (key) do update set value = excluded.value;

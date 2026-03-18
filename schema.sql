-- =============================================
-- Inventory Platform — Supabase Schema
-- Run this in your Supabase SQL Editor
-- =============================================

-- 1. Profiles table (extends Supabase auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  display_name text,
  bio text,
  avatar_url text,
  currency text default '₹',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. Categories (per-user)
create table public.categories (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles on delete cascade not null,
  slug text not null,
  name text not null,
  icon text,
  sort_order int default 0,
  created_at timestamptz default now(),
  unique (user_id, slug)
);

-- 3. Items
create table public.items (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles on delete cascade not null,
  name text not null,
  brand text,
  category_slug text not null,
  price numeric default 0,
  image_url text,
  product_url text,
  featured boolean default false,
  for_sale boolean default false,
  sale_price numeric,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 4. Indexes
create index idx_items_user on public.items (user_id);
create index idx_items_category on public.items (user_id, category_slug);
create index idx_items_for_sale on public.items (for_sale) where for_sale = true;
create index idx_categories_user on public.categories (user_id);
create index idx_profiles_username on public.profiles (username);

-- 5. Row Level Security
alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.items enable row level security;

-- Profiles: anyone can read, only owner can update
create policy "Public profiles are viewable by everyone"
  on public.profiles for select using (true);

create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert with check (auth.uid() = id);

-- Categories: anyone can read, only owner can modify
create policy "Categories are viewable by everyone"
  on public.categories for select using (true);

create policy "Users can manage their own categories"
  on public.categories for insert with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete using (auth.uid() = user_id);

-- Items: anyone can read, only owner can modify
create policy "Items are viewable by everyone"
  on public.items for select using (true);

create policy "Users can insert their own items"
  on public.items for insert with check (auth.uid() = user_id);

create policy "Users can update their own items"
  on public.items for update using (auth.uid() = user_id);

create policy "Users can delete their own items"
  on public.items for delete using (auth.uid() = user_id);

-- 6. Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, display_name)
  values (
    new.id,
    lower(split_part(new.email, '@', 1)) || '_' || substr(new.id::text, 1, 4),
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 7. Default categories seeded on profile creation
create or replace function public.seed_default_categories()
returns trigger as $$
begin
  insert into public.categories (user_id, slug, name, icon, sort_order) values
    (new.id, 'tech', 'Tech', 'laptop', 1),
    (new.id, 'workspace', 'Workspace', 'monitor', 2),
    (new.id, 'home', 'Home', 'home', 3),
    (new.id, 'carry', 'Carry', 'briefcase', 4),
    (new.id, 'books', 'Books', 'book', 5),
    (new.id, 'lifestyle', 'Lifestyle', 'heart', 6),
    (new.id, 'clothing', 'Clothing', 'shirt', 7),
    (new.id, 'travel', 'Travel', 'plane', 8);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_profile_created
  after insert on public.profiles
  for each row execute function public.seed_default_categories();

-- 8. Storage bucket for item images
insert into storage.buckets (id, name, public) values ('item-images', 'item-images', true);

create policy "Anyone can view item images"
  on storage.objects for select using (bucket_id = 'item-images');

create policy "Authenticated users can upload item images"
  on storage.objects for insert with check (
    bucket_id = 'item-images' and auth.role() = 'authenticated'
  );

create policy "Users can update their own images"
  on storage.objects for update using (
    bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "Users can delete their own images"
  on storage.objects for delete using (
    bucket_id = 'item-images' and auth.uid()::text = (storage.foldername(name))[1]
  );

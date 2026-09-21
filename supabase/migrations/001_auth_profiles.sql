-- Compra Ya Phase 2: application profile for Supabase Auth users.
-- Execute manually in the Supabase SQL Editor after reviewing the project schema.
-- Firebase data and existing users are intentionally untouched.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'buyer' check (role in ('buyer', 'seller', 'admin')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.profiles enable row level security;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data ->> 'full_name', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute procedure public.handle_new_user();

create or replace function public.protect_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.role() <> 'service_role' and new.role is distinct from old.role then
    raise exception 'role cannot be changed from the client';
  end if;
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists protect_profile_role on public.profiles;
create trigger protect_profile_role
before update on public.profiles
for each row execute procedure public.protect_profile_role();

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Client-side profile creation and deletion are intentionally denied.
-- The auth.users trigger creates the profile; service_role may administer it server-side.

drop policy if exists "profiles_insert_client_denied" on public.profiles;
create policy "profiles_insert_client_denied"
on public.profiles for insert
to authenticated
with check (false);

drop policy if exists "profiles_delete_client_denied" on public.profiles;
create policy "profiles_delete_client_denied"
on public.profiles for delete
to authenticated
using (false);

create index if not exists profiles_role_idx on public.profiles (role);

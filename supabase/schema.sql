-- =====================================================================
-- SAM — Schema Supabase (utenti + preferiti)
-- Incolla ed esegui questo file nell'SQL Editor di Supabase (una volta).
-- =====================================================================

-- ---------- PROFILI ----------
-- Un profilo per ogni utente registrato (collegato a auth.users).
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  full_name   text,
  first_name  text,
  last_name   text,
  occupation  text,   -- studente | lavoratore | libero_professionista
  university  text,   -- solo se studente
  age_range   text,   -- 18-24 | 25-34 | ...
  created_at  timestamptz not null default now()
);

-- Se la tabella esisteva già senza queste colonne, aggiungile senza perdere dati.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists age_range  text;

alter table public.profiles enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select using (auth.uid() = id);

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update using (auth.uid() = id);

-- Crea automaticamente il profilo quando nasce un utente.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, first_name, last_name, occupation, university, age_range)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'occupation',
    new.raw_user_meta_data ->> 'university',
    new.raw_user_meta_data ->> 'age_range'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- PREFERITI ----------
-- place_id = id del posto (stesso id usato dall'app, da Notion).
create table if not exists public.favorites (
  user_id    uuid not null references auth.users (id) on delete cascade,
  place_id   text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, place_id)
);

alter table public.favorites enable row level security;

drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites for select using (auth.uid() = user_id);

drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites for insert with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete using (auth.uid() = user_id);

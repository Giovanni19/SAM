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
  -- ----- Consenso (GDPR) -----
  -- Accettazione dell'informativa privacy: obbligatoria per registrarsi.
  consent_privacy_at      timestamptz,
  consent_privacy_version text,
  -- Consenso SEPARATO e facoltativo al trattamento dei dati di profilazione
  -- (occupazione/università/età) per le analytics offerte ai clienti B2B.
  -- Base giuridica: consenso (art. 6.1.a) — revocabile in ogni momento.
  consent_analytics       boolean not null default false,
  consent_analytics_at    timestamptz,
  created_at  timestamptz not null default now()
);

-- Se la tabella esisteva già senza queste colonne, aggiungile senza perdere dati.
alter table public.profiles add column if not exists first_name text;
alter table public.profiles add column if not exists last_name  text;
alter table public.profiles add column if not exists occupation text;
alter table public.profiles add column if not exists university text;
alter table public.profiles add column if not exists age_range  text;
alter table public.profiles add column if not exists consent_privacy_at      timestamptz;
alter table public.profiles add column if not exists consent_privacy_version text;
alter table public.profiles add column if not exists consent_analytics       boolean not null default false;
alter table public.profiles add column if not exists consent_analytics_at    timestamptz;

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
  insert into public.profiles (
    id, email, full_name, first_name, last_name, occupation, university, age_range,
    consent_privacy_at, consent_privacy_version, consent_analytics, consent_analytics_at
  )
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.raw_user_meta_data ->> 'occupation',
    new.raw_user_meta_data ->> 'university',
    new.raw_user_meta_data ->> 'age_range',
    -- L'informativa è accettata al momento dell'iscrizione.
    now(),
    new.raw_user_meta_data ->> 'consent_privacy_version',
    coalesce((new.raw_user_meta_data ->> 'consent_analytics')::boolean, false),
    case when (new.raw_user_meta_data ->> 'consent_analytics')::boolean then now() end
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Hardening: la funzione deve girare SOLO tramite il trigger, mai chiamata
-- direttamente. Postgres concede l'EXECUTE a PUBLIC di default; lo revochiamo
-- (il trigger continua a funzionare: non verifica il privilegio EXECUTE).
-- Chiude il finding del Security Advisor "… Can Execute SECURITY DEFINER Function".
revoke execute on function public.handle_new_user() from public, anon, authenticated;

-- ---------- CANCELLAZIONE ACCOUNT (diritto all'oblio, art. 17) ----------
-- Permette all'utente loggato di cancellare DEFINITIVAMENTE il proprio account.
-- Cancellando la riga in auth.users, il cascade elimina anche profilo e preferiti.
-- security definer: gira coi privilegi del proprietario (accesso ad auth.users),
-- ma agisce solo su auth.uid(), quindi ognuno può cancellare solo sé stesso.
create or replace function public.delete_current_user()
returns void
language plpgsql
security definer set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Non autenticato';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke all on function public.delete_current_user() from public, anon;
grant execute on function public.delete_current_user() to authenticated;

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

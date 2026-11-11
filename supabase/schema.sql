-- Schema del database Brand To Client (Supabase, progetto lhymcknoojjhkesqorlq).
-- Già applicato: questo file serve come riferimento.

-- Profili studenti: creati in automatico alla registrazione, stato "pending" finché l'admin non sblocca.
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  status text not null default 'pending' check (status in ('pending','active','blocked')),
  is_admin boolean not null default false,
  created_at timestamptz not null default now(),
  activated_at timestamptz
);

create schema if not exists private;
grant usage on schema private to authenticated;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select p.is_admin from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function private.is_active_member() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select (p.status = 'active' or p.is_admin) from public.profiles p where p.id = auth.uid()), false);
$$;

create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), coalesce(new.email, ''));
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
for each row execute function private.handle_new_user();

-- Regole di accesso (RLS)
alter table public.profiles enable row level security;
create policy profiles_select on public.profiles for select to authenticated using (id = auth.uid() or private.is_admin());
create policy profiles_update_admin on public.profiles for update to authenticated using (private.is_admin()) with check (private.is_admin());

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create table public.lessons (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules(id) on delete cascade,
  title text not null,
  description text not null default '',
  video_url text not null default '',
  transcript text not null default '',
  resources jsonb not null default '[]'::jsonb,
  position int not null default 0,
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;
create policy modules_select on public.modules for select to authenticated using (private.is_active_member());
create policy modules_admin_insert on public.modules for insert to authenticated with check (private.is_admin());
create policy modules_admin_update on public.modules for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy modules_admin_delete on public.modules for delete to authenticated using (private.is_admin());

alter table public.lessons enable row level security;
create policy lessons_select on public.lessons for select to authenticated using (private.is_admin() or (published and private.is_active_member()));
create policy lessons_admin_insert on public.lessons for insert to authenticated with check (private.is_admin());
create policy lessons_admin_update on public.lessons for update to authenticated using (private.is_admin()) with check (private.is_admin());
create policy lessons_admin_delete on public.lessons for delete to authenticated using (private.is_admin());

-- Avanzamento, note, preferiti, ultima lezione vista: ognuno vede solo i propri.
-- (lesson_progress, lesson_notes, lesson_favorites, user_state) — vedi migrazione initial_schema.

-- Impostazioni: meeting_url, meeting_when, slack_url, support_email (lette da tutti gli utenti registrati, modificate solo dall'admin).

-- Migrazione lesson_action_and_call_settings:
-- lessons.action ("L'azione di oggi") + impostazioni call_first_at / call_count.
alter table public.lessons add column if not exists action text not null default '';

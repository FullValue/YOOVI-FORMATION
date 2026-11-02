-- ════════════════════════════════════════════════════════════════════════════
-- Yoovi Formation — schéma (formation.yoovi.fr)
-- À exécuter dans un projet Supabase DÉDIÉ, dans l'ordre : 0001 → 0002 → 0003.
-- ════════════════════════════════════════════════════════════════════════════

-- gen_random_uuid() est natif depuis Postgres 13 (aucune extension requise)

-- ─── Types ──────────────────────────────────────────────────────────────────
do $$ begin
  create type public.user_role as enum ('super_admin', 'admin', 'partner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.account_status as enum ('invited', 'active', 'disabled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.publish_status as enum ('draft', 'published');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.video_provider as enum ('none', 'youtube', 'vimeo', 'file');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.progress_status as enum ('in_progress', 'completed');
exception when duplicate_object then null; end $$;

-- ─── Organismes partenaires ─────────────────────────────────────────────────
create table if not exists public.organizations (
  id            uuid primary key default gen_random_uuid(),
  name          text not null check (char_length(name) between 2 and 120),
  kind          text not null default 'Autre',          -- CCAS, établissement, association…
  city          text,
  contact_name  text,
  contact_email text,
  status       text not null default 'active' check (status in ('active', 'inactive')),
  -- 'all' : tout le catalogue publié ; 'custom' : seulement organization_modules
  catalog_mode  text not null default 'all' check (catalog_mode in ('all', 'custom')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- ─── Profils (1-1 avec auth.users) ──────────────────────────────────────────
create table if not exists public.profiles (
  id              uuid primary key references auth.users (id) on delete cascade,
  email           text not null,
  full_name       text,
  job_title       text,
  role            public.user_role not null default 'partner',
  organization_id uuid references public.organizations (id) on delete set null,
  status          public.account_status not null default 'invited',
  last_seen_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
  -- un partenaire sans organisme actif n'a accès à rien (voir current_profile_role, 0002)
);
create index if not exists profiles_org_idx on public.profiles (organization_id);

-- ─── Catalogue ──────────────────────────────────────────────────────────────
create table if not exists public.modules (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title         text not null check (char_length(title) between 2 and 120),
  summary       text not null default '',
  objective     text not null default '',
  icon          text not null default 'sparkles',
  color         text not null default 'violet',
  thumbnail_url text,
  position      integer not null default 0,
  status        public.publish_status not null default 'draft',
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.lessons (
  id               uuid primary key default gen_random_uuid(),
  module_id        uuid not null references public.modules (id) on delete cascade,
  title            text not null check (char_length(title) between 2 and 160),
  description      text not null default '',
  video_provider   public.video_provider not null default 'none',
  video_ref        text,                -- identifiant YouTube/Vimeo ou URL d'un fichier vidéo
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  position         integer not null default 0,
  status           public.publish_status not null default 'published',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists lessons_module_idx on public.lessons (module_id, position);

create table if not exists public.resources (
  id          uuid primary key default gen_random_uuid(),
  module_id   uuid not null references public.modules (id) on delete cascade,
  title       text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  kind        text not null default 'pdf' check (kind in ('pdf', 'link')),
  url         text,                     -- lien externe
  file_path   text,                     -- chemin dans le bucket privé « resources »
  position    integer not null default 0,
  created_at  timestamptz not null default now(),
  constraint resource_target check (url is not null or file_path is not null)
);
create index if not exists resources_module_idx on public.resources (module_id, position);

-- Personnalisation future du catalogue par organisme (utilisée quand catalog_mode = 'custom')
create table if not exists public.organization_modules (
  organization_id uuid not null references public.organizations (id) on delete cascade,
  module_id       uuid not null references public.modules (id) on delete cascade,
  primary key (organization_id, module_id)
);

-- ─── Progression individuelle ───────────────────────────────────────────────
create table if not exists public.lesson_progress (
  user_id               uuid not null references public.profiles (id) on delete cascade,
  lesson_id             uuid not null references public.lessons (id) on delete cascade,
  module_id             uuid not null references public.modules (id) on delete cascade,
  organization_id       uuid references public.organizations (id) on delete set null,
  status                public.progress_status not null default 'in_progress',
  last_position_seconds integer not null default 0 check (last_position_seconds >= 0),
  view_count            integer not null default 1 check (view_count >= 0),
  first_viewed_at       timestamptz not null default now(),
  last_viewed_at        timestamptz not null default now(),
  completed_at          timestamptz,
  primary key (user_id, lesson_id)
);
create index if not exists progress_org_idx on public.lesson_progress (organization_id);
create index if not exists progress_module_idx on public.lesson_progress (module_id);

-- ─── updated_at automatique ────────────────────────────────────────────────
create or replace function public.touch_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

do $$
declare t text;
begin
  foreach t in array array['organizations', 'profiles', 'modules', 'lessons'] loop
    execute format('drop trigger if exists %I_touch on public.%I', t, t);
    execute format('create trigger %I_touch before update on public.%I for each row execute function public.touch_updated_at()', t, t);
  end loop;
end $$;

-- ─── Création du profil à la création d'un compte Auth ─────────────────────
-- Le rôle et l'organisme viennent UNIQUEMENT de raw_app_meta_data (modifiable
-- seulement avec la clé service_role), jamais des métadonnées saisies par l'utilisateur.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_app_meta_data, '{}'::jsonb);
begin
  insert into public.profiles (id, email, full_name, job_title, role, organization_id, status)
  values (
    new.id,
    new.email,
    nullif(meta ->> 'full_name', ''),
    nullif(meta ->> 'job_title', ''),
    coalesce(nullif(meta ->> 'role', '')::public.user_role, 'partner'),
    nullif(meta ->> 'organization_id', '')::uuid,
    'invited'
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Le profil passe de « invited » à « active » à la première connexion confirmée
create or replace function public.handle_user_sign_in() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.last_sign_in_at is distinct from old.last_sign_in_at then
    update public.profiles
       set last_seen_at = new.last_sign_in_at,
           status = case when status = 'invited' then 'active'::public.account_status else status end
     where id = new.id;
  end if;
  return new;
end $$;

drop trigger if exists on_auth_user_signed_in on auth.users;
create trigger on_auth_user_signed_in after update of last_sign_in_at on auth.users
  for each row execute function public.handle_user_sign_in();

-- ════════════════════════════════════════════════════════════════════════════
-- Yoovi Formation — sécurité (Row Level Security)
-- Principes :
--   • un utilisateur partenaire ne lit que SON profil, SON organisme, SA progression
--     et le catalogue publié accessible à son organisme ;
--   • l'équipe Yoovi (admin, super_admin) lit et administre tout ;
--   • un compte désactivé, ou rattaché à un organisme désactivé, ne lit plus rien
--     (hors son propre profil, pour afficher le message adapté) ;
--   • les notes internes sur les partenaires vivent dans une table réservée à l'équipe.
-- ════════════════════════════════════════════════════════════════════════════

-- Notes internes (jamais visibles par les partenaires)
create table if not exists public.organization_notes (
  organization_id uuid primary key references public.organizations (id) on delete cascade,
  notes           text not null default '',
  updated_at      timestamptz not null default now()
);

-- ─── Fonctions d'aide (security definer : contournent la RLS sans récursion) ──
create or replace function public.current_profile_role() returns public.user_role
language sql stable security definer set search_path = public as $$
  select p.role
    from public.profiles p
    left join public.organizations o on o.id = p.organization_id
   where p.id = auth.uid()
     and p.status <> 'disabled'
     and (p.role <> 'partner' or o.status = 'active')
$$;

create or replace function public.is_staff() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_profile_role() in ('admin', 'super_admin'), false)
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.current_profile_role() = 'super_admin', false)
$$;

create or replace function public.is_active_user() returns boolean
language sql stable security definer set search_path = public as $$
  select public.current_profile_role() is not null
$$;

create or replace function public.current_org() returns uuid
language sql stable security definer set search_path = public as $$
  select p.organization_id from public.profiles p
   where p.id = auth.uid() and public.is_active_user()
$$;

create or replace function public.can_access_module(target uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_staff() or exists (
    select 1
      from public.modules m
      join public.profiles p on p.id = auth.uid()
      join public.organizations o on o.id = p.organization_id
     where m.id = target
       and m.status = 'published'
       and p.status <> 'disabled'
       and o.status = 'active'
       and (o.catalog_mode = 'all'
            or exists (select 1 from public.organization_modules om
                        where om.organization_id = o.id and om.module_id = m.id))
  )
$$;

-- ─── Garde-fou sur les champs sensibles des profils ────────────────────────
create or replace function public.protect_profile_fields() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  actor uuid := auth.uid();
begin
  -- clé service_role / SQL editor : pas de restriction
  if actor is null then return new; end if;

  if new.id <> old.id or new.email <> old.email then
    raise exception 'Champs non modifiables' using errcode = '42501';
  end if;

  if not public.is_staff() then
    -- un partenaire ne modifie que son nom et sa fonction
    if new.role <> old.role or new.organization_id is distinct from old.organization_id
       or new.status <> old.status then
      raise exception 'Modification non autorisée' using errcode = '42501';
    end if;
    return new;
  end if;

  if not public.is_super_admin() then
    -- un administrateur de plateforme ne gère que des comptes partenaires
    if old.role <> 'partner' and old.id <> actor then
      raise exception 'Seul un super administrateur peut modifier ce compte' using errcode = '42501';
    end if;
    if new.role <> old.role then
      raise exception 'Seul un super administrateur peut changer un rôle' using errcode = '42501';
    end if;
  end if;

  -- personne ne se désactive ni ne se rétrograde soi-même
  if old.id = actor and (new.status = 'disabled' or new.role <> old.role) then
    raise exception 'Impossible de modifier son propre rôle ou de se désactiver' using errcode = '42501';
  end if;
  return new;
end $$;

drop trigger if exists profiles_protect on public.profiles;
create trigger profiles_protect before update on public.profiles
  for each row execute function public.protect_profile_fields();

-- Cohérence de la progression : module et organisme dérivés côté base
create or replace function public.normalize_progress() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  select l.module_id into new.module_id from public.lessons l where l.id = new.lesson_id;
  if auth.uid() is not null then
    new.organization_id := (select organization_id from public.profiles where id = new.user_id);
  end if;
  if new.status = 'completed' and new.completed_at is null then
    new.completed_at := now();
  end if;
  if tg_op = 'UPDATE' and old.status = 'completed' and new.status = 'in_progress' then
    -- une leçon terminée le reste (revoir une vidéo ne fait pas perdre la validation)
    new.status := 'completed';
    new.completed_at := old.completed_at;
  end if;
  return new;
end $$;

drop trigger if exists progress_normalize on public.lesson_progress;
create trigger progress_normalize before insert or update on public.lesson_progress
  for each row execute function public.normalize_progress();

-- ─── Activation RLS ────────────────────────────────────────────────────────
alter table public.organizations        enable row level security;
alter table public.organization_notes   enable row level security;
alter table public.profiles             enable row level security;
alter table public.modules              enable row level security;
alter table public.lessons              enable row level security;
alter table public.resources            enable row level security;
alter table public.organization_modules enable row level security;
alter table public.lesson_progress      enable row level security;

-- Aucun accès anonyme aux données
revoke all on all tables in schema public from anon;

-- organizations
drop policy if exists org_select on public.organizations;
create policy org_select on public.organizations for select to authenticated
  using (public.is_staff() or id = public.current_org());
drop policy if exists org_insert on public.organizations;
create policy org_insert on public.organizations for insert to authenticated
  with check (public.is_staff());
drop policy if exists org_update on public.organizations;
create policy org_update on public.organizations for update to authenticated
  using (public.is_staff()) with check (public.is_staff());
drop policy if exists org_delete on public.organizations;
create policy org_delete on public.organizations for delete to authenticated
  using (public.is_super_admin());

-- organization_notes : équipe Yoovi uniquement
drop policy if exists notes_all on public.organization_notes;
create policy notes_all on public.organization_notes for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- profiles
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_staff());
drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_staff())
  with check (id = auth.uid() or public.is_staff());
drop policy if exists profiles_delete on public.profiles;
create policy profiles_delete on public.profiles for delete to authenticated
  using (public.is_super_admin() and id <> auth.uid());
-- pas de policy insert : les profils sont créés par le trigger handle_new_user

-- modules
drop policy if exists modules_select on public.modules;
create policy modules_select on public.modules for select to authenticated
  using (public.can_access_module(id));
drop policy if exists modules_write on public.modules;
create policy modules_write on public.modules for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- lessons
drop policy if exists lessons_select on public.lessons;
create policy lessons_select on public.lessons for select to authenticated
  using (public.is_staff() or (status = 'published' and public.can_access_module(module_id)));
drop policy if exists lessons_write on public.lessons;
create policy lessons_write on public.lessons for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- resources
drop policy if exists resources_select on public.resources;
create policy resources_select on public.resources for select to authenticated
  using (public.can_access_module(module_id));
drop policy if exists resources_write on public.resources;
create policy resources_write on public.resources for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- organization_modules
drop policy if exists orgmod_select on public.organization_modules;
create policy orgmod_select on public.organization_modules for select to authenticated
  using (public.is_staff() or organization_id = public.current_org());
drop policy if exists orgmod_write on public.organization_modules;
create policy orgmod_write on public.organization_modules for all to authenticated
  using (public.is_staff()) with check (public.is_staff());

-- lesson_progress : chacun écrit SA progression, sur une leçon publiée qu'il peut voir
drop policy if exists progress_select on public.lesson_progress;
create policy progress_select on public.lesson_progress for select to authenticated
  using (user_id = auth.uid() or public.is_staff());
drop policy if exists progress_insert on public.lesson_progress;
create policy progress_insert on public.lesson_progress for insert to authenticated
  with check (
    user_id = auth.uid()
    and public.is_active_user()
    and exists (select 1 from public.lessons l
                 where l.id = lesson_id and l.status = 'published'
                   and public.can_access_module(l.module_id))
  );
drop policy if exists progress_update on public.lesson_progress;
create policy progress_update on public.lesson_progress for update to authenticated
  using (user_id = auth.uid() and public.is_active_user())
  with check (user_id = auth.uid());
drop policy if exists progress_delete on public.lesson_progress;
create policy progress_delete on public.lesson_progress for delete to authenticated
  using (public.is_super_admin());

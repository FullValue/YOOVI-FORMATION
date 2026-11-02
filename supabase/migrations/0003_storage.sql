-- ════════════════════════════════════════════════════════════════════════════
-- Yoovi Formation — stockage des fichiers
--   thumbnails : miniatures des modules (lecture publique, écriture équipe Yoovi)
--   resources  : documents PDF (privé ; lecture si le module est accessible)
-- ════════════════════════════════════════════════════════════════════════════

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('thumbnails', 'thumbnails', true, 5242880, array['image/png', 'image/jpeg', 'image/webp']),
  ('resources', 'resources', false, 26214400, array['application/pdf'])
on conflict (id) do nothing;

drop policy if exists "thumbnails read" on storage.objects;
create policy "thumbnails read" on storage.objects for select
  using (bucket_id = 'thumbnails');

drop policy if exists "thumbnails write" on storage.objects;
create policy "thumbnails write" on storage.objects for all to authenticated
  using (bucket_id = 'thumbnails' and public.is_staff())
  with check (bucket_id = 'thumbnails' and public.is_staff());

drop policy if exists "resources read" on storage.objects;
create policy "resources read" on storage.objects for select to authenticated
  using (
    bucket_id = 'resources'
    and (
      public.is_staff()
      or exists (select 1 from public.resources r
                  where r.file_path = storage.objects.name
                    and public.can_access_module(r.module_id))
    )
  );

drop policy if exists "resources write" on storage.objects;
create policy "resources write" on storage.objects for all to authenticated
  using (bucket_id = 'resources' and public.is_staff())
  with check (bucket_id = 'resources' and public.is_staff());

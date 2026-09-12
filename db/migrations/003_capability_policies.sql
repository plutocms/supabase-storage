-- Replaces the admin-only checks on media writes with capability checks.
-- public.has_capability(cap) is defined in the core schema
-- (@plutocms/supabase 0.7.0+), which always applies before any layer
-- schema. It folds in public.is_admin(), so every existing admin keeps
-- write access with no data migration.
--
-- media_select_public (on public.media) and "media: public read" (on
-- storage.objects) do not reference is_admin() and are not touched here.

-- ============================================================
-- public.media
-- ============================================================
-- Only a holder of media:manage can insert media.
drop policy if exists "media_insert_authenticated" on public.media;

create policy "media_insert_authenticated"
  on public.media
  for insert
  with check (public.has_capability('media:manage'));

-- Only a holder of media:manage can update media records.
drop policy if exists "media_update_authenticated" on public.media;

create policy "media_update_authenticated"
  on public.media
  for update
  using  (public.has_capability('media:manage'))
  with check (public.has_capability('media:manage'));

-- Only a holder of media:delete can delete media records.
drop policy if exists "media_delete_authenticated" on public.media;

create policy "media_delete_authenticated"
  on public.media
  for delete
  using (public.has_capability('media:delete'));

-- ============================================================
-- storage.objects
-- ============================================================
-- Only a holder of media:manage can upload into the media bucket.
drop policy if exists "media: admin insert" on storage.objects;

create policy "media: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.has_capability('media:manage'));

-- Only a holder of media:manage can update objects in the media bucket.
drop policy if exists "media: admin update" on storage.objects;

create policy "media: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.has_capability('media:manage'))
  with check (bucket_id = 'media' and public.has_capability('media:manage'));

-- Only a holder of media:delete can delete objects in the media bucket.
drop policy if exists "media: admin delete" on storage.objects;

create policy "media: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.has_capability('media:delete'));

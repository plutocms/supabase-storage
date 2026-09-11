-- Deployed sites created media.product_id under the v0.1.4 baseline,
-- with a foreign key to a table (public.products) this layer does not
-- own and does not depend on. Fresh sites never had it (001_baseline.sql
-- no longer creates it). Both cases are handled correctly by IF EXISTS.
drop index if exists public.media_product_id_idx;
alter table public.media drop constraint if exists media_product_id_fkey;
alter table public.media drop column if exists product_id;

-- ============================================================
-- Row Level Security
-- ============================================================
-- Anyone (including anonymous visitors) can read media records
-- so they can be displayed on the public-facing site. Read access is
-- unchanged; re-declared here so a re-run of this file is idempotent.
drop policy if exists "media_select_public" on public.media;

create policy "media_select_public"
  on public.media
  for select
  using (true);

-- Only admins can insert media. There is no editor/author role yet, so
-- "authenticated" previously meant "any signed-up account, admin or not".
-- public.is_admin() is defined in the core schema (@plutocms/supabase),
-- which always applies before any layer schema.
drop policy if exists "media_insert_authenticated" on public.media;

create policy "media_insert_authenticated"
  on public.media
  for insert
  with check (public.is_admin());

-- Only admins can update media records.
drop policy if exists "media_update_authenticated" on public.media;

create policy "media_update_authenticated"
  on public.media
  for update
  using  (public.is_admin())
  with check (public.is_admin());

-- Only admins can delete media records.
drop policy if exists "media_delete_authenticated" on public.media;

create policy "media_delete_authenticated"
  on public.media
  for delete
  using (public.is_admin());

-- ============================================================
-- Storage
-- ============================================================
-- server/api/media/new.post.ts uploads into a bucket named "media", but
-- nothing ever created it or its storage.objects policies — uploads
-- failed until an admin created the bucket by hand in the dashboard.
-- Mirrors @plutocms/supabase-shop's setup for its "product-media" bucket.
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

drop policy if exists "media: public read" on storage.objects;

create policy "media: public read"
  on storage.objects for select
  using (bucket_id = 'media');

drop policy if exists "media: admin insert" on storage.objects;

create policy "media: admin insert"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin update" on storage.objects;

create policy "media: admin update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'media' and public.is_admin())
  with check (bucket_id = 'media' and public.is_admin());

drop policy if exists "media: admin delete" on storage.objects;

create policy "media: admin delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'media' and public.is_admin());

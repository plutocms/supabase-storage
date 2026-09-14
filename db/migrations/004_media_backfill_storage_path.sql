-- Backfills storage_path for media rows created before this column was
-- populated on insert. Idempotent: a row already carrying storage_path is
-- left alone, and a re-run of this file changes nothing further.
update public.media
set storage_path = 'uploads/' || name
where storage_path is null
  and name is not null;

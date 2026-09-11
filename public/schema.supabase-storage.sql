-- Compatibility stub. Read only by @plutocms/supabase < 0.4.0, whose
-- migration engine cannot see this layer's db/migrations/ directory.
-- Remove this file one release after 0.4.0 is the floor everywhere.
do $$
begin
  raise exception 'This layer needs @plutocms/supabase >= 0.4.0. Upgrade @plutocms/supabase and restart the server.';
end
$$;

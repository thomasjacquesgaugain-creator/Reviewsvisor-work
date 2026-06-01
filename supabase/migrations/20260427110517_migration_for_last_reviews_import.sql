alter table if exists public.establishments
  add column if not exists last_reviews_import timestamp with time zone;


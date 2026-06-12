create table import_jobs (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid references auth.users not null,
  place_id             text not null,
  outscraper_task_id   text,
  source               text, 
  status               text not null default 'pending',
  total                int,
  inserted             int,
  updated              int,
  skipped              int,
  error                text,
  created_at           timestamptz default now(),
  updated_at           timestamptz default now()
);

alter publication supabase_realtime add table import_jobs;
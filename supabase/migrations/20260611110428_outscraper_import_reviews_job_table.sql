-- Create import_jobs table
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

alter table import_jobs enable row level security;

create policy "Users can view own jobs"
  on import_jobs for select
  using (user_id = auth.uid());

create policy "Users can insert own jobs"
  on import_jobs for insert
  with check (user_id = auth.uid());

-- Enable Realtime on import_jobs
alter publication supabase_realtime add table import_jobs;
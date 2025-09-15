-- Avis individuels (source: google)
create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  place_id text not null,
  source text not null default 'google',
  remote_id text not null,              -- id de l'avis côté Google
  rating int,
  text text,
  language_code text,
  published_at timestamptz,
  author_name text,
  author_url text,
  author_photo_url text,
  like_count int,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (source, remote_id)
);

-- Agrégat / résumé de l'analyse pour un lieu
create table if not exists public.review_insights (
  place_id text not null,
  user_id uuid not null,
  last_analyzed_at timestamptz,
  counts jsonb,               -- { total, by_rating, positive_pct, negative_pct }
  overall_rating numeric,
  top_issues jsonb,           -- string[]
  top_strengths jsonb,        -- string[]
  recommendations jsonb,      -- string[]
  primary key (place_id, user_id)
);

-- RLS : lecture par l'utilisateur propriétaire
alter table public.reviews enable row level security;
alter table public.review_insights enable row level security;

do $$ begin
  if not exists (
    select 1 from pg_policies where tablename = 'review_insights' and policyname = 'ri_select_self'
  ) then
    create policy ri_select_self on public.review_insights
      for select using (auth.uid() = user_id);
  end if;
  if not exists (
    select 1 from pg_policies where tablename = 'reviews' and policyname = 'r_select_by_user'
  ) then
    create policy r_select_by_user on public.reviews
      for select using (user_id = auth.uid());
  end if;
end $$;
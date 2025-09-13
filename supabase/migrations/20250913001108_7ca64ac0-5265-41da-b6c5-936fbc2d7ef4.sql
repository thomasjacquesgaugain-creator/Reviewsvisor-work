-- Table des avis bruts unifiés
create table if not exists reviews_raw (
  id bigint generated always as identity primary key,
  place_id text not null,
  source text not null,           -- 'google' | 'yelp' | 'tripadvisor' | ...
  author text,
  rating numeric,
  text text,
  reviewed_at timestamptz,
  raw jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_reviews_raw_place on reviews_raw(place_id);
create index if not exists idx_reviews_raw_reviewed_at on reviews_raw(reviewed_at);

-- Table d'insights synthétisés par IA
create table if not exists review_insights (
  place_id text primary key,
  summary jsonb not null,         -- {overall_rating, positive_pct, negative_pct, counts, top_issues, top_strengths, recommendations}
  last_analyzed_at timestamptz default now()
);
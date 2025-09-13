-- Table d'insights (création si manquante)
create table if not exists review_insights (
  place_id text primary key,
  summary jsonb not null default '{}'::jsonb,
  last_analyzed_at timestamptz default now()
);

-- Assurer les colonnes si la table existait déjà :
alter table review_insights
  add column if not exists summary jsonb default '{}'::jsonb,
  add column if not exists last_analyzed_at timestamptz;

-- Index utile sur la clé
create index if not exists idx_review_insights_place on review_insights(place_id);
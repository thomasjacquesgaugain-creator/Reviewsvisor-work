-- Ajoute la colonne si elle n'existe pas, en optionnelle
alter table if exists review_insights
  add column if not exists user_id uuid references auth.users(id);

-- Rend la colonne optionnelle si elle existait avec NOT NULL
alter table if exists review_insights
  alter column user_id drop not null;

-- Conserve la clé par place_id ; ajoute une contrainte d'unicité facultative
-- pour éviter les doublons (un même place_id par user_id)
do $$
begin
  if not exists (
    select 1 from pg_indexes
    where schemaname = 'public' and indexname = 'uniq_review_insights_user_place'
  ) then
    execute 'create unique index uniq_review_insights_user_place
             on review_insights (coalesce(user_id::text, '''') , place_id)';
  end if;
end$$;
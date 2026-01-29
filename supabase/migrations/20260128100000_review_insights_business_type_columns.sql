-- Colonnes optionnelles pour review_insights (format v2 / business type).
-- À exécuter si la migration 20260128000000 n'a pas été appliquée ou a échoué sur d'autres tables.
-- Aucune requête ne doit échouer pour une colonne inexistante : le front sélectionne uniquement les colonnes de base si besoin.

ALTER TABLE public.review_insights
ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'autre' CHECK (business_type IN ('restaurant', 'salon_coiffure', 'salle_sport', 'serrurier', 'retail_chaussures', 'institut_beaute', 'autre')),
ADD COLUMN IF NOT EXISTS business_type_confidence integer CHECK (business_type_confidence IS NULL OR (business_type_confidence >= 0 AND business_type_confidence <= 100)),
ADD COLUMN IF NOT EXISTS business_type_candidates jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_type_source text CHECK (business_type_source IS NULL OR business_type_source IN ('places', 'keywords', 'manual')),
ADD COLUMN IF NOT EXISTS analysis_version text DEFAULT 'v1',
ADD COLUMN IF NOT EXISTS themes_universal jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS themes_industry jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS pain_points_prioritized jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommendations_quick_wins jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS recommendations_projects jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS reply_templates jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS summary_one_liner text,
ADD COLUMN IF NOT EXISTS summary_what_customers_love jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS summary_what_customers_hate jsonb DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_review_insights_business_type ON public.review_insights(business_type);
CREATE INDEX IF NOT EXISTS idx_review_insights_analysis_version ON public.review_insights(analysis_version);

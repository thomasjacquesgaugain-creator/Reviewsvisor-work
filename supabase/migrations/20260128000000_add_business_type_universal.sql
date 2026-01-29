-- Migration: Ajout du support universel multi-secteurs
-- Ajoute businessType, confidence, candidates, source, analysisVersion aux tables establishments, établissements et review_insights

-- 1. Ajouter les champs à la table establishments
ALTER TABLE public.establishments
ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'autre' CHECK (business_type IN ('restaurant', 'salon_coiffure', 'salle_sport', 'serrurier', 'retail_chaussures', 'institut_beaute', 'autre')),
ADD COLUMN IF NOT EXISTS business_type_confidence integer CHECK (business_type_confidence >= 0 AND business_type_confidence <= 100),
ADD COLUMN IF NOT EXISTS business_type_candidates jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_type_source text CHECK (business_type_source IN ('places', 'keywords', 'manual')),
ADD COLUMN IF NOT EXISTS analysis_version text DEFAULT 'v1';

-- 2. Ajouter les champs à la table établissements
ALTER TABLE public.établissements
ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'autre' CHECK (business_type IN ('restaurant', 'salon_coiffure', 'salle_sport', 'serrurier', 'retail_chaussures', 'institut_beaute', 'autre')),
ADD COLUMN IF NOT EXISTS business_type_confidence integer CHECK (business_type_confidence >= 0 AND business_type_confidence <= 100),
ADD COLUMN IF NOT EXISTS business_type_candidates jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS business_type_source text CHECK (business_type_source IN ('places', 'keywords', 'manual')),
ADD COLUMN IF NOT EXISTS analysis_version text DEFAULT 'v1';

-- 3. Ajouter les champs à la table review_insights pour le nouveau format v2
ALTER TABLE public.review_insights
ADD COLUMN IF NOT EXISTS business_type text DEFAULT 'autre' CHECK (business_type IN ('restaurant', 'salon_coiffure', 'salle_sport', 'serrurier', 'retail_chaussures', 'institut_beaute', 'autre')),
ADD COLUMN IF NOT EXISTS business_type_confidence integer CHECK (business_type_confidence >= 0 AND business_type_confidence <= 100),
ADD COLUMN IF NOT EXISTS business_type_candidates jsonb DEFAULT '[]'::jsonb,
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

-- 4. Créer des index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_establishments_business_type ON public.establishments(business_type);
CREATE INDEX IF NOT EXISTS idx_etablissements_business_type ON public.établissements(business_type);
CREATE INDEX IF NOT EXISTS idx_review_insights_business_type ON public.review_insights(business_type);
CREATE INDEX IF NOT EXISTS idx_review_insights_analysis_version ON public.review_insights(analysis_version);

-- 5. Commentaires pour documentation
COMMENT ON COLUMN public.establishments.business_type IS 'Type de commerce détecté automatiquement ou défini manuellement';
COMMENT ON COLUMN public.establishments.business_type_confidence IS 'Score de confiance de la détection (0-100)';
COMMENT ON COLUMN public.establishments.business_type_candidates IS 'Liste des types candidats avec leurs scores de confiance [{type, confidence}]';
COMMENT ON COLUMN public.establishments.business_type_source IS 'Source de la détection: places (Google Places), keywords (analyse textuelle), manual (override utilisateur)';
COMMENT ON COLUMN public.establishments.analysis_version IS 'Version du format d''analyse utilisé (v1=ancien, v2-auto-universal=nouveau)';

COMMENT ON COLUMN public.review_insights.themes_universal IS 'Thèmes universels extraits (accueil, propreté, prix, etc.)';
COMMENT ON COLUMN public.review_insights.themes_industry IS 'Thèmes spécifiques au secteur (uniquement si confidence >= 75)';
COMMENT ON COLUMN public.review_insights.pain_points_prioritized IS 'Points de friction priorisés avec impact/ease';
COMMENT ON COLUMN public.review_insights.recommendations_quick_wins IS 'Recommandations quick wins (7 jours)';
COMMENT ON COLUMN public.review_insights.recommendations_projects IS 'Recommandations projets (30 jours)';
COMMENT ON COLUMN public.review_insights.reply_templates IS 'Templates de réponses par sentiment (positive/neutral/negative)';

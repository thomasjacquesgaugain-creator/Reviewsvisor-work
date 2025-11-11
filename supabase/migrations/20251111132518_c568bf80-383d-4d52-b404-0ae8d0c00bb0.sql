-- Ajuster la table reponses avec contrainte unique sur (avis_id, etablissement_id)

-- Supprimer l'ancienne contrainte unique si elle existe
ALTER TABLE public.reponses DROP CONSTRAINT IF EXISTS reponses_unique_validation;

-- Créer la contrainte unique sur (avis_id, etablissement_id) pour éviter les doublons
CREATE UNIQUE INDEX IF NOT EXISTS reponses_unique_avis_etabl 
ON public.reponses(avis_id, etablissement_id);
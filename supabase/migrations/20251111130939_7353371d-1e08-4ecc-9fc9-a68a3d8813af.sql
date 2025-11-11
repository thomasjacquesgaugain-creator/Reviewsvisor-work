-- Vérifier si la colonne avis_id existe, sinon l'ajouter
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'reponses' 
    AND column_name = 'avis_id'
  ) THEN
    ALTER TABLE public.reponses ADD COLUMN avis_id text UNIQUE;
  END IF;
END $$;

-- Créer un index sur avis_id si il n'existe pas
CREATE INDEX IF NOT EXISTS idx_reponses_avis_id ON public.reponses(avis_id);
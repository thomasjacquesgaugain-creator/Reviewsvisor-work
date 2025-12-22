-- Ajouter les champs manquants à la table établissements pour persister toutes les infos
ALTER TABLE public.établissements
ADD COLUMN IF NOT EXISTS website text,
ADD COLUMN IF NOT EXISTS rating numeric,
ADD COLUMN IF NOT EXISTS google_maps_url text,
ADD COLUMN IF NOT EXISTS lat double precision,
ADD COLUMN IF NOT EXISTS lng double precision,
ADD COLUMN IF NOT EXISTS user_ratings_total integer,
ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS raw_place_json jsonb;

-- Créer un index partiel pour garantir un seul établissement actif par utilisateur
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_per_user 
ON public.établissements (user_id) 
WHERE is_active = true;

-- Fonction pour désactiver les autres établissements quand on en active un
CREATE OR REPLACE FUNCTION public.handle_active_establishment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE public.établissements
    SET is_active = false
    WHERE user_id = NEW.user_id 
      AND id != NEW.id 
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger pour gérer l'unicité de l'établissement actif
DROP TRIGGER IF EXISTS trigger_handle_active_establishment ON public.établissements;
CREATE TRIGGER trigger_handle_active_establishment
BEFORE INSERT OR UPDATE ON public.établissements
FOR EACH ROW
EXECUTE FUNCTION public.handle_active_establishment();
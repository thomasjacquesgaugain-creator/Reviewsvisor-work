-- Colonne pour l'import incrémental des avis (économiser les crédits Outscraper)
ALTER TABLE public."établissements"
  ADD COLUMN IF NOT EXISTS last_reviews_import timestamptz NULL;

COMMENT ON COLUMN public."établissements".last_reviews_import IS 'Date du dernier import d''avis réussi (pour import incrémental via cutoff Outscraper).';

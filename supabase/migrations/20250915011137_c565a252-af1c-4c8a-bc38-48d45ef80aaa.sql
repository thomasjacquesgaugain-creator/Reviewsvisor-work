-- Ajouter la colonne icon_type à la table establishments
ALTER TABLE public.establishments 
ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'Restaurant';
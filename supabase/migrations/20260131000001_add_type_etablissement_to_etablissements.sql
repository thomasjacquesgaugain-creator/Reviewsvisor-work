-- Type d'établissement (catégorie mappée depuis Google Places types ou saisie manuelle)
ALTER TABLE "établissements" ADD COLUMN IF NOT EXISTS type_etablissement TEXT;

COMMENT ON COLUMN "établissements".type_etablissement IS 'Catégorie d''établissement : Restaurant, Bar, Café, Hôtel, Boulangerie, Salon de coiffure, Spa / Bien-être, Commerce de détail, Autre. Remplie depuis Google Places API ou éditée par l''utilisateur.';

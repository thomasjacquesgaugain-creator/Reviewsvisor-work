-- Type d'établissement choisi à l'inscription (optionnel)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS establishment_type text;

COMMENT ON COLUMN profiles.establishment_type IS 'Type d''établissement choisi à l''inscription (ex: Restaurant, Bar, Café). Optionnel.';

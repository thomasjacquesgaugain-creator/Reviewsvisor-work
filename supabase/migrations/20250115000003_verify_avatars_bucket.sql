-- Script de vérification et création du bucket avatars
-- À exécuter manuellement si le bucket n'existe pas après les migrations précédentes

-- Vérifier si le bucket existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    -- Créer le bucket s'il n'existe pas
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,
      2097152, -- 2 MB
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
    RAISE NOTICE 'Bucket "avatars" créé avec succès';
  ELSE
    RAISE NOTICE 'Bucket "avatars" existe déjà';
  END IF;
END $$;

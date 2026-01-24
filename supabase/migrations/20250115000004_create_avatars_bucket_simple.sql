-- Script simple pour créer le bucket avatars
-- À exécuter dans Supabase SQL Editor si le bucket n'existe pas

-- Vérifier et créer le bucket
DO $$
BEGIN
  -- Vérifier si le bucket existe
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') THEN
    -- Créer le bucket
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'avatars',
      'avatars',
      true,
      2097152, -- 2 MB
      ARRAY['image/jpeg', 'image/png', 'image/webp']
    );
    RAISE NOTICE '✅ Bucket "avatars" créé avec succès';
  ELSE
    -- Mettre à jour les paramètres si le bucket existe déjà
    UPDATE storage.buckets
    SET 
      public = true,
      file_size_limit = 2097152,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp']
    WHERE id = 'avatars';
    RAISE NOTICE '✅ Bucket "avatars" existe déjà, paramètres mis à jour';
  END IF;
END $$;

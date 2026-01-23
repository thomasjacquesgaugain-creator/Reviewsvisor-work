-- Add avatar_url column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL de la photo de profil stockée dans Supabase Storage (bucket avatars)';

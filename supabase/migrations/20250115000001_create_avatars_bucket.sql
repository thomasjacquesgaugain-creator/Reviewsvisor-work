-- Create avatars bucket in Supabase Storage
-- This migration creates the bucket "avatars" if it doesn't exist
-- The bucket policies are created in a separate migration

-- Insert bucket configuration (only if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true, -- Public bucket for easy access
  2097152, -- 2 MB limit (2 * 1024 * 1024)
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

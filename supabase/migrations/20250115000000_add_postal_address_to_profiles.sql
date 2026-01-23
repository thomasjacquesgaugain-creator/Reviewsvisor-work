-- Add postal_address column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS postal_address TEXT;

-- Ensure phone column exists (should already exist, but safe to add)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.phone IS 'Phone number in E.164 format (e.g., +33123456789)';
COMMENT ON COLUMN public.profiles.postal_address IS 'Postal address as formatted string (e.g., "1 Cr de la Bôve, 56100 Lorient")';

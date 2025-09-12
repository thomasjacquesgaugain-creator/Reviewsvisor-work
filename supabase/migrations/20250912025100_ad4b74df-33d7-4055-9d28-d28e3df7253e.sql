-- Fix Security Issues

-- 1. Drop the problematic view 'etablissements' that has security definer issues
-- This view is just a simple select from the "établissements" table with different column names
DROP VIEW IF EXISTS public.etablissements;

-- 2. Enable RLS on spatial_ref_sys table (PostGIS system table)
-- Note: This table contains spatial reference system definitions and should be readable by all
ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy for spatial_ref_sys to allow read access to all authenticated users
CREATE POLICY "Allow read access to spatial reference systems" 
ON public.spatial_ref_sys 
FOR SELECT 
USING (true);

-- 4. If the 'etablissements' view was used somewhere, users should access the "établissements" table directly
-- The "établissements" table already has proper RLS policies in place

-- 5. Fix search path for existing functions that don't have it set
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = public
AS $function$
begin
  new.updated_at = now();
  return new;
end 
$function$;
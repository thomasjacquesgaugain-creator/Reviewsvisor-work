-- Fix Security Issues (excluding spatial_ref_sys which is a PostGIS system table)

-- 1. Drop the problematic view 'etablissements' that has security definer issues
-- This view is just a simple select from the "établissements" table with different column names
DROP VIEW IF EXISTS public.etablissements;

-- 2. Fix search path for existing functions that don't have it set
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
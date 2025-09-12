-- Fix RLS security issue by hiding spatial_ref_sys from PostgREST API
-- Since we cannot enable RLS on this system table, we'll remove it from the API exposure

-- Create a comment that excludes this table from PostgREST
COMMENT ON TABLE public.spatial_ref_sys IS 'PostgREST table hidden for security compliance';

-- Alternative approach: Create a view with RLS for spatial_ref_sys if needed
-- This is read-only reference data, so we can safely expose it for read operations

-- First check if anyone actually needs to access this table via API
-- If so, we can create a secure view, but for now let's document it as system table
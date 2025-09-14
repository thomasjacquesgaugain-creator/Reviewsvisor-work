-- Hide PostGIS system tables from PostgREST to prevent RLS linter errors
-- These are read-only reference tables that don't need RLS protection

-- Hide spatial_ref_sys from PostgREST
COMMENT ON TABLE public.spatial_ref_sys IS '@exclude PostgREST';

-- Hide other PostGIS system tables that might appear
COMMENT ON TABLE public.geometry_columns IS '@exclude PostgREST';
COMMENT ON TABLE public.geography_columns IS '@exclude PostgREST';
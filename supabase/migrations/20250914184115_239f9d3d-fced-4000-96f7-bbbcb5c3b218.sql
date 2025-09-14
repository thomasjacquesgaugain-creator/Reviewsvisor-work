-- Secure PostGIS system table to resolve "RLS Disabled in Public" without altering extension internals
-- We revoke access for API-exposed roles so PostgREST cannot read it.

DO $$
BEGIN
  -- Revoke from generic PUBLIC role
  BEGIN
    REVOKE ALL ON TABLE public.spatial_ref_sys FROM PUBLIC;
  EXCEPTION WHEN others THEN NULL; END;

  -- Revoke from Supabase API roles
  BEGIN
    REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon;
  EXCEPTION WHEN others THEN NULL; END;

  BEGIN
    REVOKE ALL ON TABLE public.spatial_ref_sys FROM authenticated;
  EXCEPTION WHEN others THEN NULL; END;
END $$;
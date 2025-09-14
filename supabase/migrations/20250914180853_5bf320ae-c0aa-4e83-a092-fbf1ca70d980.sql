-- Mitigation for linter error 0013: remove PostgREST exposure of PostGIS system table
-- Revoke all privileges from anon and authenticated on spatial_ref_sys so it is not exposed via PostgREST
DO $$
BEGIN
  -- Revoke from anon if exists
  PERFORM 1 FROM pg_roles WHERE rolname = 'anon';
  IF FOUND THEN
    REVOKE ALL ON TABLE public.spatial_ref_sys FROM anon;
  END IF;

  -- Revoke from authenticated if exists
  PERFORM 1 FROM pg_roles WHERE rolname = 'authenticated';
  IF FOUND THEN
    REVOKE ALL ON TABLE public.spatial_ref_sys FROM authenticated;
  END IF;
END $$;
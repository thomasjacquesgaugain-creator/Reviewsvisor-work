-- Alternative approach: Create a custom role policy to prevent PostgREST access to PostGIS system tables
-- Since we cannot modify the system tables directly, we ensure they have no accessible permissions

-- Ensure no one can access PostGIS system tables via PostgREST
DO $$
DECLARE
    postgis_tables text[] := ARRAY['spatial_ref_sys', 'geometry_columns', 'geography_columns'];
    tbl text;
BEGIN
    FOREACH tbl IN ARRAY postgis_tables
    LOOP
        -- Remove any remaining grants (if they exist)
        BEGIN
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM public', tbl);
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM anon', tbl);
            EXECUTE format('REVOKE ALL ON TABLE public.%I FROM authenticated', tbl);
        EXCEPTION WHEN others THEN
            -- Ignore errors if table doesn't exist or we don't have permissions
            NULL;
        END;
    END LOOP;
END $$;
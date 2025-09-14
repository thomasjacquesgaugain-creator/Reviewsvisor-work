-- Enable RLS on spatial_ref_sys table (PostGIS system table)
-- This table contains spatial reference system definitions and is typically read-only
-- We'll enable RLS and create a policy that allows read access to all authenticated users

ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;

-- Create a policy to allow authenticated users to read spatial reference data
-- This data is typically public reference information needed for spatial operations
CREATE POLICY "Allow authenticated users to read spatial reference systems"
ON public.spatial_ref_sys
FOR SELECT
TO authenticated
USING (true);

-- Also allow public (anonymous) access for spatial reference data since it's reference data
CREATE POLICY "Allow public read access to spatial reference systems"
ON public.spatial_ref_sys
FOR SELECT
TO anon
USING (true);
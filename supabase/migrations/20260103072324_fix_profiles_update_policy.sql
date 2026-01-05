-- Fix RLS policy for profiles UPDATE to include WITH CHECK clause
-- This allows users to update their own profile data

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

-- Recreate the policy with both USING and WITH CHECK clauses
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- Remove anonymous access policies from reponses table
-- These policies allow unauthenticated users to read/write response data

DROP POLICY IF EXISTS "anon_select_reponse" ON public.reponses;
DROP POLICY IF EXISTS "anon_insert_reponse" ON public.reponses;

-- Verify remaining policies are owner-scoped (already exist and are secure)
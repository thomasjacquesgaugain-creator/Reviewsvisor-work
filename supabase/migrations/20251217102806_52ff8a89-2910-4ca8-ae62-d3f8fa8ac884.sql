-- Remove dangerous anonymous access policies from reponses table
-- These policies allow unauthenticated users full access to all data

DROP POLICY IF EXISTS "anon_insert_reponse" ON public.reponses;
DROP POLICY IF EXISTS "anon_select_reponse" ON public.reponses;

-- The table already has proper authenticated user policies:
-- - insert_own_reponse: users can only insert their own responses
-- - select_own_reponses: users can only see their own responses  
-- - update_own_reponse: users can only update their own responses
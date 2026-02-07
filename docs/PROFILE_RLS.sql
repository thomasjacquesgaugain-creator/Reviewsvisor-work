-- =============================================================================
-- RLS pour la table public.profiles
-- Permet à chaque utilisateur de voir / modifier / créer uniquement sa ligne.
-- À exécuter si les policies sont absentes ou à recréer (ex: nouveau projet).
-- =============================================================================

-- 1. Activer RLS sur profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les policies existantes (éviter les doublons)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- 3. SELECT : l'utilisateur ne peut voir que sa ligne (user_id = auth.uid())
CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

-- 4. INSERT : l'utilisateur ne peut insérer que sa propre ligne
CREATE POLICY "Users can create their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 5. UPDATE : l'utilisateur ne peut modifier que sa propre ligne (USING + WITH CHECK)
CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Vérification (optionnel) :
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

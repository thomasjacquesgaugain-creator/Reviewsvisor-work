-- RLS pour la table établissements : permettre SELECT, INSERT, UPDATE, DELETE pour le propriétaire (user_id).
-- Sans ces politiques, les mises à jour (ex. type_etablissement) peuvent échouer ou être bloquées.

-- Activer RLS sur la table (idempotent : pas d'erreur si déjà activé)
ALTER TABLE IF EXISTS public."établissements" ENABLE ROW LEVEL SECURITY;

-- Politiques : uniquement si la table existe (les CREATE POLICY échouent si la table n'existe pas).
-- Supprimer d'éventuelles anciennes politiques pour éviter les doublons
DROP POLICY IF EXISTS "Users can view their own établissements" ON public."établissements";
DROP POLICY IF EXISTS "Users can create their own établissements" ON public."établissements";
DROP POLICY IF EXISTS "Users can update their own établissements" ON public."établissements";
DROP POLICY IF EXISTS "Users can delete their own établissements" ON public."établissements";

CREATE POLICY "Users can view their own établissements"
ON public."établissements"
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own établissements"
ON public."établissements"
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own établissements"
ON public."établissements"
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own établissements"
ON public."établissements"
FOR DELETE
USING (auth.uid() = user_id);

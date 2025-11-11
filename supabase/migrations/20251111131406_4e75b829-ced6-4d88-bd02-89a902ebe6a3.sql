-- Recréer la table reponses avec le bon schéma
DROP TABLE IF EXISTS public.reponses CASCADE;

CREATE TABLE public.reponses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  avis_id text NOT NULL,
  contenu text,
  statut text NOT NULL DEFAULT 'valide',
  validated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL,
  etablissement_id text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Créer les index pour performance
CREATE INDEX reponses_avis_id_idx ON public.reponses(avis_id);
CREATE INDEX reponses_user_idx ON public.reponses(user_id);
CREATE INDEX reponses_etab_idx ON public.reponses(etablissement_id);

-- Créer une contrainte unique sur (avis_id, user_id, etablissement_id) pour éviter les doublons
CREATE UNIQUE INDEX reponses_unique_validation ON public.reponses(avis_id, user_id, etablissement_id);

-- Activer RLS
ALTER TABLE public.reponses ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour authenticated
CREATE POLICY "insert_own_reponse"
ON public.reponses
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "update_own_reponse"
ON public.reponses
FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "select_own_reponses"
ON public.reponses
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy supplémentaire pour anon (si l'app utilise anon key)
CREATE POLICY "anon_insert_reponse"
ON public.reponses
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "anon_select_reponse"
ON public.reponses
FOR SELECT
TO anon
USING (true);
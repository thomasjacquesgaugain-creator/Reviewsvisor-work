-- Activer RLS (si pas déjà)
ALTER TABLE review_insights ENABLE ROW LEVEL SECURITY;

-- Lecture autorisée si l'entrée est publique (user_id IS NULL) OU appartient à l'utilisateur connecté
DROP POLICY IF EXISTS "read_review_insights" ON review_insights;
CREATE POLICY "read_review_insights" ON review_insights
  FOR SELECT
  USING ( user_id IS NULL OR user_id = auth.uid() );

-- (optionnel) Empêcher les writes côté anon; seules les functions service role écrivent
DROP POLICY IF EXISTS "write_review_insights" ON review_insights;
CREATE POLICY "write_review_insights" ON review_insights
  FOR ALL
  TO authenticated
  USING ( false )
  WITH CHECK ( false );
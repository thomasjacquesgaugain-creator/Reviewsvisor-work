-- Permettre aux utilisateurs d'insérer leurs propres avis (ex. import Outscraper)
DROP POLICY IF EXISTS "Users can insert their own reviews" ON public.reviews;
CREATE POLICY "Users can insert their own reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

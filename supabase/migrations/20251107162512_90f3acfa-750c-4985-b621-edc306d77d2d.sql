-- Fix review_insights RLS policies to prevent null user_id access
-- Drop the problematic policies that allow null user_id
DROP POLICY IF EXISTS "Service can upsert insights" ON review_insights;
DROP POLICY IF EXISTS "insights:own" ON review_insights;
DROP POLICY IF EXISTS "ri_select_self" ON review_insights;
DROP POLICY IF EXISTS "Users can view insights for their establishments" ON review_insights;

-- Create secure policies that require user_id
CREATE POLICY "Users can view their own insights"
ON review_insights
FOR SELECT
USING (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can insert their own insights"
ON review_insights
FOR INSERT
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can update their own insights"
ON review_insights
FOR UPDATE
USING (auth.uid() = user_id AND user_id IS NOT NULL)
WITH CHECK (auth.uid() = user_id AND user_id IS NOT NULL);

CREATE POLICY "Users can delete their own insights"
ON review_insights
FOR DELETE
USING (auth.uid() = user_id AND user_id IS NOT NULL);
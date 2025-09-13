-- Enable RLS on review_insights table
ALTER TABLE review_insights ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for review_insights
CREATE POLICY "Users can view insights for their establishments" 
ON review_insights 
FOR SELECT 
USING (place_id IN (
  SELECT place_id 
  FROM user_establishment 
  WHERE user_id = auth.uid()
));

CREATE POLICY "Service can upsert insights" 
ON review_insights 
FOR ALL 
USING (true) 
WITH CHECK (true);
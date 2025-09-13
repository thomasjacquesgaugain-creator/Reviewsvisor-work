-- Create review_insights table if not exists
CREATE TABLE IF NOT EXISTS public.review_insights (
  id BIGSERIAL PRIMARY KEY,
  place_id TEXT NOT NULL,
  user_id UUID NULL,
  last_analyzed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary JSONB NOT NULL DEFAULT '{}'
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_review_insights_place_time
  ON public.review_insights (place_id, last_analyzed_at DESC);

-- Enable RLS
ALTER TABLE public.review_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for review_insights
-- Users can read insights for their establishments
CREATE POLICY "Users can view insights for their establishments" 
ON public.review_insights 
FOR SELECT 
USING (place_id IN (
  SELECT user_establishment.place_id
  FROM user_establishment
  WHERE user_establishment.user_id = auth.uid()
));

-- Service can upsert insights
CREATE POLICY "Service can upsert insights" 
ON public.review_insights 
FOR ALL 
USING (true)
WITH CHECK (true);
-- Enable RLS on new tables
ALTER TABLE public.reviews_raw ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_insights ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews_raw
CREATE POLICY "Users can view reviews for their establishments" 
ON public.reviews_raw FOR SELECT 
USING (
  place_id IN (
    SELECT place_id FROM public.user_establishment WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service can insert reviews" 
ON public.reviews_raw FOR INSERT 
WITH CHECK (true);

-- Create policies for review_insights  
CREATE POLICY "Users can view insights for their establishments" 
ON public.review_insights FOR SELECT 
USING (
  place_id IN (
    SELECT place_id FROM public.user_establishment WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Service can upsert insights" 
ON public.review_insights FOR ALL 
USING (true) 
WITH CHECK (true);
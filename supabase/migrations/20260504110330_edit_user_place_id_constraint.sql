ALTER TABLE public.review_insights
  DROP CONSTRAINT IF EXISTS review_insights_pkey;

DROP INDEX IF EXISTS public.uniq_review_insights_user_place;

ALTER TABLE public.review_insights
  ADD CONSTRAINT review_insights_pkey PRIMARY KEY (user_id, place_id);
ALTER TABLE public.review_insights
ADD COLUMN IF NOT EXISTS qualitative_stop_words jsonb NULL DEFAULT '[]'::jsonb;

ALTER TABLE public.review_insights
ADD COLUMN IF NOT EXISTS qualitative_keywords jsonb NULL DEFAULT '{}'::jsonb;
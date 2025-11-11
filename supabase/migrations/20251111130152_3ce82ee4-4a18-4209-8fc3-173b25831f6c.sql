-- Drop the old responses table if it exists
DROP TABLE IF EXISTS public.responses CASCADE;

-- Create reponses table (without accent)
CREATE TABLE public.reponses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  establishment_id text NOT NULL,
  review_id text NOT NULL,
  response_text text NOT NULL,
  status text NOT NULL DEFAULT 'validated',
  validated_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reponses ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "allow insert"
ON public.reponses
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "allow select"
ON public.reponses
FOR SELECT
TO anon
USING (true);

CREATE POLICY "allow update"
ON public.reponses
FOR UPDATE
TO anon
USING (true)
WITH CHECK (true);

-- Create index for faster queries
CREATE INDEX idx_reponses_establishment ON public.reponses(establishment_id);
CREATE INDEX idx_reponses_review ON public.reponses(review_id);
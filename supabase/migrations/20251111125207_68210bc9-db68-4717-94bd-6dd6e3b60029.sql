-- Create responses table to track validated responses
CREATE TABLE IF NOT EXISTS public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  establishment_id uuid NOT NULL,
  review_id bigint NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  validated_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  UNIQUE(review_id)
);

-- Enable RLS
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;

-- Users can view their own responses
CREATE POLICY "Users can view their own responses"
  ON public.responses
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own responses
CREATE POLICY "Users can insert their own responses"
  ON public.responses
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own responses
CREATE POLICY "Users can update their own responses"
  ON public.responses
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_responses_user_establishment ON public.responses(user_id, establishment_id);
CREATE INDEX idx_responses_status ON public.responses(status);
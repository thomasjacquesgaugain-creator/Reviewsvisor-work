-- Create user_establishment table
CREATE TABLE public.user_establishment (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id TEXT NOT NULL,
  name TEXT NOT NULL,
  address TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  url TEXT,
  website TEXT,
  phone TEXT,
  rating NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id)
);

-- Enable RLS on user_establishment table
ALTER TABLE public.user_establishment ENABLE ROW LEVEL SECURITY;

-- Create policies for user_establishment
CREATE POLICY "Users can view their own establishment" 
ON public.user_establishment 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own establishment" 
ON public.user_establishment 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own establishment" 
ON public.user_establishment 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own establishment" 
ON public.user_establishment 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_user_establishment_updated_at
  BEFORE UPDATE ON public.user_establishment
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
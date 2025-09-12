-- Create establishments table with RLS
CREATE TABLE public.establishments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  place_id text NOT NULL,
  name text NOT NULL,
  formatted_address text,
  lat double precision,
  lng double precision,
  phone text,
  website text,
  rating numeric,
  user_ratings_total integer,
  types jsonb,
  source text NOT NULL DEFAULT 'google',
  raw jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT unique_user_place UNIQUE (user_id, place_id)
);

-- Create index on place_id for better performance
CREATE INDEX idx_establishments_place_id ON public.establishments(place_id);

-- Enable Row Level Security
ALTER TABLE public.establishments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own establishments" 
ON public.establishments 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own establishments" 
ON public.establishments 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own establishments" 
ON public.establishments 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own establishments" 
ON public.establishments 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_establishments_updated_at
BEFORE UPDATE ON public.establishments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
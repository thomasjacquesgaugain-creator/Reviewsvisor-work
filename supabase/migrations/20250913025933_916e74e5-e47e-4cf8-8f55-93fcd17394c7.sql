-- Add missing hash column for deduplication
ALTER TABLE public.reviews_raw ADD COLUMN IF NOT EXISTS hash text;

-- Create unique constraint on hash for deduplication
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'reviews_raw_hash_key' 
    AND conrelid = 'public.reviews_raw'::regclass
  ) THEN
    ALTER TABLE public.reviews_raw ADD CONSTRAINT reviews_raw_hash_key UNIQUE (hash);
  END IF;
END $$;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS reviews_raw_hash_idx ON public.reviews_raw(hash);

-- Add missing column for compatibility
ALTER TABLE public.reviews_raw ADD COLUMN IF NOT EXISTS source_ref text;
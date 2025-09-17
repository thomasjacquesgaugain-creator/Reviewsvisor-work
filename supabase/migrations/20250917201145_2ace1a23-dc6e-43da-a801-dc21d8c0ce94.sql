-- Add dedup_key column to reviews table if not exists
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS dedup_key TEXT;

-- Create unique index to prevent duplicates per establishment
CREATE UNIQUE INDEX IF NOT EXISTS ux_reviews_place_dedup 
ON reviews (place_id, dedup_key) 
WHERE dedup_key IS NOT NULL;
-- Add dedup_key column and unique constraint for bulletproof deduplication
ALTER TABLE reviews 
ADD COLUMN IF NOT EXISTS dedup_key TEXT;

-- Create unique constraint per establishment to prevent duplicates
DROP INDEX IF EXISTS ux_reviews_est_dedup;
CREATE UNIQUE INDEX ux_reviews_est_dedup 
ON reviews (place_id, dedup_key) 
WHERE dedup_key IS NOT NULL;
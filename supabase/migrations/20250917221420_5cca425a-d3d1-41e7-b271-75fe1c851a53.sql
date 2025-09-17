-- Add unique constraint on fingerprint for better deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_unique_fingerprint 
ON reviews (place_id, user_id, fingerprint) 
WHERE fingerprint IS NOT NULL;
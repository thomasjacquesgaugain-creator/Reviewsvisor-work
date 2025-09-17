-- Add fingerprint column to reviews table for deduplication
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS fingerprint text;

-- Create unique constraint on place_id and fingerprint for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_reviews_fingerprint_unique 
ON reviews (place_id, fingerprint) 
WHERE fingerprint IS NOT NULL;

-- Create index for performance on place_id
CREATE INDEX IF NOT EXISTS idx_reviews_place_id 
ON reviews (place_id);

-- Update existing reviews to generate fingerprints if they don't have them
UPDATE reviews 
SET fingerprint = 'legacy_' || id::text 
WHERE fingerprint IS NULL;
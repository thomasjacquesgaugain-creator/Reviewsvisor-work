-- Create function to identify duplicate reviews for cleanup
CREATE OR REPLACE FUNCTION identify_duplicate_reviews(p_place_id TEXT, p_user_id UUID)
RETURNS TABLE(duplicate_id BIGINT) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_reviews AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY dedup_key 
                   ORDER BY inserted_at ASC
               ) AS rn
        FROM reviews
        WHERE place_id = p_place_id 
          AND user_id = p_user_id
          AND dedup_key IS NOT NULL
    )
    SELECT r.id
    FROM ranked_reviews r
    WHERE r.rn > 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
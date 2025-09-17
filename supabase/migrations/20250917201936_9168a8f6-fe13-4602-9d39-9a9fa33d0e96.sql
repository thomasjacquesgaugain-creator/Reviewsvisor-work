-- Create function to get reviews summary with duplicates info
CREATE OR REPLACE FUNCTION get_reviews_summary_with_duplicates(p_place_id TEXT, p_user_id UUID)
RETURNS TABLE(total_all BIGINT, total_unique BIGINT, duplicates BIGINT, avg_rating NUMERIC) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT as total_all,
        COUNT(DISTINCT COALESCE(dedup_key, id::text))::BIGINT as total_unique,
        (COUNT(*) - COUNT(DISTINCT COALESCE(dedup_key, id::text)))::BIGINT as duplicates,
        COALESCE(AVG(rating), 0)::NUMERIC as avg_rating
    FROM reviews
    WHERE place_id = p_place_id 
      AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create function to cleanup duplicate reviews (keep oldest)
CREATE OR REPLACE FUNCTION cleanup_duplicate_reviews(p_place_id TEXT, p_user_id UUID)
RETURNS TABLE(deleted BIGINT) AS $$
DECLARE
    deleted_count BIGINT := 0;
BEGIN
    -- Delete duplicates, keeping the oldest record for each dedup_key
    WITH duplicates_to_delete AS (
        SELECT id,
               ROW_NUMBER() OVER (
                   PARTITION BY COALESCE(dedup_key, id::text)
                   ORDER BY inserted_at ASC
               ) AS rn
        FROM reviews
        WHERE place_id = p_place_id 
          AND user_id = p_user_id
    )
    DELETE FROM reviews 
    WHERE id IN (
        SELECT d.id 
        FROM duplicates_to_delete d 
        WHERE d.rn > 1
    );
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    RETURN QUERY SELECT deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
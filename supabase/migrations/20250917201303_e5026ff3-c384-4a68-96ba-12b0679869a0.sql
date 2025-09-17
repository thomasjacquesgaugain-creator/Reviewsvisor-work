-- Create function to count unique reviews by dedup_key
CREATE OR REPLACE FUNCTION count_unique_reviews(p_place_id TEXT, p_user_id UUID)
RETURNS TABLE(count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT COUNT(DISTINCT COALESCE(dedup_key, id::text))::BIGINT
    FROM reviews
    WHERE place_id = p_place_id 
      AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
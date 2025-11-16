-- Add DELETE policy for reviews table to allow users to delete their own reviews
CREATE POLICY "Users can delete their own reviews"
ON reviews
FOR DELETE
USING (auth.uid() = user_id);
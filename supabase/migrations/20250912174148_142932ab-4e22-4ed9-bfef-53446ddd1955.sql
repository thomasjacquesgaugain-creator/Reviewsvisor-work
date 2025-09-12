-- Enable RLS on user_establishment table
ALTER TABLE user_establishment ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own establishment
CREATE POLICY "Users can view their own establishment" 
ON user_establishment 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create policy for users to create their own establishment
CREATE POLICY "Users can create their own establishment" 
ON user_establishment 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create policy for users to update their own establishment
CREATE POLICY "Users can update their own establishment" 
ON user_establishment 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create policy for users to delete their own establishment
CREATE POLICY "Users can delete their own establishment" 
ON user_establishment 
FOR DELETE 
USING (auth.uid() = user_id);
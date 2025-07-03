-- Add photographer role to user_role enum and create helper functions
-- This fixes photographer dashboard access by ensuring photographer role exists

-- Add 'photographer' to the existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'photographer';

-- Create helper function to check if user is a photographer (similar to is_broker)
CREATE OR REPLACE FUNCTION is_photographer_role(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id_param
    AND role = 'photographer'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get photographer record for a user
CREATE OR REPLACE FUNCTION get_photographer_by_user_id(user_id_param UUID DEFAULT auth.uid())
RETURNS UUID AS $$
DECLARE
  photographer_id_result UUID;
BEGIN
  -- Check if user has photographer role
  IF NOT is_photographer_role(user_id_param) THEN
    RETURN NULL;
  END IF;
  
  -- Get photographer ID by email match (since photographers table doesn't have user_id)
  SELECT p.id INTO photographer_id_result
  FROM photographers p
  JOIN auth.users u ON p.email = u.email
  WHERE u.id = user_id_param
  AND p.is_active = true;
  
  RETURN photographer_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- Add policy to allow photographers to view their own data for dashboard access
-- This ensures photographers can access their own dashboard data

-- Allow photographers to view their own profile data
CREATE POLICY "Photographers can view their own profile" ON photographers
  FOR SELECT 
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );
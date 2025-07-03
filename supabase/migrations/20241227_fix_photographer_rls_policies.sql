-- Fix RLS policies for photographers and photographer_assignments tables
-- This migration adds the missing admin access policies

-- Allow admin access to photographers table
CREATE POLICY "Allow admin access to photographers" ON photographers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Allow service role access to photographers table (for API operations)
CREATE POLICY "Allow service role access to photographers" ON photographers
  FOR ALL USING (auth.role() = 'service_role');

-- Allow admin access to photographer_assignments table
CREATE POLICY "Allow admin access to photographer_assignments" ON photographer_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Allow service role access to photographer_assignments table (for API operations)
CREATE POLICY "Allow service role access to photographer_assignments" ON photographer_assignments
  FOR ALL USING (auth.role() = 'service_role');

-- Allow admins to update photographer assignments
CREATE POLICY "Allow admin update to photographer_assignments" ON photographer_assignments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Allow admins to insert photographer assignments
CREATE POLICY "Allow admin insert to photographer_assignments" ON photographer_assignments
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );
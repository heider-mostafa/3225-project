-- Fix RLS policies for photographers table to allow proper API access
-- This migration fixes the RLS policies that are blocking photographer operations

-- First, drop existing policies that might be too restrictive
DROP POLICY IF EXISTS "Allow admin access to photographers" ON photographers;
DROP POLICY IF EXISTS "Allow service role access to photographers" ON photographers;

-- Create a more permissive policy for service role (API operations)
CREATE POLICY "Allow service role full access to photographers" ON photographers
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create a policy that allows authenticated users with admin role to access photographers
CREATE POLICY "Allow authenticated admin access to photographers" ON photographers
  FOR ALL 
  TO authenticated
  USING (
    -- Check if user has admin role in user_roles table
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    -- Fallback: Check if user has admin role in user_profiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    -- Same check for inserts/updates
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Allow public read access for specific operations (like displaying photographer info)
CREATE POLICY "Allow public read access to active photographers" ON photographers
  FOR SELECT
  TO public
  USING (is_active = true);

-- Fix photographer_assignments table policies as well
DROP POLICY IF EXISTS "Allow admin access to photographer_assignments" ON photographer_assignments;
DROP POLICY IF EXISTS "Allow service role access to photographer_assignments" ON photographer_assignments;
DROP POLICY IF EXISTS "Allow admin update to photographer_assignments" ON photographer_assignments;
DROP POLICY IF EXISTS "Allow admin insert to photographer_assignments" ON photographer_assignments;

-- Service role full access for photographer_assignments
CREATE POLICY "Allow service role full access to photographer_assignments" ON photographer_assignments
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Admin access for photographer_assignments
CREATE POLICY "Allow authenticated admin access to photographer_assignments" ON photographer_assignments
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Allow photographers to view their own assignments
CREATE POLICY "Photographers can view their own assignments" ON photographer_assignments
  FOR SELECT 
  TO authenticated
  USING (
    photographer_id IN (
      SELECT p.id FROM photographers p
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );
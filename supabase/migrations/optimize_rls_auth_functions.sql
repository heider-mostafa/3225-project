-- Optimize RLS policies to prevent auth function re-evaluation for each row
-- This improves query performance at scale by wrapping auth functions in subqueries

-- Fix photographers table policies
DROP POLICY IF EXISTS "Photographers can view their own profile" ON photographers;
CREATE POLICY "Photographers can view their own profile" ON photographers
  FOR SELECT 
  TO authenticated
  USING (
    email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
  );

DROP POLICY IF EXISTS "Photographers can view their own assignments" ON photographer_assignments;
CREATE POLICY "Photographers can view their own assignments" ON photographer_assignments
  FOR SELECT 
  TO authenticated
  USING (
    photographer_id IN (
      SELECT p.id FROM photographers p
      WHERE p.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    )
  );

-- Fix pending_properties policies
DROP POLICY IF EXISTS "Photographers can view their own pending properties" ON pending_properties;
CREATE POLICY "Photographers can view their own pending properties" ON pending_properties
  FOR SELECT 
  TO authenticated
  USING (
    photographer_id IN (
      SELECT p.id FROM photographers p
      WHERE p.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    )
  );

-- Fix pending_property_photos policies
DROP POLICY IF EXISTS "Photographers can view their own pending property photos" ON pending_property_photos;
CREATE POLICY "Photographers can view their own pending property photos" ON pending_property_photos
  FOR SELECT 
  TO authenticated
  USING (
    pending_property_id IN (
      SELECT pp.id FROM pending_properties pp
      JOIN photographers p ON pp.photographer_id = p.id
      WHERE p.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    )
  );

-- Fix leads policies
DROP POLICY IF EXISTS "Photographers can view assigned leads" ON leads;
CREATE POLICY "Photographers can view assigned leads" ON leads
  FOR SELECT 
  TO authenticated
  USING (
    id IN (
      SELECT pa.lead_id FROM photographer_assignments pa
      JOIN photographers p ON pa.photographer_id = p.id
      WHERE p.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
    )
  );

-- Fix user_roles policies if they exist
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT 
  TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Fix any other policies that use auth.uid() directly
DROP POLICY IF EXISTS "Allow authenticated admin access to photographers" ON photographers;
CREATE POLICY "Allow authenticated admin access to photographers" ON photographers
  FOR ALL 
  TO authenticated
  USING (
    -- Check if user has admin role in user_roles table
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    -- Fallback: Check if user has admin role in user_profiles
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    -- Same check for inserts/updates
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow authenticated admin access to photographer_assignments" ON photographer_assignments;
CREATE POLICY "Allow authenticated admin access to photographer_assignments" ON photographer_assignments
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = (SELECT auth.uid())
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Allow authenticated admin access to pending_properties" ON pending_properties;
CREATE POLICY "Allow authenticated admin access to pending_properties" ON pending_properties
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Allow authenticated admin access to pending_property_photos" ON pending_property_photos;
CREATE POLICY "Allow authenticated admin access to pending_property_photos" ON pending_property_photos
  FOR ALL 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  );
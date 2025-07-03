-- FIX MULTIPLE PERMISSIVE POLICIES
-- This migration consolidates overlapping RLS policies that create performance issues
-- Multiple permissive policies for the same role/action are suboptimal

-- ================================================================
-- USER_ROLES TABLE - Consolidate SELECT policies
-- ================================================================

-- Drop all existing SELECT policies that overlap
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON user_roles;

-- Create single comprehensive SELECT policy
CREATE POLICY "user_roles_consolidated_read" ON user_roles
  FOR SELECT 
  USING (
    -- Users can see their own roles
    user_id = (SELECT auth.uid()) 
    OR 
    -- Admins and super admins can see all roles
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate policies for other operations (no overlaps)
CREATE POLICY "user_roles_admin_insert" ON user_roles
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

CREATE POLICY "user_roles_admin_update" ON user_roles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

CREATE POLICY "user_roles_admin_delete" ON user_roles
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- ADMIN_PERMISSIONS TABLE - Consolidate SELECT policies
-- ================================================================

-- Drop all existing SELECT policies that overlap
DROP POLICY IF EXISTS "Users can view their own permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Comprehensive admin permissions access" ON admin_permissions;

-- Create single comprehensive SELECT policy
CREATE POLICY "admin_permissions_consolidated_read" ON admin_permissions
  FOR SELECT 
  USING (
    -- Users can see their own permissions
    user_id = (SELECT auth.uid()) 
    OR 
    -- Admins and super admins can see all permissions
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate policies for management (no overlaps)
CREATE POLICY "admin_permissions_admin_insert" ON admin_permissions
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

CREATE POLICY "admin_permissions_admin_update" ON admin_permissions
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

CREATE POLICY "admin_permissions_admin_delete" ON admin_permissions
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- ADMIN_ACTIVITY_LOG TABLE - Consolidate SELECT policies
-- ================================================================

-- Drop overlapping policies
DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
DROP POLICY IF EXISTS "System can insert activity log" ON admin_activity_log;

-- Create single comprehensive SELECT policy
CREATE POLICY "admin_activity_log_consolidated_read" ON admin_activity_log
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate INSERT policy
CREATE POLICY "admin_activity_log_system_insert" ON admin_activity_log
  FOR INSERT 
  WITH CHECK (true); -- Allow system to log activities

-- ================================================================
-- BROKERS TABLE - Consolidate overlapping policies
-- ================================================================

-- Drop overlapping policies
DROP POLICY IF EXISTS "Allow public read access to active brokers" ON brokers;
DROP POLICY IF EXISTS "Allow brokers to update their own profile" ON brokers;
DROP POLICY IF EXISTS "Allow admins to manage brokers" ON brokers;
DROP POLICY IF EXISTS "Allow authenticated admin access to brokers" ON brokers;
DROP POLICY IF EXISTS "Photographers can view their own profile" ON brokers;

-- Create single comprehensive SELECT policy
CREATE POLICY "brokers_consolidated_read" ON brokers
  FOR SELECT 
  USING (
    -- Public can view active brokers
    is_active = true
    OR
    -- Admins can view all brokers
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate UPDATE policy for brokers
CREATE POLICY "brokers_self_update" ON brokers
  FOR UPDATE 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

-- Create separate admin management policies
CREATE POLICY "brokers_admin_insert" ON brokers
  FOR INSERT 
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "brokers_admin_update" ON brokers
  FOR UPDATE 
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

CREATE POLICY "brokers_admin_delete" ON brokers
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- BROKER_AVAILABILITY TABLE - Consolidate overlapping policies
-- ================================================================

-- Drop overlapping policies
DROP POLICY IF EXISTS "Allow public read access to broker availability" ON broker_availability;
DROP POLICY IF EXISTS "Allow brokers to manage their own availability" ON broker_availability;
DROP POLICY IF EXISTS "Allow admins to manage all availability" ON broker_availability;
DROP POLICY IF EXISTS "Comprehensive broker availability read" ON broker_availability;
DROP POLICY IF EXISTS "Comprehensive broker availability management" ON broker_availability;

-- Create single comprehensive SELECT policy
CREATE POLICY "broker_availability_consolidated_read" ON broker_availability
  FOR SELECT 
  USING (
    -- Public can view available slots
    is_available = true
    OR
    -- Brokers can view their own availability
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    -- Admins can view all availability
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate management policies
CREATE POLICY "broker_availability_insert" ON broker_availability
  FOR INSERT 
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "broker_availability_update" ON broker_availability
  FOR UPDATE 
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "broker_availability_delete" ON broker_availability
  FOR DELETE 
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- PROPERTY_VIEWINGS TABLE - Consolidate overlapping policies
-- ================================================================

-- Drop overlapping policies
DROP POLICY IF EXISTS "Allow users to read their own viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow public insert for new viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow brokers to read their assigned viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow brokers to update their viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow admins to manage all viewings" ON property_viewings;
DROP POLICY IF EXISTS "Comprehensive property viewings read" ON property_viewings;
DROP POLICY IF EXISTS "Comprehensive property viewings insert" ON property_viewings;
DROP POLICY IF EXISTS "Comprehensive property viewings update" ON property_viewings;
DROP POLICY IF EXISTS "Comprehensive property viewings delete" ON property_viewings;

-- Create single comprehensive SELECT policy
CREATE POLICY "property_viewings_consolidated_read" ON property_viewings
  FOR SELECT 
  USING (
    -- Users can see their own viewings
    user_id = (SELECT auth.uid()) 
    OR 
    visitor_email = (SELECT auth.email())
    OR
    -- Brokers can see their assigned viewings
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    -- Admins can see all viewings
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate INSERT policy
CREATE POLICY "property_viewings_public_insert" ON property_viewings
  FOR INSERT 
  WITH CHECK (true); -- Allow public booking

-- Create separate UPDATE policy
CREATE POLICY "property_viewings_broker_update" ON property_viewings
  FOR UPDATE 
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate DELETE policy (admin only)
CREATE POLICY "property_viewings_admin_delete" ON property_viewings
  FOR DELETE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
SELECT 'Multiple permissive policies have been consolidated! Performance should be significantly improved.' as message;
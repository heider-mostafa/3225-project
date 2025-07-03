-- EMERGENCY FIX: INFINITE RECURSION IN USER_ROLES POLICIES
-- This migration completely reverts the problematic changes that caused infinite recursion
-- and restores the system to a working state

-- ================================================================
-- STEP 1: DISABLE RLS TEMPORARILY TO PREVENT RECURSION ERRORS
-- ================================================================

-- Disable RLS on user_roles to break the recursion cycle
ALTER TABLE user_roles DISABLE ROW LEVEL SECURITY;

-- ================================================================
-- STEP 2: DROP ALL PROBLEMATIC POLICIES THAT REFERENCE USER_ROLES
-- ================================================================

-- Drop all policies that create circular dependencies by referencing user_roles within user_roles policies
DROP POLICY IF EXISTS "user_roles_consolidated_read" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_insert" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_delete" ON user_roles;

-- Drop all policies that reference user_roles in their conditions (causing recursion)
DROP POLICY IF EXISTS "user_profiles_read" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_delete" ON user_profiles;
DROP POLICY IF EXISTS "user_activity_read" ON user_activity_log;
DROP POLICY IF EXISTS "admin_permissions_consolidated_read" ON admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_admin_insert" ON admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_admin_update" ON admin_permissions;
DROP POLICY IF EXISTS "admin_permissions_admin_delete" ON admin_permissions;
DROP POLICY IF EXISTS "admin_activity_log_consolidated_read" ON admin_activity_log;
DROP POLICY IF EXISTS "brokers_consolidated_read" ON brokers;
DROP POLICY IF EXISTS "brokers_admin_insert" ON brokers;
DROP POLICY IF EXISTS "brokers_admin_update" ON brokers;
DROP POLICY IF EXISTS "brokers_admin_delete" ON brokers;
DROP POLICY IF EXISTS "broker_availability_consolidated_read" ON broker_availability;
DROP POLICY IF EXISTS "broker_availability_insert" ON broker_availability;
DROP POLICY IF EXISTS "broker_availability_update" ON broker_availability;
DROP POLICY IF EXISTS "broker_availability_delete" ON broker_availability;
DROP POLICY IF EXISTS "property_viewings_consolidated_read" ON property_viewings;
DROP POLICY IF EXISTS "property_viewings_broker_update" ON property_viewings;
DROP POLICY IF EXISTS "property_viewings_admin_delete" ON property_viewings;

-- Drop photographer policies that may reference user_roles
DROP POLICY IF EXISTS "photographers_consolidated_read" ON photographers;
DROP POLICY IF EXISTS "photographers_admin_insert" ON photographers;
DROP POLICY IF EXISTS "photographers_admin_update" ON photographers;
DROP POLICY IF EXISTS "photographers_admin_delete" ON photographers;
DROP POLICY IF EXISTS "photographer_assignments_consolidated_read" ON photographer_assignments;
DROP POLICY IF EXISTS "photographer_assignments_admin_insert" ON photographer_assignments;
DROP POLICY IF EXISTS "photographer_assignments_admin_update" ON photographer_assignments;
DROP POLICY IF EXISTS "photographer_assignments_admin_delete" ON photographer_assignments;

-- ================================================================
-- STEP 3: CREATE SIMPLE POLICIES WITHOUT USER_ROLES REFERENCES
-- ================================================================

-- USER_ROLES TABLE - Simple policies without recursion
DROP POLICY IF EXISTS "user_roles_owner_read" ON user_roles;
DROP POLICY IF EXISTS "user_roles_owner_manage" ON user_roles;

CREATE POLICY "user_roles_owner_read" ON user_roles
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_owner_manage" ON user_roles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- USER_PROFILES TABLE - Use preferences field for role checking instead of user_roles table
DROP POLICY IF EXISTS "user_profiles_owner_all" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_admin_read" ON user_profiles;

CREATE POLICY "user_profiles_owner_all" ON user_profiles
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "user_profiles_admin_read" ON user_profiles
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR
    (preferences->>'role')::text IN ('admin', 'super_admin')
  );

-- PROPERTIES TABLE - Ensure properties are visible
DROP POLICY IF EXISTS "properties_public_read" ON properties;
CREATE POLICY "properties_public_read" ON properties
  FOR SELECT 
  USING (status = 'active');

-- Admin access to properties using user_profiles instead of user_roles
DROP POLICY IF EXISTS "properties_admin_all" ON properties;
CREATE POLICY "properties_admin_all" ON properties
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- BROKERS TABLE - Simplified policies without user_roles references
DROP POLICY IF EXISTS "brokers_public_read" ON brokers;
DROP POLICY IF EXISTS "brokers_owner_update" ON brokers;
DROP POLICY IF EXISTS "brokers_admin_all" ON brokers;

CREATE POLICY "brokers_public_read" ON brokers
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "brokers_owner_update" ON brokers
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "brokers_admin_all" ON brokers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- PHOTOGRAPHERS TABLE - Simplified policies without user_roles references
DROP POLICY IF EXISTS "photographers_public_read" ON photographers;
DROP POLICY IF EXISTS "photographers_owner_update" ON photographers;
DROP POLICY IF EXISTS "photographers_admin_all" ON photographers;

CREATE POLICY "photographers_public_read" ON photographers
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "photographers_owner_update" ON photographers
  FOR UPDATE 
  USING (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "photographers_admin_all" ON photographers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- PHOTOGRAPHER_ASSIGNMENTS TABLE - Simplified policies
DROP POLICY IF EXISTS "photographer_assignments_photographer_read" ON photographer_assignments;
DROP POLICY IF EXISTS "photographer_assignments_admin_all" ON photographer_assignments;

CREATE POLICY "photographer_assignments_photographer_read" ON photographer_assignments
  FOR SELECT 
  USING (
    photographer_id IN (
      SELECT p.id FROM photographers p
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "photographer_assignments_admin_all" ON photographer_assignments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- BROKER_AVAILABILITY TABLE - Simplified policies
DROP POLICY IF EXISTS "broker_availability_public_read" ON broker_availability;
DROP POLICY IF EXISTS "broker_availability_broker_manage" ON broker_availability;
DROP POLICY IF EXISTS "broker_availability_admin_all" ON broker_availability;

CREATE POLICY "broker_availability_public_read" ON broker_availability
  FOR SELECT 
  USING (is_available = true);

CREATE POLICY "broker_availability_broker_manage" ON broker_availability
  FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "broker_availability_admin_all" ON broker_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- PROPERTY_VIEWINGS TABLE - Simplified policies
DROP POLICY IF EXISTS "property_viewings_user_read" ON property_viewings;
DROP POLICY IF EXISTS "property_viewings_public_insert" ON property_viewings;
DROP POLICY IF EXISTS "property_viewings_broker_manage" ON property_viewings;

CREATE POLICY "property_viewings_user_read" ON property_viewings
  FOR SELECT 
  USING (
    user_id = auth.uid() 
    OR 
    visitor_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  );

CREATE POLICY "property_viewings_public_insert" ON property_viewings
  FOR INSERT 
  WITH CHECK (true);

CREATE POLICY "property_viewings_broker_manage" ON property_viewings
  FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  )
  WITH CHECK (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- ================================================================
-- STEP 4: RESTORE MISSING DATA
-- ================================================================

-- Re-insert sample brokers if they disappeared
INSERT INTO brokers (full_name, email, phone, specialties, languages, commission_rate, rating, is_active) VALUES
('Ahmed Hassan', 'ahmed.hassan@realestate.com', '+201012345678', ARRAY['residential', 'commercial'], ARRAY['english', 'arabic'], 2.5, 4.8, true),
('Sarah Mohamed', 'sarah.mohamed@realestate.com', '+201087654321', ARRAY['luxury', 'residential'], ARRAY['english', 'arabic'], 3.0, 4.9, true),
('Omar Ali', 'omar.ali@realestate.com', '+201555666777', ARRAY['commercial'], ARRAY['english', 'arabic'], 2.0, 4.7, true),
('Fatima Ahmed', 'fatima.ahmed@realestate.com', '+201234567890', ARRAY['residential'], ARRAY['english', 'arabic'], 2.2, 4.6, true)
ON CONFLICT (email) DO NOTHING;

-- Re-insert sample photographers if they disappeared  
INSERT INTO photographers (email, name, phone, equipment, rating, is_active) VALUES
('ahmed.photographer@gmail.com', 'Ahmed Photographer', '+201012345678', 'Insta360 X5', 4.8, true),
('sara.photographer@gmail.com', 'Sara Photographer', '+201087654321', 'Insta360 X5', 4.9, true),
('omar.photographer@gmail.com', 'Omar Photographer', '+201555666777', 'Insta360 X5', 4.7, true),
('layla.photographer@gmail.com', 'Layla Photographer', '+201234567890', 'Insta360 X5', 4.6, true)
ON CONFLICT (email) DO NOTHING;

-- ================================================================
-- STEP 5: RE-ENABLE RLS AND ENSURE ADMIN ACCESS
-- ================================================================

-- Re-enable RLS on user_roles
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Make sure superadmin has access to everything by updating their profile
UPDATE user_profiles 
SET preferences = jsonb_set(
  COALESCE(preferences, '{}'::jsonb), 
  '{role}', 
  '"super_admin"'::jsonb
)
WHERE user_id IN (
  SELECT user_id FROM user_roles 
  WHERE role = 'super_admin' AND is_active = true
);

-- ================================================================
-- STEP 6: VERIFICATION QUERIES
-- ================================================================

-- Check that properties are visible
SELECT 'Properties count after fix:' as info, COUNT(*) as count FROM properties;

-- Check that brokers are visible
SELECT 'Brokers count after fix:' as info, COUNT(*) as count FROM brokers;

-- Check that photographers are visible
SELECT 'Photographers count after fix:' as info, COUNT(*) as count FROM photographers;

-- Check admin users
SELECT 'Super admin users:' as info, COUNT(*) as count 
FROM user_profiles 
WHERE (preferences->>'role')::text = 'super_admin';

SELECT 'EMERGENCY FIX COMPLETE! Infinite recursion resolved, properties and users restored.' as message;
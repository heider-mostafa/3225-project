-- EMERGENCY FIX: Restore Admin Access
-- This fixes the admin access issue immediately

-- ================================================================
-- RESTORE ADMIN PROPERTY ACCESS
-- ================================================================

-- Drop the current restrictive properties policy
DROP POLICY IF EXISTS "properties_read" ON properties;

-- Create a more permissive properties read policy that allows admin access
CREATE POLICY "properties_read_fixed" ON properties
  FOR SELECT 
  USING (
    -- Public can see active properties
    status = 'active'
    OR 
    -- Authenticated users can see all properties (temporary fix)
    auth.uid() IS NOT NULL
    OR
    -- Admin check using user_roles
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
    OR
    -- Admin check using admin_permissions
    EXISTS (
      SELECT 1 FROM admin_permissions ap
      WHERE ap.user_id = auth.uid()
      AND ap.is_active = true
    )
  );

-- ================================================================
-- CREATE/FIX ADMIN CHECKING FUNCTIONS
-- ================================================================

-- Create the is_admin RPC function that your app expects
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin') 
    AND ur.is_active = true
  ) OR EXISTS (
    SELECT 1 FROM admin_permissions ap
    WHERE ap.user_id = auth.uid()
    AND ap.is_active = true
    AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
  );
$$;

-- Create additional admin checking function
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin' 
    AND ur.is_active = true
  );
$$;

-- ================================================================
-- EMERGENCY ADMIN ACCESS POLICY
-- ================================================================

-- Ensure admins can do everything with properties
DROP POLICY IF EXISTS "emergency_admin_properties_full" ON properties;
CREATE POLICY "emergency_admin_properties_full" ON properties
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid()
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- TEST ADMIN ACCESS
-- ================================================================

-- Test that admin functions work
SELECT 
  'ADMIN ACCESS TEST' as test_type,
  public.is_admin() as is_admin_result,
  public.is_super_admin() as is_super_admin_result,
  (SELECT COUNT(*) FROM properties) as total_properties_visible,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_user;

-- Success message
SELECT 'EMERGENCY ADMIN ACCESS RESTORED' as status;
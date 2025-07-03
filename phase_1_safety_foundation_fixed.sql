-- PHASE 1: SAFETY FOUNDATION (FIXED)
-- This creates safety nets with unique function names to avoid conflicts

-- ================================================================
-- CHECK EXISTING FUNCTIONS FIRST
-- ================================================================

-- See what admin functions already exist
SELECT 
    routine_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND routine_name LIKE '%admin%'
ORDER BY routine_name;

-- ================================================================
-- SAFETY FUNCTIONS - Using unique names to avoid conflicts
-- ================================================================

-- Create a safe super admin check function with unique name
CREATE OR REPLACE FUNCTION public.is_super_admin_safe()
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
  ) OR EXISTS (
    SELECT 1 FROM admin_permissions ap
    WHERE ap.user_id = auth.uid()
    AND ap.is_active = true
    AND (ap.expires_at IS NULL OR ap.expires_at > NOW())
  );
$$;

-- Create a safe regular admin check function with unique name
CREATE OR REPLACE FUNCTION public.is_admin_safe()
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

-- Create optimized auth.uid() wrapper to reduce function calls
CREATE OR REPLACE FUNCTION public.get_current_user_id_safe()
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT auth.uid();
$$;

-- ================================================================
-- EMERGENCY RECOVERY FUNCTION
-- ================================================================

-- Emergency admin grant (use your actual email address)
CREATE OR REPLACE FUNCTION public.emergency_grant_admin_safe(target_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow if no other admins exist or called by existing admin
  IF NOT EXISTS (SELECT 1 FROM user_roles WHERE role IN ('admin', 'super_admin') AND is_active = true) 
     OR public.is_super_admin_safe() THEN
    
    -- Grant super admin role
    INSERT INTO user_roles (user_id, role, is_active, created_at)
    SELECT id, 'super_admin', true, NOW()
    FROM auth.users 
    WHERE email = target_email
    ON CONFLICT (user_id, role) 
    DO UPDATE SET is_active = true, updated_at = NOW();
    
    -- Also grant admin permissions as backup
    INSERT INTO admin_permissions (user_id, is_active, created_at)
    SELECT id, true, NOW()
    FROM auth.users 
    WHERE email = target_email
    ON CONFLICT (user_id) 
    DO UPDATE SET is_active = true, updated_at = NOW();
    
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- ================================================================
-- EMERGENCY PROPERTY ACCESS POLICY
-- ================================================================

-- Ensure properties are always accessible to admins (safety net)
DROP POLICY IF EXISTS "emergency_admin_properties_access" ON properties;
CREATE POLICY "emergency_admin_properties_access" ON properties
  FOR ALL 
  USING (public.is_admin_safe())
  WITH CHECK (public.is_admin_safe());

-- ================================================================
-- SAFETY TESTS
-- ================================================================

-- Test our safety functions work
SELECT 
  'SAFETY FUNCTION TEST' as test_name,
  public.is_admin_safe() as user_is_admin,
  public.is_super_admin_safe() as user_is_super_admin,
  public.get_current_user_id_safe() as current_user_id,
  (SELECT email FROM auth.users WHERE id = public.get_current_user_id_safe()) as current_email;

-- Show current admin status
SELECT 
  'CURRENT ADMIN STATUS' as check_type,
  (SELECT COUNT(*) FROM user_roles WHERE role IN ('admin', 'super_admin') AND is_active = true) as admin_role_count,
  (SELECT COUNT(*) FROM admin_permissions WHERE is_active = true) as admin_permission_count,
  (SELECT COUNT(*) FROM properties WHERE status = 'active') as active_properties;

-- Success message
SELECT 'Phase 1 Safety Foundation COMPLETED - Ready for optimization phases' as status;
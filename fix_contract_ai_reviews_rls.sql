-- =============================================================================
-- FIX: Contract AI Reviews RLS Performance and Multiple Policies
-- =============================================================================
-- 
-- ISSUES FIXED:
-- 1. Multiple Permissive Policies - Table has duplicate policies for same actions
-- 2. Auth RLS Initialization Plan - auth.uid() being re-evaluated for each row
--
-- SOLUTIONS:
-- 1. Remove duplicate policies and create single optimized policies per action
-- 2. Replace auth.uid() with (SELECT auth.uid()) for performance
-- 3. Use user_roles table instead of user_profiles for consistency
--
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DROP ALL EXISTING POLICIES
-- =============================================================================
-- Remove all existing policies to start clean and avoid duplicates

DROP POLICY IF EXISTS "Admin access to contract AI reviews" ON contract_ai_reviews;
DROP POLICY IF EXISTS "Admin access to contract ai reviews" ON contract_ai_reviews;
DROP POLICY IF EXISTS "Contract ai reviews admin access" ON contract_ai_reviews;
DROP POLICY IF EXISTS "Contract AI reviews admin access" ON contract_ai_reviews;

-- =============================================================================
-- 2. CREATE OPTIMIZED RLS POLICIES
-- =============================================================================
-- Create separate policies for each action (SELECT, INSERT, UPDATE, DELETE)
-- This provides better performance and granular control

-- SELECT Policy - Admin access for viewing contract AI reviews
CREATE POLICY "contract_ai_reviews_select_admin"
ON contract_ai_reviews
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- INSERT Policy - Admin access for creating contract AI reviews
CREATE POLICY "contract_ai_reviews_insert_admin"
ON contract_ai_reviews
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- UPDATE Policy - Admin access for updating contract AI reviews
CREATE POLICY "contract_ai_reviews_update_admin"
ON contract_ai_reviews
FOR UPDATE
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

-- DELETE Policy - Admin access for deleting contract AI reviews
CREATE POLICY "contract_ai_reviews_delete_admin"
ON contract_ai_reviews
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- =============================================================================
-- 3. OPTIONAL: CREATE SPECIALIST ACCESS POLICIES
-- =============================================================================
-- Allow specialists assigned to reviews to access their assigned reviews
-- This provides more granular access control

-- SELECT Policy - Specialists can view reviews assigned to them
CREATE POLICY "contract_ai_reviews_select_specialist"
ON contract_ai_reviews
FOR SELECT
TO authenticated
USING (
  specialist_assigned_to = (SELECT auth.uid())
);

-- UPDATE Policy - Specialists can update reviews assigned to them
CREATE POLICY "contract_ai_reviews_update_specialist"
ON contract_ai_reviews
FOR UPDATE
TO authenticated
USING (
  specialist_assigned_to = (SELECT auth.uid())
)
WITH CHECK (
  specialist_assigned_to = (SELECT auth.uid())
);

-- =============================================================================
-- 4. CREATE PERFORMANCE INDEXES
-- =============================================================================
-- Add indexes to support the RLS policies for better performance

-- Index for user_roles lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
ON user_roles(user_id, is_active) 
WHERE is_active = true;

-- Index for user_roles with role filtering
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role_active 
ON user_roles(user_id, role, is_active) 
WHERE is_active = true AND role IN ('admin', 'super_admin');

-- Index for specialist assignments
CREATE INDEX IF NOT EXISTS idx_contract_ai_reviews_specialist_assigned 
ON contract_ai_reviews(specialist_assigned_to) 
WHERE specialist_assigned_to IS NOT NULL;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify the fixes are applied correctly:

-- 1. Check all policies for contract_ai_reviews table
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as action,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'contract_ai_reviews'
ORDER BY cmd, policyname;

-- 2. Verify no duplicate policies exist
SELECT 
  cmd as action,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'contract_ai_reviews'
  AND permissive = 'PERMISSIVE'
GROUP BY cmd
HAVING COUNT(*) > 1;

-- 3. Check policy performance (look for auth function optimization)
SELECT 
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN '❌ NOT OPTIMIZED'
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ OPTIMIZED'
    ELSE '✓ NO AUTH FUNCTION'
  END as auth_optimization_status,
  qual as policy_condition
FROM pg_policies 
WHERE tablename = 'contract_ai_reviews'
ORDER BY policyname;

-- Expected results:
-- 1. Should show 6 policies total (4 admin + 2 specialist)
-- 2. Should show no duplicate policies (empty result)
-- 3. All policies should show OPTIMIZED status
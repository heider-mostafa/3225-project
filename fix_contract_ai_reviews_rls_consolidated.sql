-- =============================================================================
-- FIX: Contract AI Reviews RLS - Consolidated Single Policy Per Action
-- =============================================================================
-- 
-- ISSUES FIXED:
-- 1. Multiple Permissive Policies - Consolidate admin + specialist into single policy
-- 2. Duplicate Index - Remove duplicate user_roles indexes
--
-- SOLUTIONS:
-- 1. Create single policy per action that handles both admin and specialist access
-- 2. Remove duplicate indexes on user_roles table
--
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. DROP ALL EXISTING POLICIES
-- =============================================================================
-- Remove all existing policies to start clean

DROP POLICY IF EXISTS "contract_ai_reviews_select_admin" ON contract_ai_reviews;
DROP POLICY IF EXISTS "contract_ai_reviews_insert_admin" ON contract_ai_reviews;
DROP POLICY IF EXISTS "contract_ai_reviews_update_admin" ON contract_ai_reviews;
DROP POLICY IF EXISTS "contract_ai_reviews_delete_admin" ON contract_ai_reviews;
DROP POLICY IF EXISTS "contract_ai_reviews_select_specialist" ON contract_ai_reviews;
DROP POLICY IF EXISTS "contract_ai_reviews_update_specialist" ON contract_ai_reviews;

-- =============================================================================
-- 2. CREATE CONSOLIDATED SINGLE POLICIES PER ACTION
-- =============================================================================
-- Each action has ONE policy that handles both admin and specialist access

-- SELECT Policy - Combined admin and specialist access
CREATE POLICY "contract_ai_reviews_select"
ON contract_ai_reviews
FOR SELECT
TO authenticated
USING (
  -- Admin access OR specialist assigned to this review
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
  OR specialist_assigned_to = (SELECT auth.uid())
);

-- INSERT Policy - Admin access only (specialists don't create reviews)
CREATE POLICY "contract_ai_reviews_insert"
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

-- UPDATE Policy - Combined admin and specialist access
CREATE POLICY "contract_ai_reviews_update"
ON contract_ai_reviews
FOR UPDATE
TO authenticated
USING (
  -- Admin access OR specialist assigned to this review
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
  OR specialist_assigned_to = (SELECT auth.uid())
)
WITH CHECK (
  -- Same conditions for WITH CHECK
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = (SELECT auth.uid())
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
  OR specialist_assigned_to = (SELECT auth.uid())
);

-- DELETE Policy - Admin access only (specialists can't delete reviews)
CREATE POLICY "contract_ai_reviews_delete"
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
-- 3. FIX DUPLICATE INDEX ISSUE
-- =============================================================================
-- Remove duplicate indexes on user_roles table

-- Check which indexes exist and drop duplicates
-- We'll keep the more specific one and drop the general one

-- Drop the less specific duplicate index
DROP INDEX IF EXISTS idx_user_roles_user_active;

-- Keep the more specific one: idx_user_roles_user_id_active
-- This index should already exist, but create it if it doesn't
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id_active 
ON user_roles(user_id, is_active) 
WHERE is_active = true;

-- Also drop the role-specific index if it exists (we created it in the previous script)
DROP INDEX IF EXISTS idx_user_roles_user_role_active;

-- =============================================================================
-- 4. OPTIMIZE REMAINING INDEXES
-- =============================================================================
-- Ensure we have the right indexes for performance

-- Keep the specialist assignment index
CREATE INDEX IF NOT EXISTS idx_contract_ai_reviews_specialist_assigned 
ON contract_ai_reviews(specialist_assigned_to) 
WHERE specialist_assigned_to IS NOT NULL;

-- Keep the contract_id index for joins
CREATE INDEX IF NOT EXISTS idx_contract_ai_reviews_contract_id 
ON contract_ai_reviews(contract_id);

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify the fixes are applied correctly:

-- 1. Check policies - should show exactly 4 policies (one per action)
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as action
FROM pg_policies 
WHERE tablename = 'contract_ai_reviews'
ORDER BY cmd, policyname;

-- 2. Verify no duplicate policies exist for any action
SELECT 
  cmd as action,
  COUNT(*) as policy_count,
  string_agg(policyname, ', ') as policy_names
FROM pg_policies 
WHERE tablename = 'contract_ai_reviews'
  AND permissive = 'PERMISSIVE'
  AND roles = '{authenticated}'
GROUP BY cmd
ORDER BY cmd;

-- 3. Check for duplicate indexes on user_roles
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'user_roles'
  AND indexname LIKE '%user%'
ORDER BY indexname;

-- 4. Verify auth function optimization
SELECT 
  policyname,
  CASE 
    WHEN qual LIKE '%auth.uid()%' AND qual NOT LIKE '%(SELECT auth.uid())%' THEN '❌ NOT OPTIMIZED'
    WHEN qual LIKE '%(SELECT auth.uid())%' THEN '✅ OPTIMIZED'
    ELSE '✓ NO AUTH FUNCTION'
  END as auth_optimization_status
FROM pg_policies 
WHERE tablename = 'contract_ai_reviews'
ORDER BY policyname;

-- Expected results:
-- 1. Should show exactly 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- 2. Each action should have policy_count = 1 (no duplicates)
-- 3. Should show no duplicate user_roles indexes
-- 4. All policies should show OPTIMIZED status
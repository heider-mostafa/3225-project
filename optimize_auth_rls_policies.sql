-- Optimize RLS policies by replacing auth.<function>() with (SELECT auth.<function>())
-- This prevents re-evaluation of auth functions for each row

-- =============================================
-- CONTRACT_TEMPLATES TABLE
-- =============================================

-- Drop and recreate the admin policy with optimized auth function
DROP POLICY IF EXISTS "Admin access to contract templates" ON contract_templates;
CREATE POLICY "Admin access to contract templates"
ON contract_templates
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

-- =============================================
-- LEAD_CONTRACTS TABLE
-- =============================================

-- Find and update lead_contracts policies
DROP POLICY IF EXISTS "Admin access to lead contracts" ON lead_contracts;
DROP POLICY IF EXISTS "Lead contracts admin access" ON lead_contracts;
CREATE POLICY "Lead contracts admin access"
ON lead_contracts
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

-- =============================================
-- CONTRACT_AI_REVIEWS TABLE
-- =============================================

-- Find and update contract_ai_reviews policies
DROP POLICY IF EXISTS "Admin access to contract ai reviews" ON contract_ai_reviews;
DROP POLICY IF EXISTS "Contract ai reviews admin access" ON contract_ai_reviews;
CREATE POLICY "Contract ai reviews admin access"
ON contract_ai_reviews
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

-- =============================================
-- CONTRACT_SIGNATURES TABLE
-- =============================================

-- Find and update contract_signatures policies
DROP POLICY IF EXISTS "Admin access to contract signatures" ON contract_signatures;
DROP POLICY IF EXISTS "Contract signatures admin access" ON contract_signatures;
CREATE POLICY "Contract signatures admin access"
ON contract_signatures
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

-- =============================================
-- CONTRACT_NOTIFICATIONS TABLE
-- =============================================

-- Find and update contract_notifications policies
DROP POLICY IF EXISTS "Admin access to contract notifications" ON contract_notifications;
DROP POLICY IF EXISTS "Contract notifications admin access" ON contract_notifications;
CREATE POLICY "Contract notifications admin access"
ON contract_notifications
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

-- =============================================
-- VERIFICATION QUERY
-- =============================================

-- Show all policies for these tables to verify the changes
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('contract_templates', 'lead_contracts', 'contract_ai_reviews', 'contract_signatures', 'contract_notifications')
ORDER BY tablename, policyname;
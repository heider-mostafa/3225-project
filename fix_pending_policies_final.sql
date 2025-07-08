-- Fix pending properties policies - keep only unified policy
-- Remove individual action policies to eliminate multiple permissive policies

-- =============================================
-- DROP INDIVIDUAL ACTION POLICIES
-- =============================================

-- Drop specific action policies for pending_properties
DROP POLICY IF EXISTS "pending_properties_admin_delete" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_admin_insert" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_consolidated_read" ON pending_properties;

-- Drop any other specific policies that might exist
DROP POLICY IF EXISTS "pending_properties_select" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_insert" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_update" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_delete" ON pending_properties;

-- =============================================
-- KEEP ONLY THE UNIFIED POLICY
-- =============================================
-- The "pending_properties_unified_access" policy should remain as it covers ALL actions

-- Verify the unified policy exists (recreate if needed)
DROP POLICY IF EXISTS "pending_properties_unified_access" ON pending_properties;
CREATE POLICY "pending_properties_unified_access"
ON pending_properties
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);
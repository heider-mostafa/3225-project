-- Fix RLS performance issues for pending properties tables
-- 1. Remove duplicate permissive policies 
-- 2. Optimize auth function calls for better performance

-- =============================================
-- PENDING_PROPERTIES TABLE - FIX POLICIES
-- =============================================

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "pending_properties_admin_only" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_service_role" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_admin_delete" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_admin_insert" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_consolidated_read" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_select" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_insert" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_update" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_delete" ON pending_properties;

-- Create single optimized admin policy with proper auth function usage
CREATE POLICY "pending_properties_admin_access"
ON pending_properties
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

-- Service role access for API operations
CREATE POLICY "pending_properties_service_access"
ON pending_properties
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- PENDING_PROPERTY_PHOTOS TABLE - FIX POLICIES
-- =============================================

-- Drop ALL existing policies to start clean
DROP POLICY IF EXISTS "pending_property_photos_admin_only" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_service_role" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_insert_optimized" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_select" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_insert" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_update" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_delete" ON pending_property_photos;

-- Create single optimized admin policy with proper auth function usage
CREATE POLICY "pending_property_photos_admin_access"
ON pending_property_photos
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

-- Service role access for API operations
CREATE POLICY "pending_property_photos_service_access"
ON pending_property_photos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
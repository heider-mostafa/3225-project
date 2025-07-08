-- Keep only admin-specific policies for pending properties tables
-- Remove broad permissive policies to maintain security

-- =============================================
-- PENDING_PROPERTIES TABLE - REMOVE PERMISSIVE POLICIES
-- =============================================

-- Drop broad permissive policies
DROP POLICY IF EXISTS "pending_properties_unified_access" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_all_access" ON pending_properties;
DROP POLICY IF EXISTS "Allow all operations on pending_properties_simple" ON pending_properties;

-- Keep/Create admin-only policies
DROP POLICY IF EXISTS "pending_properties_admin_only" ON pending_properties;
CREATE POLICY "pending_properties_admin_only"
ON pending_properties
FOR ALL
TO authenticated
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

-- Service role access for API operations
DROP POLICY IF EXISTS "pending_properties_service_role" ON pending_properties;
CREATE POLICY "pending_properties_service_role"
ON pending_properties
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- =============================================
-- PENDING_PROPERTY_PHOTOS TABLE - REMOVE PERMISSIVE POLICIES
-- =============================================

-- Drop broad permissive policies
DROP POLICY IF EXISTS "pending_property_photos_unified_access" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_all_access" ON pending_property_photos;
DROP POLICY IF EXISTS "Allow all operations on pending_property_photos_simple" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_insert_optimized" ON pending_property_photos;

-- Keep/Create admin-only policies
DROP POLICY IF EXISTS "pending_property_photos_admin_only" ON pending_property_photos;
CREATE POLICY "pending_property_photos_admin_only"
ON pending_property_photos
FOR ALL
TO authenticated
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

-- Service role access for API operations
DROP POLICY IF EXISTS "pending_property_photos_service_role" ON pending_property_photos;
CREATE POLICY "pending_property_photos_service_role"
ON pending_property_photos
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
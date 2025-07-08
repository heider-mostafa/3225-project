-- Clean up all duplicate policies for pending properties tables
-- Keep only one unified policy per table to fix performance warnings

-- =============================================
-- PENDING_PROPERTIES TABLE - DROP ALL EXISTING POLICIES
-- =============================================

DROP POLICY IF EXISTS "pending_properties_admin_delete" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_admin_insert" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_consolidated_read" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_unified_access" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_select" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_insert" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_update" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_delete" ON pending_properties;

-- =============================================
-- PENDING_PROPERTY_PHOTOS TABLE - DROP ALL EXISTING POLICIES
-- =============================================

DROP POLICY IF EXISTS "pending_property_photos_insert_optimized" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_unified_access" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_select" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_insert" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_update" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_delete" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_admin_access" ON pending_property_photos;

-- =============================================
-- CREATE SINGLE UNIFIED POLICIES
-- =============================================

-- Single policy for pending_properties (all actions, all roles)
CREATE POLICY "pending_properties_all_access"
ON pending_properties
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);

-- Single policy for pending_property_photos (all actions, all roles)
CREATE POLICY "pending_property_photos_all_access"
ON pending_property_photos
FOR ALL
TO anon, authenticated, service_role
USING (true)
WITH CHECK (true);
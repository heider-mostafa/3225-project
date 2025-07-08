-- Consolidate RLS policies for pending properties tables
-- Remove duplicate permissive policies to fix performance warnings

-- =============================================
-- DROP ALL EXISTING POLICIES
-- =============================================

-- Drop all existing policies on pending_properties
DROP POLICY IF EXISTS "Allow all operations on pending_properties_simple" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_admin_update" ON pending_properties;
DROP POLICY IF EXISTS "Allow admin access to pending_properties" ON pending_properties;
DROP POLICY IF EXISTS "Allow service role full access to pending_properties" ON pending_properties;
DROP POLICY IF EXISTS "Allow authenticated admin access to pending_properties" ON pending_properties;
DROP POLICY IF EXISTS "Photographers can view their own pending properties" ON pending_properties;

-- Drop all existing policies on pending_property_photos  
DROP POLICY IF EXISTS "Allow all operations on pending_property_photos_simple" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_delete_optimized" ON pending_property_photos;
DROP POLICY IF EXISTS "Allow admin access to pending_property_photos" ON pending_property_photos;
DROP POLICY IF EXISTS "Allow service role full access to pending_property_photos" ON pending_property_photos;
DROP POLICY IF EXISTS "Allow authenticated admin access to pending_property_photos" ON pending_property_photos;
DROP POLICY IF EXISTS "Photographers can view their own pending property photos" ON pending_property_photos;

-- =============================================
-- CREATE SINGLE OPTIMIZED POLICIES
-- =============================================

-- Single policy for pending_properties (covers all roles and actions)
CREATE POLICY "pending_properties_unified_access"
ON pending_properties
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- Single policy for pending_property_photos (covers all roles and actions)
CREATE POLICY "pending_property_photos_unified_access"
ON pending_property_photos
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);
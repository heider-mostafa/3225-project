-- Remove remaining duplicate policies that are causing multiple permissive policy errors

-- =============================================
-- DROP ALL REMAINING DUPLICATE POLICIES
-- =============================================

-- For pending_property_photos - remove the conflicting policy
DROP POLICY IF EXISTS "pending_property_photos_update_optimized" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_select_optimized" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_insert_optimized" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_delete_optimized" ON pending_property_photos;

-- For pending_properties - remove any remaining conflicting policies
DROP POLICY IF EXISTS "pending_properties_update_optimized" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_select_optimized" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_insert_optimized" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_delete_optimized" ON pending_properties;

-- Remove any other variations that might exist
DROP POLICY IF EXISTS "pending_property_photos_authenticated_update" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_authenticated_select" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_properties_authenticated_update" ON pending_properties;
DROP POLICY IF EXISTS "pending_properties_authenticated_select" ON pending_properties;

-- List all policies to verify (this will show in the output)
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('pending_properties', 'pending_property_photos')
ORDER BY tablename, policyname;
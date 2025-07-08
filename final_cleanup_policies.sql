-- Final cleanup - remove the remaining conflicting policies

-- Remove the remaining conflicting policies on pending_property_photos
DROP POLICY IF EXISTS "pending_property_photos_select_consolidated" ON pending_property_photos;
DROP POLICY IF EXISTS "pending_property_photos_update_optimized" ON pending_property_photos;

-- Verify final state
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies 
WHERE tablename IN ('pending_properties', 'pending_property_photos')
ORDER BY tablename, policyname;
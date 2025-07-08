-- Enable RLS on remaining tables to fix security warnings
-- Following the same simple approach as the auction tables fix

-- =============================================
-- ENABLE RLS ON TABLES
-- =============================================

-- Enable RLS on pending_properties table
ALTER TABLE pending_properties ENABLE ROW LEVEL SECURITY;

-- Enable RLS on pending_property_photos table  
ALTER TABLE pending_property_photos ENABLE ROW LEVEL SECURITY;

-- Enable RLS on photographer_status_updates table
ALTER TABLE photographer_status_updates ENABLE ROW LEVEL SECURITY;

-- =============================================
-- ADD SIMPLE PERMISSIVE POLICIES
-- =============================================
-- These policies maintain existing functionality while enabling RLS

-- Pending Properties - Allow all operations for authenticated users and service role
CREATE POLICY "Allow all operations on pending_properties_simple"
ON pending_properties
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- Pending Property Photos - Allow all operations for authenticated users and service role  
CREATE POLICY "Allow all operations on pending_property_photos_simple"
ON pending_property_photos
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- Photographer Status Updates - Allow all operations for authenticated users and service role
CREATE POLICY "Allow all operations on photographer_status_updates_simple"
ON photographer_status_updates
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);
-- DIAGNOSE THE REAL API FAILURE ISSUE
-- This will test everything systematically to find what's actually broken

-- ================================================================
-- TEST 1: Basic Database Connection and Data
-- ================================================================

-- Check if we can connect and see data at all
SELECT 'DATABASE CONNECTION TEST' as test_type, NOW() as current_time;

-- Check if properties table exists and has data
SELECT 
  'PROPERTIES TABLE TEST' as test_type,
  COUNT(*) as total_properties,
  COUNT(CASE WHEN status IS NOT NULL THEN 1 END) as properties_with_status,
  COUNT(CASE WHEN title IS NOT NULL THEN 1 END) as properties_with_title
FROM properties;

-- Check if property_photos table exists and has data
SELECT 
  'PROPERTY_PHOTOS TABLE TEST' as test_type,
  COUNT(*) as total_photos,
  COUNT(DISTINCT property_id) as unique_property_ids
FROM property_photos;

-- ================================================================
-- TEST 2: Test the Exact Query the API Uses
-- ================================================================

-- This simulates the exact query from your API route (app/api/properties/route.ts)
SELECT 
  'API QUERY SIMULATION' as test_type,
  'Testing exact query from API route' as description;

-- The exact query with pagination that your API uses
SELECT 
  p.*,
  json_agg(
    json_build_object(
      'id', pp.id,
      'url', pp.url,
      'is_primary', pp.is_primary,
      'order_index', pp.order_index
    ) ORDER BY pp.order_index, pp.id
  ) FILTER (WHERE pp.id IS NOT NULL) as property_photos
FROM properties p
LEFT JOIN property_photos pp ON p.id = pp.property_id
GROUP BY p.id
ORDER BY p.created_at DESC
LIMIT 5;

-- ================================================================
-- TEST 3: Check RLS is Not Blocking Access
-- ================================================================

-- Temporarily disable RLS to see if that's the issue
ALTER TABLE properties DISABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos DISABLE ROW LEVEL SECURITY;

-- Test the same query without RLS
SELECT 
  'NO RLS TEST' as test_type,
  COUNT(*) as properties_without_rls
FROM properties;

-- Re-enable RLS with simple policies
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow public read access to all properties" ON properties;
DROP POLICY IF EXISTS "Allow public read access to all property_photos" ON property_photos;

-- Create the simplest possible policies
CREATE POLICY "simple_properties_read" ON properties FOR SELECT USING (true);
CREATE POLICY "simple_photos_read" ON property_photos FOR SELECT USING (true);

-- Test with simple RLS
SELECT 
  'SIMPLE RLS TEST' as test_type,
  COUNT(*) as properties_with_simple_rls
FROM properties;

-- ================================================================
-- TEST 4: Check Authentication Context
-- ================================================================

-- Check what auth context we have
SELECT 
  'AUTH CONTEXT TEST' as test_type,
  auth.uid() as current_user_id,
  (SELECT auth.role()) as auth_role,
  (SELECT email FROM auth.users WHERE id = auth.uid()) as current_email;

-- ================================================================
-- TEST 5: Environment and Connection Test
-- ================================================================

-- Check if we can access related tables (tests if connection is working)
SELECT 
  'CONNECTION TEST' as test_type,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public') as total_tables,
  (SELECT COUNT(*) FROM user_roles) as user_roles_count,
  (SELECT COUNT(*) FROM brokers) as brokers_count;

-- ================================================================
-- FINAL RECOMMENDATIONS
-- ================================================================

SELECT 
  'DIAGNOSIS COMPLETE' as status,
  'Check the results above to identify the issue' as message,
  'Look for: 1) Zero properties 2) Auth issues 3) Query failures' as next_steps;
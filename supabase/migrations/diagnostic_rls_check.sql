-- Diagnostic RLS Check
-- Run this to see what RLS policies exist and might be causing issues

-- Check properties table policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies 
WHERE tablename IN ('properties', 'property_photos', 'user_profiles', 'profiles', 'saved_properties')
ORDER BY tablename, policyname;

-- Check if properties table has RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename IN ('properties', 'property_photos', 'user_profiles', 'profiles', 'saved_properties')
AND schemaname = 'public';

-- Check current user authentication (this would show null if not authenticated)
SELECT auth.uid() as current_user_id;

-- Test basic property access
SELECT COUNT(*) as property_count FROM properties LIMIT 1; 
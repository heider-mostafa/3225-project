-- Fix Properties Access Issues
-- This ensures that properties and related data are publicly accessible

-- Set explicit search path for this migration
SET search_path = 'public';

-- Properties should be publicly readable
DROP POLICY IF EXISTS "Allow public read access to properties" ON properties;
CREATE POLICY "Allow public read access to properties" ON properties
  FOR SELECT USING (true);

-- Property photos should be publicly readable
DROP POLICY IF EXISTS "Allow public read access to property_photos" ON property_photos;
CREATE POLICY "Allow public read access to property_photos" ON property_photos
  FOR SELECT USING (true);

-- Property documents should be publicly readable (if table exists)
DROP POLICY IF EXISTS "Allow public read access to property_documents" ON property_documents;
CREATE POLICY "Allow public read access to property_documents" ON property_documents
  FOR SELECT USING (true);

-- Property videos should be publicly readable (if table exists)
DROP POLICY IF EXISTS "Allow public read access to property_videos" ON property_videos;
CREATE POLICY "Allow public read access to property_videos" ON property_videos
  FOR SELECT USING (true);

-- Allow admins to manage properties
DROP POLICY IF EXISTS "Allow admins to manage properties" ON properties;
CREATE POLICY "Allow admins to manage properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Allow admins to manage property photos
DROP POLICY IF EXISTS "Allow admins to manage property_photos" ON property_photos;
CREATE POLICY "Allow admins to manage property_photos" ON property_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Reset search path
RESET search_path; 
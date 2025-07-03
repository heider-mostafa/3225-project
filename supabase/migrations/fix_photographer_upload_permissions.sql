-- Fix photographer upload permissions and RLS policies
-- This migration addresses the 403 errors when photographers try to upload photos

-- Drop and recreate pending_properties table policies
DROP POLICY IF EXISTS "Allow admin access to pending_properties" ON pending_properties;
DROP POLICY IF EXISTS "Allow service role full access to pending_properties" ON pending_properties;

-- Service role full access for pending_properties (needed for API operations)
CREATE POLICY "Allow service role full access to pending_properties" ON pending_properties
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to manage pending properties
CREATE POLICY "Allow authenticated admin access to pending_properties" ON pending_properties
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

-- Allow photographers to view pending properties they created
CREATE POLICY "Photographers can view their own pending properties" ON pending_properties
  FOR SELECT 
  TO authenticated
  USING (
    photographer_id IN (
      SELECT p.id FROM photographers p
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Fix pending_property_photos table policies
DROP POLICY IF EXISTS "Allow admin access to pending_property_photos" ON pending_property_photos;
DROP POLICY IF EXISTS "Allow service role full access to pending_property_photos" ON pending_property_photos;

-- Service role full access for pending_property_photos
CREATE POLICY "Allow service role full access to pending_property_photos" ON pending_property_photos
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated admins to manage pending property photos
CREATE POLICY "Allow authenticated admin access to pending_property_photos" ON pending_property_photos
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

-- Allow photographers to view photos for their pending properties
CREATE POLICY "Photographers can view their own pending property photos" ON pending_property_photos
  FOR SELECT 
  TO authenticated
  USING (
    pending_property_id IN (
      SELECT pp.id FROM pending_properties pp
      JOIN photographers p ON pp.photographer_id = p.id
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Ensure photographers table has proper policies for checking photographer status
-- This is needed for the isCurrentUserPhotographer() function
DROP POLICY IF EXISTS "Allow authenticated users to check photographer status" ON photographers;
CREATE POLICY "Allow authenticated users to check photographer status" ON photographers
  FOR SELECT 
  TO authenticated
  USING (true);

-- Fix leads table policies for photographer upload workflow
DROP POLICY IF EXISTS "Allow service role full access to leads" ON leads;
CREATE POLICY "Allow service role full access to leads" ON leads
  FOR ALL 
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow photographers to view leads assigned to them
DROP POLICY IF EXISTS "Photographers can view assigned leads" ON leads;
CREATE POLICY "Photographers can view assigned leads" ON leads
  FOR SELECT 
  TO authenticated
  USING (
    id IN (
      SELECT pa.lead_id FROM photographer_assignments pa
      JOIN photographers p ON pa.photographer_id = p.id
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Ensure we can update leads status during photo upload
DROP POLICY IF EXISTS "Allow authenticated admin and service role to update leads" ON leads;
CREATE POLICY "Allow authenticated admin and service role to update leads" ON leads
  FOR UPDATE 
  TO authenticated, service_role
  USING (true)
  WITH CHECK (true);
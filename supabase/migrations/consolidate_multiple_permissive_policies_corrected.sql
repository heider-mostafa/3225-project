-- Consolidate Multiple Permissive Policies (CORRECTED)
-- This migration combines multiple permissive policies for the same role and action
-- into single comprehensive policies to improve query performance.

-- Set explicit search path for this migration
SET search_path = 'public';

-- Consolidate saved_properties policies
-- Remove duplicate SELECT policies
DROP POLICY IF EXISTS "Users can view their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can view their own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can manage their own saved properties" ON saved_properties;

-- Create single comprehensive policy for SELECT
CREATE POLICY "Users can view and manage their saved properties" ON saved_properties
  FOR SELECT USING (user_id = (select auth.uid()));

-- Remove duplicate INSERT and DELETE policies and keep manage policy
DROP POLICY IF EXISTS "Users can insert their own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can delete their own saved properties" ON saved_properties;

-- Create comprehensive management policies
CREATE POLICY "Users can manage their saved properties" ON saved_properties
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

CREATE POLICY "Users can delete their saved properties" ON saved_properties
  FOR DELETE USING (user_id = (select auth.uid()));

-- Consolidate admin_permissions policies
-- Remove overlapping policies and create comprehensive ones
DROP POLICY IF EXISTS "Users can view their own permissions" ON admin_permissions;
DROP POLICY IF EXISTS "Admins can view all permissions" ON admin_permissions;

CREATE POLICY "Comprehensive admin permissions access" ON admin_permissions
  FOR SELECT USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate broker_availability policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Allow brokers to manage their own availability" ON broker_availability;
DROP POLICY IF EXISTS "Allow admins to manage all availability" ON broker_availability;
DROP POLICY IF EXISTS "Allow public read access to broker availability" ON broker_availability;

-- Create comprehensive policies
CREATE POLICY "Comprehensive broker availability read" ON broker_availability
  FOR SELECT USING (true); -- Public read access

CREATE POLICY "Comprehensive broker availability management" ON broker_availability
  FOR ALL USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate broker_schedules policies
-- Remove duplicate policies
DROP POLICY IF EXISTS "Allow brokers to manage their own schedules" ON broker_schedules;
DROP POLICY IF EXISTS "Allow public read access to broker schedules" ON broker_schedules;

-- Create comprehensive policies
CREATE POLICY "Comprehensive broker schedules read" ON broker_schedules
  FOR SELECT USING (true); -- Public read access

CREATE POLICY "Comprehensive broker schedules management" ON broker_schedules
  FOR ALL USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate email_analytics policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Admins can view all email analytics" ON email_analytics;
DROP POLICY IF EXISTS "Users can view their own email analytics" ON email_analytics;

CREATE POLICY "Comprehensive email analytics access" ON email_analytics
  FOR SELECT USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate email_suppressions policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Admins can manage email suppressions" ON email_suppressions;
DROP POLICY IF EXISTS "Users can suppress their own email" ON email_suppressions;

CREATE POLICY "Comprehensive email suppressions management" ON email_suppressions
  FOR ALL USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate email_templates policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
DROP POLICY IF EXISTS "Users can view active email templates" ON email_templates;

CREATE POLICY "Comprehensive email templates access" ON email_templates
  FOR SELECT USING (
    (is_active = true AND (select auth.uid()) IS NOT NULL) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Comprehensive email templates management" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate property_brokers policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Allow admins to manage property broker assignments" ON property_brokers;
DROP POLICY IF EXISTS "Allow public read access to property brokers" ON property_brokers;

CREATE POLICY "Comprehensive property brokers read" ON property_brokers
  FOR SELECT USING (true); -- Public read access

CREATE POLICY "Comprehensive property brokers management" ON property_brokers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate property_viewings policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Allow users to read their own viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow brokers to read their assigned viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow brokers to update their viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow admins to manage all viewings" ON property_viewings;
DROP POLICY IF EXISTS "Allow public insert for new viewings" ON property_viewings;

-- Create comprehensive policies
CREATE POLICY "Comprehensive property viewings read" ON property_viewings
  FOR SELECT USING (
    user_id = (select auth.uid()) OR
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Comprehensive property viewings insert" ON property_viewings
  FOR INSERT WITH CHECK (true); -- Allow public insert for new viewings

CREATE POLICY "Comprehensive property viewings update" ON property_viewings
  FOR UPDATE USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

CREATE POLICY "Comprehensive property viewings delete" ON property_viewings
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate saved_searches policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can manage their own saved searches" ON saved_searches;

CREATE POLICY "Comprehensive saved searches management" ON saved_searches
  FOR ALL USING (user_id = (select auth.uid()));

-- Consolidate user_activity_log policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
DROP POLICY IF EXISTS "Admins can view all user activity" ON user_activity_log;

CREATE POLICY "Comprehensive user activity log access" ON user_activity_log
  FOR SELECT USING (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Consolidate user_profiles policies
-- Remove overlapping policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;

CREATE POLICY "Comprehensive user profiles read" ON user_profiles
  FOR SELECT USING (
    id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Keep separate INSERT and UPDATE policies as they have different logic
-- No changes needed for these as they don't have multiple permissive policies for same action

-- Reset search path
RESET search_path; 
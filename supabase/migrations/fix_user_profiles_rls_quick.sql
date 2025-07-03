-- Quick Fix for User Profiles RLS Issues
-- This fixes the RLS policies for user_profiles table to use the correct column names

-- Set explicit search path for this migration
SET search_path = 'public';

-- Fix user_profiles policies - use user_id instead of id
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- Also fix profiles table policies if they exist - ensure these work for the auth profile
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = (select auth.uid()));

-- Allow users to upsert their own user_profiles
DROP POLICY IF EXISTS "Users can upsert their own profile" ON user_profiles;
CREATE POLICY "Users can upsert their own profile" ON user_profiles
  FOR ALL USING (user_id = (select auth.uid()));

-- Reset search path
RESET search_path; 
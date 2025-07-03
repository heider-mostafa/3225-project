-- Fix infinite recursion in user_roles policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "user_roles_select_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_insert_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_update_policy" ON user_roles;
DROP POLICY IF EXISTS "user_roles_delete_policy" ON user_roles;

-- Create safe, non-recursive policies for user_roles
-- Allow super_admin to do everything
CREATE POLICY "super_admin_full_access" ON user_roles
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'mostafa.heider@umontreal.ca'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'mostafa.heider@umontreal.ca'
    )
  );

-- Allow users to view their own roles
CREATE POLICY "users_view_own_roles" ON user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Allow service role to do everything
CREATE POLICY "service_role_full_access" ON user_roles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Also fix brokers table policies to prevent cascading issues
DROP POLICY IF EXISTS "brokers_select_policy" ON brokers;
DROP POLICY IF EXISTS "brokers_insert_policy" ON brokers;
DROP POLICY IF EXISTS "brokers_update_policy" ON brokers;
DROP POLICY IF EXISTS "brokers_delete_policy" ON brokers;

-- Create safe policies for brokers
CREATE POLICY "super_admin_brokers_full_access" ON brokers
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'mostafa.heider@umontreal.ca'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND auth.users.email = 'mostafa.heider@umontreal.ca'
    )
  );

-- Allow service role to access brokers
CREATE POLICY "service_role_brokers_full_access" ON brokers
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow public read access to brokers for now (can be restricted later)
CREATE POLICY "public_brokers_read" ON brokers
  FOR SELECT
  TO authenticated
  USING (true); 
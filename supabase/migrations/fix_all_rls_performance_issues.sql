-- Fix ALL RLS performance issues by wrapping auth functions in subqueries
-- This prevents auth functions from being re-evaluated for each row

-- ================================================================
-- CALL LOGS TABLE
-- ================================================================
DROP POLICY IF EXISTS "Users can view call logs" ON call_logs;
CREATE POLICY "Users can view call logs" ON call_logs
  FOR SELECT USING ((SELECT auth.role()) = 'authenticated');

DROP POLICY IF EXISTS "Service role can manage call logs" ON call_logs;
CREATE POLICY "Service role can manage call logs" ON call_logs
  FOR ALL USING ((SELECT auth.role()) = 'service_role');

-- ================================================================
-- ADMIN ACTIVITY LOG TABLE
-- ================================================================
DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
CREATE POLICY "Admins can view activity log" ON admin_activity_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- USER ROLES TABLE
-- ================================================================
DROP POLICY IF EXISTS "Users can view their own roles" ON user_roles;
CREATE POLICY "Users can view their own roles" ON user_roles
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all roles" ON user_roles;
CREATE POLICY "Admins can view all roles" ON user_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

DROP POLICY IF EXISTS "Super admins can manage roles" ON user_roles;
CREATE POLICY "Super admins can manage roles" ON user_roles
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- ADMIN PERMISSIONS TABLE
-- ================================================================
DROP POLICY IF EXISTS "Users can view their own permissions" ON admin_permissions;
CREATE POLICY "Users can view their own permissions" ON admin_permissions
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

DROP POLICY IF EXISTS "Admins can view all permissions" ON admin_permissions;
CREATE POLICY "Admins can view all permissions" ON admin_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- SAVED PROPERTIES TABLE
-- ================================================================
DROP POLICY IF EXISTS "saved_properties_select_policy" ON saved_properties;
CREATE POLICY "saved_properties_select_policy" ON saved_properties
  FOR SELECT 
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "saved_properties_insert_policy" ON saved_properties;
CREATE POLICY "saved_properties_insert_policy" ON saved_properties
  FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "saved_properties_update_policy" ON saved_properties;
CREATE POLICY "saved_properties_update_policy" ON saved_properties
  FOR UPDATE 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "saved_properties_delete_policy" ON saved_properties;
CREATE POLICY "saved_properties_delete_policy" ON saved_properties
  FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- ================================================================
-- PROPERTIES TABLE - Fix admin policies
-- ================================================================
DROP POLICY IF EXISTS "Allow admins to manage properties" ON properties;
CREATE POLICY "Allow admins to manage properties" ON properties
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (SELECT auth.uid())
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- ================================================================
-- PROPERTY PHOTOS TABLE - Fix admin policies
-- ================================================================
DROP POLICY IF EXISTS "Allow admins to manage property_photos" ON property_photos;
CREATE POLICY "Allow admins to manage property_photos" ON property_photos
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (SELECT auth.uid())
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > NOW())
    )
  );

-- ================================================================
-- BROKERS TABLE
-- ================================================================
DROP POLICY IF EXISTS "Allow brokers to update their own profile" ON brokers;
CREATE POLICY "Allow brokers to update their own profile" ON brokers
  FOR UPDATE
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS "Allow admins to manage brokers" ON brokers;
CREATE POLICY "Allow admins to manage brokers" ON brokers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- BROKER AVAILABILITY TABLE
-- ================================================================
DROP POLICY IF EXISTS "Allow brokers to manage their own availability" ON broker_availability;
CREATE POLICY "Allow brokers to manage their own availability" ON broker_availability
  FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow admins to manage all availability" ON broker_availability;
CREATE POLICY "Allow admins to manage all availability" ON broker_availability
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- PROPERTY BROKERS TABLE
-- ================================================================
DROP POLICY IF EXISTS "Allow admins to manage property broker assignments" ON property_brokers;
CREATE POLICY "Allow admins to manage property broker assignments" ON property_brokers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- PROPERTY VIEWINGS TABLE
-- ================================================================
DROP POLICY IF EXISTS "Allow users to read their own viewings" ON property_viewings;
CREATE POLICY "Allow users to read their own viewings" ON property_viewings
  FOR SELECT
  USING (user_id = (SELECT auth.uid()) OR visitor_email = (SELECT auth.email()));

DROP POLICY IF EXISTS "Allow brokers to read their assigned viewings" ON property_viewings;
CREATE POLICY "Allow brokers to read their assigned viewings" ON property_viewings
  FOR SELECT
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow brokers to update their viewings" ON property_viewings;
CREATE POLICY "Allow brokers to update their viewings" ON property_viewings
  FOR UPDATE
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow admins to manage all viewings" ON property_viewings;
CREATE POLICY "Allow admins to manage all viewings" ON property_viewings
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- BROKER SCHEDULES TABLE
-- ================================================================
DROP POLICY IF EXISTS "Allow brokers to manage their own schedules" ON broker_schedules;
CREATE POLICY "Allow brokers to manage their own schedules" ON broker_schedules
  FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- BROKER BLOCKED TIMES TABLE
-- ================================================================
DROP POLICY IF EXISTS "Allow brokers to manage their own blocked times" ON broker_blocked_times;
CREATE POLICY "Allow brokers to manage their own blocked times" ON broker_blocked_times
  FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = (SELECT auth.uid())
    )
  );

-- ================================================================
-- USER PROFILES TABLE (if it exists)
-- ================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        -- Drop and recreate user profiles policies
        DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
        CREATE POLICY "Users can view their own profile" ON user_profiles
          FOR SELECT
          USING (user_id = (SELECT auth.uid()));

        DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
        CREATE POLICY "Users can update their own profile" ON user_profiles
          FOR UPDATE
          USING (user_id = (SELECT auth.uid()))
          WITH CHECK (user_id = (SELECT auth.uid()));

        DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
        CREATE POLICY "Users can insert their own profile" ON user_profiles
          FOR INSERT
          WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- ================================================================
-- USER SETTINGS TABLE (if it exists)
-- ================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_settings') THEN
        -- Drop and recreate user settings policies
        DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
        CREATE POLICY "Users can view their own settings" ON user_settings
          FOR SELECT
          USING (user_id = (SELECT auth.uid()));

        DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
        CREATE POLICY "Users can update their own settings" ON user_settings
          FOR UPDATE
          USING (user_id = (SELECT auth.uid()))
          WITH CHECK (user_id = (SELECT auth.uid()));

        DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;
        CREATE POLICY "Users can insert their own settings" ON user_settings
          FOR INSERT
          WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- ================================================================
-- SAVED SEARCHES TABLE (if it exists)
-- ================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_searches') THEN
        -- Drop and recreate saved searches policies
        DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
        CREATE POLICY "Users can view their own saved searches" ON saved_searches
          FOR SELECT
          USING (user_id = (SELECT auth.uid()));

        DROP POLICY IF EXISTS "Users can manage their own saved searches" ON saved_searches;
        CREATE POLICY "Users can manage their own saved searches" ON saved_searches
          FOR ALL
          USING (user_id = (SELECT auth.uid()))
          WITH CHECK (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- ================================================================
-- USER ACTIVITY LOG TABLE (if it exists)
-- ================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_activity_log') THEN
        -- Drop and recreate user activity log policies
        DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
        CREATE POLICY "Users can view their own activity" ON user_activity_log
          FOR SELECT
          USING (user_id = (SELECT auth.uid()));

        DROP POLICY IF EXISTS "System can insert activity" ON user_activity_log;
        CREATE POLICY "System can insert activity" ON user_activity_log
          FOR INSERT
          WITH CHECK (true);
    END IF;
END $$;

-- ================================================================
-- AGENT CONVERSATIONS TABLE (if it exists - mentioned in error)
-- ================================================================
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_conversations') THEN
        -- Drop and recreate agent conversations policies
        DROP POLICY IF EXISTS "Allow authenticated users to insert conversations" ON agent_conversations;
        CREATE POLICY "Allow authenticated users to insert conversations" ON agent_conversations
          FOR INSERT
          WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

        DROP POLICY IF EXISTS "Users can view their own conversations" ON agent_conversations;
        CREATE POLICY "Users can view their own conversations" ON agent_conversations
          FOR SELECT
          USING (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
SELECT 'All RLS performance issues have been fixed! Auth functions are now wrapped in subqueries.' as message;
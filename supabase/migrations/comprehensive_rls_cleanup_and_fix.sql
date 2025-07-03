-- COMPREHENSIVE RLS CLEANUP AND PERFORMANCE FIX
-- This migration completely cleans up ALL RLS policy conflicts and performance issues
-- It removes ALL existing policies and creates clean, optimized ones

-- ================================================================
-- CLEANUP: DROP ALL EXISTING CONFLICTING POLICIES
-- ================================================================

-- USER_PROFILES table - Remove ALL existing policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can upsert their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
DROP POLICY IF EXISTS "Comprehensive user profiles read" ON user_profiles;
DROP POLICY IF EXISTS "API users can manage their profiles" ON user_profiles;
DROP POLICY IF EXISTS "user_profiles_optimized_final" ON user_profiles;

-- USER_SETTINGS table - Remove ALL existing policies
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can view their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update their own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can insert their own settings" ON user_settings;

-- USER_PREFERENCES table (if exists) - Remove ALL existing policies
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can insert their own preferences" ON user_preferences;
        DROP POLICY IF EXISTS "Users can manage their own preferences" ON user_preferences;
    END IF;
END $$;

-- SAVED_SEARCHES table - Remove ALL existing policies
DROP POLICY IF EXISTS "Users can manage their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
DROP POLICY IF EXISTS "Comprehensive saved searches management" ON saved_searches;

-- USER_ACTIVITY_LOG table - Remove ALL existing policies
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
DROP POLICY IF EXISTS "Allow logging user activity" ON user_activity_log;
DROP POLICY IF EXISTS "System can insert activity" ON user_activity_log;
DROP POLICY IF EXISTS "Comprehensive user activity log access" ON user_activity_log;
DROP POLICY IF EXISTS "Admins can view all user activity" ON user_activity_log;

-- SAVED_PROPERTIES table - Remove ALL existing policies
DROP POLICY IF EXISTS "saved_properties_select_policy" ON saved_properties;
DROP POLICY IF EXISTS "saved_properties_insert_policy" ON saved_properties;
DROP POLICY IF EXISTS "saved_properties_update_policy" ON saved_properties;
DROP POLICY IF EXISTS "saved_properties_delete_policy" ON saved_properties;
DROP POLICY IF EXISTS "Users can view and manage their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can manage their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can delete their saved properties" ON saved_properties;

-- USER_VERIFICATION_TOKENS table - Remove ALL existing policies
DROP POLICY IF EXISTS "Users can view their own verification tokens" ON user_verification_tokens;
DROP POLICY IF EXISTS "Allow creating verification tokens" ON user_verification_tokens;

-- NOTIFICATION_HISTORY table - Remove ALL existing policies
DROP POLICY IF EXISTS "Users can view their own notification history" ON notification_history;
DROP POLICY IF EXISTS "Allow system to insert notifications" ON notification_history;

-- ================================================================
-- CREATE CLEAN, OPTIMIZED POLICIES
-- ================================================================

-- USER_PROFILES table - Single policy per operation
CREATE POLICY "user_profiles_read" ON user_profiles
  FOR SELECT 
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "user_profiles_insert" ON user_profiles
  FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_update" ON user_profiles
  FOR UPDATE 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_profiles_delete" ON user_profiles
  FOR DELETE 
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- USER_SETTINGS table - Single policy per operation
CREATE POLICY "user_settings_read" ON user_settings
  FOR SELECT 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "user_settings_insert" ON user_settings
  FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_settings_update" ON user_settings
  FOR UPDATE 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "user_settings_delete" ON user_settings
  FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- USER_PREFERENCES table (if exists) - Single policy per operation
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        CREATE POLICY "user_preferences_read" ON user_preferences
          FOR SELECT 
          USING (user_id = (SELECT auth.uid()));

        CREATE POLICY "user_preferences_insert" ON user_preferences
          FOR INSERT 
          WITH CHECK (user_id = (SELECT auth.uid()));

        CREATE POLICY "user_preferences_update" ON user_preferences
          FOR UPDATE 
          USING (user_id = (SELECT auth.uid()))
          WITH CHECK (user_id = (SELECT auth.uid()));

        CREATE POLICY "user_preferences_delete" ON user_preferences
          FOR DELETE 
          USING (user_id = (SELECT auth.uid()));
    END IF;
END $$;

-- SAVED_SEARCHES table - Single policy per operation
CREATE POLICY "saved_searches_read" ON saved_searches
  FOR SELECT 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_searches_insert" ON saved_searches
  FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_searches_update" ON saved_searches
  FOR UPDATE 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_searches_delete" ON saved_searches
  FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- USER_ACTIVITY_LOG table - Single policy per operation
CREATE POLICY "user_activity_read" ON user_activity_log
  FOR SELECT 
  USING (
    user_id = (SELECT auth.uid()) OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "user_activity_insert" ON user_activity_log
  FOR INSERT 
  WITH CHECK (true); -- Allow system to log any activity

-- SAVED_PROPERTIES table - Single policy per operation
CREATE POLICY "saved_properties_read" ON saved_properties
  FOR SELECT 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_properties_insert" ON saved_properties
  FOR INSERT 
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_properties_update" ON saved_properties
  FOR UPDATE 
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "saved_properties_delete" ON saved_properties
  FOR DELETE 
  USING (user_id = (SELECT auth.uid()));

-- USER_VERIFICATION_TOKENS table - Single policy per operation
CREATE POLICY "verification_tokens_read" ON user_verification_tokens
  FOR SELECT 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "verification_tokens_insert" ON user_verification_tokens
  FOR INSERT 
  WITH CHECK (true); -- Allow system to create tokens

-- NOTIFICATION_HISTORY table - Single policy per operation
CREATE POLICY "notification_history_read" ON notification_history
  FOR SELECT 
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "notification_history_insert" ON notification_history
  FOR INSERT 
  WITH CHECK (true); -- Allow system to insert notifications

-- ================================================================
-- FIX OTHER TABLES MENTIONED IN ORIGINAL ERRORS
-- ================================================================

-- AGENT_CONVERSATIONS table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_conversations') THEN
        DROP POLICY IF EXISTS "Allow authenticated users to insert conversations" ON agent_conversations;
        DROP POLICY IF EXISTS "Users can view their own conversations" ON agent_conversations;
        
        CREATE POLICY "agent_conversations_read" ON agent_conversations
          FOR SELECT 
          USING (user_id = (SELECT auth.uid()));
          
        CREATE POLICY "agent_conversations_insert" ON agent_conversations
          FOR INSERT 
          WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
    END IF;
END $$;

-- ================================================================
-- VERIFY AND ENSURE RLS IS ENABLED
-- ================================================================

-- Ensure RLS is enabled on all tables (safe to run multiple times)
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_preferences') THEN
        ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'agent_conversations') THEN
        ALTER TABLE agent_conversations ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
SELECT 'RLS cleanup complete! All conflicting policies removed and performance optimized.' as message;
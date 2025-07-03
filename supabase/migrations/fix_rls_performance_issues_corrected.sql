-- Fix RLS Performance Issues: Auth RLS Initialization Plan (CORRECTED)
-- This migration optimizes RLS policies by wrapping auth function calls in subqueries
-- to prevent re-evaluation for each row, significantly improving query performance.

-- Set explicit search path for this migration
SET search_path = 'public';

-- Fix agent_conversations policies
DROP POLICY IF EXISTS "Allow authenticated users to insert conversations" ON agent_conversations;
CREATE POLICY "Allow authenticated users to insert conversations" ON agent_conversations
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

-- Fix profiles policies
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (id = (select auth.uid()));

-- Fix user_preferences policies
DROP POLICY IF EXISTS "Users can view their own preferences" ON user_preferences;
CREATE POLICY "Users can view their own preferences" ON user_preferences
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own preferences" ON user_preferences;
CREATE POLICY "Users can update their own preferences" ON user_preferences
  FOR UPDATE USING (user_id = (select auth.uid()));

-- Fix saved_properties policies
DROP POLICY IF EXISTS "Users can view their saved properties" ON saved_properties;
CREATE POLICY "Users can view their saved properties" ON saved_properties
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own saved properties" ON saved_properties;
CREATE POLICY "Users can insert their own saved properties" ON saved_properties
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can delete their own saved properties" ON saved_properties;
CREATE POLICY "Users can delete their own saved properties" ON saved_properties
  FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own saved properties" ON saved_properties;
CREATE POLICY "Users can view their own saved properties" ON saved_properties
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own saved properties" ON saved_properties;
CREATE POLICY "Users can manage their own saved properties" ON saved_properties
  FOR ALL USING (user_id = (select auth.uid()));

-- Fix admin_permissions policies
DROP POLICY IF EXISTS "Users can view their own permissions" ON admin_permissions;
CREATE POLICY "Users can view their own permissions" ON admin_permissions
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all permissions" ON admin_permissions;
CREATE POLICY "Admins can view all permissions" ON admin_permissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix admin_activity_log policies
DROP POLICY IF EXISTS "Admins can view activity log" ON admin_activity_log;
CREATE POLICY "Admins can view activity log" ON admin_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix inquiries policies
DROP POLICY IF EXISTS "Allow admins to update inquiries" ON inquiries;
CREATE POLICY "Allow admins to update inquiries" ON inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow admins to delete inquiries" ON inquiries;
CREATE POLICY "Allow admins to delete inquiries" ON inquiries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix user_profiles policies
DROP POLICY IF EXISTS "Users can view their own profile" ON user_profiles;
CREATE POLICY "Users can view their own profile" ON user_profiles
  FOR SELECT USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON user_profiles;
CREATE POLICY "Users can insert their own profile" ON user_profiles
  FOR INSERT WITH CHECK (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
CREATE POLICY "Users can update their own profile" ON user_profiles
  FOR UPDATE USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all user profiles" ON user_profiles;
CREATE POLICY "Admins can view all user profiles" ON user_profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix user_settings policies
DROP POLICY IF EXISTS "Users can manage their own settings" ON user_settings;
CREATE POLICY "Users can manage their own settings" ON user_settings
  FOR ALL USING (user_id = (select auth.uid()));

-- Fix user_activity_log policies
DROP POLICY IF EXISTS "Users can view their own activity" ON user_activity_log;
CREATE POLICY "Users can view their own activity" ON user_activity_log
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Admins can view all user activity" ON user_activity_log;
CREATE POLICY "Admins can view all user activity" ON user_activity_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix user_verification_tokens policies
DROP POLICY IF EXISTS "Users can view their own verification tokens" ON user_verification_tokens;
CREATE POLICY "Users can view their own verification tokens" ON user_verification_tokens
  FOR SELECT USING (user_id = (select auth.uid()));

-- Fix notification_history policies
DROP POLICY IF EXISTS "Users can view their own notification history" ON notification_history;
CREATE POLICY "Users can view their own notification history" ON notification_history
  FOR SELECT USING (user_id = (select auth.uid()));

-- Fix property_videos policies
DROP POLICY IF EXISTS "Allow authenticated users to insert property_videos" ON property_videos;
CREATE POLICY "Allow authenticated users to insert property_videos" ON property_videos
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update property_videos" ON property_videos;
CREATE POLICY "Allow authenticated users to update property_videos" ON property_videos
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete property_videos" ON property_videos;
CREATE POLICY "Allow authenticated users to delete property_videos" ON property_videos
  FOR DELETE USING ((select auth.uid()) IS NOT NULL);

-- Fix property_documents policies
DROP POLICY IF EXISTS "Allow authenticated users to insert property_documents" ON property_documents;
CREATE POLICY "Allow authenticated users to insert property_documents" ON property_documents
  FOR INSERT WITH CHECK ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to update property_documents" ON property_documents;
CREATE POLICY "Allow authenticated users to update property_documents" ON property_documents
  FOR UPDATE USING ((select auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "Allow authenticated users to delete property_documents" ON property_documents;
CREATE POLICY "Allow authenticated users to delete property_documents" ON property_documents
  FOR DELETE USING ((select auth.uid()) IS NOT NULL);

-- Fix search_history policies
DROP POLICY IF EXISTS "Users can delete their own search history" ON search_history;
CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can view their own search history" ON search_history;
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own search history" ON search_history;
CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (user_id = (select auth.uid()));

-- Fix saved_searches policies
DROP POLICY IF EXISTS "Users can view their own saved searches" ON saved_searches;
CREATE POLICY "Users can view their own saved searches" ON saved_searches
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can manage their own saved searches" ON saved_searches;
CREATE POLICY "Users can manage their own saved searches" ON saved_searches
  FOR ALL USING (user_id = (select auth.uid()));

-- Fix search_analytics policies
DROP POLICY IF EXISTS "Admin can view search analytics" ON search_analytics;
CREATE POLICY "Admin can view search analytics" ON search_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix broker_availability policies
-- Note: Assuming broker role is checked via admin_permissions or user is the broker_id
DROP POLICY IF EXISTS "Allow brokers to manage their own availability" ON broker_availability;
CREATE POLICY "Allow brokers to manage their own availability" ON broker_availability
  FOR ALL USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow admins to manage all availability" ON broker_availability;
CREATE POLICY "Allow admins to manage all availability" ON broker_availability
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix property_brokers policies
DROP POLICY IF EXISTS "Allow admins to manage property broker assignments" ON property_brokers;
CREATE POLICY "Allow admins to manage property broker assignments" ON property_brokers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix property_viewings policies
DROP POLICY IF EXISTS "Allow users to read their own viewings" ON property_viewings;
CREATE POLICY "Allow users to read their own viewings" ON property_viewings
  FOR SELECT USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Allow brokers to read their assigned viewings" ON property_viewings;
CREATE POLICY "Allow brokers to read their assigned viewings" ON property_viewings
  FOR SELECT USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow brokers to update their viewings" ON property_viewings;
CREATE POLICY "Allow brokers to update their viewings" ON property_viewings
  FOR UPDATE USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Allow admins to manage all viewings" ON property_viewings;
CREATE POLICY "Allow admins to manage all viewings" ON property_viewings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix broker_schedules policies
DROP POLICY IF EXISTS "Allow brokers to manage their own schedules" ON broker_schedules;
CREATE POLICY "Allow brokers to manage their own schedules" ON broker_schedules
  FOR ALL USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix broker_blocked_times policies
DROP POLICY IF EXISTS "Allow brokers to manage their own blocked times" ON broker_blocked_times;
CREATE POLICY "Allow brokers to manage their own blocked times" ON broker_blocked_times
  FOR ALL USING (
    broker_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix email_analytics policies
DROP POLICY IF EXISTS "Admins can view all email analytics" ON email_analytics;
CREATE POLICY "Admins can view all email analytics" ON email_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view their own email analytics" ON email_analytics;
CREATE POLICY "Users can view their own email analytics" ON email_analytics
  FOR SELECT USING (user_id = (select auth.uid()));

-- Fix link_analytics policies
DROP POLICY IF EXISTS "Admins can view all link analytics" ON link_analytics;
CREATE POLICY "Admins can view all link analytics" ON link_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix email_templates policies
DROP POLICY IF EXISTS "Admins can manage email templates" ON email_templates;
CREATE POLICY "Admins can manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can view active email templates" ON email_templates;
CREATE POLICY "Users can view active email templates" ON email_templates
  FOR SELECT USING (is_active = true AND (select auth.uid()) IS NOT NULL);

-- Fix email_campaigns policies
DROP POLICY IF EXISTS "Admins can manage email campaigns" ON email_campaigns;
CREATE POLICY "Admins can manage email campaigns" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Fix email_suppressions policies
DROP POLICY IF EXISTS "Admins can manage email suppressions" ON email_suppressions;
CREATE POLICY "Admins can manage email suppressions" ON email_suppressions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

DROP POLICY IF EXISTS "Users can suppress their own email" ON email_suppressions;
CREATE POLICY "Users can suppress their own email" ON email_suppressions
  FOR INSERT WITH CHECK (
    user_id = (select auth.uid()) OR
    EXISTS (
      SELECT 1 FROM admin_permissions 
      WHERE user_id = (select auth.uid())
    )
  );

-- Reset search path
RESET search_path; 
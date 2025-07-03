-- Push Notifications System for Egyptian Real Estate App
-- Author: AI Assistant
-- Date: 2024-12-20

-- Create push notification tokens table
CREATE TABLE IF NOT EXISTS push_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_push_token TEXT NOT NULL,
  device_id TEXT,
  device_name TEXT,
  platform TEXT CHECK (platform IN ('ios', 'android', 'web')),
  app_version TEXT,
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique tokens per user
  UNIQUE(user_id, expo_push_token)
);

-- Create notification history table
CREATE TABLE IF NOT EXISTS notification_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  recipient_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expo_ticket_id TEXT, -- Expo's receipt ID for delivery tracking
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}', -- Custom payload for deep linking
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'new_property', 'price_change', 'inquiry_response', 'viewing_reminder',
    'ai_recommendation', 'market_update', 'system_notification'
  )),
  
  -- Delivery tracking
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'failed', 'read')),
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Analytics
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification queue table for batching and scheduling
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  notification_type TEXT NOT NULL,
  
  -- Scheduling
  scheduled_for TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  priority INTEGER DEFAULT 1 CHECK (priority BETWEEN 1 AND 5), -- 1 = low, 5 = urgent
  
  -- Processing
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed', 'cancelled')),
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_attempt_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  
  -- Grouping (to prevent spam)
  group_key TEXT, -- e.g., 'new_property_new_cairo' to group similar notifications
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create notification preferences table (enhanced version)
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Individual notification type preferences
  new_properties BOOLEAN DEFAULT true,
  price_changes BOOLEAN DEFAULT true,
  inquiry_responses BOOLEAN DEFAULT true,
  viewing_reminders BOOLEAN DEFAULT true,
  ai_recommendations BOOLEAN DEFAULT true,
  market_updates BOOLEAN DEFAULT false,
  system_notifications BOOLEAN DEFAULT true,
  
  -- Timing preferences
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '08:00',
  timezone TEXT DEFAULT 'Africa/Cairo',
  
  -- Frequency preferences
  max_daily_notifications INTEGER DEFAULT 10,
  batch_similar_notifications BOOLEAN DEFAULT true,
  
  -- Location-based preferences
  preferred_cities JSONB DEFAULT '["New Cairo", "Sheikh Zayed", "Zamalek", "Maadi"]'::jsonb,
  price_range_min INTEGER,
  price_range_max INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_tokens_user_id ON push_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_push_tokens_active ON push_tokens(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_push_tokens_platform ON push_tokens(platform);

CREATE INDEX IF NOT EXISTS idx_notification_history_user_id ON notification_history(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_type ON notification_history(notification_type);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON notification_history(status);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON notification_history(sent_at);

CREATE INDEX IF NOT EXISTS idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_queue_status ON notification_queue(status);
CREATE INDEX IF NOT EXISTS idx_notification_queue_scheduled_for ON notification_queue(scheduled_for);
CREATE INDEX IF NOT EXISTS idx_notification_queue_group_key ON notification_queue(group_key);
CREATE INDEX IF NOT EXISTS idx_notification_queue_priority ON notification_queue(priority);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS on all tables
ALTER TABLE push_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Push tokens - users can only manage their own tokens
CREATE POLICY "Users can view their own push tokens"
  ON push_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own push tokens"
  ON push_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own push tokens"
  ON push_tokens FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own push tokens"
  ON push_tokens FOR DELETE
  USING (user_id = auth.uid());

-- Notification history - users can only see their own notifications
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (recipient_user_id = auth.uid());

-- Admins can view all notification history
CREATE POLICY "Admins can view all notification history"
  ON notification_history FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Notification queue - only system can manage
CREATE POLICY "System can manage notification queue"
  ON notification_queue FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Notification preferences - users can manage their own
CREATE POLICY "Users can manage their own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Create update triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_push_tokens_updated_at
    BEFORE UPDATE ON push_tokens
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_queue_updated_at
    BEFORE UPDATE ON notification_queue
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create notification trigger functions

-- Function to queue new property notifications
CREATE OR REPLACE FUNCTION queue_new_property_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if the property is newly created and active
  IF TG_OP = 'INSERT' AND NEW.status = 'active' THEN
    -- Queue notifications for users with matching preferences
    INSERT INTO notification_queue (
      user_id, 
      title, 
      body, 
      data, 
      notification_type,
      group_key,
      priority
    )
    SELECT 
      np.user_id,
      'عقار جديد متاح! 🏠',
      'عقار جديد من نوع ' || NEW.property_type || ' في ' || NEW.city || ' يطابق تفضيلاتك',
      jsonb_build_object(
        'property_id', NEW.id,
        'property_title', NEW.title,
        'property_city', NEW.city,
        'property_price', NEW.price,
        'type', 'new_property',
        'deep_link', '/property/' || NEW.id
      ),
      'new_property',
      'new_property_' || lower(replace(NEW.city, ' ', '_')),
      2 -- Medium priority
    FROM notification_preferences np
    WHERE np.new_properties = true
      AND np.preferred_cities ? NEW.city
      AND (
        np.price_range_min IS NULL OR NEW.price >= np.price_range_min
      )
      AND (
        np.price_range_max IS NULL OR NEW.price <= np.price_range_max
      )
      -- Don't send if user already has pending notification for this group
      AND NOT EXISTS (
        SELECT 1 FROM notification_queue nq 
        WHERE nq.user_id = np.user_id 
        AND nq.group_key = 'new_property_' || lower(replace(NEW.city, ' ', '_'))
        AND nq.status = 'pending'
        AND nq.created_at > NOW() - INTERVAL '1 hour'
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to queue price change notifications
CREATE OR REPLACE FUNCTION queue_price_change_notifications()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if price actually changed
  IF TG_OP = 'UPDATE' AND OLD.price != NEW.price THEN
    -- Determine if it's a price drop or increase
    DECLARE
      price_change_type TEXT;
      title_text TEXT;
      body_text TEXT;
      notification_priority INTEGER;
    BEGIN
      IF NEW.price < OLD.price THEN
        price_change_type := 'price_drop';
        title_text := 'انخفاض في السعر! 💰';
        body_text := 'انخفض سعر ' || NEW.title || ' بمقدار ' || (OLD.price - NEW.price) || ' ج.م';
        notification_priority := 3; -- High priority for price drops
      ELSE
        price_change_type := 'price_increase';
        title_text := 'ارتفاع في السعر 📈';
        body_text := 'ارتفع سعر ' || NEW.title || ' بمقدار ' || (NEW.price - OLD.price) || ' ج.م';
        notification_priority := 2; -- Medium priority for price increases
      END IF;
      
      -- Queue notifications for users who saved this property
      INSERT INTO notification_queue (
        user_id, 
        title, 
        body, 
        data, 
        notification_type,
        priority
      )
      SELECT 
        sp.user_id,
        title_text,
        body_text,
        jsonb_build_object(
          'property_id', NEW.id,
          'property_title', NEW.title,
          'old_price', OLD.price,
          'new_price', NEW.price,
          'price_change', NEW.price - OLD.price,
          'type', price_change_type,
          'deep_link', '/property/' || NEW.id
        ),
        'price_change',
        notification_priority
      FROM saved_properties sp
      JOIN notification_preferences np ON sp.user_id = np.user_id
      WHERE sp.property_id = NEW.id
        AND np.price_changes = true;
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER property_notification_trigger
  AFTER INSERT ON properties
  FOR EACH ROW EXECUTE FUNCTION queue_new_property_notifications();

CREATE TRIGGER price_change_notification_trigger
  AFTER UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION queue_price_change_notifications();

-- Insert default notification preferences for existing users
INSERT INTO notification_preferences (user_id)
SELECT id FROM auth.users 
WHERE id NOT IN (SELECT user_id FROM notification_preferences)
ON CONFLICT (user_id) DO NOTHING;

-- Create helper function to check if user is in quiet hours
CREATE OR REPLACE FUNCTION is_user_in_quiet_hours(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prefs notification_preferences;
  user_time TIME;
BEGIN
  -- Get user preferences
  SELECT * INTO prefs
  FROM notification_preferences 
  WHERE user_id = user_uuid;
  
  -- If quiet hours not enabled, never in quiet hours
  IF NOT prefs.quiet_hours_enabled THEN
    RETURN FALSE;
  END IF;
  
  -- Get current time in user's timezone
  user_time := (NOW() AT TIME ZONE prefs.timezone)::TIME;
  
  -- Check if current time is within quiet hours
  IF prefs.quiet_hours_start <= prefs.quiet_hours_end THEN
    -- Normal case: quiet hours don't cross midnight
    RETURN user_time >= prefs.quiet_hours_start AND user_time <= prefs.quiet_hours_end;
  ELSE
    -- Quiet hours cross midnight
    RETURN user_time >= prefs.quiet_hours_start OR user_time <= prefs.quiet_hours_end;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Create function to check daily notification limit
CREATE OR REPLACE FUNCTION has_reached_daily_limit(user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  prefs notification_preferences;
  daily_count INTEGER;
BEGIN
  -- Get user preferences
  SELECT * INTO prefs
  FROM notification_preferences 
  WHERE user_id = user_uuid;
  
  -- Count notifications sent today
  SELECT COUNT(*) INTO daily_count
  FROM notification_history
  WHERE recipient_user_id = user_uuid
    AND sent_at >= CURRENT_DATE;
  
  RETURN daily_count >= prefs.max_daily_notifications;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT ALL ON push_tokens TO authenticated;
GRANT ALL ON notification_history TO authenticated;
GRANT ALL ON notification_queue TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated; 
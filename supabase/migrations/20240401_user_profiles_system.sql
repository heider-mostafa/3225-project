-- User Profile & Account Management System
-- This migration creates the foundation for comprehensive user profile management

-- Create user_profiles table for extended user information
CREATE TABLE user_profiles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  full_name TEXT,
  phone TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  nationality TEXT,
  occupation TEXT,
  company TEXT,
  bio TEXT,
  profile_photo_url TEXT,
  address JSONB, -- {street, city, state, country, postal_code}
  emergency_contact JSONB, -- {name, phone, relationship}
  preferences JSONB DEFAULT '{}', -- User preferences for notifications, search, etc.
  is_verified BOOLEAN DEFAULT false,
  phone_verified BOOLEAN DEFAULT false,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create user_settings table for application-specific settings
CREATE TABLE user_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- Notification preferences
  email_notifications JSONB DEFAULT '{
    "property_updates": true,
    "saved_search_alerts": true,
    "inquiry_responses": true,
    "newsletter": false,
    "marketing": false
  }',
  
  sms_notifications JSONB DEFAULT '{
    "property_updates": false,
    "saved_search_alerts": false,
    "urgent_only": true
  }',
  
  push_notifications JSONB DEFAULT '{
    "property_updates": true,
    "saved_search_alerts": true,
    "chat_messages": true
  }',
  
  -- Display preferences
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
  language TEXT DEFAULT 'en' CHECK (language IN ('en', 'ar')),
  currency TEXT DEFAULT 'EGP' CHECK (currency IN ('EGP', 'USD', 'EUR')),
  
  -- Privacy settings
  profile_visibility TEXT DEFAULT 'private' CHECK (profile_visibility IN ('public', 'private', 'contacts_only')),
  show_activity BOOLEAN DEFAULT false,
  allow_contact BOOLEAN DEFAULT true,
  
  -- Search preferences
  default_search_radius INTEGER DEFAULT 50, -- km
  default_property_types TEXT[] DEFAULT ARRAY['apartment', 'villa', 'townhouse'],
  price_range_preference JSONB, -- {min, max}
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create saved_searches table for user search criteria
CREATE TABLE saved_searches (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  search_criteria JSONB NOT NULL, -- All search parameters
  search_url TEXT, -- The actual search URL for easy access
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('instant', 'daily', 'weekly', 'never')),
  is_active BOOLEAN DEFAULT true,
  last_alert_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create user_activity_log table for tracking user actions
CREATE TABLE user_activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- 'property_view', 'search', 'inquiry', 'save_property', 'contact_agent'
  entity_type TEXT, -- 'property', 'search', 'inquiry', etc.
  entity_id UUID,
  activity_data JSONB, -- Additional data specific to the activity
  ip_address TEXT,
  user_agent TEXT,
  location JSONB, -- {city, country, coordinates}
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create user_verification_tokens table for email/phone verification
CREATE TABLE user_verification_tokens (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('email_verification', 'phone_verification', 'password_reset')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB, -- Additional data like new email/phone for verification
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create notification_history table to track sent notifications
CREATE TABLE notification_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'email', 'sms', 'push'
  subject TEXT,
  content TEXT,
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'failed')),
  metadata JSONB, -- Provider-specific data
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better performance
CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_phone ON user_profiles(phone);
CREATE INDEX idx_user_profiles_is_verified ON user_profiles(is_verified);

CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

CREATE INDEX idx_saved_searches_user_id ON saved_searches(user_id);
CREATE INDEX idx_saved_searches_active ON saved_searches(is_active);
CREATE INDEX idx_saved_searches_alert_frequency ON saved_searches(alert_frequency);

CREATE INDEX idx_user_activity_log_user_id ON user_activity_log(user_id);
CREATE INDEX idx_user_activity_log_activity_type ON user_activity_log(activity_type);
CREATE INDEX idx_user_activity_log_entity_type ON user_activity_log(entity_type);
CREATE INDEX idx_user_activity_log_created_at ON user_activity_log(created_at);

CREATE INDEX idx_user_verification_tokens_user_id ON user_verification_tokens(user_id);
CREATE INDEX idx_user_verification_tokens_token ON user_verification_tokens(token);
CREATE INDEX idx_user_verification_tokens_type ON user_verification_tokens(token_type);
CREATE INDEX idx_user_verification_tokens_expires_at ON user_verification_tokens(expires_at);

CREATE INDEX idx_notification_history_user_id ON notification_history(user_id);
CREATE INDEX idx_notification_history_type ON notification_history(type);
CREATE INDEX idx_notification_history_sent_at ON notification_history(sent_at);

-- Enable RLS on all tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- User profiles - users can only see and modify their own profile
CREATE POLICY "Users can view their own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- User settings - users can only manage their own settings
CREATE POLICY "Users can manage their own settings"
  ON user_settings FOR ALL
  USING (auth.uid() = user_id);

-- Saved searches - users can only manage their own searches
CREATE POLICY "Users can manage their own saved searches"
  ON saved_searches FOR ALL
  USING (auth.uid() = user_id);

-- User activity log - users can only view their own activity
CREATE POLICY "Users can view their own activity"
  ON user_activity_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow logging user activity"
  ON user_activity_log FOR INSERT
  WITH CHECK (true);

-- User verification tokens - users can only see their own tokens
CREATE POLICY "Users can view their own verification tokens"
  ON user_verification_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow creating verification tokens"
  ON user_verification_tokens FOR INSERT
  WITH CHECK (true);

-- Notification history - users can only see their own notifications
CREATE POLICY "Users can view their own notification history"
  ON notification_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Allow logging notifications"
  ON notification_history FOR INSERT
  WITH CHECK (true);

-- Admin policies
CREATE POLICY "Admins can view all user profiles"
  ON user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Admins can view all user activity"
  ON user_activity_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create functions for profile management
CREATE OR REPLACE FUNCTION create_user_profile_extended()
RETURNS TRIGGER AS $$
BEGIN
  -- Create default profile for new user (only if it doesn't exist)
  INSERT INTO user_profiles (user_id, email_verified)
  VALUES (NEW.id, NEW.email_confirmed_at IS NOT NULL)
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Create default settings for new user (only if it doesn't exist)
  INSERT INTO user_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger with a unique name
DO $$ 
BEGIN
  -- Only create trigger if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'on_auth_user_created_profile_extended'
  ) THEN
    CREATE TRIGGER on_auth_user_created_profile_extended
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION create_user_profile_extended();
  END IF;
END $$;

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at 
  BEFORE UPDATE ON user_settings 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_saved_searches_updated_at 
  BEFORE UPDATE ON saved_searches 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_id_param UUID,
  activity_type_param TEXT,
  entity_type_param TEXT DEFAULT NULL,
  entity_id_param UUID DEFAULT NULL,
  activity_data_param JSONB DEFAULT NULL,
  ip_address_param TEXT DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO user_activity_log (
    user_id, activity_type, entity_type, entity_id, 
    activity_data, ip_address, user_agent
  )
  VALUES (
    user_id_param, activity_type_param, entity_type_param, entity_id_param,
    activity_data_param, ip_address_param, user_agent_param
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to generate verification token
CREATE OR REPLACE FUNCTION generate_verification_token(
  user_id_param UUID,
  token_type_param TEXT,
  expires_in_hours INTEGER DEFAULT 24,
  metadata_param JSONB DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  token TEXT;
BEGIN
  -- Generate random token
  token := encode(gen_random_bytes(32), 'hex');
  
  -- Invalidate any existing tokens of the same type for this user
  UPDATE user_verification_tokens 
  SET used_at = NOW() 
  WHERE user_id = user_id_param 
    AND token_type = token_type_param 
    AND used_at IS NULL 
    AND expires_at > NOW();
  
  -- Insert new token
  INSERT INTO user_verification_tokens (
    user_id, token, token_type, expires_at, metadata
  )
  VALUES (
    user_id_param, token, token_type_param, 
    NOW() + (expires_in_hours || ' hours')::INTERVAL,
    metadata_param
  );
  
  RETURN token;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for profile photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-photos', 'profile-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for profile photos
CREATE POLICY "Users can upload their own profile photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update their own profile photos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete their own profile photos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'profile-photos' 
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Profile photos are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'profile-photos'); 
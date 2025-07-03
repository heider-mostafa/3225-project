-- Email Analytics and Mailgun Integration Migration
-- This migration adds comprehensive email tracking and analytics capabilities

-- Create email_analytics table for tracking all email events
CREATE TABLE IF NOT EXISTS email_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  event_type TEXT NOT NULL CHECK (event_type IN ('email_sent', 'email_delivered', 'email_opened', 'email_clicked', 'email_bounced', 'email_complained', 'email_unsubscribed', 'email_failed')),
  recipient_email TEXT NOT NULL,
  message_id TEXT NOT NULL,
  subject TEXT,
  tags TEXT[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  metadata JSONB DEFAULT '{}', -- Store additional event data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create link_analytics table for tracking email link clicks
CREATE TABLE IF NOT EXISTS link_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  url TEXT NOT NULL,
  email_recipient TEXT NOT NULL,
  message_id TEXT NOT NULL,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Update notification_history table to include Mailgun integration fields
DO $$
BEGIN
  -- Add mailgun_message_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_history' AND column_name = 'mailgun_message_id'
  ) THEN
    ALTER TABLE notification_history ADD COLUMN mailgun_message_id TEXT;
  END IF;

  -- Add template_name column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_history' AND column_name = 'template_name'
  ) THEN
    ALTER TABLE notification_history ADD COLUMN template_name TEXT;
  END IF;

  -- Add tags column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notification_history' AND column_name = 'tags'
  ) THEN
    ALTER TABLE notification_history ADD COLUMN tags TEXT[] DEFAULT '{}';
  END IF;

  -- Update status column to include new statuses if needed
  -- First check if the constraint exists, then drop and recreate it
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'notification_history_status_check'
  ) THEN
    ALTER TABLE notification_history DROP CONSTRAINT notification_history_status_check;
  END IF;
  
  ALTER TABLE notification_history ADD CONSTRAINT notification_history_status_check 
    CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'failed', 'bounced', 'complained', 'unsubscribed'));
END $$;

-- Create email_templates table for managing email templates
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  subject TEXT NOT NULL,
  html_content TEXT NOT NULL,
  text_content TEXT,
  variables JSONB DEFAULT '{}', -- Expected template variables
  category TEXT DEFAULT 'general' CHECK (category IN ('transactional', 'marketing', 'notification', 'general')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create email_campaigns table for managing bulk email campaigns
CREATE TABLE IF NOT EXISTS email_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id),
  target_audience JSONB NOT NULL, -- Criteria for selecting recipients
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  recipient_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create email_suppressions table for managing unsubscribes and bounces
CREATE TABLE IF NOT EXISTS email_suppressions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email_address TEXT UNIQUE NOT NULL,
  suppression_type TEXT NOT NULL CHECK (suppression_type IN ('bounce', 'complaint', 'unsubscribe', 'manual')),
  reason TEXT,
  campaign_id UUID REFERENCES email_campaigns(id),
  suppressed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_email_analytics_event_type ON email_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_email_analytics_recipient ON email_analytics(recipient_email);
CREATE INDEX IF NOT EXISTS idx_email_analytics_message_id ON email_analytics(message_id);
CREATE INDEX IF NOT EXISTS idx_email_analytics_timestamp ON email_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_email_analytics_tags ON email_analytics USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_link_analytics_url ON link_analytics(url);
CREATE INDEX IF NOT EXISTS idx_link_analytics_recipient ON link_analytics(email_recipient);
CREATE INDEX IF NOT EXISTS idx_link_analytics_clicked_at ON link_analytics(clicked_at);

CREATE INDEX IF NOT EXISTS idx_notification_history_mailgun_id ON notification_history(mailgun_message_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_template ON notification_history(template_name);
CREATE INDEX IF NOT EXISTS idx_notification_history_tags ON notification_history USING GIN(tags);

CREATE INDEX IF NOT EXISTS idx_email_templates_name ON email_templates(name);
CREATE INDEX IF NOT EXISTS idx_email_templates_category ON email_templates(category);
CREATE INDEX IF NOT EXISTS idx_email_templates_active ON email_templates(is_active);

CREATE INDEX IF NOT EXISTS idx_email_campaigns_status ON email_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_scheduled_at ON email_campaigns(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_campaigns_created_by ON email_campaigns(created_by);

CREATE INDEX IF NOT EXISTS idx_email_suppressions_email ON email_suppressions(email_address);
CREATE INDEX IF NOT EXISTS idx_email_suppressions_type ON email_suppressions(suppression_type);

-- Enable RLS on new tables
ALTER TABLE email_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE link_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_suppressions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Email analytics - admins can see all, users can see their own
CREATE POLICY "Admins can view all email analytics"
  ON email_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

CREATE POLICY "Users can view their own email analytics"
  ON email_analytics FOR SELECT
  USING (
    recipient_email IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Link analytics - similar to email analytics
CREATE POLICY "Admins can view all link analytics"
  ON link_analytics FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Email templates - admins can manage, all authenticated users can read active templates
CREATE POLICY "Admins can manage email templates"
  ON email_templates FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

CREATE POLICY "Users can view active email templates"
  ON email_templates FOR SELECT
  USING (is_active = true AND auth.role() = 'authenticated');

-- Email campaigns - admins and marketing roles can manage
CREATE POLICY "Admins can manage email campaigns"
  ON email_campaigns FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Email suppressions - admins can manage, users can add their own email
CREATE POLICY "Admins can manage email suppressions"
  ON email_suppressions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

CREATE POLICY "Users can suppress their own email"
  ON email_suppressions FOR INSERT
  WITH CHECK (
    email_address IN (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
  );

-- Insert default email templates
INSERT INTO email_templates (name, subject, html_content, text_content, category, variables) VALUES
('welcome-email', 'Welcome to VirtualEstate! 🏠', 
 '<!-- Will be populated from lib/email/templates.ts -->', 
 'Welcome to VirtualEstate, {{user_name}}!', 
 'transactional', 
 '{"user_name": "string", "website_url": "string"}'
),
('inquiry-confirmation', 'Your Property Inquiry Has Been Received', 
 '<!-- Will be populated from lib/email/templates.ts -->', 
 'Thank you for your inquiry about {{property_title}}.', 
 'transactional', 
 '{"user_name": "string", "property_title": "string", "inquiry_id": "string"}'
),
('viewing-confirmation', 'Your Property Viewing is Confirmed! 🗓️', 
 '<!-- Will be populated from lib/email/templates.ts -->', 
 'Your viewing for {{property_title}} is confirmed for {{viewing_date}} at {{viewing_time}}.', 
 'transactional', 
 '{"user_name": "string", "property_title": "string", "viewing_date": "string", "viewing_time": "string", "confirmation_code": "string"}'
),
('password-reset', 'Reset Your VirtualEstate Password', 
 '<!-- Will be populated from lib/email/templates.ts -->', 
 'Click here to reset your password: {{reset_url}}', 
 'transactional', 
 '{"reset_url": "string", "expiry_hours": "number"}'
) ON CONFLICT (name) DO NOTHING;

-- Create useful views for email analytics
CREATE OR REPLACE VIEW email_performance_summary AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*) FILTER (WHERE event_type = 'email_sent') as emails_sent,
  COUNT(*) FILTER (WHERE event_type = 'email_delivered') as emails_delivered,
  COUNT(*) FILTER (WHERE event_type = 'email_opened') as emails_opened,
  COUNT(*) FILTER (WHERE event_type = 'email_clicked') as emails_clicked,
  COUNT(*) FILTER (WHERE event_type = 'email_bounced') as emails_bounced,
  COUNT(*) FILTER (WHERE event_type = 'email_unsubscribed') as emails_unsubscribed,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'email_delivered')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'email_sent'), 0) * 100, 2
  ) as delivery_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'email_opened')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'email_delivered'), 0) * 100, 2
  ) as open_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'email_clicked')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'email_delivered'), 0) * 100, 2
  ) as click_rate
FROM email_analytics
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- Create function to get email stats for a user
CREATE OR REPLACE FUNCTION get_user_email_stats(user_email TEXT, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  total_emails INTEGER,
  emails_opened INTEGER,
  emails_clicked INTEGER,
  last_opened TIMESTAMP WITH TIME ZONE,
  engagement_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INTEGER as total_emails,
    COUNT(*) FILTER (WHERE event_type = 'email_opened')::INTEGER as emails_opened,
    COUNT(*) FILTER (WHERE event_type = 'email_clicked')::INTEGER as emails_clicked,
    MAX(timestamp) FILTER (WHERE event_type = 'email_opened') as last_opened,
    ROUND(
      (COUNT(*) FILTER (WHERE event_type = 'email_opened') + 
       COUNT(*) FILTER (WHERE event_type = 'email_clicked') * 2)::numeric / 
      NULLIF(COUNT(*), 0) * 100, 2
    ) as engagement_score
  FROM email_analytics
  WHERE recipient_email = user_email
    AND timestamp >= CURRENT_DATE - INTERVAL '1 day' * days_back;
END;
$$ LANGUAGE plpgsql;

-- Create function to check if email is suppressed
CREATE OR REPLACE FUNCTION is_email_suppressed(email_address TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_suppressions 
    WHERE email_suppressions.email_address = is_email_suppressed.email_address
  );
END;
$$ LANGUAGE plpgsql;

-- Create updated_at trigger for tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_email_templates_updated_at ON email_templates;
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_campaigns_updated_at ON email_campaigns;
CREATE TRIGGER update_email_campaigns_updated_at
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Grant necessary permissions
GRANT SELECT ON email_performance_summary TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_email_stats(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION is_email_suppressed(TEXT) TO authenticated; 
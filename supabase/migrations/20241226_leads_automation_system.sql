-- VirtualEstate N8N Automation System Migration
-- Creates leads table and supporting infrastructure for the automation workflows

-- 1. CREATE LEADS TABLE (Main table for WORKFLOW 1)
-- ===================================================
CREATE TABLE IF NOT EXISTS leads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id TEXT UNIQUE NOT NULL, -- Custom lead ID from workflow
  name TEXT NOT NULL,
  email TEXT,
  whatsapp_number TEXT NOT NULL,
  location TEXT NOT NULL,
  price_range TEXT NOT NULL,
  property_type TEXT NOT NULL,
  timeline TEXT NOT NULL,
  
  -- Scoring and qualification
  initial_score INTEGER DEFAULT 0,
  final_score INTEGER DEFAULT 0,
  recommendation TEXT CHECK (recommendation IN ('auto_book', 'manual_review', 'reject')),
  
  -- Status tracking
  status TEXT DEFAULT 'new_lead' CHECK (status IN ('new_lead', 'qualified', 'called', 'booked', 'rejected', 'completed')),
  
  -- Call data from WORKFLOW 2
  call_completed_at TIMESTAMPTZ,
  call_duration_seconds INTEGER,
  property_size_sqm DECIMAL(8,2),
  property_condition TEXT CHECK (property_condition IN ('empty', 'furnished', 'occupied')),
  urgency_reason TEXT,
  decision_authority TEXT CHECK (decision_authority IN ('owner', 'authorized', 'needs_approval')),
  previous_attempts TEXT,
  competing_agents BOOLEAN DEFAULT false,
  
  -- Booking data from WORKFLOW 3
  photographer_id UUID,
  shoot_scheduled_at TIMESTAMPTZ,
  shoot_completed_at TIMESTAMPTZ,
  shoot_duration_minutes INTEGER,
  
  -- Tour data from WORKFLOW 4
  virtual_tour_url TEXT,
  tour_processing_status TEXT DEFAULT 'pending' CHECK (tour_processing_status IN ('pending', 'processing', 'completed', 'failed')),
  tour_completed_at TIMESTAMPTZ,
  
  -- Analytics and performance
  tour_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  average_time_spent_seconds INTEGER DEFAULT 0,
  broker_inquiries INTEGER DEFAULT 0,
  viewing_requests INTEGER DEFAULT 0,
  
  -- Follow-up tracking
  last_followup_at TIMESTAMPTZ,
  followup_count INTEGER DEFAULT 0,
  broker_introduced BOOLEAN DEFAULT false,
  market_report_sent BOOLEAN DEFAULT false,
  
  -- Metadata
  source TEXT DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE PHOTOGRAPHERS TABLE (For WORKFLOW 3)
-- ===============================================
CREATE TABLE IF NOT EXISTS photographers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  preferred_areas TEXT[] DEFAULT '{}',
  equipment TEXT,
  rating DECIMAL(3,2) DEFAULT 0.00,
  total_shoots INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  google_calendar_id TEXT,
  pricing JSONB DEFAULT '{}', -- {base_rate, overtime_rate, travel_fee}
  availability JSONB DEFAULT '{}', -- {working_days, working_hours, blackout_dates}
  skills TEXT[] DEFAULT '{}', -- {residential, commercial, luxury, etc}
  languages TEXT[] DEFAULT '{"Arabic", "English"}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CREATE PHOTOGRAPHER ASSIGNMENTS TABLE
-- ========================================
CREATE TABLE IF NOT EXISTS photographer_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  assignment_date TIMESTAMPTZ NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 120,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rescheduled')),
  google_calendar_event_id TEXT,
  preparation_notes TEXT,
  completion_notes TEXT,
  client_rating INTEGER CHECK (client_rating >= 1 AND client_rating <= 5),
  photographer_rating INTEGER CHECK (photographer_rating >= 1 AND photographer_rating <= 5),
  travel_distance_km DECIMAL(6,2),
  actual_duration_minutes INTEGER,
  photos_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CREATE AI CALL LOGS TABLE (For WORKFLOW 2)
-- ==============================================
CREATE TABLE IF NOT EXISTS ai_call_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  call_id TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  call_status TEXT DEFAULT 'initiated' CHECK (call_status IN ('initiated', 'ringing', 'answered', 'completed', 'failed', 'no_answer', 'busy')),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  transcript TEXT,
  sentiment_score DECIMAL(3,2), -- -1.0 to 1.0
  key_insights JSONB DEFAULT '{}',
  questions_answered JSONB DEFAULT '{}',
  objections_raised TEXT[],
  decision_factors JSONB DEFAULT '{}',
  next_steps TEXT,
  call_recording_url TEXT,
  openai_session_id TEXT,
  cost_usd DECIMAL(8,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE WORKFLOW EXECUTION LOGS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS workflow_execution_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  workflow_version TEXT DEFAULT '1.0',
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  execution_id TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'started' CHECK (status IN ('started', 'in_progress', 'completed', 'failed', 'timeout')),
  start_time TIMESTAMPTZ DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  duration_seconds INTEGER,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. CREATE FOLLOW UP ACTIVITIES TABLE (For WORKFLOW 5)
-- =====================================================
CREATE TABLE IF NOT EXISTS followup_activities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('tour_ready', 'analytics_report', 'broker_introduction', 'market_insights', 'performance_review')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  executed_at TIMESTAMPTZ,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'skipped')),
  message_content TEXT,
  delivery_method TEXT CHECK (delivery_method IN ('whatsapp', 'email', 'sms')),
  delivery_status TEXT,
  engagement_metrics JSONB DEFAULT '{}', -- {opened, clicked, replied}
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ADD ADDITIONAL FIELDS TO EXISTING BROKERS TABLE (For WORKFLOW 5B)
-- =====================================================================
-- Note: Using existing brokers table from broker_calendar_system.sql
-- Adding any missing fields needed for the automation workflows

DO $$
BEGIN
  -- Add preferred_areas if not exists (for lead assignment)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'preferred_areas') THEN
    ALTER TABLE brokers ADD COLUMN preferred_areas TEXT[] DEFAULT '{}';
  END IF;
  
  -- Add total_deals if not exists (for performance tracking)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'total_deals') THEN
    ALTER TABLE brokers ADD COLUMN total_deals INTEGER DEFAULT 0;
  END IF;
  
  -- Add last_assignment_at if not exists (for load balancing)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'last_assignment_at') THEN
    ALTER TABLE brokers ADD COLUMN last_assignment_at TIMESTAMPTZ;
  END IF;
  
  -- Add whatsapp_number if not exists (for direct communication)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'whatsapp_number') THEN
    ALTER TABLE brokers ADD COLUMN whatsapp_number TEXT;
  END IF;
END $$;

-- 8. CREATE LEAD BROKER ASSIGNMENTS TABLE
-- =======================================
CREATE TABLE IF NOT EXISTS lead_broker_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE, -- References existing brokers table
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  introduction_sent_at TIMESTAMPTZ,
  broker_response_at TIMESTAMPTZ,
  status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'introduced', 'responded', 'declined', 'closed')),
  response_type TEXT CHECK (response_type IN ('interested', 'not_interested', 'need_more_info')),
  notes TEXT,
  commission_agreed DECIMAL(4,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE INDEXES FOR PERFORMANCE
-- =================================
CREATE INDEX IF NOT EXISTS idx_leads_lead_id ON leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_whatsapp_number ON leads(whatsapp_number);
CREATE INDEX IF NOT EXISTS idx_leads_location ON leads(location);
CREATE INDEX IF NOT EXISTS idx_leads_price_range ON leads(price_range);
CREATE INDEX IF NOT EXISTS idx_leads_initial_score ON leads(initial_score);
CREATE INDEX IF NOT EXISTS idx_leads_final_score ON leads(final_score);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_shoot_scheduled_at ON leads(shoot_scheduled_at);

CREATE INDEX IF NOT EXISTS idx_photographers_preferred_areas ON photographers USING GIN(preferred_areas);
CREATE INDEX IF NOT EXISTS idx_photographers_is_active ON photographers(is_active);
CREATE INDEX IF NOT EXISTS idx_photographers_rating ON photographers(rating);

CREATE INDEX IF NOT EXISTS idx_photographer_assignments_lead_id ON photographer_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_photographer_assignments_photographer_id ON photographer_assignments(photographer_id);
CREATE INDEX IF NOT EXISTS idx_photographer_assignments_scheduled_time ON photographer_assignments(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_photographer_assignments_status ON photographer_assignments(status);

CREATE INDEX IF NOT EXISTS idx_ai_call_logs_lead_id ON ai_call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_call_status ON ai_call_logs(call_status);
CREATE INDEX IF NOT EXISTS idx_ai_call_logs_start_time ON ai_call_logs(start_time);

CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_workflow_name ON workflow_execution_logs(workflow_name);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_lead_id ON workflow_execution_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_status ON workflow_execution_logs(status);
CREATE INDEX IF NOT EXISTS idx_workflow_execution_logs_start_time ON workflow_execution_logs(start_time);

CREATE INDEX IF NOT EXISTS idx_followup_activities_lead_id ON followup_activities(lead_id);
CREATE INDEX IF NOT EXISTS idx_followup_activities_scheduled_at ON followup_activities(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_followup_activities_activity_type ON followup_activities(activity_type);
CREATE INDEX IF NOT EXISTS idx_followup_activities_status ON followup_activities(status);

-- Indexes for additional broker fields (if they don't already exist)
CREATE INDEX IF NOT EXISTS idx_brokers_preferred_areas ON brokers USING GIN(preferred_areas);
CREATE INDEX IF NOT EXISTS idx_brokers_total_deals ON brokers(total_deals);
CREATE INDEX IF NOT EXISTS idx_brokers_last_assignment_at ON brokers(last_assignment_at);

CREATE INDEX IF NOT EXISTS idx_lead_broker_assignments_lead_id ON lead_broker_assignments(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_broker_assignments_broker_id ON lead_broker_assignments(broker_id);
CREATE INDEX IF NOT EXISTS idx_lead_broker_assignments_status ON lead_broker_assignments(status);

-- 10. ENABLE ROW LEVEL SECURITY
-- =============================
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographers ENABLE ROW LEVEL SECURITY;
ALTER TABLE photographer_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_call_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_activities ENABLE ROW LEVEL SECURITY;
-- Note: brokers table RLS already enabled in broker_calendar_system.sql
ALTER TABLE lead_broker_assignments ENABLE ROW LEVEL SECURITY;

-- 11. CREATE RLS POLICIES
-- =======================
-- Allow public read access to leads for admin dashboard
CREATE POLICY "Allow admin access to leads" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Allow photographers to view their assignments
CREATE POLICY "Photographers can view their assignments" ON photographer_assignments
  FOR SELECT USING (
    photographer_id IN (
      SELECT p.id FROM photographers p
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Allow brokers to view their assignments
CREATE POLICY "Brokers can view their lead assignments" ON lead_broker_assignments
  FOR SELECT USING (
    broker_id IN (
      SELECT b.id FROM brokers b
      WHERE b.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Allow public read access to workflow logs for monitoring
CREATE POLICY "Allow admin access to workflow logs" ON workflow_execution_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- 12. INSERT SAMPLE PHOTOGRAPHERS
-- ===============================
INSERT INTO photographers (email, name, phone, preferred_areas, equipment, rating) VALUES
('ahmed.photographer@gmail.com', 'Ahmed Photographer', '+201012345678', '{"New Cairo", "Heliopolis"}', 'Insta360 X5', 4.8),
('sara.photographer@gmail.com', 'Sara Photographer', '+201087654321', '{"Zamalek", "Maadi", "Giza"}', 'Insta360 X5', 4.9),
('omar.photographer@gmail.com', 'Omar Photographer', '+201555666777', '{"6th October", "Sheikh Zayed"}', 'Insta360 X5', 4.7),
('layla.photographer@gmail.com', 'Layla Photographer', '+201234567890', '{"New Cairo", "Maadi"}', 'Insta360 X5', 4.6)
ON CONFLICT (email) DO NOTHING;

-- 13. UPDATE EXISTING BROKERS WITH AUTOMATION FIELDS
-- ===================================================
-- Add preferred areas and other automation-related fields to existing brokers
UPDATE brokers SET 
  preferred_areas = CASE 
    WHEN email = 'mostafa.heider9@gmail.com' THEN ARRAY['New Cairo', 'Sheikh Zayed', 'Fifth Settlement']
    WHEN email = 'sarah.mohamed@realestate.com' THEN ARRAY['Zamalek', 'Maadi', 'Heliopolis'] 
    WHEN email = 'ahmed.hassan@realestate.com' THEN ARRAY['New Cairo', 'Fifth Settlement']
    WHEN email = 'omar.ali@realestate.com' THEN ARRAY['Downtown Cairo', 'New Capital']
    WHEN email = 'fatima.ahmed@realestate.com' THEN ARRAY['North Coast', 'Red Sea']
    WHEN full_name ILIKE '%Ahmed%' THEN ARRAY['New Cairo', 'Zamalek']
    WHEN full_name ILIKE '%Sara%' OR full_name ILIKE '%Fatma%' THEN ARRAY['Sheikh Zayed', '6th October']
    WHEN full_name ILIKE '%Mohamed%' THEN ARRAY['Maadi', 'Heliopolis']
    ELSE ARRAY['Giza', 'Dokki']
  END,
  total_deals = CASE 
    WHEN email = 'mostafa.heider9@gmail.com' THEN 78
    WHEN email = 'sarah.mohamed@realestate.com' THEN 67
    WHEN email = 'ahmed.hassan@realestate.com' THEN 45
    WHEN email = 'omar.ali@realestate.com' THEN 38
    WHEN email = 'fatima.ahmed@realestate.com' THEN 29
    WHEN rating > 4.5 THEN floor(random() * 50 + 20)::INTEGER
    WHEN rating > 4.0 THEN floor(random() * 30 + 10)::INTEGER
    ELSE floor(random() * 20 + 5)::INTEGER
  END,
  whatsapp_number = CASE 
    WHEN email = 'mostafa.heider9@gmail.com' THEN '+201123456789'
    WHEN phone IS NOT NULL AND phone != '' THEN phone
    ELSE '+20' || (floor(random() * 900000000 + 100000000))::TEXT
  END,
  last_assignment_at = CASE 
    WHEN email IN ('mostafa.heider9@gmail.com', 'sarah.mohamed@realestate.com', 'ahmed.hassan@realestate.com') 
    THEN NOW() - INTERVAL '1 day'
    ELSE NOW() - INTERVAL '1 week'
  END
WHERE preferred_areas IS NULL OR preferred_areas = '{}' OR array_length(preferred_areas, 1) IS NULL;

-- Insert sample brokers only if no existing brokers exist at all (which they do, so this won't run)
INSERT INTO brokers (full_name, email, phone, whatsapp_number, specialties, preferred_areas, languages, commission_rate, rating, is_active) 
SELECT * FROM (VALUES
  ('Mohamed Hassan', 'mohamed.hassan@broker.com', '+201111111111', '+201111111111', ARRAY['residential', 'luxury'], ARRAY['New Cairo', 'Zamalek'], ARRAY['english', 'arabic'], 2.5, 4.7, true),
  ('Fatma Ahmed', 'fatma.ahmed@broker.com', '+201222222222', '+201222222222', ARRAY['commercial', 'residential'], ARRAY['Sheikh Zayed', '6th October'], ARRAY['english', 'arabic', 'french'], 2.0, 4.8, true),
  ('Youssef Mahmoud', 'youssef.mahmoud@broker.com', '+201333333333', '+201333333333', ARRAY['luxury', 'commercial'], ARRAY['Maadi', 'Heliopolis'], ARRAY['english', 'arabic'], 3.0, 4.9, true),
  ('Nour El-Din', 'nour.eldin@broker.com', '+201444444444', '+201444444444', ARRAY['residential'], ARRAY['Giza', 'Dokki'], ARRAY['english', 'arabic'], 2.2, 4.5, true)
) AS new_brokers(full_name, email, phone, whatsapp_number, specialties, preferred_areas, languages, commission_rate, rating, is_active)
WHERE NOT EXISTS (SELECT 1 FROM brokers WHERE email IN ('ahmed.hassan@realestate.com', 'mostafa.heider9@gmail.com'))
ON CONFLICT (email) DO NOTHING;

-- 14. CREATE UPDATED_AT TRIGGERS (function already exists from previous migrations)
-- =================================================================================

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_photographers_updated_at BEFORE UPDATE ON photographers FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_photographer_assignments_updated_at BEFORE UPDATE ON photographer_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_followup_activities_updated_at BEFORE UPDATE ON followup_activities FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
-- Note: brokers table already has updated_at trigger from broker_calendar_system.sql
CREATE TRIGGER update_lead_broker_assignments_updated_at BEFORE UPDATE ON lead_broker_assignments FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
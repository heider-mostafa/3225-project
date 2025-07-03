-- ================================================================
-- BROKER AVAILABILITY CALENDAR SYSTEM
-- Migration: 20241220_broker_calendar_system.sql
-- ================================================================

-- ================================================================
-- EXTEND ROLE SYSTEM TO INCLUDE BROKERS
-- ================================================================

-- Add 'broker' to the existing user_role enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'broker';

-- Create helper function to check if user is a broker
CREATE OR REPLACE FUNCTION is_broker(user_id_param UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = user_id_param
    AND role = 'broker'
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get broker record for a user
CREATE OR REPLACE FUNCTION get_broker_by_user_id(user_id_param UUID DEFAULT auth.uid())
RETURNS UUID AS $$
DECLARE
  broker_id_result UUID;
BEGIN
  -- Check if user has broker role
  IF NOT is_broker(user_id_param) THEN
    RETURN NULL;
  END IF;
  
  -- Get broker ID
  SELECT id INTO broker_id_result
  FROM brokers
  WHERE user_id = user_id_param
  AND is_active = true;
  
  RETURN broker_id_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. CREATE BROKERS TABLE
-- ================================================================
CREATE TABLE brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  license_number VARCHAR(100),
  photo_url TEXT,
  bio TEXT,
  specialties TEXT[] DEFAULT '{}', -- ['residential', 'commercial', 'luxury']
  languages TEXT[] DEFAULT '{}', -- ['english', 'arabic', 'french']
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  total_reviews INTEGER DEFAULT 0,
  years_experience INTEGER DEFAULT 0,
  commission_rate DECIMAL(5,2) DEFAULT 2.5, -- Percentage
  is_active BOOLEAN DEFAULT true,
  timezone VARCHAR(50) DEFAULT 'UTC',
  working_hours JSONB DEFAULT '{"monday": {"start": "09:00", "end": "18:00"}, "tuesday": {"start": "09:00", "end": "18:00"}, "wednesday": {"start": "09:00", "end": "18:00"}, "thursday": {"start": "09:00", "end": "18:00"}, "friday": {"start": "09:00", "end": "18:00"}, "saturday": {"start": "10:00", "end": "16:00"}, "sunday": {"closed": true}}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. CREATE BROKER AVAILABILITY TABLE
-- ================================================================
CREATE TABLE broker_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN DEFAULT true,
  max_bookings INTEGER DEFAULT 1,
  current_bookings INTEGER DEFAULT 0,
  slot_duration_minutes INTEGER DEFAULT 60,
  break_between_slots INTEGER DEFAULT 15, -- Minutes between bookings
  booking_type VARCHAR(50) DEFAULT 'property_viewing', -- 'property_viewing', 'consultation', 'tour'
  notes TEXT,
  recurring_pattern VARCHAR(20), -- 'none', 'weekly', 'daily'
  recurring_until DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(broker_id, date, start_time),
  CHECK (start_time < end_time),
  CHECK (current_bookings <= max_bookings)
);

-- 3. CREATE PROPERTY BROKERS ASSIGNMENT TABLE
-- ================================================================
CREATE TABLE property_brokers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  is_primary BOOLEAN DEFAULT false,
  assignment_type VARCHAR(50) DEFAULT 'listing', -- 'listing', 'selling', 'showing'
  commission_split DECIMAL(5,2) DEFAULT 50.0, -- Percentage
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES auth.users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(property_id, broker_id)
);

-- 4. CREATE PROPERTY VIEWINGS TABLE
-- ================================================================
CREATE TABLE property_viewings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  viewing_date DATE NOT NULL,
  viewing_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  visitor_name VARCHAR(255) NOT NULL,
  visitor_email VARCHAR(255) NOT NULL,
  visitor_phone VARCHAR(20),
  party_size INTEGER DEFAULT 1 CHECK (party_size > 0),
  viewing_type VARCHAR(50) DEFAULT 'in_person', -- 'in_person', 'virtual', 'self_guided'
  special_requests TEXT,
  preparation_notes TEXT, -- For broker preparation
  status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled'
  confirmation_code VARCHAR(10) UNIQUE,
  booking_source VARCHAR(50) DEFAULT 'website', -- 'website', 'phone', 'email', 'walk_in'
  reminded_at TIMESTAMPTZ,
  reminder_count INTEGER DEFAULT 0,
  checked_in_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  cancellation_reason TEXT,
  follow_up_required BOOLEAN DEFAULT true,
  follow_up_completed BOOLEAN DEFAULT false,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  lead_quality_score INTEGER CHECK (lead_quality_score >= 1 AND lead_quality_score <= 10),
  notes TEXT,
  metadata JSONB DEFAULT '{}', -- For additional data like traffic source, UTM params, etc.
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CREATE BROKER SCHEDULES TABLE (For recurring schedules)
-- ================================================================
CREATE TABLE broker_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  max_daily_bookings INTEGER DEFAULT 8,
  lunch_break_start TIME,
  lunch_break_end TIME,
  slot_duration_minutes INTEGER DEFAULT 60,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(broker_id, day_of_week, start_time)
);

-- 6. CREATE BROKER BLOCKED TIMES TABLE (For vacations, meetings, etc.)
-- ================================================================
CREATE TABLE broker_blocked_times (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  broker_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason VARCHAR(255),
  block_type VARCHAR(50) DEFAULT 'vacation', -- 'vacation', 'meeting', 'personal', 'training'
  is_recurring BOOLEAN DEFAULT false,
  recurring_pattern VARCHAR(20), -- 'weekly', 'monthly'
  recurring_until TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (start_datetime < end_datetime)
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Brokers table indexes
CREATE INDEX idx_brokers_user_id ON brokers(user_id);
CREATE INDEX idx_brokers_email ON brokers(email);
CREATE INDEX idx_brokers_is_active ON brokers(is_active);
CREATE INDEX idx_brokers_specialties ON brokers USING GIN(specialties);
CREATE INDEX idx_brokers_rating ON brokers(rating DESC);

-- Broker availability indexes
CREATE INDEX idx_broker_availability_broker_id ON broker_availability(broker_id);
CREATE INDEX idx_broker_availability_date ON broker_availability(date);
CREATE INDEX idx_broker_availability_broker_date ON broker_availability(broker_id, date);
CREATE INDEX idx_broker_availability_available ON broker_availability(is_available) WHERE is_available = true;

-- Property brokers indexes
CREATE INDEX idx_property_brokers_property_id ON property_brokers(property_id);
CREATE INDEX idx_property_brokers_broker_id ON property_brokers(broker_id);
CREATE INDEX idx_property_brokers_primary ON property_brokers(property_id) WHERE is_primary = true;
CREATE INDEX idx_property_brokers_active ON property_brokers(is_active) WHERE is_active = true;

-- Property viewings indexes
CREATE INDEX idx_property_viewings_property_id ON property_viewings(property_id);
CREATE INDEX idx_property_viewings_broker_id ON property_viewings(broker_id);
CREATE INDEX idx_property_viewings_user_id ON property_viewings(user_id);
CREATE INDEX idx_property_viewings_date ON property_viewings(viewing_date);
CREATE INDEX idx_property_viewings_status ON property_viewings(status);
CREATE INDEX idx_property_viewings_confirmation_code ON property_viewings(confirmation_code);
CREATE INDEX idx_property_viewings_broker_date ON property_viewings(broker_id, viewing_date);

-- Broker schedules indexes
CREATE INDEX idx_broker_schedules_broker_id ON broker_schedules(broker_id);
CREATE INDEX idx_broker_schedules_day_of_week ON broker_schedules(day_of_week);
CREATE INDEX idx_broker_schedules_active ON broker_schedules(is_active) WHERE is_active = true;

-- Broker blocked times indexes
CREATE INDEX idx_broker_blocked_times_broker_id ON broker_blocked_times(broker_id);
CREATE INDEX idx_broker_blocked_times_datetime ON broker_blocked_times(start_datetime, end_datetime);

-- ================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS
ALTER TABLE brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_brokers ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_viewings ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE broker_blocked_times ENABLE ROW LEVEL SECURITY;

-- Brokers policies
CREATE POLICY "Allow public read access to active brokers"
  ON brokers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow brokers to update their own profile"
  ON brokers FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Allow admins to manage brokers"
  ON brokers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Broker availability policies
CREATE POLICY "Allow public read access to broker availability"
  ON broker_availability FOR SELECT
  USING (is_available = true);

CREATE POLICY "Allow brokers to manage their own availability"
  ON broker_availability FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to manage all availability"
  ON broker_availability FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Property brokers policies
CREATE POLICY "Allow public read access to property brokers"
  ON property_brokers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow admins to manage property broker assignments"
  ON property_brokers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Property viewings policies
CREATE POLICY "Allow users to read their own viewings"
  ON property_viewings FOR SELECT
  USING (user_id = auth.uid() OR visitor_email = auth.email());

CREATE POLICY "Allow public insert for new viewings"
  ON property_viewings FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow brokers to read their assigned viewings"
  ON property_viewings FOR SELECT
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow brokers to update their viewings"
  ON property_viewings FOR UPDATE
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Allow admins to manage all viewings"
  ON property_viewings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Broker schedules policies
CREATE POLICY "Allow public read access to broker schedules"
  ON broker_schedules FOR SELECT
  USING (is_active = true);

CREATE POLICY "Allow brokers to manage their own schedules"
  ON broker_schedules FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Broker blocked times policies
CREATE POLICY "Allow brokers to manage their own blocked times"
  ON broker_blocked_times FOR ALL
  USING (
    broker_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- ================================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to update broker availability current bookings
CREATE OR REPLACE FUNCTION update_broker_availability_bookings()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'scheduled' THEN
    -- Increase current bookings
    UPDATE broker_availability 
    SET current_bookings = current_bookings + 1,
        updated_at = NOW()
    WHERE broker_id = NEW.broker_id 
      AND date = NEW.viewing_date 
      AND start_time <= NEW.viewing_time 
      AND end_time > NEW.viewing_time;
  
  ELSIF TG_OP = 'UPDATE' AND OLD.status = 'scheduled' AND NEW.status IN ('cancelled', 'no_show') THEN
    -- Decrease current bookings
    UPDATE broker_availability 
    SET current_bookings = GREATEST(current_bookings - 1, 0),
        updated_at = NOW()
    WHERE broker_id = NEW.broker_id 
      AND date = NEW.viewing_date 
      AND start_time <= NEW.viewing_time 
      AND end_time > NEW.viewing_time;
  
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'scheduled' THEN
    -- Decrease current bookings
    UPDATE broker_availability 
    SET current_bookings = GREATEST(current_bookings - 1, 0),
        updated_at = NOW()
    WHERE broker_id = OLD.broker_id 
      AND date = OLD.viewing_date 
      AND start_time <= OLD.viewing_time 
      AND end_time > OLD.viewing_time;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger for broker availability bookings
CREATE TRIGGER trigger_update_broker_availability_bookings
  AFTER INSERT OR UPDATE OR DELETE ON property_viewings
  FOR EACH ROW EXECUTE FUNCTION update_broker_availability_bookings();

-- Function to generate confirmation codes
CREATE OR REPLACE FUNCTION generate_confirmation_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.confirmation_code IS NULL THEN
    NEW.confirmation_code := upper(substr(md5(random()::text), 1, 10));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for confirmation codes
CREATE TRIGGER trigger_generate_confirmation_code
  BEFORE INSERT ON property_viewings
  FOR EACH ROW EXECUTE FUNCTION generate_confirmation_code();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER trigger_brokers_updated_at
  BEFORE UPDATE ON brokers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_broker_availability_updated_at
  BEFORE UPDATE ON broker_availability
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_property_viewings_updated_at
  BEFORE UPDATE ON property_viewings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_broker_schedules_updated_at
  BEFORE UPDATE ON broker_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- SAMPLE DATA FOR TESTING
-- ================================================================

-- Insert sample brokers (use ON CONFLICT to prevent duplicates)
INSERT INTO brokers (full_name, email, phone, license_number, bio, specialties, languages, rating, total_reviews, years_experience, is_active) VALUES
('Ahmed Hassan', 'ahmed.hassan@realestate.com', '+201234567890', 'RE-001-2024', 'Experienced residential broker specializing in luxury properties in New Cairo and Madinaty.', '{"residential", "luxury"}', '{"english", "arabic"}', 4.8, 127, 8, true),
('Sarah Mohamed', 'sarah.mohamed@realestate.com', '+201987654321', 'RE-002-2024', 'Commercial real estate expert with focus on office buildings and retail spaces.', '{"commercial", "retail"}', '{"english", "arabic", "french"}', 4.6, 89, 6, true),
('Omar Ali', 'omar.ali@realestate.com', '+201555666777', 'RE-003-2024', 'Specialist in beachfront and vacation properties along the North Coast.', '{"residential", "vacation"}', '{"english", "arabic"}', 4.9, 203, 12, true),
('Fatima Ahmed', 'fatima.ahmed@realestate.com', '+201444555666', 'RE-004-2024', 'New construction and development specialist focusing on modern compounds.', '{"residential", "new_construction"}', '{"english", "arabic"}', 4.7, 156, 9, true)
ON CONFLICT (email) DO NOTHING;

-- Insert sample property broker assignments (only if properties exist)
INSERT INTO property_brokers (property_id, broker_id, is_primary, assignment_type) 
SELECT 
  p.id,
  b.id,
  true,
  'listing'
FROM properties p
CROSS JOIN brokers b
WHERE p.id IN (
  SELECT id FROM properties 
  ORDER BY created_at 
  LIMIT 10
)
AND b.email = 'ahmed.hassan@realestate.com'
ON CONFLICT (property_id, broker_id) DO NOTHING;

-- Insert sample broker schedules (Monday to Friday, 9 AM to 6 PM)
INSERT INTO broker_schedules (broker_id, day_of_week, start_time, end_time, max_daily_bookings, lunch_break_start, lunch_break_end)
SELECT 
  b.id,
  dow,
  '09:00'::time,
  '18:00'::time,
  8,
  '13:00'::time,
  '14:00'::time
FROM brokers b
CROSS JOIN generate_series(1, 5) as dow -- Monday to Friday
WHERE b.is_active = true
ON CONFLICT (broker_id, day_of_week, start_time) DO NOTHING;

-- Insert weekend schedules (Saturday 10 AM to 4 PM)
INSERT INTO broker_schedules (broker_id, day_of_week, start_time, end_time, max_daily_bookings)
SELECT 
  b.id,
  6, -- Saturday
  '10:00'::time,
  '16:00'::time,
  4
FROM brokers b
WHERE b.is_active = true
ON CONFLICT (broker_id, day_of_week, start_time) DO NOTHING;

-- Insert sample availability for next 30 days (use ON CONFLICT to prevent duplicates)
INSERT INTO broker_availability (broker_id, date, start_time, end_time, max_bookings, slot_duration_minutes)
SELECT 
  b.id,
  current_date + interval '1 day' * day_offset,
  time_slot,
  time_slot + interval '1 hour',
  2,
  60
FROM brokers b
CROSS JOIN generate_series(1, 30) as day_offset
CROSS JOIN generate_series(0, 8) as hour_offset
CROSS JOIN (VALUES ('09:00'::time), ('10:00'::time), ('11:00'::time), ('14:00'::time), ('15:00'::time), ('16:00'::time), ('17:00'::time)) as slots(time_slot)
WHERE b.is_active = true
  AND extract(dow from current_date + interval '1 day' * day_offset) BETWEEN 1 AND 6 -- Weekdays and Saturday
  AND NOT (extract(dow from current_date + interval '1 day' * day_offset) = 6 AND time_slot > '15:00'::time) -- Saturday ends at 4 PM
ON CONFLICT (broker_id, date, start_time) DO NOTHING;

-- Success message
SELECT 'Broker Calendar System database migration completed successfully!' as message; 
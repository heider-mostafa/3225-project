-- Add RealSee integration fields to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS realsee_tour_id TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS realsee_model_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS realsee_floor_plan_url TEXT;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS realsee_images JSONB;

-- Add enhanced analytics fields for better tracking
ALTER TABLE property_analytics ADD COLUMN IF NOT EXISTS session_id TEXT;
ALTER TABLE property_analytics ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE property_analytics ADD COLUMN IF NOT EXISTS room_visited TEXT;
ALTER TABLE property_analytics ADD COLUMN IF NOT EXISTS time_spent_seconds INTEGER;
ALTER TABLE property_analytics ADD COLUMN IF NOT EXISTS interaction_type TEXT;
ALTER TABLE property_analytics ADD COLUMN IF NOT EXISTS referrer_url TEXT;

-- Create saved_properties table for user bookmarks
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(user_id, property_id)
);

-- Create tour_sessions table for detailed virtual tour tracking
CREATE TABLE IF NOT EXISTS tour_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT UNIQUE NOT NULL,
  tour_type TEXT NOT NULL DEFAULT 'virtual_3d', -- 'virtual_3d', 'realsee', 'video'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  total_duration_seconds INTEGER,
  rooms_visited JSONB,
  actions_taken JSONB,
  user_agent TEXT,
  ip_address TEXT,
  completed BOOLEAN DEFAULT FALSE
);

-- Create heygen_sessions table for video call tracking
CREATE TABLE IF NOT EXISTS heygen_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT UNIQUE NOT NULL,
  agent_type TEXT NOT NULL,
  agent_name TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  questions_asked JSONB,
  topics_discussed JSONB,
  call_rating INTEGER CHECK (call_rating >= 1 AND call_rating <= 5),
  follow_up_requested BOOLEAN DEFAULT FALSE,
  meeting_scheduled BOOLEAN DEFAULT FALSE,
  user_agent TEXT,
  ip_address TEXT
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_properties_realsee_tour_id ON properties(realsee_tour_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_session_id ON property_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_user_id ON property_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_interaction_type ON property_analytics(interaction_type);
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_property_id ON saved_properties(property_id);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_property_id ON tour_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_user_id ON tour_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_session_id ON tour_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_property_id ON heygen_sessions(property_id);
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_user_id ON heygen_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_session_id ON heygen_sessions(session_id);

-- Enable RLS
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE heygen_sessions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved properties"
  ON saved_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved properties"
  ON saved_properties FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Public read access to tour sessions"
  ON tour_sessions FOR SELECT
  USING (true);

CREATE POLICY "Public insert access to tour sessions"
  ON tour_sessions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Public read access to heygen sessions"
  ON heygen_sessions FOR SELECT
  USING (true);

CREATE POLICY "Public insert access to heygen sessions"
  ON heygen_sessions FOR INSERT
  WITH CHECK (true);

-- Create function to track tour completion
CREATE OR REPLACE FUNCTION complete_tour_session(session_id_param TEXT)
RETURNS void AS $$
BEGIN
  UPDATE tour_sessions
  SET 
    ended_at = TIMEZONE('utc'::text, NOW()),
    completed = TRUE,
    total_duration_seconds = EXTRACT(EPOCH FROM (TIMEZONE('utc'::text, NOW()) - started_at))::INTEGER
  WHERE session_id = session_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to track heygen session end
CREATE OR REPLACE FUNCTION end_heygen_session(session_id_param TEXT, rating INTEGER DEFAULT NULL)
RETURNS void AS $$
BEGIN
  UPDATE heygen_sessions
  SET 
    ended_at = TIMEZONE('utc'::text, NOW()),
    duration_seconds = EXTRACT(EPOCH FROM (TIMEZONE('utc'::text, NOW()) - started_at))::INTEGER,
    call_rating = COALESCE(rating, call_rating)
  WHERE session_id = session_id_param;
END;
$$ LANGUAGE plpgsql; 
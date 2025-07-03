-- =============================================================================
-- LIFESTYLE COMPATIBILITY FEATURES - DATABASE MIGRATION
-- =============================================================================
-- 
-- PURPOSE:
-- Creates database infrastructure for the "Your Life From Here" lifestyle 
-- compatibility tool that helps users analyze how a property fits their daily life.
--
-- WHAT IT CREATES:
-- • user_destinations table - Stores user's personal places (work, gym, school, etc.)
-- • commute_data table - Calculated travel times, costs, and routing data
-- • lifestyle_compatibility_scores table - AI-generated compatibility ratings
-- • traffic_patterns table - Time-based traffic analysis data
-- • Enhanced properties table with walkability, transit, and bike scores
-- • Functions for calculating lifestyle scores and commute analysis
--
-- INTEGRATES WITH:
-- • Google Maps Distance Matrix API (for real-time commute calculations)
-- • Property details page (displays interactive lifestyle tool)
-- • User authentication system (RLS policies for data security)
-- • Multilingual system (supports English/Arabic)
--
-- DEPENDENCIES:
-- • PostGIS extension (for geographic point storage and calculations)
-- • Existing properties table
-- • Supabase auth system
--
-- Date: 2024-12-26
-- =============================================================================

BEGIN;

-- Enable PostGIS extension if not already enabled
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create user_destinations table for personal places
CREATE TABLE IF NOT EXISTS user_destinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  address TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('work', 'education', 'health', 'entertainment', 'shopping', 'custom')),
  coordinates GEOGRAPHY(POINT, 4326) NOT NULL,
  frequency TEXT DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'occasional')),
  importance INTEGER DEFAULT 3 CHECK (importance BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, label)
);

-- Create commute_data table for calculated commute information
CREATE TABLE IF NOT EXISTS commute_data (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  destination_id UUID REFERENCES user_destinations(id) ON DELETE CASCADE,
  distance_km DECIMAL(8, 3) NOT NULL,
  duration_car INTEGER, -- minutes
  duration_public INTEGER, -- minutes
  duration_walking INTEGER, -- minutes
  duration_cycling INTEGER, -- minutes
  traffic_factor DECIMAL(3, 2) DEFAULT 1.0, -- multiplier during rush hour
  best_time_ranges TEXT[], -- ["07:00-08:00", "14:00-15:00"]
  cost_estimate DECIMAL(8, 2), -- monthly cost in EGP
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, destination_id)
);

-- Create lifestyle_compatibility_scores table for calculated compatibility
CREATE TABLE IF NOT EXISTS lifestyle_compatibility_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  overall_score DECIMAL(3, 1) CHECK (overall_score BETWEEN 0 AND 10),
  commute_score DECIMAL(3, 1) CHECK (commute_score BETWEEN 0 AND 10),
  cost_score DECIMAL(3, 1) CHECK (cost_score BETWEEN 0 AND 10),
  accessibility_score DECIMAL(3, 1) CHECK (accessibility_score BETWEEN 0 AND 10),
  total_daily_travel_minutes INTEGER,
  monthly_transport_cost DECIMAL(10, 2),
  co2_impact_kg DECIMAL(8, 2),
  last_calculated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, user_id)
);

-- Create traffic_patterns table for time-based traffic analysis
CREATE TABLE IF NOT EXISTS traffic_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_point GEOGRAPHY(POINT, 4326) NOT NULL,
  to_point GEOGRAPHY(POINT, 4326) NOT NULL,
  hour_of_day INTEGER CHECK (hour_of_day BETWEEN 0 AND 23),
  day_of_week INTEGER CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Monday, 7=Sunday
  average_duration INTEGER NOT NULL, -- minutes
  congestion_level TEXT CHECK (congestion_level IN ('low', 'medium', 'high', 'severe')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add enhanced location fields to properties table if they don't exist
DO $$
BEGIN
  -- Add more detailed location fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'walkability_score') THEN
    ALTER TABLE properties ADD COLUMN walkability_score INTEGER CHECK (walkability_score BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'transit_score') THEN
    ALTER TABLE properties ADD COLUMN transit_score INTEGER CHECK (transit_score BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'bike_score') THEN
    ALTER TABLE properties ADD COLUMN bike_score INTEGER CHECK (bike_score BETWEEN 0 AND 100);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'nearby_amenities') THEN
    ALTER TABLE properties ADD COLUMN nearby_amenities JSONB DEFAULT '{}';
  END IF;
  
  -- Add traffic-aware distance fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'metro_travel_time_peak') THEN
    ALTER TABLE properties ADD COLUMN metro_travel_time_peak INTEGER; -- minutes during peak hours
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'metro_travel_time_off_peak') THEN
    ALTER TABLE properties ADD COLUMN metro_travel_time_off_peak INTEGER; -- minutes during off-peak
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'airport_travel_time_peak') THEN
    ALTER TABLE properties ADD COLUMN airport_travel_time_peak INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'airport_travel_time_off_peak') THEN
    ALTER TABLE properties ADD COLUMN airport_travel_time_off_peak INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'mall_travel_time_peak') THEN
    ALTER TABLE properties ADD COLUMN mall_travel_time_peak INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'mall_travel_time_off_peak') THEN
    ALTER TABLE properties ADD COLUMN mall_travel_time_off_peak INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'hospital_travel_time_peak') THEN
    ALTER TABLE properties ADD COLUMN hospital_travel_time_peak INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'hospital_travel_time_off_peak') THEN
    ALTER TABLE properties ADD COLUMN hospital_travel_time_off_peak INTEGER;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_destinations_user_id ON user_destinations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_destinations_category ON user_destinations(category);
CREATE INDEX IF NOT EXISTS idx_user_destinations_coordinates ON user_destinations USING GIST (coordinates);

CREATE INDEX IF NOT EXISTS idx_commute_data_property_id ON commute_data(property_id);
CREATE INDEX IF NOT EXISTS idx_commute_data_destination_id ON commute_data(destination_id);
CREATE INDEX IF NOT EXISTS idx_commute_data_distance ON commute_data(distance_km);

CREATE INDEX IF NOT EXISTS idx_lifestyle_scores_property_id ON lifestyle_compatibility_scores(property_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_scores_user_id ON lifestyle_compatibility_scores(user_id);
CREATE INDEX IF NOT EXISTS idx_lifestyle_scores_overall ON lifestyle_compatibility_scores(overall_score DESC);

CREATE INDEX IF NOT EXISTS idx_traffic_patterns_time ON traffic_patterns(hour_of_day, day_of_week);
CREATE INDEX IF NOT EXISTS idx_traffic_patterns_from_point ON traffic_patterns USING GIST (from_point);
CREATE INDEX IF NOT EXISTS idx_traffic_patterns_to_point ON traffic_patterns USING GIST (to_point);

-- Create function to calculate lifestyle compatibility score
CREATE OR REPLACE FUNCTION calculate_lifestyle_score(
  p_property_id UUID,
  p_user_id UUID
) RETURNS DECIMAL(3,1) AS $$
DECLARE
  total_destinations INTEGER;
  total_weighted_score DECIMAL(10,2) := 0;
  total_weight INTEGER := 0;
  destination_record RECORD;
  commute_score DECIMAL(3,1);
  final_score DECIMAL(3,1);
BEGIN
  -- Get all user destinations
  SELECT COUNT(*) INTO total_destinations
  FROM user_destinations 
  WHERE user_id = p_user_id;
  
  IF total_destinations = 0 THEN
    RETURN 5.0; -- Default neutral score
  END IF;
  
  -- Calculate weighted score based on commute times and importance
  FOR destination_record IN 
    SELECT ud.importance, cd.duration_car, cd.distance_km
    FROM user_destinations ud
    LEFT JOIN commute_data cd ON ud.id = cd.destination_id AND cd.property_id = p_property_id
    WHERE ud.user_id = p_user_id
  LOOP
    -- Score based on commute time (0-10 scale)
    IF destination_record.duration_car IS NOT NULL THEN
      IF destination_record.duration_car <= 10 THEN
        commute_score := 10.0;
      ELSIF destination_record.duration_car <= 20 THEN
        commute_score := 8.0;
      ELSIF destination_record.duration_car <= 30 THEN
        commute_score := 6.0;
      ELSIF destination_record.duration_car <= 45 THEN
        commute_score := 4.0;
      ELSIF destination_record.duration_car <= 60 THEN
        commute_score := 2.0;
      ELSE
        commute_score := 1.0;
      END IF;
    ELSE
      commute_score := 5.0; -- Default if no data
    END IF;
    
    total_weighted_score := total_weighted_score + (commute_score * destination_record.importance);
    total_weight := total_weight + destination_record.importance;
  END LOOP;
  
  IF total_weight > 0 THEN
    final_score := total_weighted_score / total_weight;
  ELSE
    final_score := 5.0;
  END IF;
  
  RETURN ROUND(final_score, 1);
END;
$$ LANGUAGE plpgsql;

-- Create function to get commute analysis for a property and user
CREATE OR REPLACE FUNCTION get_commute_analysis(
  p_property_id UUID,
  p_user_id UUID
) RETURNS JSON AS $$
DECLARE
  result JSON;
  total_daily_time INTEGER := 0;
  total_monthly_cost DECIMAL(10,2) := 0;
  destination_count INTEGER := 0;
BEGIN
  SELECT json_agg(
    json_build_object(
      'destination_id', ud.id,
      'label', ud.label,
      'category', ud.category,
      'importance', ud.importance,
      'distance_km', cd.distance_km,
      'duration_car', cd.duration_car,
      'duration_public', cd.duration_public,
      'cost_estimate', cd.cost_estimate,
      'traffic_factor', cd.traffic_factor
    )
  ) INTO result
  FROM user_destinations ud
  LEFT JOIN commute_data cd ON ud.id = cd.destination_id AND cd.property_id = p_property_id
  WHERE ud.user_id = p_user_id;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE user_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE commute_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE lifestyle_compatibility_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE traffic_patterns ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can manage their own destinations" ON user_destinations
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view commute data for their destinations" ON commute_data
  USING (
    destination_id IN (
      SELECT id FROM user_destinations WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own lifestyle scores" ON lifestyle_compatibility_scores
  USING (auth.uid() = user_id);

CREATE POLICY "Traffic patterns are publicly readable" ON traffic_patterns
  FOR SELECT USING (true);

-- Insert sample traffic patterns for major Egyptian cities
INSERT INTO traffic_patterns (from_point, to_point, hour_of_day, day_of_week, average_duration, congestion_level)
VALUES
  -- Cairo to New Capital during rush hours
  (ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326), ST_SetSRID(ST_MakePoint(31.7000, 30.0000), 4326), 8, 1, 45, 'high'),
  (ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326), ST_SetSRID(ST_MakePoint(31.7000, 30.0000), 4326), 17, 1, 50, 'severe'),
  -- Off-peak times
  (ST_SetSRID(ST_MakePoint(31.2357, 30.0444), 4326), ST_SetSRID(ST_MakePoint(31.7000, 30.0000), 4326), 14, 1, 35, 'medium')
ON CONFLICT DO NOTHING;

COMMIT; 
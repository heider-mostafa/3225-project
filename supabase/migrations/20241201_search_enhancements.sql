-- Search & Filter Enhancements Migration (Safe Version)
-- This migration adds comprehensive search capabilities including:
-- 1. Search history tracking
-- 2. Saved searches with alerts
-- 3. Geographical coordinates for map-based search
-- 4. Nearby amenities data
-- 5. Enhanced property indexing

-- Enable PostGIS extension for geographic operations
CREATE EXTENSION IF NOT EXISTS postgis;

-- Clean up any existing objects from failed migrations
DROP TABLE IF EXISTS search_analytics CASCADE;
DROP TABLE IF EXISTS property_nearby_amenities CASCADE;
DROP TABLE IF EXISTS amenities CASCADE;
DROP TABLE IF EXISTS saved_searches CASCADE;
DROP TABLE IF EXISTS search_history CASCADE;

-- Drop any existing functions that might conflict
DROP FUNCTION IF EXISTS log_search_activity CASCADE;
DROP FUNCTION IF EXISTS get_popular_search_terms CASCADE;
DROP FUNCTION IF EXISTS search_properties_near_point CASCADE;
DROP FUNCTION IF EXISTS calculate_nearby_amenities CASCADE;
DROP FUNCTION IF EXISTS advanced_property_search CASCADE;
DROP FUNCTION IF EXISTS update_property_search_fields CASCADE;

-- Add geographical coordinates to properties table (safely)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='latitude') THEN
    ALTER TABLE properties ADD COLUMN latitude DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='longitude') THEN
    ALTER TABLE properties ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='geo_point') THEN
    ALTER TABLE properties ADD COLUMN geo_point GEOGRAPHY(POINT, 4326);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='features_search') THEN
    ALTER TABLE properties ADD COLUMN features_search JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='properties' AND column_name='amenities_search') THEN
    ALTER TABLE properties ADD COLUMN amenities_search JSONB DEFAULT '[]';
  END IF;
END $$;

-- Create geo_point update function
CREATE OR REPLACE FUNCTION update_geo_point()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geo_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for geo_point updates
DROP TRIGGER IF EXISTS update_properties_geo_point ON properties;
CREATE TRIGGER update_properties_geo_point
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_geo_point();

-- Function to update search fields
CREATE OR REPLACE FUNCTION update_property_search_fields()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.features IS NOT NULL THEN
    NEW.features_search = NEW.features;
  END IF;
  
  IF NEW.amenities IS NOT NULL THEN
    NEW.amenities_search = NEW.amenities;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search fields
DROP TRIGGER IF EXISTS update_property_search_fields_trigger ON properties;
CREATE TRIGGER update_property_search_fields_trigger
  BEFORE INSERT OR UPDATE ON properties
  FOR EACH ROW
  EXECUTE FUNCTION update_property_search_fields();

-- Create new tables
CREATE TABLE search_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query TEXT,
  filters JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  search_query TEXT,
  filters JSONB DEFAULT '{}',
  alert_enabled BOOLEAN DEFAULT FALSE,
  alert_frequency VARCHAR(20) DEFAULT 'daily',
  last_alert_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL UNIQUE,
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE property_nearby_amenities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  amenity_id UUID REFERENCES amenities(id) ON DELETE CASCADE,
  distance_km DECIMAL(8, 3),
  walking_time_minutes INTEGER,
  driving_time_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(property_id, amenity_id)
);

CREATE TABLE search_analytics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_term TEXT,
  filters_used JSONB DEFAULT '{}',
  results_count INTEGER DEFAULT 0,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  click_through_rate DECIMAL(5, 4),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX properties_geo_point_idx ON properties USING GIST (geo_point);
CREATE INDEX properties_location_idx ON properties (city, state);
CREATE INDEX properties_search_idx ON properties 
  USING GIN (to_tsvector('english', title || ' ' || COALESCE(description, '') || ' ' || address || ' ' || city || ' ' || state));

CREATE INDEX search_history_user_id_idx ON search_history (user_id);
CREATE INDEX search_history_created_at_idx ON search_history (created_at DESC);
CREATE INDEX search_history_filters_idx ON search_history USING GIN (filters);

CREATE INDEX saved_searches_user_id_idx ON saved_searches (user_id);
CREATE INDEX saved_searches_alerts_idx ON saved_searches (alert_enabled, alert_frequency);

CREATE INDEX property_nearby_amenities_property_id_idx ON property_nearby_amenities (property_id);
CREATE INDEX property_nearby_amenities_distance_idx ON property_nearby_amenities (distance_km);

CREATE INDEX search_analytics_search_term_idx ON search_analytics (search_term);
CREATE INDEX search_analytics_created_at_idx ON search_analytics (created_at DESC);

-- Populate amenities
INSERT INTO amenities (name, category, icon) VALUES
('Shopping Mall', 'shopping', 'ShoppingBag'),
('Supermarket', 'shopping', 'ShoppingCart'),
('Pharmacy', 'shopping', 'Plus'),
('Bank', 'shopping', 'CreditCard'),
('Hospital', 'healthcare', 'Cross'),
('Clinic', 'healthcare', 'Stethoscope'),
('Dental Clinic', 'healthcare', 'Smile'),
('Emergency Services', 'healthcare', 'Ambulance'),
('Primary School', 'education', 'GraduationCap'),
('Secondary School', 'education', 'School'),
('University', 'education', 'BookOpen'),
('International School', 'education', 'Globe'),
('Metro Station', 'transportation', 'Train'),
('Bus Stop', 'transportation', 'Bus'),
('Airport', 'transportation', 'Plane'),
('Taxi Stand', 'transportation', 'Car'),
('Park', 'recreation', 'Trees'),
('Gym', 'recreation', 'Dumbbell'),
('Swimming Pool', 'recreation', 'Waves'),
('Sports Club', 'recreation', 'Trophy'),
('Cinema', 'recreation', 'Film'),
('Restaurant', 'recreation', 'Utensils'),
('Cafe', 'recreation', 'Coffee');

-- Create functions
CREATE OR REPLACE FUNCTION log_search_activity(
  p_user_id UUID,
  p_search_query TEXT,
  p_filters JSONB DEFAULT '{}',
  p_results_count INTEGER DEFAULT 0,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  search_id UUID;
BEGIN
  INSERT INTO search_history (
    user_id, search_query, filters, results_count, ip_address, user_agent
  ) VALUES (
    p_user_id, p_search_query, p_filters, p_results_count, p_ip_address, p_user_agent
  ) RETURNING id INTO search_id;
  
  INSERT INTO search_analytics (
    search_term, filters_used, results_count, user_id
  ) VALUES (
    p_search_query, p_filters, p_results_count, p_user_id
  );
  
  RETURN search_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_popular_search_terms(days_back INTEGER DEFAULT 30)
RETURNS TABLE (
  search_term TEXT,
  search_count BIGINT,
  avg_results INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sa.search_term,
    COUNT(*) as search_count,
    AVG(sa.results_count)::INTEGER as avg_results
  FROM search_analytics sa
  WHERE sa.created_at >= NOW() - INTERVAL '1 day' * days_back
    AND sa.search_term IS NOT NULL
    AND LENGTH(sa.search_term) > 2
  GROUP BY sa.search_term
  ORDER BY search_count DESC
  LIMIT 20;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION search_properties_near_point(
  lat DECIMAL,
  lng DECIMAL,
  radius_km DECIMAL DEFAULT 5.0,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE (
  property_id UUID,
  title VARCHAR(255),
  distance_km DECIMAL(8, 3)
) AS $$
DECLARE
  search_point GEOGRAPHY;
BEGIN
  search_point := ST_SetSRID(ST_MakePoint(lng, lat), 4326);
  
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    (ST_Distance(p.geo_point, search_point) / 1000)::DECIMAL(8, 3) as distance_km
  FROM properties p
  WHERE p.geo_point IS NOT NULL
    AND ST_DWithin(p.geo_point, search_point, radius_km * 1000)
    AND p.status = 'active'
  ORDER BY ST_Distance(p.geo_point, search_point)
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Add sample coordinates (only for properties without coordinates)
UPDATE properties SET 
  latitude = 30.0444 + (random() - 0.5) * 0.1,
  longitude = 31.2357 + (random() - 0.5) * 0.1
WHERE latitude IS NULL AND city ILIKE '%cairo%';

UPDATE properties SET 
  latitude = 31.2001 + (random() - 0.5) * 0.05,
  longitude = 29.9187 + (random() - 0.5) * 0.05
WHERE latitude IS NULL AND city ILIKE '%alexandria%';

UPDATE properties SET 
  latitude = 30.0626 + (random() - 0.5) * 0.05,
  longitude = 31.2497 + (random() - 0.5) * 0.05
WHERE latitude IS NULL AND city ILIKE '%giza%';

-- Enable RLS
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_nearby_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own search history" ON search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own search history" ON search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own search history" ON search_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own saved searches" ON saved_searches
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own saved searches" ON saved_searches
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Amenities are viewable by everyone" ON amenities
  FOR SELECT USING (true);

CREATE POLICY "Property amenities are viewable by everyone" ON property_nearby_amenities
  FOR SELECT USING (true);

CREATE POLICY "Admin can view search analytics" ON search_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Grant permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated; 
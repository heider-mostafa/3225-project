-- Enhanced Property Schema Migration
-- Ensures all fields needed for comprehensive property forms are available

-- Add missing fields to properties table
DO $$
BEGIN
  -- Basic property information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lot_size') THEN
    ALTER TABLE properties ADD COLUMN lot_size DECIMAL(12,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'year_built') THEN
    ALTER TABLE properties ADD COLUMN year_built INTEGER;
  END IF;
  
  -- Location fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'latitude') THEN
    ALTER TABLE properties ADD COLUMN latitude DECIMAL(10, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'longitude') THEN
    ALTER TABLE properties ADD COLUMN longitude DECIMAL(11, 8);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'neighborhood') THEN
    ALTER TABLE properties ADD COLUMN neighborhood TEXT;
  END IF;
  
  -- Property condition and features
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'property_condition') THEN
    ALTER TABLE properties ADD COLUMN property_condition TEXT DEFAULT 'good' CHECK (property_condition IN ('excellent', 'very_good', 'good', 'fair', 'needs_work'));
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'features') THEN
    ALTER TABLE properties ADD COLUMN features JSONB DEFAULT '[]';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'amenities') THEN
    ALTER TABLE properties ADD COLUMN amenities JSONB DEFAULT '[]';
  END IF;
  
  -- Utility and infrastructure
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'heating_type') THEN
    ALTER TABLE properties ADD COLUMN heating_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'cooling_type') THEN
    ALTER TABLE properties ADD COLUMN cooling_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'water_source') THEN
    ALTER TABLE properties ADD COLUMN water_source TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'sewer_type') THEN
    ALTER TABLE properties ADD COLUMN sewer_type TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'internet_speed') THEN
    ALTER TABLE properties ADD COLUMN internet_speed TEXT;
  END IF;
  
  -- Financial information
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'monthly_hoa_fee') THEN
    ALTER TABLE properties ADD COLUMN monthly_hoa_fee DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'annual_property_tax') THEN
    ALTER TABLE properties ADD COLUMN annual_property_tax DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'insurance_cost') THEN
    ALTER TABLE properties ADD COLUMN insurance_cost DECIMAL(10,2) DEFAULT 0;
  END IF;
  
  -- Property specifications
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'floor_level') THEN
    ALTER TABLE properties ADD COLUMN floor_level INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'total_floors') THEN
    ALTER TABLE properties ADD COLUMN total_floors INTEGER;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'balconies') THEN
    ALTER TABLE properties ADD COLUMN balconies INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'parking_spaces') THEN
    ALTER TABLE properties ADD COLUMN parking_spaces INTEGER DEFAULT 0;
  END IF;
  
  -- Availability and scheduling
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'available_date') THEN
    ALTER TABLE properties ADD COLUMN available_date DATE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'lease_terms') THEN
    ALTER TABLE properties ADD COLUMN lease_terms TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'pet_policy') THEN
    ALTER TABLE properties ADD COLUMN pet_policy TEXT DEFAULT 'not_allowed' CHECK (pet_policy IN ('allowed', 'cats_only', 'dogs_only', 'not_allowed', 'deposit_required'));
  END IF;
  
  -- Virtual tour and media
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'virtual_tour_url') THEN
    ALTER TABLE properties ADD COLUMN virtual_tour_url TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'video_tour_url') THEN
    ALTER TABLE properties ADD COLUMN video_tour_url TEXT;
  END IF;
  
  -- Property highlights and selling points
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'key_features') THEN
    ALTER TABLE properties ADD COLUMN key_features TEXT[];
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'recent_updates') THEN
    ALTER TABLE properties ADD COLUMN recent_updates JSONB;
  END IF;
  
  -- Admin and marketing fields
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'marketing_headline') THEN
    ALTER TABLE properties ADD COLUMN marketing_headline TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'internal_notes') THEN
    ALTER TABLE properties ADD COLUMN internal_notes TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'seo_title') THEN
    ALTER TABLE properties ADD COLUMN seo_title TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'seo_description') THEN
    ALTER TABLE properties ADD COLUMN seo_description TEXT;
  END IF;
  
  -- Distance and accessibility fields (if not exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'compound') THEN
    ALTER TABLE properties ADD COLUMN compound TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'distance_to_metro') THEN
    ALTER TABLE properties ADD COLUMN distance_to_metro DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'distance_to_airport') THEN
    ALTER TABLE properties ADD COLUMN distance_to_airport DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'distance_to_mall') THEN
    ALTER TABLE properties ADD COLUMN distance_to_mall DECIMAL(5,2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'distance_to_hospital') THEN
    ALTER TABLE properties ADD COLUMN distance_to_hospital DECIMAL(5,2);
  END IF;
  
  -- Boolean amenity fields (if not exist)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'furnished') THEN
    ALTER TABLE properties ADD COLUMN furnished BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_pool') THEN
    ALTER TABLE properties ADD COLUMN has_pool BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_garden') THEN
    ALTER TABLE properties ADD COLUMN has_garden BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_security') THEN
    ALTER TABLE properties ADD COLUMN has_security BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_parking') THEN
    ALTER TABLE properties ADD COLUMN has_parking BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_gym') THEN
    ALTER TABLE properties ADD COLUMN has_gym BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_playground') THEN
    ALTER TABLE properties ADD COLUMN has_playground BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_community_center') THEN
    ALTER TABLE properties ADD COLUMN has_community_center BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_elevator') THEN
    ALTER TABLE properties ADD COLUMN has_elevator BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_balcony') THEN
    ALTER TABLE properties ADD COLUMN has_balcony BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_terrace') THEN
    ALTER TABLE properties ADD COLUMN has_terrace BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_storage') THEN
    ALTER TABLE properties ADD COLUMN has_storage BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_maid_room') THEN
    ALTER TABLE properties ADD COLUMN has_maid_room BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'has_driver_room') THEN
    ALTER TABLE properties ADD COLUMN has_driver_room BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_properties_lot_size ON properties(lot_size);
CREATE INDEX IF NOT EXISTS idx_properties_year_built ON properties(year_built);
CREATE INDEX IF NOT EXISTS idx_properties_latitude ON properties(latitude);
CREATE INDEX IF NOT EXISTS idx_properties_longitude ON properties(longitude);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_property_condition ON properties(property_condition);
CREATE INDEX IF NOT EXISTS idx_properties_features ON properties USING GIN (features);
CREATE INDEX IF NOT EXISTS idx_properties_amenities ON properties USING GIN (amenities);
CREATE INDEX IF NOT EXISTS idx_properties_monthly_hoa_fee ON properties(monthly_hoa_fee);
CREATE INDEX IF NOT EXISTS idx_properties_annual_property_tax ON properties(annual_property_tax);
CREATE INDEX IF NOT EXISTS idx_properties_floor_level ON properties(floor_level);
CREATE INDEX IF NOT EXISTS idx_properties_parking_spaces ON properties(parking_spaces);
CREATE INDEX IF NOT EXISTS idx_properties_available_date ON properties(available_date);
CREATE INDEX IF NOT EXISTS idx_properties_pet_policy ON properties(pet_policy);

-- Update existing properties with default values where needed
UPDATE properties SET 
  features = COALESCE(features, '[]'::jsonb),
  amenities = COALESCE(amenities, '[]'::jsonb),
  parking_spaces = COALESCE(parking_spaces, 0),
  balconies = COALESCE(balconies, 0),
  monthly_hoa_fee = COALESCE(monthly_hoa_fee, 0),
  annual_property_tax = COALESCE(annual_property_tax, 0),
  insurance_cost = COALESCE(insurance_cost, 0)
WHERE features IS NULL OR amenities IS NULL OR parking_spaces IS NULL; 
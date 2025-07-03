-- Create properties table
CREATE TABLE properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(12,2) NOT NULL,
  bedrooms INTEGER,
  bathrooms INTEGER,
  square_feet INTEGER,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  property_type TEXT NOT NULL,
  status TEXT NOT NULL,
  year_built INTEGER,
  view_count INTEGER DEFAULT 0,
  compound TEXT,
  nearest_schools JSONB,
  amenities JSONB,
  distance_to_metro DECIMAL(5,2),
  distance_to_airport DECIMAL(5,2),
  distance_to_mall DECIMAL(5,2),
  distance_to_hospital DECIMAL(5,2),
  furnished BOOLEAN DEFAULT false,
  has_pool BOOLEAN DEFAULT false,
  has_garden BOOLEAN DEFAULT false,
  has_security BOOLEAN DEFAULT false,
  has_parking BOOLEAN DEFAULT false,
  has_gym BOOLEAN DEFAULT false,
  has_playground BOOLEAN DEFAULT false,
  has_community_center BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_photos table
CREATE TABLE property_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for properties table
CREATE INDEX idx_properties_property_type ON properties(property_type);
CREATE INDEX idx_properties_status ON properties(status);
CREATE INDEX idx_properties_price ON properties(price);
CREATE INDEX idx_properties_city ON properties(city);
CREATE INDEX idx_properties_state ON properties(state);
CREATE INDEX idx_properties_created_at ON properties(created_at);
CREATE INDEX idx_properties_compound ON properties(compound);
CREATE INDEX idx_properties_furnished ON properties(furnished);
CREATE INDEX idx_properties_has_pool ON properties(has_pool);
CREATE INDEX idx_properties_has_garden ON properties(has_garden);
CREATE INDEX idx_properties_has_security ON properties(has_security);
CREATE INDEX idx_properties_has_parking ON properties(has_parking);
CREATE INDEX idx_properties_has_gym ON properties(has_gym);
CREATE INDEX idx_properties_has_playground ON properties(has_playground);
CREATE INDEX idx_properties_has_community_center ON properties(has_community_center);

-- Create index for property_photos
CREATE INDEX idx_property_photos_property_id ON property_photos(property_id);

-- Enable RLS
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_photos ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to properties"
  ON properties FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to property_photos"
  ON property_photos FOR SELECT
  USING (true);

-- Create storage bucket for property photos
INSERT INTO storage.buckets (id, name, public) VALUES ('property-photos', 'property-photos', true);

-- Create storage policy for property photos
CREATE POLICY "Allow public read access to property photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-photos');

-- Create storage policy for property photo uploads (only authenticated users)
CREATE POLICY "Allow authenticated uploads to property photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-photos' 
    AND auth.role() = 'authenticated'
  ); 
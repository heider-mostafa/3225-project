-- Create property_financials table
CREATE TABLE property_financials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  listing_price DECIMAL(12,2),
  price_history JSONB,
  property_taxes JSONB,
  hoa_fees JSONB,
  financing JSONB,
  market_analysis JSONB,
  incentives TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_legal table
CREATE TABLE property_legal (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  property_disclosures JSONB,
  title_info JSONB,
  zoning JSONB,
  permits JSONB,
  association_rules JSONB,
  contract_terms JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_scheduling table
CREATE TABLE property_scheduling (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  available_viewings JSONB,
  key_contact_info JSONB,
  access_instructions JSONB,
  restrictions JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_analytics table
CREATE TABLE property_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_views table
CREATE TABLE property_views (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  user_agent TEXT,
  ip_address TEXT
);

-- Create function to increment property views
CREATE OR REPLACE FUNCTION increment_property_views(property_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE properties
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = property_id;
END;
$$ LANGUAGE plpgsql;

-- Add view_count column to properties table if it doesn't exist
ALTER TABLE properties ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_property_financials_property_id ON property_financials(property_id);
CREATE INDEX IF NOT EXISTS idx_property_legal_property_id ON property_legal(property_id);
CREATE INDEX IF NOT EXISTS idx_property_scheduling_property_id ON property_scheduling(property_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_property_id ON property_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_property_views_property_id ON property_views(property_id);
CREATE INDEX IF NOT EXISTS idx_property_analytics_event_type ON property_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_property_analytics_created_at ON property_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_property_views_viewed_at ON property_views(viewed_at);

-- Add RLS policies
ALTER TABLE property_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_legal ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_scheduling ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_views ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read access to property_financials"
  ON property_financials FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to property_legal"
  ON property_legal FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to property_scheduling"
  ON property_scheduling FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to property_analytics"
  ON property_analytics FOR SELECT
  USING (true);

CREATE POLICY "Allow public read access to property_views"
  ON property_views FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to property_analytics"
  ON property_analytics FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public insert access to property_views"
  ON property_views FOR INSERT
  WITH CHECK (true); 
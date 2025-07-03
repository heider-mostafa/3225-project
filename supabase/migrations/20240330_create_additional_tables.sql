-- Create property_financials table
CREATE TABLE property_financials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  monthly_rent DECIMAL(12,2),
  annual_income DECIMAL(12,2),
  operating_expenses DECIMAL(12,2),
  net_operating_income DECIMAL(12,2),
  cap_rate DECIMAL(5,2),
  cash_on_cash_return DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_legal table
CREATE TABLE property_legal (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  title_status TEXT,
  zoning_type TEXT,
  property_tax DECIMAL(12,2),
  insurance_cost DECIMAL(12,2),
  hoa_fees DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_scheduling table
CREATE TABLE property_scheduling (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  available_from TIMESTAMP WITH TIME ZONE,
  available_to TIMESTAMP WITH TIME ZONE,
  viewing_hours JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes
CREATE INDEX idx_property_financials_property_id ON property_financials(property_id);
CREATE INDEX idx_property_legal_property_id ON property_legal(property_id);
CREATE INDEX idx_property_scheduling_property_id ON property_scheduling(property_id);

-- Enable RLS
ALTER TABLE property_financials ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_legal ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_scheduling ENABLE ROW LEVEL SECURITY;

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
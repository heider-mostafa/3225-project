-- Create missing pending properties tables (fixed version)
-- Handle existing policies gracefully

-- Create pending_properties table
CREATE TABLE IF NOT EXISTS pending_properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assignment_id UUID REFERENCES photographer_assignments(id) ON DELETE CASCADE,
  photographer_id UUID REFERENCES photographers(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Status and admin review
  status TEXT DEFAULT 'photos_uploaded' CHECK (status IN ('photos_uploaded', 'under_review', 'approved', 'rejected')),
  admin_feedback TEXT,
  admin_notes TEXT,
  
  -- Photographer information
  photographer_notes TEXT,
  recommended_shots TEXT,
  property_condition TEXT,
  best_features TEXT,
  shooting_challenges TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create pending_property_photos table
CREATE TABLE IF NOT EXISTS pending_property_photos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  pending_property_id UUID REFERENCES pending_properties(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  order_index INTEGER,
  photographer_caption TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on the new tables (only if not already enabled)
ALTER TABLE pending_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_property_photos ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Allow all operations on pending_properties_simple" ON pending_properties;
DROP POLICY IF EXISTS "Allow all operations on pending_property_photos_simple" ON pending_property_photos;

-- Add simple permissive policies
CREATE POLICY "Allow all operations on pending_properties_simple"
ON pending_properties
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations on pending_property_photos_simple"
ON pending_property_photos
FOR ALL
TO authenticated, anon, service_role
USING (true)
WITH CHECK (true);

-- Create indexes for better performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_pending_properties_assignment_id ON pending_properties(assignment_id);
CREATE INDEX IF NOT EXISTS idx_pending_properties_photographer_id ON pending_properties(photographer_id);
CREATE INDEX IF NOT EXISTS idx_pending_properties_lead_id ON pending_properties(lead_id);
CREATE INDEX IF NOT EXISTS idx_pending_properties_status ON pending_properties(status);
CREATE INDEX IF NOT EXISTS idx_pending_property_photos_pending_property_id ON pending_property_photos(pending_property_id);
CREATE INDEX IF NOT EXISTS idx_pending_property_photos_is_primary ON pending_property_photos(is_primary);
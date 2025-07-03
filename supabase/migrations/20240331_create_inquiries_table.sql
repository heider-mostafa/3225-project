-- Create inquiries table
CREATE TABLE inquiries (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new', -- 'new', 'pending', 'responded', 'closed'
  source TEXT, -- 'website', 'phone', 'email', 'agent'
  priority TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  response_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for performance
CREATE INDEX idx_inquiries_property_id ON inquiries(property_id);
CREATE INDEX idx_inquiries_user_id ON inquiries(user_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);
CREATE INDEX idx_inquiries_priority ON inquiries(priority);
CREATE INDEX idx_inquiries_created_at ON inquiries(created_at);
CREATE INDEX idx_inquiries_assigned_to ON inquiries(assigned_to);

-- Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow public read access to inquiries"
  ON inquiries FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access to inquiries"
  ON inquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow admins to update inquiries"
  ON inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

CREATE POLICY "Allow admins to delete inquiries"
  ON inquiries FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = auth.uid() 
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create trigger to update updated_at column
CREATE OR REPLACE FUNCTION update_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc'::text, NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_inquiries_updated_at
  BEFORE UPDATE ON inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_inquiries_updated_at();

-- Insert some sample inquiries for testing
INSERT INTO inquiries (property_id, name, email, phone, message, status, source, priority) 
SELECT 
  p.id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'Ahmed Hassan'
    WHEN 1 THEN 'Sarah Mohammed'
    WHEN 2 THEN 'Omar Ali'
    ELSE 'Fatima Ahmed'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'ahmed.hassan@email.com'
    WHEN 1 THEN 'sarah.mohammed@email.com'
    WHEN 2 THEN 'omar.ali@email.com'
    ELSE 'fatima.ahmed@email.com'
  END,
  '+20 ' || (1000000000 + (random() * 99999999)::bigint)::text,
  CASE (random() * 3)::int
    WHEN 0 THEN 'I am interested in viewing this property. Please contact me to schedule a visit.'
    WHEN 1 THEN 'Could you provide more information about the amenities and nearby facilities?'
    ELSE 'I would like to know about the financing options available for this property.'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'new'
    WHEN 1 THEN 'pending'
    WHEN 2 THEN 'responded'
    ELSE 'closed'
  END,
  CASE (random() * 3)::int
    WHEN 0 THEN 'website'
    WHEN 1 THEN 'phone'
    ELSE 'email'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    WHEN 2 THEN 'high'
    ELSE 'urgent'
  END
FROM properties p
WHERE random() < 0.7  -- Create inquiries for about 70% of properties
LIMIT 50; -- Limit to 50 sample inquiries 
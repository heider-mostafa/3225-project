-- Support for photographer assignments on appraised properties
-- Add property_id column to photographer_assignments table to support both lead-based and property-based assignments

-- Add property_id column to photographer_assignments
ALTER TABLE photographer_assignments 
ADD COLUMN IF NOT EXISTS property_id UUID REFERENCES properties(id) ON DELETE CASCADE;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_photographer_assignments_property_id ON photographer_assignments(property_id);

-- Allow lead_id to be nullable since appraised properties don't have leads
ALTER TABLE photographer_assignments 
ALTER COLUMN lead_id DROP NOT NULL;

-- Update RLS policy to allow photographers to view assignments for both leads and properties
DROP POLICY IF EXISTS "Photographers can view their assignments" ON photographer_assignments;

CREATE POLICY "Photographers can view their assignments" ON photographer_assignments
  FOR SELECT USING (
    photographer_id IN (
      SELECT p.id FROM photographers p
      WHERE p.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Add policy for admins to manage photographer assignments
CREATE POLICY "Admins can manage photographer assignments" ON photographer_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Add constraint to ensure either lead_id or property_id is provided (but not both)
ALTER TABLE photographer_assignments 
ADD CONSTRAINT check_assignment_type 
CHECK (
  (lead_id IS NOT NULL AND property_id IS NULL) OR 
  (lead_id IS NULL AND property_id IS NOT NULL)
);
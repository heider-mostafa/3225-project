-- Add features column to properties table
ALTER TABLE properties ADD COLUMN features JSONB;

-- Create index for the features column for better query performance
CREATE INDEX idx_properties_features ON properties USING GIN (features); 
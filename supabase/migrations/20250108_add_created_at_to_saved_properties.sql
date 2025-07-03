-- Add missing created_at column to saved_properties table
ALTER TABLE saved_properties 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW());

-- Update existing rows to have a created_at timestamp
UPDATE saved_properties 
SET created_at = TIMEZONE('utc'::text, NOW()) 
WHERE created_at IS NULL; 
-- Fix pending_properties table to ensure id column has proper UUID default

-- First check if uuid-ossp extension is enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Fix the id column to have proper UUID default
ALTER TABLE pending_properties 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Also fix pending_property_photos table
ALTER TABLE pending_property_photos 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

-- Verify the table structure
\d pending_properties
\d pending_property_photos
-- Migration: Convert square_feet to square_meters
-- Date: 2024-12-24
-- Description: Rename square_feet column to square_meters and convert values from sq ft to sq m

BEGIN;

-- Step 1: Add new square_meters column
ALTER TABLE properties ADD COLUMN IF NOT EXISTS square_meters INTEGER;

-- Step 2: Convert existing square_feet data to square_meters (1 sq ft = 0.092903 sq m)
UPDATE properties 
SET square_meters = ROUND(square_feet * 0.092903)
WHERE square_feet IS NOT NULL;

-- Step 3: Update any other tables that might reference square_feet
-- (Add more tables here if needed)

-- Step 4: Drop the old square_feet column
ALTER TABLE properties DROP COLUMN IF EXISTS square_feet;

-- Step 5: Update any indexes that referenced square_feet
DROP INDEX IF EXISTS idx_properties_square_feet;
CREATE INDEX IF NOT EXISTS idx_properties_square_meters ON properties(square_meters);

-- Step 6: Update any RLS policies that might reference square_feet
-- (No specific policies found that reference square_feet)

COMMIT; 
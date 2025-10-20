-- Portfolio Sync Enhancement Migration
-- Adds source_appraisal_id to track which portfolio items came from appraisals
-- Date: 2025-01-18

-- Add source_appraisal_id to appraiser_portfolio table
ALTER TABLE appraiser_portfolio 
ADD COLUMN IF NOT EXISTS source_appraisal_id UUID REFERENCES property_appraisals(id) ON DELETE SET NULL;

-- Add unique index to prevent duplicate portfolio items from same appraisal
CREATE UNIQUE INDEX unique_portfolio_source 
ON appraiser_portfolio(appraiser_id, source_appraisal_id) 
WHERE source_appraisal_id IS NOT NULL;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_appraiser_portfolio_source_appraisal 
ON appraiser_portfolio(source_appraisal_id) 
WHERE source_appraisal_id IS NOT NULL;

-- Add appraisal_challenges field for better portfolio descriptions
ALTER TABLE appraiser_portfolio 
ADD COLUMN IF NOT EXISTS appraisal_challenges TEXT;

-- Update existing portfolio sync tracking
-- Add completion tracking fields
ALTER TABLE appraiser_portfolio 
ADD COLUMN IF NOT EXISTS auto_generated BOOLEAN DEFAULT false;

-- Comment the new fields
COMMENT ON COLUMN appraiser_portfolio.source_appraisal_id IS 'Links portfolio item to the source appraisal that generated it';
COMMENT ON COLUMN appraiser_portfolio.appraisal_challenges IS 'Description of challenges or complexity in the appraisal';
COMMENT ON COLUMN appraiser_portfolio.auto_generated IS 'Whether this portfolio item was automatically generated from an appraisal';

-- Create statistics tracking enhancement
-- Update property statistics with more detailed tracking
ALTER TABLE appraiser_property_statistics 
ADD COLUMN IF NOT EXISTS price_range_min BIGINT;

ALTER TABLE appraiser_property_statistics 
ADD COLUMN IF NOT EXISTS price_range_max BIGINT;

ALTER TABLE appraiser_property_statistics 
ADD COLUMN IF NOT EXISTS last_appraisal_date DATE;

-- Update RLS policies for the new source_appraisal_id field
-- No additional RLS changes needed as existing policies cover the table
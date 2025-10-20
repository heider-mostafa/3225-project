-- Enhanced Property Photos Source Tracking
-- Adds source tracking for appraisal-extracted images

-- Add new columns to property_photos table
ALTER TABLE property_photos 
ADD COLUMN IF NOT EXISTS source VARCHAR(20) DEFAULT 'manual' CHECK (source IN ('manual', 'appraisal_extracted')),
ADD COLUMN IF NOT EXISTS appraisal_id UUID REFERENCES property_appraisals(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS document_page INTEGER,
ADD COLUMN IF NOT EXISTS original_category TEXT,
ADD COLUMN IF NOT EXISTS extraction_metadata JSONB DEFAULT '{}';

-- Create index for efficient querying by source
CREATE INDEX IF NOT EXISTS idx_property_photos_source ON property_photos(source);
CREATE INDEX IF NOT EXISTS idx_property_photos_appraisal_id ON property_photos(appraisal_id);

-- Add comments for documentation
COMMENT ON COLUMN property_photos.source IS 'Source of the image: manual (uploaded by user) or appraisal_extracted (from document)';
COMMENT ON COLUMN property_photos.appraisal_id IS 'Reference to the appraisal that extracted this image';
COMMENT ON COLUMN property_photos.document_page IS 'Page number in the source document where image was found';
COMMENT ON COLUMN property_photos.original_category IS 'Original category assigned during extraction before mapping';
COMMENT ON COLUMN property_photos.extraction_metadata IS 'Additional metadata from extraction process (confidence, description, etc.)';

-- Update RLS policies to handle appraisal images
-- First, drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow authenticated users to view appraisal images" ON property_photos;
DROP POLICY IF EXISTS "Allow admin and appraisers to insert appraisal images" ON property_photos;

-- Allow authenticated users to view appraisal images
CREATE POLICY "Allow authenticated users to view appraisal images" ON property_photos
    FOR SELECT USING (auth.role() = 'authenticated' AND source = 'appraisal_extracted');

-- Allow admin and appraisers to insert appraisal images
CREATE POLICY "Allow admin and appraisers to insert appraisal images" ON property_photos
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND 
        source = 'appraisal_extracted' AND
        (
            -- Admin can always insert
            EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'))
            OR
            -- Appraiser can insert for their own appraisals
            EXISTS (
                SELECT 1 FROM property_appraisals pa 
                JOIN brokers b ON pa.appraiser_id = b.id 
                WHERE pa.id = appraisal_id AND b.user_id = auth.uid()
            )
        )
    );
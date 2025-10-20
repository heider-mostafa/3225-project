-- Add missing columns to rental_listings and rental_amenities tables
-- This migration adds all columns that the frontend expects but are missing from the schema

-- ===============================================
-- RENTAL LISTINGS TABLE - MISSING COLUMNS
-- ===============================================

-- Booking Rules & Policies Extensions
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS advance_notice_days INTEGER DEFAULT 0;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS booking_window_days INTEGER DEFAULT 365;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS max_guests INTEGER;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS allow_extra_guests BOOLEAN DEFAULT false;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS require_verification BOOLEAN DEFAULT false;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS require_profile_photo BOOLEAN DEFAULT false;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS allow_business_travelers BOOLEAN DEFAULT false;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS weekend_pricing BOOLEAN DEFAULT false;

-- Media & Virtual Tours
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS virtual_tour_url TEXT;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS video_tour_url TEXT;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS media_urls JSONB DEFAULT '[]'::jsonb;

-- Availability Management
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS available_from DATE;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS available_until DATE;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS default_available_days JSONB DEFAULT '[0,1,2,3,4,5,6]'::jsonb;

-- Custom Fields
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS custom_amenities TEXT;
ALTER TABLE rental_listings ADD COLUMN IF NOT EXISTS availability_calendar JSONB DEFAULT '[]'::jsonb;

-- ===============================================
-- RENTAL AMENITIES TABLE - MISSING COLUMNS
-- ===============================================

-- Additional Amenity Fields
ALTER TABLE rental_amenities ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false;
ALTER TABLE rental_amenities ADD COLUMN IF NOT EXISTS has_valet_parking BOOLEAN DEFAULT false;
ALTER TABLE rental_amenities ADD COLUMN IF NOT EXISTS has_beach_access BOOLEAN DEFAULT false;
ALTER TABLE rental_amenities ADD COLUMN IF NOT EXISTS has_city_view BOOLEAN DEFAULT false;

-- ===============================================
-- INDEXES FOR PERFORMANCE
-- ===============================================

-- Create indexes for commonly queried new columns
CREATE INDEX IF NOT EXISTS idx_rental_listings_max_guests ON rental_listings(max_guests);
CREATE INDEX IF NOT EXISTS idx_rental_listings_available_from ON rental_listings(available_from);
CREATE INDEX IF NOT EXISTS idx_rental_listings_available_until ON rental_listings(available_until);
CREATE INDEX IF NOT EXISTS idx_rental_listings_advance_notice ON rental_listings(advance_notice_days);
CREATE INDEX IF NOT EXISTS idx_rental_listings_booking_window ON rental_listings(booking_window_days);

-- ===============================================
-- COMMENTS FOR DOCUMENTATION
-- ===============================================

COMMENT ON COLUMN rental_listings.advance_notice_days IS 'Minimum days in advance guests must book';
COMMENT ON COLUMN rental_listings.booking_window_days IS 'Maximum days in advance guests can book';
COMMENT ON COLUMN rental_listings.max_guests IS 'Maximum number of guests allowed';
COMMENT ON COLUMN rental_listings.allow_extra_guests IS 'Whether extra guests beyond max are allowed (with fee)';
COMMENT ON COLUMN rental_listings.require_verification IS 'Require government ID verification from guests';
COMMENT ON COLUMN rental_listings.require_profile_photo IS 'Require guests to have profile photo';
COMMENT ON COLUMN rental_listings.allow_business_travelers IS 'Special accommodation for business travelers';
COMMENT ON COLUMN rental_listings.weekend_pricing IS 'Enable weekend pricing surcharge';
COMMENT ON COLUMN rental_listings.virtual_tour_url IS 'URL for virtual tour (Matterport, etc.)';
COMMENT ON COLUMN rental_listings.video_tour_url IS 'URL for video tour (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN rental_listings.media_urls IS 'Array of additional media URLs (photos, videos)';
COMMENT ON COLUMN rental_listings.available_from IS 'Start date for rental availability';
COMMENT ON COLUMN rental_listings.available_until IS 'End date for rental availability (optional)';
COMMENT ON COLUMN rental_listings.default_available_days IS 'Array of available days of week (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN rental_listings.custom_amenities IS 'Custom amenities description';
COMMENT ON COLUMN rental_listings.availability_calendar IS 'Calendar configuration and custom availability rules';

COMMENT ON COLUMN rental_amenities.has_parking IS 'Free parking availability';
COMMENT ON COLUMN rental_amenities.has_valet_parking IS 'Valet parking service available';
COMMENT ON COLUMN rental_amenities.has_beach_access IS 'Direct beach access available';
COMMENT ON COLUMN rental_amenities.has_city_view IS 'City view from property';

-- ===============================================
-- UPDATE EXISTING RECORDS WITH SENSIBLE DEFAULTS
-- ===============================================

-- Set reasonable defaults for existing rental listings
UPDATE rental_listings 
SET 
    max_guests = CASE 
        WHEN EXISTS (
            SELECT 1 FROM properties 
            WHERE properties.id = rental_listings.property_id 
            AND properties.bedrooms IS NOT NULL
        ) 
        THEN (
            SELECT properties.bedrooms * 2 + 2 
            FROM properties 
            WHERE properties.id = rental_listings.property_id
        )
        ELSE 4
    END
WHERE max_guests IS NULL;

-- Set available_from to today for existing active listings
UPDATE rental_listings 
SET available_from = CURRENT_DATE 
WHERE available_from IS NULL AND is_active = true;

-- Set advance_notice_days based on rental_type
UPDATE rental_listings 
SET advance_notice_days = CASE 
    WHEN rental_type = 'short_term' THEN 1
    WHEN rental_type = 'long_term' THEN 7
    ELSE 2
END
WHERE advance_notice_days = 0;
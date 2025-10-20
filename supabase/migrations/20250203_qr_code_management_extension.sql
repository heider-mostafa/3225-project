-- ===============================================
-- QR CODE MANAGEMENT SYSTEM EXTENSION
-- Extends existing rental booking system with comprehensive QR code management
-- Date: 2025-02-03
-- ===============================================

BEGIN;

-- ===============================================
-- 1. EXTEND RENTAL_BOOKINGS TABLE
-- Add QR code management columns to existing rental_bookings table
-- ===============================================

ALTER TABLE rental_bookings 
ADD COLUMN IF NOT EXISTS qr_codes JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS qr_upload_status TEXT DEFAULT 'pending' CHECK (qr_upload_status IN ('pending', 'uploaded', 'expired')),
ADD COLUMN IF NOT EXISTS qr_uploaded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS qr_uploaded_by UUID REFERENCES auth.users(id);

-- ===============================================
-- 2. CREATE BOOKING_QR_CODES TABLE
-- Detailed QR code tracking with individual records for better management
-- ===============================================

CREATE TABLE IF NOT EXISTS booking_qr_codes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
  rental_listing_id UUID REFERENCES rental_listings(id) ON DELETE CASCADE,
  
  -- QR Code Details
  qr_image_url TEXT NOT NULL, -- Actual QR code image URL (stored in Supabase Storage)
  qr_type TEXT NOT NULL DEFAULT 'access' CHECK (qr_type IN ('access', 'parking', 'amenity', 'gate', 'elevator', 'pool', 'gym', 'other')),
  qr_label TEXT, -- Human-readable label (e.g., "Main Gate Access", "Pool Area")
  qr_description TEXT, -- Optional description for the QR code
  
  -- Validity and Usage
  valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
  valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
  usage_limit INTEGER DEFAULT NULL, -- NULL means unlimited usage during validity period
  times_used INTEGER DEFAULT 0,
  
  -- Status Management
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'revoked', 'pending')),
  
  -- Admin Management
  created_by_admin_id UUID REFERENCES auth.users(id),
  uploaded_by_admin_id UUID REFERENCES auth.users(id),
  revoked_by_admin_id UUID REFERENCES auth.users(id),
  revoked_at TIMESTAMP WITH TIME ZONE,
  revocation_reason TEXT,
  
  -- Metadata
  metadata JSONB DEFAULT '{}', -- Additional data like instructions, special notes, etc.
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 3. CREATE QR CODE USAGE LOGS TABLE
-- Track QR code usage for security and analytics
-- ===============================================

CREATE TABLE IF NOT EXISTS qr_code_usage_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  qr_code_id UUID REFERENCES booking_qr_codes(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
  
  -- Usage Details
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used_by_user_id UUID REFERENCES auth.users(id), -- Guest who used it
  location_description TEXT, -- Where it was used (if provided)
  
  -- Technical Details
  user_agent TEXT,
  ip_address INET,
  device_info JSONB DEFAULT '{}',
  
  -- Status
  usage_status TEXT DEFAULT 'success' CHECK (usage_status IN ('success', 'failed', 'blocked', 'expired')),
  failure_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- Optimize queries for QR code management
-- ===============================================

-- Booking QR Codes indexes
CREATE INDEX IF NOT EXISTS idx_booking_qr_codes_booking_id ON booking_qr_codes(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_qr_codes_rental_listing_id ON booking_qr_codes(rental_listing_id);
CREATE INDEX IF NOT EXISTS idx_booking_qr_codes_status ON booking_qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_booking_qr_codes_valid_period ON booking_qr_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_booking_qr_codes_type ON booking_qr_codes(qr_type);

-- Usage logs indexes
CREATE INDEX IF NOT EXISTS idx_qr_usage_logs_qr_code_id ON qr_code_usage_logs(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_logs_booking_id ON qr_code_usage_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_qr_usage_logs_used_at ON qr_code_usage_logs(used_at);
CREATE INDEX IF NOT EXISTS idx_qr_usage_logs_user_id ON qr_code_usage_logs(used_by_user_id);

-- Rental bookings QR status index
CREATE INDEX IF NOT EXISTS idx_rental_bookings_qr_status ON rental_bookings(qr_upload_status);

-- ===============================================
-- 5. CREATE ROW LEVEL SECURITY POLICIES
-- Secure access to QR code data
-- ===============================================

-- Enable RLS on new tables
ALTER TABLE booking_qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE qr_code_usage_logs ENABLE ROW LEVEL SECURITY;

-- Booking QR Codes Policies
CREATE POLICY "booking_qr_codes_guest_view" ON booking_qr_codes
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM rental_bookings 
      WHERE guest_user_id = auth.uid()
    )
  );

CREATE POLICY "booking_qr_codes_admin_all" ON booking_qr_codes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "booking_qr_codes_owner_view" ON booking_qr_codes
  FOR SELECT USING (
    rental_listing_id IN (
      SELECT id FROM rental_listings 
      WHERE owner_user_id = auth.uid()
    )
  );

-- QR Code Usage Logs Policies
CREATE POLICY "qr_usage_logs_guest_view" ON qr_code_usage_logs
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM rental_bookings 
      WHERE guest_user_id = auth.uid()
    )
  );

CREATE POLICY "qr_usage_logs_admin_all" ON qr_code_usage_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin')
    )
  );

-- ===============================================
-- 6. CREATE HELPER FUNCTIONS
-- Utility functions for QR code management
-- ===============================================

-- Function to automatically expire QR codes
CREATE OR REPLACE FUNCTION expire_qr_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE booking_qr_codes 
  SET status = 'expired', updated_at = NOW()
  WHERE status = 'active' 
    AND valid_until < NOW();
END;
$$;

-- Function to update QR upload status based on QR codes existence
CREATE OR REPLACE FUNCTION update_booking_qr_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the booking's QR upload status
  UPDATE rental_bookings 
  SET 
    qr_upload_status = CASE 
      WHEN EXISTS (
        SELECT 1 FROM booking_qr_codes 
        WHERE booking_id = COALESCE(NEW.booking_id, OLD.booking_id)
        AND status = 'active'
      ) THEN 'uploaded'
      ELSE 'pending'
    END,
    qr_uploaded_at = CASE 
      WHEN TG_OP = 'INSERT' THEN NOW()
      ELSE qr_uploaded_at
    END,
    updated_at = NOW()
  WHERE id = COALESCE(NEW.booking_id, OLD.booking_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger to automatically update booking QR status
DROP TRIGGER IF EXISTS trigger_update_booking_qr_status ON booking_qr_codes;
CREATE TRIGGER trigger_update_booking_qr_status
  AFTER INSERT OR UPDATE OR DELETE ON booking_qr_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_qr_status();

-- ===============================================
-- 7. CREATE VIEWS FOR EASY DATA ACCESS
-- Simplified views for common queries
-- ===============================================

-- View for guest's rental bookings with QR status
CREATE OR REPLACE VIEW guest_rental_bookings AS
SELECT 
  rb.id,
  rb.rental_listing_id,
  rb.guest_user_id,
  rb.check_in_date,
  rb.check_out_date,
  rb.number_of_guests,
  rb.booking_status,
  rb.total_amount,
  rb.qr_upload_status,
  rb.qr_uploaded_at,
  
  -- Property details (via rental_listings -> properties)
  p.title as rental_title,
  p.address,
  p.city,
  rl.rental_type,
  
  -- QR codes count
  (SELECT COUNT(*) FROM booking_qr_codes WHERE booking_id = rb.id AND status = 'active') as active_qr_count,
  (SELECT COUNT(*) FROM booking_qr_codes WHERE booking_id = rb.id) as total_qr_count,
  
  rb.created_at,
  rb.updated_at
FROM rental_bookings rb
JOIN rental_listings rl ON rb.rental_listing_id = rl.id
JOIN properties p ON rl.property_id = p.id
WHERE rb.booking_status IN ('confirmed', 'checked_in', 'completed');

-- View for admin QR code management
CREATE OR REPLACE VIEW admin_booking_qr_overview AS
SELECT 
  rb.id as booking_id,
  rb.check_in_date,
  rb.check_out_date,
  rb.booking_status,
  rb.qr_upload_status,
  rb.qr_uploaded_at,
  
  -- Guest info
  up.full_name as guest_name,
  rb.guest_email,
  rb.guest_phone,
  
  -- Property info (via rental_listings -> properties)
  p.title as rental_title,
  p.address,
  p.city,
  rl.rental_type,
  
  -- QR stats
  (SELECT COUNT(*) FROM booking_qr_codes WHERE booking_id = rb.id AND status = 'active') as active_qr_count,
  (SELECT COUNT(*) FROM booking_qr_codes WHERE booking_id = rb.id) as total_qr_count,
  (SELECT SUM(times_used) FROM booking_qr_codes WHERE booking_id = rb.id) as total_qr_usage
  
FROM rental_bookings rb
JOIN rental_listings rl ON rb.rental_listing_id = rl.id
JOIN properties p ON rl.property_id = p.id
LEFT JOIN user_profiles up ON rb.guest_user_id = up.user_id
ORDER BY rb.check_in_date DESC;

-- ===============================================
-- 8. UPDATE EXISTING DATA (IF NEEDED)
-- Initialize QR status for existing bookings
-- ===============================================

-- Update existing bookings to have proper QR status
UPDATE rental_bookings 
SET qr_upload_status = 'pending'
WHERE qr_upload_status IS NULL;

-- ===============================================
-- 9. GRANT NECESSARY PERMISSIONS
-- Ensure proper access for the application
-- ===============================================

-- Grant permissions to authenticated users for the views
GRANT SELECT ON guest_rental_bookings TO authenticated;
GRANT SELECT ON admin_booking_qr_overview TO authenticated;

-- Grant permissions for the QR expiration function (for scheduled jobs)
GRANT EXECUTE ON FUNCTION expire_qr_codes() TO service_role;

COMMIT;

-- ===============================================
-- VERIFICATION QUERIES
-- Run these to verify the migration worked correctly
-- ===============================================

-- Check new columns in rental_bookings
-- SELECT column_name, data_type, column_default 
-- FROM information_schema.columns 
-- WHERE table_name = 'rental_bookings' 
-- AND column_name IN ('qr_codes', 'qr_upload_status', 'qr_uploaded_at', 'qr_uploaded_by')
-- ORDER BY column_name;

-- Check new tables exist
-- SELECT table_name, table_type 
-- FROM information_schema.tables 
-- WHERE table_name IN ('booking_qr_codes', 'qr_code_usage_logs')
-- ORDER BY table_name;

-- Check indexes were created
-- SELECT indexname, indexdef 
-- FROM pg_indexes 
-- WHERE tablename IN ('booking_qr_codes', 'qr_code_usage_logs', 'rental_bookings')
-- AND indexname LIKE 'idx_%qr%'
-- ORDER BY tablename, indexname;
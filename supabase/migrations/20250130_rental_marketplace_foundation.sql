-- Rental Marketplace Foundation Migration
-- Phase 1: Database Schema Extension for Full-Service Rental Platform

-- ===============================================
-- RENTAL LISTINGS TABLE
-- Core table for property rental listings
-- ===============================================

CREATE TABLE rental_listings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  owner_user_id UUID REFERENCES auth.users(id),
  appraisal_id UUID REFERENCES property_appraisals(id), -- Links to existing appraisals
  
  -- Rental-specific data
  rental_type TEXT NOT NULL CHECK (rental_type IN ('short_term', 'long_term', 'both')),
  nightly_rate DECIMAL(10,2), -- For short-term (EGP)
  monthly_rate DECIMAL(10,2), -- For long-term (EGP)
  yearly_rate DECIMAL(10,2),  -- For long-term (EGP)
  
  -- Availability and booking rules
  minimum_stay_nights INTEGER DEFAULT 1,
  maximum_stay_nights INTEGER DEFAULT 365,
  check_in_time TIME DEFAULT '15:00',
  check_out_time TIME DEFAULT '11:00',
  
  -- House rules and policies
  house_rules JSONB,
  cancellation_policy TEXT DEFAULT 'moderate',
  instant_book BOOLEAN DEFAULT false,
  
  -- QR and compliance (Egyptian market specific)
  developer_qr_code TEXT, -- QR code from real estate developer
  tourism_permit_number TEXT,
  compliance_status TEXT DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'approved', 'rejected', 'expired')),
  compliance_documents JSONB,
  
  -- Pricing and fees
  cleaning_fee DECIMAL(8,2) DEFAULT 0,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  extra_guest_fee DECIMAL(8,2) DEFAULT 0,
  
  -- Platform management
  is_active BOOLEAN DEFAULT true,
  featured BOOLEAN DEFAULT false,
  auto_sync_external BOOLEAN DEFAULT true, -- Sync to Airbnb/Booking.com
  
  -- Performance metrics
  total_bookings INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2) DEFAULT 0,
  response_rate DECIMAL(5,2) DEFAULT 100.00,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- RENTAL CALENDAR TABLE
-- Manages availability and pricing calendar
-- ===============================================

CREATE TABLE rental_calendar (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_listing_id UUID REFERENCES rental_listings(id) ON DELETE CASCADE,
  
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,
  nightly_rate DECIMAL(10,2), -- Override default rate for specific dates
  minimum_stay INTEGER, -- Override minimum stay for specific dates
  
  -- Special pricing periods (holidays, events, etc.)
  is_special_pricing BOOLEAN DEFAULT false,
  special_pricing_reason TEXT,
  
  -- Booking reference (if booked)
  booking_id UUID,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(rental_listing_id, date)
);

-- ===============================================
-- RENTAL BOOKINGS TABLE
-- Manages all rental reservations and payments
-- ===============================================

CREATE TABLE rental_bookings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_listing_id UUID REFERENCES rental_listings(id) ON DELETE CASCADE,
  guest_user_id UUID REFERENCES auth.users(id),
  
  -- Booking details
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  number_of_guests INTEGER NOT NULL DEFAULT 1,
  number_of_nights INTEGER NOT NULL,
  
  -- Pricing breakdown (all in EGP)
  nightly_rate DECIMAL(10,2) NOT NULL,
  total_nights_cost DECIMAL(10,2) NOT NULL,
  cleaning_fee DECIMAL(8,2) DEFAULT 0,
  security_deposit DECIMAL(10,2) DEFAULT 0,
  platform_fee DECIMAL(8,2) NOT NULL, -- 12% platform commission
  total_amount DECIMAL(10,2) NOT NULL,
  
  -- Payment integration (Paymob)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'partial', 'refunded', 'failed')),
  paymob_transaction_id TEXT,
  paymob_order_id TEXT,
  payment_method TEXT,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  
  -- Booking status
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN (
    'pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed'
  )),
  
  -- Guest information
  guest_phone TEXT,
  guest_email TEXT,
  special_requests TEXT,
  
  -- QR code integration
  developer_booking_qr TEXT, -- QR from developer system
  check_in_qr_code TEXT, -- Generated check-in QR
  
  -- Cancellation
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  refund_amount DECIMAL(10,2),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- RENTAL REVIEWS TABLE
-- Guest reviews and ratings system
-- ===============================================

CREATE TABLE rental_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_listing_id UUID REFERENCES rental_listings(id) ON DELETE CASCADE,
  booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
  reviewer_user_id UUID REFERENCES auth.users(id),
  
  -- Review content
  overall_rating INTEGER NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating >= 1 AND cleanliness_rating <= 5),
  accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
  location_rating INTEGER CHECK (location_rating >= 1 AND location_rating <= 5),
  value_rating INTEGER CHECK (value_rating >= 1 AND value_rating <= 5),
  
  review_text TEXT,
  review_language TEXT DEFAULT 'ar',
  
  -- Review status
  is_public BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT true, -- Reviews only from actual bookings
  
  -- Moderation
  is_flagged BOOLEAN DEFAULT false,
  moderation_status TEXT DEFAULT 'approved' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(booking_id) -- One review per booking
);

-- ===============================================
-- QR INTEGRATION TABLE
-- Manages QR codes from real estate developers
-- ===============================================

CREATE TABLE developer_qr_integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_listing_id UUID REFERENCES rental_listings(id) ON DELETE CASCADE,
  
  -- Developer information
  developer_name TEXT NOT NULL, -- Emaar Misr, SODIC, Hyde Park, etc.
  developer_api_endpoint TEXT,
  developer_contact_info JSONB,
  
  -- QR code data
  qr_code_data TEXT NOT NULL,
  qr_code_type TEXT DEFAULT 'property_access' CHECK (qr_code_type IN ('property_access', 'booking_confirmation', 'check_in')),
  
  -- Integration status
  integration_status TEXT DEFAULT 'active' CHECK (integration_status IN ('active', 'inactive', 'error')),
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_error_message TEXT,
  
  -- API credentials (encrypted)
  api_credentials JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- RENTAL AMENITIES TABLE
-- Extended amenities specific to rentals
-- ===============================================

CREATE TABLE rental_amenities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_listing_id UUID REFERENCES rental_listings(id) ON DELETE CASCADE,
  
  -- Basic amenities
  has_wifi BOOLEAN DEFAULT false,
  has_ac BOOLEAN DEFAULT false,
  has_heating BOOLEAN DEFAULT false,
  has_kitchen BOOLEAN DEFAULT false,
  has_washing_machine BOOLEAN DEFAULT false,
  has_tv BOOLEAN DEFAULT false,
  
  -- Egyptian-specific amenities
  has_satellite_tv BOOLEAN DEFAULT false,
  has_balcony BOOLEAN DEFAULT false,
  has_sea_view BOOLEAN DEFAULT false,
  has_nile_view BOOLEAN DEFAULT false,
  has_elevator BOOLEAN DEFAULT false,
  
  -- Luxury amenities
  has_swimming_pool BOOLEAN DEFAULT false,
  has_gym BOOLEAN DEFAULT false,
  has_spa BOOLEAN DEFAULT false,
  has_concierge BOOLEAN DEFAULT false,
  
  -- Safety and security
  has_security_guard BOOLEAN DEFAULT false,
  has_cctv BOOLEAN DEFAULT false,
  has_safe BOOLEAN DEFAULT false,
  
  -- Additional amenities (flexible)
  additional_amenities JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- EXTERNAL PLATFORM SYNC TABLE
-- Manages synchronization with Airbnb, Booking.com
-- ===============================================

CREATE TABLE external_platform_sync (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  rental_listing_id UUID REFERENCES rental_listings(id) ON DELETE CASCADE,
  
  -- Platform information
  platform_name TEXT NOT NULL CHECK (platform_name IN ('airbnb', 'booking_com', 'expedia', 'local_portals')),
  external_listing_id TEXT,
  external_listing_url TEXT,
  
  -- Sync configuration
  auto_sync_enabled BOOLEAN DEFAULT true,
  sync_pricing BOOLEAN DEFAULT true,
  sync_availability BOOLEAN DEFAULT true,
  sync_photos BOOLEAN DEFAULT true,
  
  -- Sync status
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending' CHECK (sync_status IN ('pending', 'success', 'error', 'disabled')),
  sync_error_message TEXT,
  
  -- API credentials and settings
  api_settings JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(rental_listing_id, platform_name)
);

-- ===============================================
-- RENTAL PAYMENTS TABLE
-- Manages all rental payment transactions with Paymob
-- ===============================================

CREATE TABLE rental_payments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  booking_id UUID REFERENCES rental_bookings(id) ON DELETE CASCADE,
  
  -- Payment identifiers
  paymob_order_id TEXT NOT NULL,
  paymob_transaction_id TEXT,
  
  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EGP' CHECK (currency IN ('EGP')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  
  -- Payment method information
  payment_method TEXT, -- card, wallet, bank_transfer, bnpl
  payment_provider TEXT, -- visa, mastercard, vodafone_cash, instapay, valu
  
  -- Transaction timestamps
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_at TIMESTAMP WITH TIME ZONE,
  
  -- Refund information
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  refund_transaction_id TEXT,
  
  -- Additional metadata
  metadata JSONB,
  fees_breakdown JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================
-- INDEXES FOR PERFORMANCE OPTIMIZATION
-- ===============================================

-- Rental listings indexes
CREATE INDEX idx_rental_listings_property_id ON rental_listings(property_id);
CREATE INDEX idx_rental_listings_owner ON rental_listings(owner_user_id);
CREATE INDEX idx_rental_listings_type ON rental_listings(rental_type);
CREATE INDEX idx_rental_listings_active ON rental_listings(is_active);
CREATE INDEX idx_rental_listings_featured ON rental_listings(featured);
CREATE INDEX idx_rental_listings_compliance ON rental_listings(compliance_status);
CREATE INDEX idx_rental_listings_rating ON rental_listings(average_rating);
CREATE INDEX idx_rental_listings_created ON rental_listings(created_at);

-- Calendar indexes
CREATE INDEX idx_rental_calendar_listing_date ON rental_calendar(rental_listing_id, date);
CREATE INDEX idx_rental_calendar_available ON rental_calendar(is_available, date);
CREATE INDEX idx_rental_calendar_booking ON rental_calendar(booking_id) WHERE booking_id IS NOT NULL;

-- Booking indexes
CREATE INDEX idx_rental_bookings_listing ON rental_bookings(rental_listing_id);
CREATE INDEX idx_rental_bookings_guest ON rental_bookings(guest_user_id);
CREATE INDEX idx_rental_bookings_dates ON rental_bookings(check_in_date, check_out_date);
CREATE INDEX idx_rental_bookings_status ON rental_bookings(booking_status);
CREATE INDEX idx_rental_bookings_payment ON rental_bookings(payment_status);
CREATE INDEX idx_rental_bookings_created ON rental_bookings(created_at);

-- Reviews indexes
CREATE INDEX idx_rental_reviews_listing ON rental_reviews(rental_listing_id);
CREATE INDEX idx_rental_reviews_rating ON rental_reviews(overall_rating);
CREATE INDEX idx_rental_reviews_public ON rental_reviews(is_public);

-- Payments indexes
CREATE INDEX idx_rental_payments_booking ON rental_payments(booking_id);
CREATE INDEX idx_rental_payments_paymob_order ON rental_payments(paymob_order_id);
CREATE INDEX idx_rental_payments_paymob_transaction ON rental_payments(paymob_transaction_id);
CREATE INDEX idx_rental_payments_status ON rental_payments(status);
CREATE INDEX idx_rental_payments_created ON rental_payments(created_at);

-- ===============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE rental_listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_qr_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_amenities ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_platform_sync ENABLE ROW LEVEL SECURITY;
ALTER TABLE rental_payments ENABLE ROW LEVEL SECURITY;

-- Rental listings policies
CREATE POLICY "Public read access to active rental listings"
  ON rental_listings FOR SELECT
  USING (is_active = true AND compliance_status = 'approved');

CREATE POLICY "Owners can manage their rental listings"
  ON rental_listings FOR ALL
  USING (owner_user_id = auth.uid());

CREATE POLICY "Admins have full access to rental listings"
  ON rental_listings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
      AND user_roles.revoked_at IS NULL
    )
  );

-- Calendar policies
CREATE POLICY "Public read access to rental calendar"
  ON rental_calendar FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rental_listings 
      WHERE rental_listings.id = rental_calendar.rental_listing_id 
      AND rental_listings.is_active = true
    )
  );

CREATE POLICY "Owners can manage their calendar"
  ON rental_calendar FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM rental_listings 
      WHERE rental_listings.id = rental_calendar.rental_listing_id 
      AND rental_listings.owner_user_id = auth.uid()
    )
  );

-- Bookings policies
CREATE POLICY "Users can read their own bookings"
  ON rental_bookings FOR SELECT
  USING (guest_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM rental_listings 
      WHERE rental_listings.id = rental_bookings.rental_listing_id 
      AND rental_listings.owner_user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create bookings"
  ON rental_bookings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Guests and owners can update their bookings"
  ON rental_bookings FOR UPDATE
  USING (guest_user_id = auth.uid() OR 
    EXISTS (
      SELECT 1 FROM rental_listings 
      WHERE rental_listings.id = rental_bookings.rental_listing_id 
      AND rental_listings.owner_user_id = auth.uid()
    )
  );

-- Reviews policies
CREATE POLICY "Public read access to approved reviews"
  ON rental_reviews FOR SELECT
  USING (is_public = true AND moderation_status = 'approved');

CREATE POLICY "Verified guests can create reviews"
  ON rental_reviews FOR INSERT
  WITH CHECK (
    reviewer_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM rental_bookings 
      WHERE rental_bookings.id = rental_reviews.booking_id 
      AND rental_bookings.guest_user_id = auth.uid()
      AND rental_bookings.booking_status = 'completed'
    )
  );

-- Payments policies
CREATE POLICY "Users can view their own payment records"
  ON rental_payments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM rental_bookings rb
      WHERE rb.id = rental_payments.booking_id 
      AND (rb.guest_user_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM rental_listings rl
             WHERE rl.id = rb.rental_listing_id 
             AND rl.owner_user_id = auth.uid()
           ))
    )
  );

CREATE POLICY "System can create payment records"
  ON rental_payments FOR INSERT
  WITH CHECK (true); -- Payment records are created by the system

CREATE POLICY "System can update payment records"
  ON rental_payments FOR UPDATE
  USING (true); -- Payment records are updated by webhooks/system

CREATE POLICY "Admins have full access to payment records"
  ON rental_payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
      AND user_roles.revoked_at IS NULL
    )
  );

-- ===============================================
-- STORAGE BUCKETS FOR RENTAL CONTENT
-- ===============================================

-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('rental-photos', 'rental-photos', true),
  ('rental-documents', 'rental-documents', false),
  ('qr-codes', 'qr-codes', false);

-- Storage policies for rental photos
CREATE POLICY "Public read access to rental photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'rental-photos');

CREATE POLICY "Authenticated users can upload rental photos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'rental-photos' 
    AND auth.role() = 'authenticated'
  );

-- Storage policies for rental documents (private)
CREATE POLICY "Owners can access their rental documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'rental-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Owners can upload rental documents"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'rental-documents'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- ===============================================
-- FUNCTIONS AND TRIGGERS
-- ===============================================

-- Function to update rental listing ratings
CREATE OR REPLACE FUNCTION update_rental_listing_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE rental_listings 
  SET 
    average_rating = (
      SELECT ROUND(AVG(overall_rating), 2)
      FROM rental_reviews 
      WHERE rental_listing_id = COALESCE(NEW.rental_listing_id, OLD.rental_listing_id)
      AND is_public = true 
      AND moderation_status = 'approved'
    )
  WHERE id = COALESCE(NEW.rental_listing_id, OLD.rental_listing_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update ratings on review changes
CREATE TRIGGER update_rental_rating_trigger
  AFTER INSERT OR UPDATE OR DELETE ON rental_reviews
  FOR EACH ROW EXECUTE FUNCTION update_rental_listing_rating();

-- Function to update booking count
CREATE OR REPLACE FUNCTION update_booking_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_status = 'completed' THEN
    UPDATE rental_listings 
    SET total_bookings = total_bookings + 1
    WHERE id = NEW.rental_listing_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update booking count
CREATE TRIGGER update_booking_count_trigger
  AFTER UPDATE ON rental_bookings
  FOR EACH ROW 
  WHEN (OLD.booking_status != 'completed' AND NEW.booking_status = 'completed')
  EXECUTE FUNCTION update_booking_count();

-- Function to update calendar on booking
CREATE OR REPLACE FUNCTION update_calendar_on_booking()
RETURNS TRIGGER AS $$
DECLARE
  booking_date DATE;
BEGIN
  -- Mark dates as unavailable for confirmed bookings
  IF NEW.booking_status = 'confirmed' THEN
    FOR booking_date IN SELECT generate_series(NEW.check_in_date, NEW.check_out_date - INTERVAL '1 day', '1 day'::INTERVAL)::DATE
    LOOP
      INSERT INTO rental_calendar (rental_listing_id, date, is_available, booking_id)
      VALUES (NEW.rental_listing_id, booking_date, false, NEW.id)
      ON CONFLICT (rental_listing_id, date) 
      DO UPDATE SET is_available = false, booking_id = NEW.id;
    END LOOP;
  END IF;
  
  -- Free up dates for cancelled bookings
  IF NEW.booking_status = 'cancelled' AND OLD.booking_status = 'confirmed' THEN
    UPDATE rental_calendar 
    SET is_available = true, booking_id = NULL
    WHERE rental_listing_id = NEW.rental_listing_id 
    AND booking_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update calendar on booking changes
CREATE TRIGGER update_calendar_trigger
  AFTER INSERT OR UPDATE ON rental_bookings
  FOR EACH ROW EXECUTE FUNCTION update_calendar_on_booking();

-- ===============================================
-- INITIAL DATA SEEDING
-- ===============================================

-- Insert default house rules
INSERT INTO rental_listings (
  property_id, 
  owner_user_id, 
  rental_type, 
  nightly_rate,
  house_rules
) 
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000000', -- Placeholder - will be updated
  'both',
  CASE 
    WHEN p.property_type = 'villa' THEN p.price * 0.0008 -- 0.08% of property value per night
    WHEN p.property_type = 'apartment' THEN p.price * 0.001 -- 0.1% of property value per night
    ELSE p.price * 0.0006
  END,
  '{
    "check_in_time": "15:00",
    "check_out_time": "11:00",
    "smoking_allowed": false,
    "pets_allowed": false,
    "parties_allowed": false,
    "quiet_hours": "22:00-08:00",
    "maximum_occupancy": null,
    "additional_rules": []
  }'::jsonb
FROM properties p 
WHERE p.status = 'available' 
AND p.furnished = true
LIMIT 0; -- Start with 0 to avoid errors, will be populated by admin

COMMENT ON TABLE rental_listings IS 'Core rental listings table linking properties to rental market';
COMMENT ON TABLE rental_calendar IS 'Daily availability and pricing calendar for rental listings';
COMMENT ON TABLE rental_bookings IS 'All rental reservations with Paymob payment integration';
COMMENT ON TABLE rental_reviews IS 'Guest reviews and ratings for rental experiences';
COMMENT ON TABLE developer_qr_integrations IS 'QR code integrations with Egyptian real estate developers';
COMMENT ON TABLE rental_amenities IS 'Extended amenities specific to rental properties';
COMMENT ON TABLE external_platform_sync IS 'Synchronization with external platforms like Airbnb';

-- ===============================================
-- DEBUG QUERIES: USER ROLE TABLE STRUCTURE
-- Run separately to check the user profile structure
-- ===============================================

-- Check user profile table structure and role column
SELECT 
  table_name, 
  column_name, 
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name LIKE '%user%' OR table_name LIKE '%profile%'
ORDER BY table_name, ordinal_position;

-- Also check for any role-related tables
SELECT 
  table_name, 
  column_name, 
  data_type
FROM information_schema.columns 
WHERE column_name LIKE '%role%'
ORDER BY table_name;

-- Check specific user_profiles table if it exists
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- Check for user_roles table specifically
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;

-- Check all tables that might contain role information
SELECT DISTINCT table_name 
FROM information_schema.columns 
WHERE column_name LIKE '%role%' OR table_name LIKE '%role%'
ORDER BY table_name;

-- Get the structure of the user_roles table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'user_roles'
ORDER BY ordinal_position;
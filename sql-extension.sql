  -- 20250125_community_management_foundation.sql

  -- ===============================================
  -- EXTEND USER ROLES ENUM FOR COMMUNITY MANAGEMENT
  -- ===============================================

  -- Note: user_roles table extensions are done after community tables are created

  -- ===============================================
  -- COMMUNITY DEVELOPERS TABLE
  -- Property developers (Mountain View, Emaar, etc.)
  -- ===============================================
  CREATE TABLE community_developers (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_name TEXT NOT NULL,
    commercial_registration TEXT UNIQUE NOT NULL,
    logo_url TEXT,
    contact_person_name TEXT NOT NULL,
    contact_phone TEXT NOT NULL,
    contact_email TEXT UNIQUE NOT NULL,
    company_address TEXT,

    -- Subscription
    subscription_tier TEXT DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'growth', 'enterprise')),
    subscription_status TEXT DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
    monthly_fee DECIMAL(10,2) DEFAULT 2000.00,

    -- Integration
    whitelabel_config JSONB DEFAULT '{}',
    api_credentials JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- COMPOUNDS TABLE
  -- Individual compound communities
  -- ===============================================
  CREATE TABLE compounds (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    developer_id UUID REFERENCES community_developers(id) ON DELETE CASCADE,

    -- Basic Info
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    city TEXT DEFAULT 'Cairo',
    district TEXT,
    location_lat DECIMAL(10, 8),
    location_lng DECIMAL(11, 8),

    -- Compound Details
    total_units INTEGER NOT NULL,
    total_area_sqm DECIMAL(12,2),
    handover_year INTEGER,
    compound_type TEXT DEFAULT 'residential' CHECK (compound_type IN ('residential', 'mixed_use')),

    -- Contact & Management
    compound_manager_user_id UUID REFERENCES auth.users(id),
    management_company TEXT,
    emergency_phone TEXT,

    -- Settings
    operating_hours_start TIME DEFAULT '06:00',
    operating_hours_end TIME DEFAULT '22:00',
    security_level TEXT DEFAULT 'medium' CHECK (security_level IN ('low', 'medium', 'high')),

    -- Platform Config
    is_active BOOLEAN DEFAULT true,
    branding_config JSONB DEFAULT '{}',
    notification_settings JSONB DEFAULT '{}',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- UNITS TABLE  
  -- Individual units within compounds
  -- ===============================================
  CREATE TABLE community_units (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id), -- Link to existing properties

    -- Unit Identity
    unit_number TEXT NOT NULL,
    building_name TEXT,
    floor_number INTEGER,
    unit_type TEXT CHECK (unit_type IN ('apartment', 'villa', 'townhouse', 'penthouse')),

    -- Physical Details
    bedrooms INTEGER,
    bathrooms INTEGER,
    area_sqm DECIMAL(8,2),
    orientation TEXT CHECK (orientation IN ('north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest')),

    -- Ownership
    owner_user_id UUID REFERENCES auth.users(id),
    tenant_user_id UUID REFERENCES auth.users(id),
    occupancy_status TEXT DEFAULT 'vacant' CHECK (occupancy_status IN ('vacant', 'owner_occupied', 'tenant_occupied')),

    -- Rental Info (if rented)
    monthly_rent DECIMAL(10,2),
    lease_start_date DATE,
    lease_end_date DATE,

    -- Platform
    is_active BOOLEAN DEFAULT true,
    move_in_date DATE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(compound_id, unit_number)
  );

  -- ===============================================
  -- RESIDENTS TABLE
  -- Owners and tenants living in compounds
  -- ===============================================
  CREATE TABLE compound_residents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    unit_id UUID REFERENCES community_units(id) ON DELETE CASCADE,

    -- Personal Info
    full_name_arabic TEXT,
    full_name_english TEXT NOT NULL,
    national_id TEXT UNIQUE,
    date_of_birth DATE,
    profile_photo_url TEXT,

    -- Contact
    primary_phone TEXT NOT NULL,
    emergency_contact_name TEXT,
    emergency_contact_phone TEXT,

    -- Residency
    resident_type TEXT NOT NULL CHECK (resident_type IN ('owner', 'tenant', 'family_member')),
    move_in_date DATE DEFAULT CURRENT_DATE,
    move_out_date DATE,

    -- Family Members
    family_members JSONB DEFAULT '[]', -- [{"name": "John", "age": 8, "relationship": "son"}]

    -- Verification
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    verification_documents JSONB DEFAULT '{}',
    approved_by_user_id UUID REFERENCES auth.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,

    -- Platform Status
    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- VEHICLES TABLE
  -- Resident vehicle registration
  -- ===============================================
  CREATE TABLE resident_vehicles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resident_id UUID REFERENCES compound_residents(id) ON DELETE CASCADE,

    plate_number TEXT NOT NULL,
    make TEXT,
    model TEXT,
    color TEXT,
    year INTEGER,
    vehicle_photo_url TEXT,

    -- Parking
    parking_pass_number TEXT,
    assigned_parking_spot TEXT,

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(plate_number)
  );

  -- ===============================================
  -- AMENITIES TABLE
  -- Community amenities (pools, gym, etc.)
  -- ===============================================
  CREATE TABLE compound_amenities (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,

    -- Basic Info
    name TEXT NOT NULL,
    description TEXT,
    amenity_type TEXT NOT NULL CHECK (amenity_type IN (
      'pool', 'gym', 'tennis_court', 'football_field', 'playground',
      'bbq_area', 'event_hall', 'clubhouse', 'mosque', 'retail'
    )),
    location_description TEXT,

    -- Capacity & Rules
    max_capacity INTEGER DEFAULT 0,
    booking_duration_minutes INTEGER DEFAULT 120,
    advance_booking_hours INTEGER DEFAULT 2,
    max_bookings_per_resident INTEGER DEFAULT 2,

    -- Pricing
    is_paid BOOLEAN DEFAULT false,
    hourly_rate DECIMAL(8,2) DEFAULT 0,

    -- Booking Rules
    requires_approval BOOLEAN DEFAULT false,
    allow_guests BOOLEAN DEFAULT true,
    max_guests_per_booking INTEGER DEFAULT 5,

    -- Operating Hours
    operating_days TEXT DEFAULT 'monday,tuesday,wednesday,thursday,friday,saturday,sunday',
    opening_time TIME DEFAULT '06:00',
    closing_time TIME DEFAULT '22:00',

    -- Media
    photos JSONB DEFAULT '[]',

    is_active BOOLEAN DEFAULT true,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- AMENITY BOOKINGS TABLE
  -- Reuse existing booking system architecture
  -- ===============================================
  CREATE TABLE amenity_bookings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    amenity_id UUID REFERENCES compound_amenities(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES compound_residents(id),

    -- Booking Details
    booking_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    number_of_people INTEGER DEFAULT 1,

    -- Guest Info (if applicable)
    guest_names JSONB DEFAULT '[]',
    guest_count INTEGER DEFAULT 0,

    -- Status
    booking_status TEXT DEFAULT 'confirmed' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled', 'completed')),

    -- Confirmation
    confirmation_qr_code TEXT,
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,

    -- Payment (if paid amenity)
    total_amount DECIMAL(8,2) DEFAULT 0,
    payment_status TEXT DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded')),

    -- Special Requests
    special_requests TEXT,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- VISITOR MANAGEMENT TABLE
  -- ===============================================
  CREATE TABLE visitor_passes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resident_id UUID REFERENCES compound_residents(id),
    unit_id UUID REFERENCES community_units(id),

    -- Visitor Info
    visitor_name TEXT NOT NULL,
    visitor_phone TEXT,
    visitor_national_id TEXT,
    visitor_type TEXT DEFAULT 'guest' CHECK (visitor_type IN ('guest', 'service_provider', 'delivery', 'recurring')),

    -- Visit Details
    visit_date DATE NOT NULL,
    expected_arrival_time TIME,
    expected_duration_hours INTEGER DEFAULT 4,
    purpose_of_visit TEXT,

    -- Vehicle (if applicable)
    vehicle_plate TEXT,
    vehicle_make TEXT,
    vehicle_color TEXT,
    parking_required BOOLEAN DEFAULT false,

    -- Pass Details
    pass_qr_code TEXT NOT NULL UNIQUE,
    pass_valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    pass_valid_until TIMESTAMP WITH TIME ZONE,

    -- Entry/Exit
    actual_arrival_time TIMESTAMP WITH TIME ZONE,
    actual_departure_time TIMESTAMP WITH TIME ZONE,
    entry_gate TEXT,
    security_guard_id UUID REFERENCES auth.users(id),

    -- Status
    pass_status TEXT DEFAULT 'active' CHECK (pass_status IN ('active', 'used', 'expired', 'cancelled')),

    -- Guest Count
    additional_guests_count INTEGER DEFAULT 0,
    guest_names JSONB DEFAULT '[]',

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- COMMUNITY FEES TABLE
  -- Monthly maintenance, service fees, etc.
  -- ===============================================
  CREATE TABLE community_fees (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    unit_id UUID REFERENCES community_units(id) ON DELETE CASCADE,

    -- Fee Details
    fee_type TEXT NOT NULL CHECK (fee_type IN ('maintenance', 'security', 'amenities', 'utilities', 'parking', 'late_fee')),
    fee_name TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,

    -- Billing Period
    billing_month INTEGER NOT NULL,
    billing_year INTEGER NOT NULL,
    due_date DATE NOT NULL,

    -- Status
    payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue', 'waived')),
    paid_amount DECIMAL(10,2) DEFAULT 0,
    paid_at TIMESTAMP WITH TIME ZONE,

    -- Payment Integration (reuse existing Paymob)
    paymob_order_id TEXT,
    payment_reference TEXT,

    -- Late Fees
    late_fee_applied BOOLEAN DEFAULT false,
    late_fee_amount DECIMAL(8,2) DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(unit_id, fee_type, billing_month, billing_year)
  );

  -- ===============================================
  -- SERVICE REQUESTS TABLE 
  -- Integrate with your existing services platform
  -- ===============================================
  CREATE TABLE community_service_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    resident_id UUID REFERENCES compound_residents(id),
    unit_id UUID REFERENCES community_units(id),

    -- Service Details
    service_type TEXT NOT NULL CHECK (service_type IN (
      'plumbing', 'electrical', 'ac_repair', 'painting', 'carpentry',
      'cleaning', 'pest_control', 'appliance_repair', 'other'
    )),
    issue_description TEXT NOT NULL,
    urgency_level TEXT DEFAULT 'normal' CHECK (urgency_level IN ('emergency', 'urgent', 'normal', 'scheduled')),

    -- Location
    location_in_unit TEXT, -- kitchen, bathroom1, living_room, etc.
    access_instructions TEXT,

    -- Media
    issue_photos JSONB DEFAULT '[]',
    issue_video_url TEXT,

    -- Assignment
    assigned_provider_id UUID, -- Reference to your service provider system
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),

    -- Status Tracking
    request_status TEXT DEFAULT 'pending' CHECK (request_status IN ('pending', 'assigned', 'in_progress', 'completed', 'cancelled')),
    completion_photos JSONB DEFAULT '[]',
    resident_rating INTEGER CHECK (resident_rating >= 1 AND resident_rating <= 5),
    resident_feedback TEXT,

    -- Scheduling
    scheduled_date DATE,
    scheduled_time_start TIME,
    scheduled_time_end TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_completion_time TIMESTAMP WITH TIME ZONE,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- ANNOUNCEMENTS TABLE
  -- Community-wide and targeted announcements
  -- ===============================================
  CREATE TABLE community_announcements (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id),

    -- Content
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    announcement_type TEXT DEFAULT 'general' CHECK (announcement_type IN (
      'general', 'emergency', 'maintenance', 'event', 'security', 'payment_reminder'
    )),

    -- Targeting
    target_buildings JSONB DEFAULT '[]', -- ["Tower A", "Tower B"]
    target_unit_types JSONB DEFAULT '[]', -- ["apartment", "villa"]
    is_urgent BOOLEAN DEFAULT false,
    is_pinned BOOLEAN DEFAULT false,

    -- Media
    attachments JSONB DEFAULT '[]',

    -- Delivery
    send_push_notification BOOLEAN DEFAULT true,
    send_sms BOOLEAN DEFAULT false,
    send_email BOOLEAN DEFAULT true,

    -- Scheduling
    publish_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE,

    -- Status
    is_active BOOLEAN DEFAULT true,
    is_published BOOLEAN DEFAULT false,

    -- Stats
    read_count INTEGER DEFAULT 0,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- INDEXES FOR PERFORMANCE
  -- ===============================================
  CREATE INDEX idx_compounds_developer ON compounds(developer_id);
  CREATE INDEX idx_compounds_active ON compounds(is_active);
  CREATE INDEX idx_community_units_compound ON community_units(compound_id);
  CREATE INDEX idx_community_units_owner ON community_units(owner_user_id);
  CREATE INDEX idx_community_units_tenant ON community_units(tenant_user_id);
  CREATE INDEX idx_residents_unit ON compound_residents(unit_id);
  CREATE INDEX idx_residents_user ON compound_residents(user_id);
  CREATE INDEX idx_residents_verification ON compound_residents(verification_status);
  CREATE INDEX idx_amenity_bookings_amenity ON amenity_bookings(amenity_id);
  CREATE INDEX idx_amenity_bookings_resident ON amenity_bookings(resident_id);
  CREATE INDEX idx_amenity_bookings_date ON amenity_bookings(booking_date);
  CREATE INDEX idx_visitor_passes_resident ON visitor_passes(resident_id);
  CREATE INDEX idx_visitor_passes_date ON visitor_passes(visit_date);
  CREATE INDEX idx_visitor_passes_status ON visitor_passes(pass_status);
  CREATE INDEX idx_community_fees_unit ON community_fees(unit_id);
  CREATE INDEX idx_community_fees_status ON community_fees(payment_status);
  CREATE INDEX idx_community_fees_due ON community_fees(due_date);
  CREATE INDEX idx_service_requests_unit ON community_service_requests(unit_id);
  CREATE INDEX idx_service_requests_status ON community_service_requests(request_status);
  CREATE INDEX idx_announcements_compound ON community_announcements(compound_id);

  -- ===============================================
  -- ROW LEVEL SECURITY POLICIES
  -- ===============================================

  -- Enable RLS
  ALTER TABLE community_developers ENABLE ROW LEVEL SECURITY;
  ALTER TABLE compounds ENABLE ROW LEVEL SECURITY;
  ALTER TABLE community_units ENABLE ROW LEVEL SECURITY;
  ALTER TABLE compound_residents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE resident_vehicles ENABLE ROW LEVEL SECURITY;
  ALTER TABLE compound_amenities ENABLE ROW LEVEL SECURITY;
  ALTER TABLE amenity_bookings ENABLE ROW LEVEL SECURITY;
  ALTER TABLE visitor_passes ENABLE ROW LEVEL SECURITY;
  ALTER TABLE community_fees ENABLE ROW LEVEL SECURITY;
  ALTER TABLE community_service_requests ENABLE ROW LEVEL SECURITY;
  ALTER TABLE community_announcements ENABLE ROW LEVEL SECURITY;

  -- Developer policies
  CREATE POLICY "Developers can manage their own data"
  ON community_developers FOR ALL
  USING (contact_email = auth.jwt() ->> 'email');

  -- Compound policies  
  CREATE POLICY "Public read access to active compounds"
  ON compounds FOR SELECT
  USING (is_active = true);

  CREATE POLICY "Compound managers can manage their compounds"
  ON compounds FOR ALL
  USING (compound_manager_user_id = auth.uid());

  -- Resident policies
  CREATE POLICY "Residents can view their own data"
  ON compound_residents FOR ALL
  USING (user_id = auth.uid());

  CREATE POLICY "Compound managers can manage residents"
  ON compound_residents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cu.id = compound_residents.unit_id
      AND c.compound_manager_user_id = auth.uid()
    )
  );

  -- Admin access to all community data
  CREATE POLICY "Admins can access all community data"
  ON compound_residents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
      AND is_active = true
      AND revoked_at IS NULL
    )
  );

  -- Community Units policies
  CREATE POLICY "Public read access to active units"
  ON community_units FOR SELECT
  USING (is_active = true);

  CREATE POLICY "Unit owners can manage their units"
  ON community_units FOR ALL
  USING (owner_user_id = auth.uid());

  CREATE POLICY "Tenants can view their units"
  ON community_units FOR SELECT
  USING (tenant_user_id = auth.uid());

  CREATE POLICY "Compound managers can manage units in their compounds"
  ON community_units FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compounds
      WHERE compounds.id = community_units.compound_id
      AND compounds.compound_manager_user_id = auth.uid()
    )
  );

  -- Vehicle policies
  CREATE POLICY "Residents can manage their vehicles"
  ON resident_vehicles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents
      WHERE compound_residents.id = resident_vehicles.resident_id
      AND compound_residents.user_id = auth.uid()
    )
  );

  CREATE POLICY "Compound managers can view vehicles"
  ON resident_vehicles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cr.id = resident_vehicles.resident_id
      AND c.compound_manager_user_id = auth.uid()
    )
  );

  -- Amenity policies
  CREATE POLICY "Public read access to active amenities"
  ON compound_amenities FOR SELECT
  USING (is_active = true);

  CREATE POLICY "Compound managers can manage amenities"
  ON compound_amenities FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compounds
      WHERE compounds.id = compound_amenities.compound_id
      AND compounds.compound_manager_user_id = auth.uid()
    )
  );

  -- Amenity booking policies
  CREATE POLICY "Residents can manage their bookings"
  ON amenity_bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents
      WHERE compound_residents.id = amenity_bookings.resident_id
      AND compound_residents.user_id = auth.uid()
    )
  );

  CREATE POLICY "Compound managers can view all bookings"
  ON amenity_bookings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compound_amenities ca
      JOIN compounds c ON c.id = ca.compound_id
      WHERE ca.id = amenity_bookings.amenity_id
      AND c.compound_manager_user_id = auth.uid()
    )
  );

  -- Visitor pass policies
  CREATE POLICY "Residents can manage their visitor passes"
  ON visitor_passes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents
      WHERE compound_residents.id = visitor_passes.resident_id
      AND compound_residents.user_id = auth.uid()
    )
  );

  CREATE POLICY "Security guards can view visitor passes"
  ON visitor_passes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'security_guard'
      AND ur.is_active = true
    )
  );

  CREATE POLICY "Security guards can update visitor passes"
  ON visitor_passes FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'security_guard'
      AND ur.is_active = true
    )
  );

  -- Community fees policies
  CREATE POLICY "Residents can view their fees"
  ON community_fees FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compound_residents cr ON cr.unit_id = cu.id
      WHERE cu.id = community_fees.unit_id
      AND cr.user_id = auth.uid()
    )
  );

  CREATE POLICY "Compound managers can manage fees"
  ON community_fees FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cu.id = community_fees.unit_id
      AND c.compound_manager_user_id = auth.uid()
    )
  );

  -- Service request policies
  CREATE POLICY "Residents can manage their service requests"
  ON community_service_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents
      WHERE compound_residents.id = community_service_requests.resident_id
      AND compound_residents.user_id = auth.uid()
    )
  );

  CREATE POLICY "Compound managers can view service requests"
  ON community_service_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cu.id = community_service_requests.unit_id
      AND c.compound_manager_user_id = auth.uid()
    )
  );

  CREATE POLICY "Compound managers can update service requests"
  ON community_service_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cu.id = community_service_requests.unit_id
      AND c.compound_manager_user_id = auth.uid()
    )
  );

  -- Announcement policies
  CREATE POLICY "Residents can view published announcements"
  ON community_announcements FOR SELECT
  USING (
    is_published = true 
    AND is_active = true
    AND (publish_at <= NOW())
    AND (expires_at IS NULL OR expires_at > NOW())
    AND EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      WHERE cu.compound_id = community_announcements.compound_id
      AND cr.user_id = auth.uid()
    )
  );

  CREATE POLICY "Compound managers can manage announcements"
  ON community_announcements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compounds
      WHERE compounds.id = community_announcements.compound_id
      AND compounds.compound_manager_user_id = auth.uid()
    )
  );

  -- ===============================================
  -- INTEGRATION WITH EXISTING TABLES
  -- ===============================================

  -- Extend existing user_roles table for community roles
  DO $$
  BEGIN
    -- Add compound_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'compound_id') THEN
      ALTER TABLE user_roles ADD COLUMN compound_id UUID REFERENCES compounds(id);
    END IF;

    -- Add developer_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'user_roles' AND column_name = 'developer_id') THEN
      ALTER TABLE user_roles ADD COLUMN developer_id UUID REFERENCES community_developers(id);
    END IF;
  END $$;

  -- Extend properties table to link with compounds
  DO $$
  BEGIN
    -- Add compound_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'compound_id') THEN
      ALTER TABLE properties ADD COLUMN compound_id UUID REFERENCES compounds(id);
    END IF;

    -- Add unit_number column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'unit_number') THEN
      ALTER TABLE properties ADD COLUMN unit_number TEXT;
    END IF;

    -- Add is_community_unit column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'properties' AND column_name = 'is_community_unit') THEN
      ALTER TABLE properties ADD COLUMN is_community_unit BOOLEAN DEFAULT false;
    END IF;
  END $$;

  -- Extend rental_listings table to link with community units
  DO $$
  BEGIN
    -- Add community_unit_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rental_listings' AND column_name = 'community_unit_id') THEN
      ALTER TABLE rental_listings ADD COLUMN community_unit_id UUID REFERENCES community_units(id);
    END IF;

    -- Add guest_community_access column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'rental_listings' AND column_name = 'guest_community_access') THEN
      ALTER TABLE rental_listings ADD COLUMN guest_community_access BOOLEAN DEFAULT false;
    END IF;
  END $$;

  -- ===============================================
  -- ADDITIONAL TABLES FOR ADVANCED FEATURES
  -- ===============================================

  -- Community Events Table
  CREATE TABLE community_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id),
    
    -- Event Details
    title TEXT NOT NULL,
    description TEXT,
    event_type TEXT DEFAULT 'social' CHECK (event_type IN ('social', 'meeting', 'workshop', 'celebration', 'maintenance', 'emergency')),
    
    -- Location
    location TEXT, -- "Clubhouse", "Pool Area", etc.
    amenity_id UUID REFERENCES compound_amenities(id),
    
    -- Timing
    event_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone TEXT DEFAULT 'Africa/Cairo',
    
    -- Attendance
    max_attendees INTEGER,
    registration_required BOOLEAN DEFAULT true,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    
    -- Pricing
    is_paid BOOLEAN DEFAULT false,
    ticket_price DECIMAL(8,2) DEFAULT 0,
    
    -- Media
    event_image_url TEXT,
    attachments JSONB DEFAULT '[]',
    
    -- Status
    event_status TEXT DEFAULT 'draft' CHECK (event_status IN ('draft', 'published', 'cancelled', 'completed')),
    is_private BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Event Registrations Table
  CREATE TABLE event_registrations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES compound_residents(id) ON DELETE CASCADE,
    
    -- Registration Details
    number_of_attendees INTEGER DEFAULT 1,
    attendee_names JSONB DEFAULT '[]',
    special_requirements TEXT,
    
    -- Status
    registration_status TEXT DEFAULT 'registered' CHECK (registration_status IN ('registered', 'waitlisted', 'cancelled', 'attended')),
    
    -- Payment (if paid event)
    payment_status TEXT DEFAULT 'not_required' CHECK (payment_status IN ('not_required', 'pending', 'paid', 'refunded')),
    payment_reference TEXT,
    
    -- Check-in
    checked_in_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(event_id, resident_id)
  );

  -- Community Marketplace Table
  CREATE TABLE community_marketplace (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
    seller_resident_id UUID REFERENCES compound_residents(id),
    
    -- Item Details
    title TEXT NOT NULL,
    description TEXT,
    category TEXT CHECK (category IN ('furniture', 'electronics', 'clothing', 'books', 'sports', 'toys', 'services', 'other')),
    condition TEXT CHECK (condition IN ('new', 'like_new', 'good', 'fair', 'poor')),
    
    -- Pricing
    price DECIMAL(10,2) NOT NULL,
    is_negotiable BOOLEAN DEFAULT true,
    
    -- Media
    photos JSONB DEFAULT '[]',
    
    -- Availability
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    
    -- Contact
    contact_method TEXT DEFAULT 'app' CHECK (contact_method IN ('app', 'phone', 'both')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Security Incidents Table
  CREATE TABLE security_incidents (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
    reported_by_user_id UUID REFERENCES auth.users(id),
    security_guard_id UUID REFERENCES auth.users(id),
    
    -- Incident Details
    incident_type TEXT NOT NULL CHECK (incident_type IN ('theft', 'vandalism', 'noise_complaint', 'suspicious_activity', 'accident', 'medical_emergency', 'fire', 'other')),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location_description TEXT,
    
    -- Timing
    incident_date DATE NOT NULL,
    incident_time TIME NOT NULL,
    
    -- Severity
    severity_level TEXT DEFAULT 'medium' CHECK (severity_level IN ('low', 'medium', 'high', 'critical')),
    
    -- Status
    incident_status TEXT DEFAULT 'reported' CHECK (incident_status IN ('reported', 'investigating', 'resolved', 'closed')),
    
    -- Evidence
    photos JSONB DEFAULT '[]',
    videos JSONB DEFAULT '[]',
    witness_statements JSONB DEFAULT '[]',
    
    -- Actions Taken
    actions_taken TEXT,
    resolution_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by_user_id UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Community Polls Table
  CREATE TABLE community_polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    compound_id UUID REFERENCES compounds(id) ON DELETE CASCADE,
    created_by_user_id UUID REFERENCES auth.users(id),
    
    -- Poll Details
    question TEXT NOT NULL,
    description TEXT,
    poll_type TEXT DEFAULT 'single_choice' CHECK (poll_type IN ('single_choice', 'multiple_choice', 'rating', 'text')),
    
    -- Options
    options JSONB NOT NULL, -- [{"id": 1, "text": "Option 1"}, ...]
    
    -- Settings
    is_anonymous BOOLEAN DEFAULT false,
    allow_comments BOOLEAN DEFAULT true,
    require_justification BOOLEAN DEFAULT false,
    
    -- Timing
    start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_date TIMESTAMP WITH TIME ZONE,
    
    -- Targeting
    target_resident_types JSONB DEFAULT '["owner", "tenant"]',
    target_buildings JSONB DEFAULT '[]',
    
    -- Status
    poll_status TEXT DEFAULT 'active' CHECK (poll_status IN ('draft', 'active', 'closed', 'archived')),
    
    -- Results
    total_votes INTEGER DEFAULT 0,
    results JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- Poll Responses Table
  CREATE TABLE poll_responses (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES community_polls(id) ON DELETE CASCADE,
    resident_id UUID REFERENCES compound_residents(id) ON DELETE CASCADE,
    
    -- Response
    selected_options JSONB, -- [1, 3] for multiple choice
    rating_value INTEGER, -- for rating polls
    text_response TEXT, -- for text polls
    justification TEXT,
    
    -- Metadata
    is_anonymous BOOLEAN DEFAULT false,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(poll_id, resident_id)
  );

  -- Guest Community Access (for rental guests)
  CREATE TABLE guest_community_access (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    rental_booking_id UUID, -- Reference to rental_bookings if exists
    community_unit_id UUID REFERENCES community_units(id),
    guest_user_id UUID REFERENCES auth.users(id),
    
    -- Access Details
    guest_name TEXT NOT NULL,
    guest_phone TEXT,
    guest_email TEXT,
    
    -- Access Period
    access_start_date DATE NOT NULL,
    access_end_date DATE NOT NULL,
    
    -- Permissions
    amenity_access BOOLEAN DEFAULT true,
    guest_invite_permissions BOOLEAN DEFAULT false,
    parking_access BOOLEAN DEFAULT false,
    
    -- QR Code
    access_qr_code TEXT UNIQUE,
    
    -- Status
    access_status TEXT DEFAULT 'active' CHECK (access_status IN ('pending', 'active', 'expired', 'revoked')),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );

  -- ===============================================
  -- ADDITIONAL INDEXES FOR NEW TABLES
  -- ===============================================
  CREATE INDEX idx_community_events_compound ON community_events(compound_id);
  CREATE INDEX idx_community_events_date ON community_events(event_date);
  CREATE INDEX idx_community_events_status ON community_events(event_status);
  CREATE INDEX idx_event_registrations_event ON event_registrations(event_id);
  CREATE INDEX idx_event_registrations_resident ON event_registrations(resident_id);
  CREATE INDEX idx_marketplace_compound ON community_marketplace(compound_id);
  CREATE INDEX idx_marketplace_category ON community_marketplace(category);
  CREATE INDEX idx_marketplace_available ON community_marketplace(is_available);
  CREATE INDEX idx_security_incidents_compound ON security_incidents(compound_id);
  CREATE INDEX idx_security_incidents_date ON security_incidents(incident_date);
  CREATE INDEX idx_security_incidents_severity ON security_incidents(severity_level);
  CREATE INDEX idx_polls_compound ON community_polls(compound_id);
  CREATE INDEX idx_polls_status ON community_polls(poll_status);
  CREATE INDEX idx_poll_responses_poll ON poll_responses(poll_id);
  CREATE INDEX idx_guest_access_unit ON guest_community_access(community_unit_id);
  CREATE INDEX idx_guest_access_dates ON guest_community_access(access_start_date, access_end_date);

  -- ===============================================
  -- TRIGGERS AND FUNCTIONS
  -- ===============================================

  -- Function to update compound statistics
  CREATE OR REPLACE FUNCTION update_compound_statistics()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Update occupancy rate, active residents, etc.
    -- This can be called after resident changes
    RETURN COALESCE(NEW, OLD);
  END;
  $$ LANGUAGE plpgsql;

  -- Function to generate QR codes
  CREATE OR REPLACE FUNCTION generate_qr_code_data(prefix TEXT, id UUID)
  RETURNS TEXT AS $$
  BEGIN
    RETURN prefix || '-' || REPLACE(id::TEXT, '-', '') || '-' || EXTRACT(EPOCH FROM NOW())::BIGINT;
  END;
  $$ LANGUAGE plpgsql;

  -- Function to check amenity availability
  CREATE OR REPLACE FUNCTION check_amenity_availability(
    p_amenity_id UUID,
    p_booking_date DATE,
    p_start_time TIME,
    p_end_time TIME
  )
  RETURNS BOOLEAN AS $$
  DECLARE
    conflict_count INTEGER;
  BEGIN
    SELECT COUNT(*) INTO conflict_count
    FROM amenity_bookings
    WHERE amenity_id = p_amenity_id
    AND booking_date = p_booking_date
    AND booking_status = 'confirmed'
    AND (
      (start_time <= p_start_time AND end_time > p_start_time)
      OR (start_time < p_end_time AND end_time >= p_end_time)
      OR (start_time >= p_start_time AND end_time <= p_end_time)
    );
    
    RETURN conflict_count = 0;
  END;
  $$ LANGUAGE plpgsql;

  -- Function to auto-expire visitor passes
  CREATE OR REPLACE FUNCTION expire_old_visitor_passes()
  RETURNS void AS $$
  BEGIN
    UPDATE visitor_passes 
    SET pass_status = 'expired'
    WHERE pass_status = 'active'
    AND pass_valid_until < NOW();
  END;
  $$ LANGUAGE plpgsql;

  -- Trigger to auto-generate QR codes for visitor passes
  CREATE OR REPLACE FUNCTION generate_visitor_qr_code()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.pass_qr_code := generate_qr_code_data('VIS', NEW.id);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER visitor_pass_qr_trigger
    BEFORE INSERT ON visitor_passes
    FOR EACH ROW EXECUTE FUNCTION generate_visitor_qr_code();

  -- Trigger to auto-generate QR codes for amenity bookings
  CREATE OR REPLACE FUNCTION generate_amenity_booking_qr_code()
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.confirmation_qr_code := generate_qr_code_data('AMN', NEW.id);
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER amenity_booking_qr_trigger
    BEFORE INSERT ON amenity_bookings
    FOR EACH ROW EXECUTE FUNCTION generate_amenity_booking_qr_code();

  -- ===============================================
  -- RLS POLICIES FOR NEW TABLES
  -- ===============================================

  -- Enable RLS for new tables
  ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
  ALTER TABLE event_registrations ENABLE ROW LEVEL SECURITY;
  ALTER TABLE community_marketplace ENABLE ROW LEVEL SECURITY;
  ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;
  ALTER TABLE community_polls ENABLE ROW LEVEL SECURITY;
  ALTER TABLE poll_responses ENABLE ROW LEVEL SECURITY;
  ALTER TABLE guest_community_access ENABLE ROW LEVEL SECURITY;

  -- Community Events policies
  CREATE POLICY "Residents can view published events"
  ON community_events FOR SELECT
  USING (
    event_status = 'published'
    AND EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      WHERE cu.compound_id = community_events.compound_id
      AND cr.user_id = auth.uid()
    )
  );

  CREATE POLICY "Event creators and managers can manage events"
  ON community_events FOR ALL
  USING (
    created_by_user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM compounds
      WHERE compounds.id = community_events.compound_id
      AND compounds.compound_manager_user_id = auth.uid()
    )
  );

  -- Event Registration policies
  CREATE POLICY "Residents can manage their event registrations"
  ON event_registrations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents
      WHERE compound_residents.id = event_registrations.resident_id
      AND compound_residents.user_id = auth.uid()
    )
  );

  -- Marketplace policies
  CREATE POLICY "Residents can view marketplace items"
  ON community_marketplace FOR SELECT
  USING (
    is_available = true
    AND EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      WHERE cu.compound_id = community_marketplace.compound_id
      AND cr.user_id = auth.uid()
    )
  );

  CREATE POLICY "Residents can manage their own marketplace items"
  ON community_marketplace FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents
      WHERE compound_residents.id = community_marketplace.seller_resident_id
      AND compound_residents.user_id = auth.uid()
    )
  );

  -- Security incidents policies
  CREATE POLICY "Residents can view security incidents"
  ON security_incidents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      WHERE cu.compound_id = security_incidents.compound_id
      AND cr.user_id = auth.uid()
    )
  );

  CREATE POLICY "Residents can report security incidents"
  ON security_incidents FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      WHERE cu.compound_id = security_incidents.compound_id
      AND cr.user_id = auth.uid()
    )
  );

  CREATE POLICY "Security staff can manage incidents"
  ON security_incidents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = auth.uid()
      AND ur.role = 'security_guard'
      AND ur.is_active = true
    )
  );

  -- Community polls policies
  CREATE POLICY "Residents can view active polls"
  ON community_polls FOR SELECT
  USING (
    poll_status = 'active'
    AND EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      WHERE cu.compound_id = community_polls.compound_id
      AND cr.user_id = auth.uid()
    )
  );

  CREATE POLICY "Compound managers can manage polls"
  ON community_polls FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compounds
      WHERE compounds.id = community_polls.compound_id
      AND compounds.compound_manager_user_id = auth.uid()
    )
  );

  -- Poll responses policies
  CREATE POLICY "Residents can manage their poll responses"
  ON poll_responses FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents
      WHERE compound_residents.id = poll_responses.resident_id
      AND compound_residents.user_id = auth.uid()
    )
  );

  -- Guest access policies
  CREATE POLICY "Unit residents can manage guest access"
  ON guest_community_access FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.unit_id = guest_community_access.community_unit_id
      AND cr.user_id = auth.uid()
    )
  );

  -- ===============================================
  -- DATA SEEDING AND INITIAL SETUP
  -- ===============================================

  -- Insert sample roles for testing
  DO $$
  BEGIN
    -- Add new role types to existing enum if needed
    INSERT INTO user_roles (user_id, role, is_active)
    SELECT 
      '00000000-0000-0000-0000-000000000000',
      role_type,
      true
    FROM (VALUES 
      ('developer'),
      ('compound_manager'),
      ('resident_owner'),
      ('resident_tenant'),
      ('security_guard')
    ) AS roles(role_type)
    WHERE NOT EXISTS (
      SELECT 1 FROM user_roles 
      WHERE role = roles.role_type 
      AND user_id = '00000000-0000-0000-0000-000000000000'
    );
  EXCEPTION 
    WHEN others THEN
      -- Handle if user_roles structure is different
      RAISE NOTICE 'Could not insert sample roles: %', SQLERRM;
  END $$;

  -- ===============================================
  -- FINAL COMMENTS AND DOCUMENTATION
  -- ===============================================

  COMMENT ON TABLE community_developers IS 'Property developer companies managing multiple compounds';
  COMMENT ON TABLE compounds IS 'Individual compound/community properties with management details';
  COMMENT ON TABLE community_units IS 'Units within compounds, linked to existing properties table';
  COMMENT ON TABLE compound_residents IS 'Residents living in compound units (owners/tenants)';
  COMMENT ON TABLE resident_vehicles IS 'Vehicle registration for compound residents';
  COMMENT ON TABLE compound_amenities IS 'Community amenities available for booking';
  COMMENT ON TABLE amenity_bookings IS 'Booking system for community amenities';
  COMMENT ON TABLE visitor_passes IS 'QR-code based visitor management system';
  COMMENT ON TABLE community_fees IS 'Monthly fees and payment tracking for units';
  COMMENT ON TABLE community_service_requests IS 'Service requests integrated with existing provider network';
  COMMENT ON TABLE community_announcements IS 'Community-wide communications and announcements';
  COMMENT ON TABLE community_events IS 'Community events and social activities';
  COMMENT ON TABLE event_registrations IS 'Resident registrations for community events';
  COMMENT ON TABLE community_marketplace IS 'Resident-to-resident marketplace for items and services';
  COMMENT ON TABLE security_incidents IS 'Security incident reporting and tracking';
  COMMENT ON TABLE community_polls IS 'Community polls and voting system';
  COMMENT ON TABLE poll_responses IS 'Resident responses to community polls';
  COMMENT ON TABLE guest_community_access IS 'Temporary access for rental guests and visitors';

  -- ===============================================
  -- INTEGRATION VERIFICATION
  -- ===============================================

  -- Verify integration points with existing tables
  DO $$
  DECLARE
    table_exists BOOLEAN;
  BEGIN
    -- Check if core tables exist
    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'properties') INTO table_exists;
    IF NOT table_exists THEN
      RAISE WARNING 'Properties table not found - some integrations may not work';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_bookings') INTO table_exists;
    IF NOT table_exists THEN
      RAISE WARNING 'Rental bookings table not found - guest access integration may not work';
    END IF;

    SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_roles') INTO table_exists;
    IF NOT table_exists THEN
      RAISE WARNING 'User roles table not found - role-based access may not work';
    END IF;

    RAISE NOTICE 'Community management schema installation completed successfully';
  END $$;
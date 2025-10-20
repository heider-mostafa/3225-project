-- Public Appraiser Profiles Migration
-- Phase 2: LinkedIn-style public profiles with portfolio and reviews
-- Date: 2025-01-16

-- Enhanced public profile fields for brokers table
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS public_profile_active BOOLEAN DEFAULT false;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS profile_headline VARCHAR(200);
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS profile_summary TEXT;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS languages JSONB; -- ['Arabic', 'English', 'French']
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS certifications JSONB;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS service_areas JSONB; -- Geographic areas served
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS pricing_info JSONB;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS availability_schedule JSONB;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS profile_views_count INTEGER DEFAULT 0;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2);
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS total_reviews INTEGER DEFAULT 0;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS response_time_hours INTEGER; -- Average response time
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS social_media_links JSONB; -- LinkedIn, website, etc.

-- Property specialties breakdown and statistics
CREATE TABLE IF NOT EXISTS appraiser_property_statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  property_type VARCHAR NOT NULL, -- 'residential', 'commercial', 'industrial', 'land', 'agricultural'
  properties_appraised INTEGER DEFAULT 0,
  total_value_appraised BIGINT DEFAULT 0,
  average_appraisal_time_days INTEGER,
  average_accuracy_percentage DECIMAL(5,2), -- How accurate their appraisals are
  price_range_min BIGINT, -- Minimum property value they handle
  price_range_max BIGINT, -- Maximum property value they handle
  last_appraisal_date DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(appraiser_id, property_type)
);

-- Client reviews and ratings system
CREATE TABLE IF NOT EXISTS appraiser_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  client_name VARCHAR NOT NULL,
  client_email VARCHAR,
  client_phone VARCHAR,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  review_title VARCHAR(200),
  property_type VARCHAR,
  property_value BIGINT,
  appraisal_id UUID REFERENCES property_appraisals(id),
  is_verified BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false, -- Admin can feature exceptional reviews
  helpful_votes INTEGER DEFAULT 0,
  response_from_appraiser TEXT, -- Appraiser can respond to reviews
  response_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Professional portfolio showcasing previous work
CREATE TABLE IF NOT EXISTS appraiser_portfolio (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  property_type VARCHAR,
  property_value BIGINT,
  property_location VARCHAR,
  appraisal_challenges TEXT, -- What made this appraisal complex/interesting
  completion_date DATE,
  images JSONB, -- Array of image URLs (before/after, property photos)
  documents JSONB, -- Links to redacted reports or certificates
  is_featured BOOLEAN DEFAULT false,
  is_public BOOLEAN DEFAULT true,
  client_testimonial TEXT,
  tags JSONB, -- ['luxury', 'heritage', 'commercial', 'complex_valuation']
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Professional certifications and achievements
CREATE TABLE IF NOT EXISTS appraiser_certifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  certification_name VARCHAR NOT NULL,
  issuing_authority VARCHAR NOT NULL, -- 'FRA', 'CRE', 'RICS', etc.
  certification_number VARCHAR,
  issue_date DATE,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT true,
  verification_status VARCHAR DEFAULT 'pending', -- 'pending', 'verified', 'expired'
  certificate_image_url VARCHAR,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Service offerings and pricing
CREATE TABLE IF NOT EXISTS appraiser_services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  service_name VARCHAR NOT NULL, -- 'Residential Appraisal', 'Commercial Valuation', etc.
  service_description TEXT,
  property_types JSONB, -- ['residential', 'commercial']
  price_range JSONB, -- {min: 1000, max: 5000, currency: 'EGP'}
  typical_timeframe_days INTEGER,
  included_features JSONB, -- ['Site visit', 'Detailed report', 'Market analysis']
  additional_fees JSONB, -- {'Rush service': 500, 'Additional copy': 100}
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Appraiser availability and scheduling
CREATE TABLE IF NOT EXISTS appraiser_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  day_of_week INTEGER, -- 0=Sunday, 1=Monday, etc.
  start_time TIME,
  end_time TIME,
  is_available BOOLEAN DEFAULT true,
  timezone VARCHAR DEFAULT 'Africa/Cairo',
  break_start_time TIME,
  break_end_time TIME,
  notes TEXT, -- 'Available for emergency appraisals'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(appraiser_id, day_of_week)
);

-- Appraiser search and discovery optimization
CREATE TABLE IF NOT EXISTS appraiser_search_keywords (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  keyword VARCHAR NOT NULL,
  category VARCHAR, -- 'specialization', 'location', 'property_type'
  relevance_score INTEGER DEFAULT 1, -- Higher = more relevant
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(appraiser_id, keyword)
);

-- Profile views and analytics
CREATE TABLE IF NOT EXISTS appraiser_profile_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  viewer_ip VARCHAR,
  viewer_user_id UUID, -- If logged in
  view_source VARCHAR, -- 'search', 'property_page', 'direct_link'
  referrer_url VARCHAR,
  user_agent TEXT,
  viewed_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_brokers_public_profile_active ON brokers(public_profile_active);
CREATE INDEX IF NOT EXISTS idx_brokers_average_rating ON brokers(average_rating DESC);
CREATE INDEX IF NOT EXISTS idx_appraiser_property_statistics_appraiser_id ON appraiser_property_statistics(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_property_statistics_property_type ON appraiser_property_statistics(property_type);
CREATE INDEX IF NOT EXISTS idx_appraiser_reviews_appraiser_id ON appraiser_reviews(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_reviews_rating ON appraiser_reviews(rating DESC);
CREATE INDEX IF NOT EXISTS idx_appraiser_reviews_created_at ON appraiser_reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appraiser_portfolio_appraiser_id ON appraiser_portfolio(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_portfolio_featured ON appraiser_portfolio(is_featured, is_public);
CREATE INDEX IF NOT EXISTS idx_appraiser_certifications_appraiser_id ON appraiser_certifications(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_certifications_active ON appraiser_certifications(is_active, verification_status);
CREATE INDEX IF NOT EXISTS idx_appraiser_services_appraiser_id ON appraiser_services(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_services_active ON appraiser_services(is_active);
CREATE INDEX IF NOT EXISTS idx_appraiser_search_keywords_keyword ON appraiser_search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_appraiser_profile_views_appraiser_id ON appraiser_profile_views(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_profile_views_viewed_at ON appraiser_profile_views(viewed_at DESC);

-- Enable RLS on new tables
ALTER TABLE appraiser_property_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_portfolio ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_certifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_search_keywords ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_profile_views ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public profile data

-- Property Statistics - Public read, appraiser/admin write
CREATE POLICY "Public can view property statistics" ON appraiser_property_statistics
  FOR SELECT USING (true);

CREATE POLICY "Appraisers can manage their own property statistics" ON appraiser_property_statistics
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all property statistics" ON appraiser_property_statistics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- Reviews - Public read, authenticated write (with validation)
CREATE POLICY "Public can view verified reviews" ON appraiser_reviews
  FOR SELECT USING (is_verified = true);

CREATE POLICY "Users can create reviews" ON appraiser_reviews
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Review authors can update their own reviews" ON appraiser_reviews
  FOR UPDATE USING (client_email = (SELECT email FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Appraisers can respond to their reviews" ON appraiser_reviews
  FOR UPDATE USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all reviews" ON appraiser_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- Portfolio - Public read for public items, appraiser/admin write
CREATE POLICY "Public can view public portfolio items" ON appraiser_portfolio
  FOR SELECT USING (is_public = true);

CREATE POLICY "Appraisers can manage their own portfolio" ON appraiser_portfolio
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all portfolios" ON appraiser_portfolio
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- Certifications - Public read for verified, appraiser/admin write
CREATE POLICY "Public can view verified certifications" ON appraiser_certifications
  FOR SELECT USING (verification_status = 'verified' AND is_active = true);

CREATE POLICY "Appraisers can manage their own certifications" ON appraiser_certifications
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all certifications" ON appraiser_certifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- Services - Public read for active, appraiser/admin write
CREATE POLICY "Public can view active services" ON appraiser_services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Appraisers can manage their own services" ON appraiser_services
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all services" ON appraiser_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- Availability - Public read, appraiser/admin write
CREATE POLICY "Public can view availability" ON appraiser_availability
  FOR SELECT USING (is_available = true);

CREATE POLICY "Appraisers can manage their own availability" ON appraiser_availability
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Search Keywords - Public read, appraiser/admin write
CREATE POLICY "Public can view search keywords" ON appraiser_search_keywords
  FOR SELECT USING (true);

CREATE POLICY "Appraisers can manage their own keywords" ON appraiser_search_keywords
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

-- Profile Views - Anonymous insert, appraiser read own, admin read all
CREATE POLICY "Anyone can log profile views" ON appraiser_profile_views
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Appraisers can view their own profile analytics" ON appraiser_profile_views
  FOR SELECT USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all profile analytics" ON appraiser_profile_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- Add check constraints
ALTER TABLE appraiser_reviews ADD CONSTRAINT check_rating_range 
  CHECK (rating >= 1 AND rating <= 5);

ALTER TABLE appraiser_availability ADD CONSTRAINT check_day_of_week 
  CHECK (day_of_week >= 0 AND day_of_week <= 6);

ALTER TABLE appraiser_property_statistics ADD CONSTRAINT check_positive_values 
  CHECK (properties_appraised >= 0 AND total_value_appraised >= 0);

-- Comments for documentation
COMMENT ON TABLE appraiser_property_statistics IS 'Statistics and performance metrics for each property type';
COMMENT ON TABLE appraiser_reviews IS 'Client reviews and ratings for appraisers with verification system';
COMMENT ON TABLE appraiser_portfolio IS 'Professional portfolio showcasing previous appraisal work';
COMMENT ON TABLE appraiser_certifications IS 'Professional certifications and qualifications';
COMMENT ON TABLE appraiser_services IS 'Service offerings and pricing information';
COMMENT ON TABLE appraiser_availability IS 'Weekly availability schedule for bookings';
COMMENT ON TABLE appraiser_search_keywords IS 'Keywords for search optimization and discovery';
COMMENT ON TABLE appraiser_profile_views IS 'Analytics for profile views and user engagement';

COMMENT ON COLUMN brokers.public_profile_active IS 'Whether the appraiser profile is visible to the public';
COMMENT ON COLUMN brokers.profile_headline IS 'Professional headline for public profile';
COMMENT ON COLUMN brokers.languages IS 'JSON array of languages spoken';
COMMENT ON COLUMN brokers.service_areas IS 'JSON array of geographic areas served';
COMMENT ON COLUMN brokers.pricing_info IS 'JSON object with pricing structure and policies';
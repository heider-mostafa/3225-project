-- Market Intelligence Cache System (Updated to integrate with existing infrastructure)
-- Stores aggregated appraisal data for public market intelligence dashboard
-- Phase 1: PDF-first revenue model transformation

-- Main market intelligence cache table
CREATE TABLE IF NOT EXISTS market_intelligence_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_type VARCHAR(20) NOT NULL CHECK (location_type IN ('compound', 'area', 'district', 'governorate')),
  location_name VARCHAR(255) NOT NULL,
  
  -- Aggregated statistics
  total_appraisals INTEGER DEFAULT 0,
  avg_price_per_sqm DECIMAL(10,2),
  price_trend_1_month DECIMAL(5,2), -- percentage change
  price_trend_6_months DECIMAL(5,2),
  price_trend_1_year DECIMAL(5,2),
  
  -- Property mix distribution
  property_types JSONB DEFAULT '{}', -- {"apartments": 65, "villas": 30, "townhouses": 5}
  
  -- Market indicators
  market_activity VARCHAR(20) CHECK (market_activity IN ('hot', 'moderate', 'slow')),
  confidence_level VARCHAR(20) CHECK (confidence_level IN ('high', 'medium', 'low')),
  
  -- Investment indicators
  investment_score INTEGER CHECK (investment_score >= 0 AND investment_score <= 100),
  market_velocity_score INTEGER CHECK (market_velocity_score >= 0 AND market_velocity_score <= 100),
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  data_freshness_score INTEGER DEFAULT 100 CHECK (data_freshness_score >= 0 AND data_freshness_score <= 100),
  
  UNIQUE(location_type, location_name)
);

-- Index for fast location lookups
CREATE INDEX IF NOT EXISTS idx_market_intelligence_location ON market_intelligence_cache(location_type, location_name);
CREATE INDEX IF NOT EXISTS idx_market_intelligence_updated ON market_intelligence_cache(last_updated DESC);

-- Link appraisals to market intelligence for recalculation
CREATE TABLE IF NOT EXISTS appraisal_market_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id UUID REFERENCES property_appraisals(id) ON DELETE CASCADE,
  market_cache_id UUID REFERENCES market_intelligence_cache(id) ON DELETE CASCADE,
  contribution_weight DECIMAL(3,2) DEFAULT 1.0,
  location_extracted VARCHAR(255), -- compound/area name extracted from appraisal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(appraisal_id, market_cache_id)
);

-- Index for efficient appraisal-to-cache lookups
CREATE INDEX IF NOT EXISTS idx_appraisal_contributions_appraisal ON appraisal_market_contributions(appraisal_id);
CREATE INDEX IF NOT EXISTS idx_appraisal_contributions_cache ON appraisal_market_contributions(market_cache_id);

-- Appraiser coverage areas tracking
CREATE TABLE IF NOT EXISTS appraiser_coverage_areas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  area_name VARCHAR(255) NOT NULL,
  area_type VARCHAR(50) CHECK (area_type IN ('compound', 'district', 'governorate')),
  appraisals_completed INTEGER DEFAULT 0,
  coverage_strength VARCHAR(20) CHECK (coverage_strength IN ('high', 'medium', 'low')),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(appraiser_id, area_name, area_type)
);

-- Index for appraiser coverage lookups
CREATE INDEX IF NOT EXISTS idx_appraiser_coverage_appraiser ON appraiser_coverage_areas(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_coverage_area ON appraiser_coverage_areas(area_name, area_type);

-- ================================================================
-- UPDATED: Integrate with existing payment system instead of creating new tables
-- Use existing appraisal_payments table with new payment_category = 'market_report'
-- ================================================================

-- Add market report category to existing payment categories (if not already exists)
DO $$
BEGIN
  -- Check if the constraint exists and includes 'market_report'
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name LIKE '%payment_category%' 
    AND check_clause LIKE '%market_report%'
  ) THEN
    -- Add market_report to existing payment categories
    ALTER TABLE appraisal_payments 
    DROP CONSTRAINT IF EXISTS appraisal_payments_payment_category_check;
    
    ALTER TABLE appraisal_payments 
    ADD CONSTRAINT appraisal_payments_payment_category_check 
    CHECK (payment_category IN ('booking', 'report_generation', 'market_report', 'subscription'));
  END IF;
END $$;

-- Market Intelligence Report Sales Tracking (extends existing payment system)
CREATE TABLE IF NOT EXISTS market_report_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id UUID REFERENCES appraisal_payments(id) ON DELETE CASCADE,
  report_type VARCHAR(50) CHECK (report_type IN ('individual', 'compound', 'area', 'custom')),
  
  -- Location and report details
  area_name VARCHAR(255),
  compound_name VARCHAR(255),
  related_appraisal_ids UUID[], -- Array of appraisal IDs used in compound/area reports
  
  -- Report content and delivery
  report_title VARCHAR(500),
  report_description TEXT,
  report_file_url TEXT, -- Link to generated PDF
  report_preview_url TEXT, -- Link to 2-page preview
  
  -- Sales analytics
  marketing_source VARCHAR(100), -- 'market_intelligence_dashboard', 'appraiser_profile', etc.
  customer_segment VARCHAR(50), -- 'individual', 'investor', 'developer', 'bank'
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ,
  
  -- Bundling and packages
  bundle_id UUID, -- for bulk purchases
  is_bundled BOOLEAN DEFAULT false,
  
  -- Performance tracking
  view_count INTEGER DEFAULT 0, -- How many times report page was viewed before purchase
  conversion_source VARCHAR(100), -- What led to the purchase
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for market report sales
CREATE INDEX IF NOT EXISTS idx_market_report_sales_payment ON market_report_sales(payment_id);
CREATE INDEX IF NOT EXISTS idx_market_report_sales_type ON market_report_sales(report_type);
CREATE INDEX IF NOT EXISTS idx_market_report_sales_area ON market_report_sales(area_name);
CREATE INDEX IF NOT EXISTS idx_market_report_sales_compound ON market_report_sales(compound_name);
CREATE INDEX IF NOT EXISTS idx_market_report_sales_date ON market_report_sales(created_at DESC);

-- Add unique constraint to report_generation_pricing if it doesn't exist
DO $$
BEGIN
  -- Add unique constraint for report_type and appraiser_tier
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'unique_report_type_appraiser_tier'
  ) THEN
    ALTER TABLE report_generation_pricing 
    ADD CONSTRAINT unique_report_type_appraiser_tier 
    UNIQUE (report_type, appraiser_tier);
  END IF;
END $$;

-- Report pricing for market intelligence reports (extends existing pricing system)
INSERT INTO report_generation_pricing (report_type, appraiser_tier, base_fee_egp, additional_services) VALUES
-- Market Intelligence Individual Reports
('market_individual', 'basic', 500.00, '{"express_delivery": 100, "excel_data": 50, "api_access": 200}'),
('market_individual', 'premium', 400.00, '{"express_delivery": 80, "excel_data": 40, "api_access": 160}'),
('market_individual', 'enterprise', 300.00, '{"express_delivery": 60, "excel_data": 30, "api_access": 120}'),

-- Market Intelligence Compound Reports
('market_compound', 'basic', 2500.00, '{"monthly_updates": 500, "excel_data": 200, "api_access": 1000}'),
('market_compound', 'premium', 2000.00, '{"monthly_updates": 400, "excel_data": 160, "api_access": 800}'),
('market_compound', 'enterprise', 1500.00, '{"monthly_updates": 300, "excel_data": 120, "api_access": 600}'),

-- Market Intelligence Area Reports
('market_area', 'basic', 5000.00, '{"quarterly_updates": 1000, "custom_analysis": 2000, "api_access": 2000}'),
('market_area', 'premium', 4000.00, '{"quarterly_updates": 800, "custom_analysis": 1600, "api_access": 1600}'),
('market_area', 'enterprise', 3000.00, '{"quarterly_updates": 600, "custom_analysis": 1200, "api_access": 1200}'),

-- Custom Market Intelligence Reports
('market_custom', 'basic', 10000.00, '{"dedicated_analyst": 5000, "monthly_updates": 2000, "api_access": 3000}'),
('market_custom', 'premium', 8000.00, '{"dedicated_analyst": 4000, "monthly_updates": 1600, "api_access": 2400}'),
('market_custom', 'enterprise', 6000.00, '{"dedicated_analyst": 3000, "monthly_updates": 1200, "api_access": 1800}')

ON CONFLICT (report_type, appraiser_tier) DO NOTHING;

-- Function to update market intelligence cache when appraisal is completed
CREATE OR REPLACE FUNCTION update_market_intelligence_cache()
RETURNS TRIGGER AS $$
DECLARE
  compound_name TEXT;
  area_name TEXT;
  cache_record RECORD;
BEGIN
  -- Only process completed appraisals
  IF NEW.status = 'completed' THEN
    
    -- Extract location information from form_data
    compound_name := NEW.form_data ->> 'compound_name';
    area_name := COALESCE(NEW.form_data ->> 'area', NEW.form_data ->> 'district', NEW.form_data ->> 'city_name');
    
    -- Update compound-level cache if compound name exists
    IF compound_name IS NOT NULL AND compound_name != '' THEN
      INSERT INTO market_intelligence_cache (location_type, location_name, total_appraisals, last_updated)
      VALUES ('compound', compound_name, 1, NOW())
      ON CONFLICT (location_type, location_name)
      DO UPDATE SET 
        total_appraisals = market_intelligence_cache.total_appraisals + 1,
        last_updated = NOW();
    END IF;
    
    -- Update area-level cache if area name exists
    IF area_name IS NOT NULL AND area_name != '' THEN
      INSERT INTO market_intelligence_cache (location_type, location_name, total_appraisals, last_updated)
      VALUES ('area', area_name, 1, NOW())
      ON CONFLICT (location_type, location_name)
      DO UPDATE SET 
        total_appraisals = market_intelligence_cache.total_appraisals + 1,
        last_updated = NOW();
    END IF;
    
    -- Update appraiser coverage
    IF NEW.appraiser_id IS NOT NULL THEN
      -- Update compound coverage
      IF compound_name IS NOT NULL AND compound_name != '' THEN
        INSERT INTO appraiser_coverage_areas (appraiser_id, area_name, area_type, appraisals_completed, last_activity)
        VALUES (NEW.appraiser_id, compound_name, 'compound', 1, NOW())
        ON CONFLICT (appraiser_id, area_name, area_type)
        DO UPDATE SET 
          appraisals_completed = appraiser_coverage_areas.appraisals_completed + 1,
          last_activity = NOW();
      END IF;
      
      -- Update area coverage
      IF area_name IS NOT NULL AND area_name != '' THEN
        INSERT INTO appraiser_coverage_areas (appraiser_id, area_name, area_type, appraisals_completed, last_activity)
        VALUES (NEW.appraiser_id, area_name, 'area', 1, NOW())
        ON CONFLICT (appraiser_id, area_name, area_type)
        DO UPDATE SET 
          appraisals_completed = appraiser_coverage_areas.appraisals_completed + 1,
          last_activity = NOW();
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic market intelligence updates
DROP TRIGGER IF EXISTS trigger_update_market_intelligence ON property_appraisals;
CREATE TRIGGER trigger_update_market_intelligence
  AFTER UPDATE ON property_appraisals
  FOR EACH ROW
  EXECUTE FUNCTION update_market_intelligence_cache();

-- Create some initial sample data for testing
INSERT INTO market_intelligence_cache (location_type, location_name, total_appraisals, market_activity, confidence_level) 
VALUES 
  ('compound', 'Rehab City', 0, 'moderate', 'medium'),
  ('compound', 'Madinaty', 0, 'hot', 'high'),
  ('compound', 'New Capital', 0, 'moderate', 'medium'),
  ('area', 'New Cairo', 0, 'hot', 'high'),
  ('area', '6th of October', 0, 'moderate', 'medium'),
  ('area', 'Heliopolis', 0, 'moderate', 'medium'),
  ('area', 'Zamalek', 0, 'hot', 'high'),
  ('area', 'Nasr City', 0, 'moderate', 'medium'),
  ('governorate', 'Cairo', 0, 'hot', 'high'),
  ('governorate', 'Giza', 0, 'moderate', 'medium')
ON CONFLICT (location_type, location_name) DO NOTHING;

-- RLS Policies for new tables
ALTER TABLE market_intelligence_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_market_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_coverage_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE market_report_sales ENABLE ROW LEVEL SECURITY;

-- Market intelligence cache is public (read-only)
CREATE POLICY "Market intelligence is publicly readable" ON market_intelligence_cache
  FOR SELECT USING (true);

CREATE POLICY "System can manage market intelligence cache" ON market_intelligence_cache
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Appraisal contributions (system managed)
CREATE POLICY "System can manage appraisal contributions" ON appraisal_market_contributions
  FOR ALL USING (true);

-- Appraiser coverage (appraisers can view their own)
CREATE POLICY "Appraisers can view their own coverage" ON appraiser_coverage_areas
  FOR SELECT USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Public can view appraiser coverage" ON appraiser_coverage_areas
  FOR SELECT USING (true);

CREATE POLICY "System can manage appraiser coverage" ON appraiser_coverage_areas
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' IN ('admin', 'super_admin')
    )
  );

-- Market report sales (users can view their own purchases)
CREATE POLICY "Users can view their own report purchases" ON market_report_sales
  FOR SELECT USING (
    payment_id IN (
      SELECT id FROM appraisal_payments WHERE payer_id = auth.uid()
    )
  );

CREATE POLICY "System can manage market report sales" ON market_report_sales
  FOR ALL USING (true);

-- Comments for documentation
COMMENT ON TABLE market_intelligence_cache IS 'Aggregated market intelligence data for public dashboard and PDF report demand generation';
COMMENT ON TABLE appraisal_market_contributions IS 'Links individual appraisals to market intelligence cache for recalculation';
COMMENT ON TABLE appraiser_coverage_areas IS 'Tracks which areas each appraiser has coverage in for heatmap visualization';
COMMENT ON TABLE market_report_sales IS 'Tracks market intelligence report sales, extends existing payment system';

-- Create notification for successful migration
DO $$
BEGIN
  RAISE NOTICE 'Market Intelligence system migration completed successfully!';
  RAISE NOTICE 'Created tables: market_intelligence_cache, appraisal_market_contributions, appraiser_coverage_areas, market_report_sales';
  RAISE NOTICE 'Extended existing payment system with market_report category';
  RAISE NOTICE 'Added market intelligence pricing to existing report_generation_pricing table';
  RAISE NOTICE 'Inserted 10 Egyptian market areas for testing';
  RAISE NOTICE 'Ready to process market intelligence data from completed appraisals';
END $$;
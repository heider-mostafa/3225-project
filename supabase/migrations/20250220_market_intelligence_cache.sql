-- Market Intelligence Cache System
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

-- Report sales tracking for PDF-first revenue model
CREATE TABLE IF NOT EXISTS report_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type VARCHAR(50) CHECK (report_type IN ('individual', 'compound', 'custom')),
  related_appraisal_id UUID REFERENCES property_appraisals(id),
  area_name VARCHAR(255),
  customer_email VARCHAR(255),
  customer_name VARCHAR(255),
  sale_price DECIMAL(10,2) NOT NULL,
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Metadata for tracking
  marketing_source VARCHAR(100), -- 'market_intelligence_dashboard', 'appraiser_profile', etc.
  bundle_id UUID, -- for bulk purchases
  commission_paid DECIMAL(10,2) DEFAULT 0
);

-- Index for report sales analytics
CREATE INDEX IF NOT EXISTS idx_report_sales_date ON report_sales(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_report_sales_type ON report_sales(report_type);
CREATE INDEX IF NOT EXISTS idx_report_sales_area ON report_sales(area_name);
CREATE INDEX IF NOT EXISTS idx_report_sales_appraisal ON report_sales(related_appraisal_id);

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
    area_name := COALESCE(NEW.form_data ->> 'area', NEW.form_data ->> 'district');
    
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
  ('area', '6th of October', 0, 'moderate', 'medium')
ON CONFLICT (location_type, location_name) DO NOTHING;

-- Comments for documentation
COMMENT ON TABLE market_intelligence_cache IS 'Aggregated market intelligence data for public dashboard and PDF report demand generation';
COMMENT ON TABLE appraisal_market_contributions IS 'Links individual appraisals to market intelligence cache for recalculation';
COMMENT ON TABLE appraiser_coverage_areas IS 'Tracks which areas each appraiser has coverage in for heatmap visualization';
COMMENT ON TABLE report_sales IS 'Tracks PDF report sales for revenue analytics in PDF-first business model';
-- Enhanced Price Calculations for Market Intelligence
-- Phase 1: Extend existing trigger function with price calculations
-- Date: 2025-09-21

-- First, add missing price-related columns to market_intelligence_cache
ALTER TABLE market_intelligence_cache 
ADD COLUMN IF NOT EXISTS price_trend_1_year DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_trend_6_months DECIMAL(5,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS market_velocity_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_price_update TIMESTAMPTZ DEFAULT NOW();

-- Create helper function for weighted average price calculation
CREATE OR REPLACE FUNCTION calculate_weighted_avg_price_per_sqm(
  loc_type VARCHAR(50),
  loc_name VARCHAR(255)
) RETURNS DECIMAL AS $$
DECLARE
  total_value DECIMAL := 0;
  total_area DECIMAL := 0;
  appraisal_record RECORD;
  calculated_avg DECIMAL;
BEGIN
  -- Get all completed appraisals for this location with valid price and area data
  FOR appraisal_record IN
    SELECT 
      market_value_estimate,
      COALESCE(
        (form_data ->> 'unit_area_sqm')::DECIMAL,
        (form_data ->> 'built_area')::DECIMAL,
        (form_data ->> 'total_area')::DECIMAL
      ) as property_area
    FROM property_appraisals
    WHERE status = 'completed'
    AND market_value_estimate IS NOT NULL
    AND COALESCE(
      (form_data ->> 'unit_area_sqm')::DECIMAL,
      (form_data ->> 'built_area')::DECIMAL,
      (form_data ->> 'total_area')::DECIMAL
    ) > 0
    AND (
      (loc_type = 'compound' AND form_data ->> 'compound_name' = loc_name) OR
      (loc_type = 'district' AND form_data ->> 'district_name' = loc_name) OR
      (loc_type = 'area' AND COALESCE(form_data ->> 'area', form_data ->> 'district_name') = loc_name) OR
      (loc_type = 'city' AND form_data ->> 'city_name' = loc_name)
    )
  LOOP
    total_value := total_value + appraisal_record.market_value_estimate;
    total_area := total_area + appraisal_record.property_area;
  END LOOP;
  
  -- Calculate weighted average price per sqm
  IF total_area > 0 THEN
    calculated_avg := ROUND(total_value / total_area);
    RETURN calculated_avg;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Enhanced function that extends the existing trigger logic
CREATE OR REPLACE FUNCTION update_market_intelligence_cache_enhanced()
RETURNS TRIGGER AS $$
DECLARE
  compound_name TEXT;
  district_name TEXT;
  area_name TEXT;
  city_name TEXT;
  most_specific_location TEXT;
  location_type TEXT;
  property_area DECIMAL;
  calculated_avg_price DECIMAL;
BEGIN
  -- Only process completed appraisals
  IF NEW.status = 'completed' THEN
    
    -- Extract all available location information from form_data
    compound_name := NEW.form_data ->> 'compound_name';
    district_name := NEW.form_data ->> 'district_name';
    area_name := NEW.form_data ->> 'area';
    city_name := NEW.form_data ->> 'city_name';
    
    -- Get property area for calculations
    property_area := COALESCE(
      (NEW.form_data ->> 'unit_area_sqm')::DECIMAL,
      (NEW.form_data ->> 'built_area')::DECIMAL,
      (NEW.form_data ->> 'total_area')::DECIMAL
    );
    
    -- Determine most specific location available (improved hierarchy)
    IF compound_name IS NOT NULL AND compound_name != '' THEN
      most_specific_location := compound_name;
      location_type := 'compound';
    ELSIF district_name IS NOT NULL AND district_name != '' THEN
      most_specific_location := district_name;
      location_type := 'district';
    ELSIF area_name IS NOT NULL AND area_name != '' THEN
      most_specific_location := area_name;
      location_type := 'area';
    ELSIF city_name IS NOT NULL AND city_name != '' THEN
      most_specific_location := city_name;
      location_type := 'city';
    ELSE
      -- Skip if no location data available
      RETURN NEW;
    END IF;
    
    -- Calculate weighted average price for this location
    calculated_avg_price := calculate_weighted_avg_price_per_sqm(location_type, most_specific_location);
    
    -- Update market intelligence cache with enhanced data
    INSERT INTO market_intelligence_cache (
      location_type, 
      location_name, 
      total_appraisals, 
      avg_price_per_sqm,
      last_updated,
      last_price_update,
      market_activity,
      confidence_level
    ) VALUES (
      location_type, 
      most_specific_location, 
      1, 
      calculated_avg_price,
      NOW(),
      NOW(),
      CASE 
        WHEN calculated_avg_price IS NOT NULL THEN 'moderate'
        ELSE 'low'
      END,
      CASE 
        WHEN calculated_avg_price IS NOT NULL THEN 'medium'
        ELSE 'low'
      END
    ) ON CONFLICT (location_type, location_name)
    DO UPDATE SET 
      total_appraisals = market_intelligence_cache.total_appraisals + 1,
      avg_price_per_sqm = calculate_weighted_avg_price_per_sqm(location_type, most_specific_location),
      last_updated = NOW(),
      last_price_update = CASE 
        WHEN calculated_avg_price IS NOT NULL THEN NOW()
        ELSE market_intelligence_cache.last_price_update
      END,
      market_activity = CASE 
        WHEN calculate_weighted_avg_price_per_sqm(location_type, most_specific_location) IS NOT NULL THEN 'moderate'
        ELSE market_intelligence_cache.market_activity
      END,
      confidence_level = CASE 
        WHEN market_intelligence_cache.total_appraisals + 1 >= 10 THEN 'high'
        WHEN market_intelligence_cache.total_appraisals + 1 >= 3 THEN 'medium'
        ELSE 'low'
      END;
    
    -- Also update broader location levels for hierarchy
    -- If we're at compound level, also update district/area/city
    IF location_type = 'compound' AND district_name IS NOT NULL AND district_name != '' THEN
      calculated_avg_price := calculate_weighted_avg_price_per_sqm('district', district_name);
      
      INSERT INTO market_intelligence_cache (location_type, location_name, total_appraisals, avg_price_per_sqm, last_updated, last_price_update)
      VALUES ('district', district_name, 1, calculated_avg_price, NOW(), NOW())
      ON CONFLICT (location_type, location_name)
      DO UPDATE SET 
        total_appraisals = market_intelligence_cache.total_appraisals + 1,
        avg_price_per_sqm = calculate_weighted_avg_price_per_sqm('district', district_name),
        last_updated = NOW(),
        last_price_update = CASE 
          WHEN calculate_weighted_avg_price_per_sqm('district', district_name) IS NOT NULL THEN NOW()
          ELSE market_intelligence_cache.last_price_update
        END;
    END IF;
    
    -- Update area level if available
    IF area_name IS NOT NULL AND area_name != '' AND location_type IN ('compound', 'district') THEN
      calculated_avg_price := calculate_weighted_avg_price_per_sqm('area', area_name);
      
      INSERT INTO market_intelligence_cache (location_type, location_name, total_appraisals, avg_price_per_sqm, last_updated, last_price_update)
      VALUES ('area', area_name, 1, calculated_avg_price, NOW(), NOW())
      ON CONFLICT (location_type, location_name)
      DO UPDATE SET 
        total_appraisals = market_intelligence_cache.total_appraisals + 1,
        avg_price_per_sqm = calculate_weighted_avg_price_per_sqm('area', area_name),
        last_updated = NOW(),
        last_price_update = CASE 
          WHEN calculate_weighted_avg_price_per_sqm('area', area_name) IS NOT NULL THEN NOW()
          ELSE market_intelligence_cache.last_price_update
        END;
    END IF;
    
    -- Update appraiser coverage (keep existing logic)
    IF NEW.appraiser_id IS NOT NULL THEN
      INSERT INTO appraiser_coverage_areas (appraiser_id, area_name, area_type, appraisals_completed, last_activity)
      VALUES (NEW.appraiser_id, most_specific_location, location_type, 1, NOW())
      ON CONFLICT (appraiser_id, area_name, area_type)
      DO UPDATE SET 
        appraisals_completed = appraiser_coverage_areas.appraisals_completed + 1,
        last_activity = NOW();
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Replace the existing trigger with the enhanced version
DROP TRIGGER IF EXISTS trigger_update_market_intelligence ON property_appraisals;
CREATE TRIGGER trigger_update_market_intelligence_enhanced
  AFTER UPDATE ON property_appraisals
  FOR EACH ROW
  EXECUTE FUNCTION update_market_intelligence_cache_enhanced();

-- Also trigger on INSERT for new appraisals that are created as completed
CREATE TRIGGER trigger_update_market_intelligence_enhanced_insert
  AFTER INSERT ON property_appraisals
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION update_market_intelligence_cache_enhanced();

-- Create an index for faster price calculations
CREATE INDEX IF NOT EXISTS idx_property_appraisals_location_price 
ON property_appraisals(status, market_value_estimate) 
WHERE status = 'completed' AND market_value_estimate IS NOT NULL;

-- Add comments for documentation
COMMENT ON FUNCTION calculate_weighted_avg_price_per_sqm IS 'Calculates weighted average price per square meter for a specific location based on all completed appraisals';
COMMENT ON FUNCTION update_market_intelligence_cache_enhanced IS 'Enhanced trigger function that updates market intelligence cache with proper price calculations and improved location hierarchy';

-- Notification
DO $$
BEGIN
  RAISE NOTICE 'Enhanced price calculation system installed successfully!';
  RAISE NOTICE 'Features added:';
  RAISE NOTICE '- Weighted average price per sqm calculations';
  RAISE NOTICE '- Improved location hierarchy (compound -> district -> area -> city)';
  RAISE NOTICE '- Enhanced trigger with price tracking';
  RAISE NOTICE '- Ready to process existing appraisals for accurate market intelligence';
END $$;
-- Recalculate Market Intelligence Data with Enhanced Price Calculations
-- This script will populate the market intelligence cache with accurate data from existing appraisals
-- Date: 2025-09-21

-- Function to recalculate all market intelligence data
CREATE OR REPLACE FUNCTION recalculate_all_market_intelligence()
RETURNS TABLE(
  location_type VARCHAR(50),
  location_name VARCHAR(255), 
  total_appraisals INTEGER,
  avg_price_per_sqm DECIMAL,
  processing_status TEXT
) AS $$
DECLARE
  appraisal_record RECORD;
  processed_count INTEGER := 0;
  error_count INTEGER := 0;
BEGIN
  -- Clear existing cache to rebuild with accurate data
  RAISE NOTICE 'Clearing existing market intelligence cache...';
  DELETE FROM market_intelligence_cache;
  
  RAISE NOTICE 'Starting market intelligence recalculation...';
  RAISE NOTICE 'Processing all completed appraisals...';
  
  -- Process each completed appraisal through the enhanced trigger logic
  FOR appraisal_record IN
    SELECT id, form_data, market_value_estimate, appraiser_id, status, created_at
    FROM property_appraisals 
    WHERE status = 'completed'
    ORDER BY created_at ASC
  LOOP
    BEGIN
      -- Simulate the trigger by calling the enhanced function logic
      DECLARE
        compound_name TEXT;
        district_name TEXT;
        area_name TEXT;
        city_name TEXT;
        most_specific_location TEXT;
        loc_type TEXT;
        calculated_avg_price DECIMAL;
      BEGIN
        -- Extract location information
        compound_name := appraisal_record.form_data ->> 'compound_name';
        district_name := appraisal_record.form_data ->> 'district_name';
        area_name := appraisal_record.form_data ->> 'area';
        city_name := appraisal_record.form_data ->> 'city_name';
        
        -- Determine most specific location (enhanced hierarchy)
        IF compound_name IS NOT NULL AND compound_name != '' THEN
          most_specific_location := compound_name;
          loc_type := 'compound';
        ELSIF district_name IS NOT NULL AND district_name != '' THEN
          most_specific_location := district_name;
          loc_type := 'district';
        ELSIF area_name IS NOT NULL AND area_name != '' THEN
          most_specific_location := area_name;
          loc_type := 'area';
        ELSIF city_name IS NOT NULL AND city_name != '' THEN
          most_specific_location := city_name;
          loc_type := 'city';
        ELSE
          -- Skip if no location data
          CONTINUE;
        END IF;
        
        -- Calculate weighted average price
        calculated_avg_price := calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location);
        
        -- Update market intelligence cache
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
          loc_type, 
          most_specific_location, 
          1, 
          calculated_avg_price,
          NOW(),
          NOW(),
          CASE 
            WHEN calculated_avg_price IS NOT NULL THEN 'moderate'
            ELSE 'low'
          END,
          'low' -- Will be updated correctly in the DO UPDATE
        ) ON CONFLICT (location_type, location_name)
        DO UPDATE SET 
          total_appraisals = market_intelligence_cache.total_appraisals + 1,
          avg_price_per_sqm = calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location),
          last_updated = NOW(),
          last_price_update = CASE 
            WHEN calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location) IS NOT NULL THEN NOW()
            ELSE market_intelligence_cache.last_price_update
          END,
          market_activity = CASE 
            WHEN calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location) IS NOT NULL THEN 'moderate'
            ELSE market_intelligence_cache.market_activity
          END,
          confidence_level = CASE 
            WHEN market_intelligence_cache.total_appraisals + 1 >= 10 THEN 'high'
            WHEN market_intelligence_cache.total_appraisals + 1 >= 3 THEN 'medium'
            ELSE 'low'
          END;
        
        -- Update broader location levels for hierarchy
        IF loc_type = 'compound' AND district_name IS NOT NULL AND district_name != '' THEN
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
        IF area_name IS NOT NULL AND area_name != '' AND loc_type IN ('compound', 'district') THEN
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
        
        -- Update appraiser coverage
        IF appraisal_record.appraiser_id IS NOT NULL THEN
          INSERT INTO appraiser_coverage_areas (appraiser_id, area_name, area_type, appraisals_completed, last_activity)
          VALUES (appraisal_record.appraiser_id, most_specific_location, loc_type, 1, appraisal_record.created_at)
          ON CONFLICT (appraiser_id, area_name, area_type)
          DO UPDATE SET 
            appraisals_completed = appraiser_coverage_areas.appraisals_completed + 1,
            last_activity = GREATEST(appraiser_coverage_areas.last_activity, appraisal_record.created_at);
        END IF;
        
        processed_count := processed_count + 1;
        
        -- Log progress every 10 appraisals
        IF processed_count % 10 = 0 THEN
          RAISE NOTICE 'Processed % appraisals...', processed_count;
        END IF;
        
      END;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'Error processing appraisal %: %', appraisal_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE 'Market intelligence recalculation completed!';
  RAISE NOTICE 'Successfully processed: % appraisals', processed_count;
  RAISE NOTICE 'Errors encountered: % appraisals', error_count;
  
  -- Return summary of all created cache entries
  RETURN QUERY
    SELECT 
      mic.location_type,
      mic.location_name,
      mic.total_appraisals,
      mic.avg_price_per_sqm,
      CASE 
        WHEN mic.avg_price_per_sqm IS NOT NULL THEN 'Price calculated successfully'
        ELSE 'No price data available'
      END as processing_status
    FROM market_intelligence_cache mic
    ORDER BY mic.location_type, mic.total_appraisals DESC, mic.location_name;
    
END;
$$ LANGUAGE plpgsql;

-- Execute the recalculation
SELECT * FROM recalculate_all_market_intelligence();

-- Verification queries to check the results
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '=== VERIFICATION RESULTS ===';
  RAISE NOTICE '';
END $$;

-- Show summary by location type
SELECT 
  location_type,
  COUNT(*) as locations_count,
  SUM(total_appraisals) as total_appraisals,
  AVG(avg_price_per_sqm) as avg_price_across_locations,
  COUNT(CASE WHEN avg_price_per_sqm IS NOT NULL THEN 1 END) as locations_with_price_data
FROM market_intelligence_cache
GROUP BY location_type
ORDER BY 
  CASE location_type 
    WHEN 'compound' THEN 1 
    WHEN 'district' THEN 2 
    WHEN 'area' THEN 3 
    WHEN 'city' THEN 4 
  END;

-- Show top locations by appraisal count
SELECT 
  location_type,
  location_name,
  total_appraisals,
  ROUND(avg_price_per_sqm) as avg_price_per_sqm,
  confidence_level,
  market_activity
FROM market_intelligence_cache
WHERE total_appraisals > 0
ORDER BY total_appraisals DESC, avg_price_per_sqm DESC
LIMIT 20;

-- Show locations with missing price data
SELECT 
  location_type,
  location_name,
  total_appraisals
FROM market_intelligence_cache
WHERE avg_price_per_sqm IS NULL AND total_appraisals > 0
ORDER BY total_appraisals DESC;

-- Final summary
DO $$
DECLARE
  total_locations INTEGER;
  locations_with_prices INTEGER;
  total_appraisals_processed INTEGER;
BEGIN
  SELECT COUNT(*), COUNT(CASE WHEN avg_price_per_sqm IS NOT NULL THEN 1 END), SUM(total_appraisals)
  INTO total_locations, locations_with_prices, total_appraisals_processed
  FROM market_intelligence_cache;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== FINAL SUMMARY ===';
  RAISE NOTICE 'Total locations created: %', total_locations;
  RAISE NOTICE 'Locations with price data: %', locations_with_prices;
  RAISE NOTICE 'Price calculation success rate: %%%', 
    CASE 
      WHEN total_locations > 0 THEN ROUND((locations_with_prices::DECIMAL / total_locations * 100), 1)
      ELSE 0 
    END;
  RAISE NOTICE 'Total appraisals processed: %', total_appraisals_processed;
  RAISE NOTICE '';
  RAISE NOTICE 'Enhanced market intelligence system is now active!';
  RAISE NOTICE 'Your market intelligence dashboard will now show accurate price data.';
END $$;
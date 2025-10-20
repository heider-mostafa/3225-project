-- Safe Recalculation Script for Enhanced Market Intelligence
-- This version handles edge cases and prevents division by zero errors
-- Date: 2025-09-21

-- Check if we have any completed appraisals before starting
DO $$
DECLARE
  appraisal_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO appraisal_count 
  FROM property_appraisals 
  WHERE status = 'completed';
  
  IF appraisal_count = 0 THEN
    RAISE NOTICE 'No completed appraisals found. Please complete some appraisals first.';
    RAISE NOTICE 'Exiting without making changes.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Found % completed appraisals. Starting recalculation...', appraisal_count;
END $$;

-- Safe recalculation function with better error handling
CREATE OR REPLACE FUNCTION safe_recalculate_market_intelligence()
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
  skipped_count INTEGER := 0;
  total_to_process INTEGER;
BEGIN
  -- Count total appraisals to process
  SELECT COUNT(*) INTO total_to_process
  FROM property_appraisals 
  WHERE status = 'completed';
  
  IF total_to_process = 0 THEN
    RAISE NOTICE 'No completed appraisals found to process.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Starting safe market intelligence recalculation...';
  RAISE NOTICE 'Will process % completed appraisals', total_to_process;
  
  -- Clear existing cache to rebuild with accurate data
  RAISE NOTICE 'Clearing existing market intelligence cache...';
  DELETE FROM market_intelligence_cache;
  
  -- Process each completed appraisal
  FOR appraisal_record IN
    SELECT id, form_data, market_value_estimate, appraiser_id, status, created_at
    FROM property_appraisals 
    WHERE status = 'completed'
    ORDER BY created_at ASC
  LOOP
    BEGIN
      DECLARE
        compound_name TEXT;
        district_name TEXT;
        area_name TEXT;
        city_name TEXT;
        most_specific_location TEXT;
        loc_type TEXT;
        property_area DECIMAL;
        calculated_avg_price DECIMAL;
        has_valid_data BOOLEAN := FALSE;
      BEGIN
        -- Extract location information
        compound_name := appraisal_record.form_data ->> 'compound_name';
        district_name := appraisal_record.form_data ->> 'district_name';
        area_name := appraisal_record.form_data ->> 'area';
        city_name := appraisal_record.form_data ->> 'city_name';
        
        -- Check if we have valid price and area data
        property_area := COALESCE(
          (appraisal_record.form_data ->> 'unit_area_sqm')::DECIMAL,
          (appraisal_record.form_data ->> 'built_area')::DECIMAL,
          (appraisal_record.form_data ->> 'total_area')::DECIMAL
        );
        
        has_valid_data := (
          appraisal_record.market_value_estimate IS NOT NULL 
          AND appraisal_record.market_value_estimate > 0
          AND property_area IS NOT NULL 
          AND property_area > 0
        );
        
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
          skipped_count := skipped_count + 1;
          CONTINUE;
        END IF;
        
        -- Calculate weighted average price (only if we have valid data)
        IF has_valid_data THEN
          calculated_avg_price := calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location);
        ELSE
          calculated_avg_price := NULL;
        END IF;
        
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
          CASE WHEN calculated_avg_price IS NOT NULL THEN NOW() ELSE NULL END,
          CASE WHEN calculated_avg_price IS NOT NULL THEN 'moderate' ELSE 'low' END,
          'low' -- Will be updated correctly in the DO UPDATE
        ) ON CONFLICT (location_type, location_name)
        DO UPDATE SET 
          total_appraisals = market_intelligence_cache.total_appraisals + 1,
          avg_price_per_sqm = CASE 
            WHEN has_valid_data THEN calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location)
            ELSE market_intelligence_cache.avg_price_per_sqm
          END,
          last_updated = NOW(),
          last_price_update = CASE 
            WHEN has_valid_data AND calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location) IS NOT NULL 
            THEN NOW()
            ELSE market_intelligence_cache.last_price_update
          END,
          market_activity = CASE 
            WHEN has_valid_data AND calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location) IS NOT NULL 
            THEN 'moderate'
            ELSE COALESCE(market_intelligence_cache.market_activity, 'low')
          END,
          confidence_level = CASE 
            WHEN market_intelligence_cache.total_appraisals + 1 >= 10 THEN 'high'
            WHEN market_intelligence_cache.total_appraisals + 1 >= 3 THEN 'medium'
            ELSE 'low'
          END;
        
        -- Update broader location levels for hierarchy (only if current level has valid data)
        IF loc_type = 'compound' AND district_name IS NOT NULL AND district_name != '' THEN
          INSERT INTO market_intelligence_cache (location_type, location_name, total_appraisals, avg_price_per_sqm, last_updated, last_price_update)
          VALUES ('district', district_name, 1, 
            CASE WHEN has_valid_data THEN calculate_weighted_avg_price_per_sqm('district', district_name) ELSE NULL END, 
            NOW(), 
            CASE WHEN has_valid_data THEN NOW() ELSE NULL END)
          ON CONFLICT (location_type, location_name)
          DO UPDATE SET 
            total_appraisals = market_intelligence_cache.total_appraisals + 1,
            avg_price_per_sqm = CASE 
              WHEN has_valid_data THEN calculate_weighted_avg_price_per_sqm('district', district_name)
              ELSE market_intelligence_cache.avg_price_per_sqm
            END,
            last_updated = NOW(),
            last_price_update = CASE 
              WHEN has_valid_data THEN NOW()
              ELSE market_intelligence_cache.last_price_update
            END;
        END IF;
        
        -- Update area level if available
        IF area_name IS NOT NULL AND area_name != '' AND loc_type IN ('compound', 'district') THEN
          INSERT INTO market_intelligence_cache (location_type, location_name, total_appraisals, avg_price_per_sqm, last_updated, last_price_update)
          VALUES ('area', area_name, 1, 
            CASE WHEN has_valid_data THEN calculate_weighted_avg_price_per_sqm('area', area_name) ELSE NULL END, 
            NOW(), 
            CASE WHEN has_valid_data THEN NOW() ELSE NULL END)
          ON CONFLICT (location_type, location_name)
          DO UPDATE SET 
            total_appraisals = market_intelligence_cache.total_appraisals + 1,
            avg_price_per_sqm = CASE 
              WHEN has_valid_data THEN calculate_weighted_avg_price_per_sqm('area', area_name)
              ELSE market_intelligence_cache.avg_price_per_sqm
            END,
            last_updated = NOW(),
            last_price_update = CASE 
              WHEN has_valid_data THEN NOW()
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
          RAISE NOTICE 'Processed % of % appraisals (% with valid price data)...', 
            processed_count, total_to_process, 
            processed_count - skipped_count;
        END IF;
        
      END;
    EXCEPTION
      WHEN OTHERS THEN
        error_count := error_count + 1;
        RAISE NOTICE 'Error processing appraisal %: %', appraisal_record.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE NOTICE '';
  RAISE NOTICE 'Safe market intelligence recalculation completed!';
  RAISE NOTICE 'Successfully processed: % appraisals', processed_count;
  RAISE NOTICE 'Skipped (no location): % appraisals', skipped_count;
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
        WHEN mic.total_appraisals > 0 THEN 'Location tracked, awaiting price data'
        ELSE 'No valid data available'
      END as processing_status
    FROM market_intelligence_cache mic
    ORDER BY mic.location_type, mic.total_appraisals DESC, mic.location_name;
    
END;
$$ LANGUAGE plpgsql;

-- Execute the safe recalculation
SELECT * FROM safe_recalculate_market_intelligence();

-- Safe summary with division by zero protection
DO $$
DECLARE
  total_locations INTEGER;
  locations_with_prices INTEGER;
  total_appraisals_processed INTEGER;
  success_rate DECIMAL;
BEGIN
  SELECT 
    COUNT(*), 
    COUNT(CASE WHEN avg_price_per_sqm IS NOT NULL THEN 1 END), 
    COALESCE(SUM(total_appraisals), 0)
  INTO total_locations, locations_with_prices, total_appraisals_processed
  FROM market_intelligence_cache;
  
  -- Safe division
  IF total_locations > 0 THEN
    success_rate := ROUND((locations_with_prices::DECIMAL / total_locations * 100), 1);
  ELSE
    success_rate := 0;
  END IF;
  
  RAISE NOTICE '';
  RAISE NOTICE '=== SAFE RECALCULATION SUMMARY ===';
  RAISE NOTICE 'Total locations created: %', total_locations;
  RAISE NOTICE 'Locations with price data: %', locations_with_prices;
  RAISE NOTICE 'Price calculation success rate: %%%', success_rate;
  RAISE NOTICE 'Total appraisals processed: %', total_appraisals_processed;
  RAISE NOTICE '';
  
  IF total_locations > 0 THEN
    RAISE NOTICE '✅ Enhanced market intelligence system is now active!';
    RAISE NOTICE 'Your market intelligence dashboard will now show data for % locations.', total_locations;
    IF locations_with_prices > 0 THEN
      RAISE NOTICE 'Price data is available for % locations (% success rate).', locations_with_prices, success_rate;
    ELSE
      RAISE NOTICE '⚠️  No price data calculated. Check that appraisals have market_value_estimate and area data.';
    END IF;
  ELSE
    RAISE NOTICE '⚠️  No locations were created. Check that appraisals have location data (compound_name, district_name, area, or city_name).';
  END IF;
END $$;
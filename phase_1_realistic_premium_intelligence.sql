-- Phase 1.1: Realistic Premium Market Intelligence - Extract Real Data
-- Based on actual appraisal form_data structure analysis
-- Date: 2025-09-21

-- Step 1: Add realistic investment columns based on actual available data
ALTER TABLE market_intelligence_cache 
ADD COLUMN IF NOT EXISTS rental_yield_percentage DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS monthly_rental_estimate INTEGER,
ADD COLUMN IF NOT EXISTS neighborhood_quality_rating INTEGER,
ADD COLUMN IF NOT EXISTS comparable_price_per_sqm DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS investment_attractiveness VARCHAR(20),
ADD COLUMN IF NOT EXISTS demand_supply_ratio DECIMAL(3,2);

-- Step 2: Create function to extract real data from existing appraisals
CREATE OR REPLACE FUNCTION extract_premium_intelligence_from_appraisals()
RETURNS TABLE(
    result_location_type VARCHAR(50),
    result_location_name VARCHAR(255),
    extracted_data JSONB,
    processing_status TEXT
) AS $$
DECLARE
    appraisal_record RECORD;
    processed_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting premium intelligence extraction from real appraisal data...';
    
    -- Process each completed appraisal to extract premium data
    FOR appraisal_record IN
        SELECT 
            id,
            form_data,
            market_value_estimate,
            created_at
        FROM property_appraisals 
        WHERE status = 'completed'
        ORDER BY created_at DESC
    LOOP
        DECLARE
            compound_name TEXT;
            district_name TEXT;
            area_name TEXT;
            city_name TEXT;
            most_specific_location TEXT;
            loc_type TEXT;
            
            -- Premium intelligence data from form_data
            monthly_rental DECIMAL;
            area_rating INTEGER;
            market_trend TEXT;
            investment_level TEXT;
            demand_ratio DECIMAL;
            comp_price_sqm DECIMAL;
            
            extracted_intelligence JSONB := '{}';
        BEGIN
            -- Extract location hierarchy
            compound_name := appraisal_record.form_data ->> 'compound_name';
            district_name := appraisal_record.form_data ->> 'district_name';
            area_name := appraisal_record.form_data ->> 'area';
            city_name := appraisal_record.form_data ->> 'city_name';
            
            -- Determine most specific location
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
                CONTINUE; -- Skip if no location data
            END IF;
            
            -- Extract premium intelligence data (based on actual form_data structure)
            monthly_rental := COALESCE(
                (appraisal_record.form_data ->> 'monthly_rental_estimate')::DECIMAL,
                0
            );
            
            area_rating := COALESCE(
                (appraisal_record.form_data ->> 'neighborhood_quality_rating')::INTEGER,
                (appraisal_record.form_data ->> 'accessibility_rating')::INTEGER,
                5 -- Default rating
            );
            
            market_trend := COALESCE(
                appraisal_record.form_data ->> 'market_trend',
                'stable'
            );
            
            investment_level := CASE 
                WHEN market_trend = 'rising' AND monthly_rental > 7000 THEN 'high'
                WHEN market_trend = 'stable' AND monthly_rental > 5000 THEN 'medium'
                ELSE 'low'
            END;
            
            -- Extract comparable sales data for market intelligence
            comp_price_sqm := COALESCE(
                (appraisal_record.form_data ->> 'comparable_sale_1_price_per_sqm')::DECIMAL,
                (appraisal_record.form_data ->> 'price_per_sqm_fully_finished')::DECIMAL,
                0
            );
            
            -- Build extracted intelligence JSON
            extracted_intelligence := jsonb_build_object(
                'monthly_rental_estimate', monthly_rental,
                'neighborhood_quality_rating', area_rating,
                'market_trend', market_trend,
                'investment_attractiveness', investment_level,
                'comparable_price_per_sqm', comp_price_sqm,
                'market_activity', COALESCE(appraisal_record.form_data ->> 'market_activity', 'moderate'),
                'demand_supply_indicator', market_trend,
                'last_updated', NOW()
            );
            
            -- Update market intelligence cache with extracted data
            INSERT INTO market_intelligence_cache (
                location_type,
                location_name,
                total_appraisals,
                avg_price_per_sqm,
                rental_yield_percentage,
                monthly_rental_estimate,
                neighborhood_quality_rating,
                comparable_price_per_sqm,
                investment_attractiveness,
                market_activity,
                last_updated
            ) VALUES (
                loc_type,
                most_specific_location,
                1,
                calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location),
                CASE 
                    WHEN monthly_rental > 0 AND appraisal_record.market_value_estimate > 0 
                    THEN ROUND((monthly_rental * 12.0 / appraisal_record.market_value_estimate * 100), 2)
                    ELSE NULL 
                END,
                monthly_rental,
                area_rating,
                comp_price_sqm,
                investment_level,
                COALESCE(appraisal_record.form_data ->> 'market_activity', 'moderate'),
                NOW()
            ) ON CONFLICT (location_type, location_name)
            DO UPDATE SET
                total_appraisals = market_intelligence_cache.total_appraisals + 1,
                avg_price_per_sqm = calculate_weighted_avg_price_per_sqm(loc_type, most_specific_location),
                rental_yield_percentage = CASE 
                    WHEN monthly_rental > 0 AND appraisal_record.market_value_estimate > 0 
                    THEN ROUND((monthly_rental * 12.0 / appraisal_record.market_value_estimate * 100), 2)
                    ELSE market_intelligence_cache.rental_yield_percentage
                END,
                monthly_rental_estimate = CASE 
                    WHEN monthly_rental > 0 THEN monthly_rental
                    ELSE market_intelligence_cache.monthly_rental_estimate
                END,
                neighborhood_quality_rating = GREATEST(
                    COALESCE(market_intelligence_cache.neighborhood_quality_rating, 0),
                    area_rating
                ),
                comparable_price_per_sqm = CASE 
                    WHEN comp_price_sqm > 0 THEN comp_price_sqm
                    ELSE market_intelligence_cache.comparable_price_per_sqm
                END,
                investment_attractiveness = investment_level,
                market_activity = COALESCE(appraisal_record.form_data ->> 'market_activity', market_intelligence_cache.market_activity),
                last_updated = NOW();
            
            processed_count := processed_count + 1;
            
            -- Return this extraction result
            RETURN QUERY SELECT 
                loc_type::VARCHAR(50),
                most_specific_location::VARCHAR(255),
                extracted_intelligence,
                'Premium data extracted successfully'::TEXT;
                
        END;
    END LOOP;
    
    RAISE NOTICE 'Premium intelligence extraction completed. Processed % appraisals.', processed_count;
    
END;
$$ LANGUAGE plpgsql;

-- Step 3: Execute the extraction
SELECT * FROM extract_premium_intelligence_from_appraisals();

-- Step 4: Verify the results
SELECT 
    'Premium Intelligence Verification' as test_name,
    location_type,
    location_name,
    total_appraisals,
    avg_price_per_sqm,
    rental_yield_percentage,
    monthly_rental_estimate,
    neighborhood_quality_rating,
    comparable_price_per_sqm,
    investment_attractiveness,
    market_activity
FROM market_intelligence_cache
WHERE rental_yield_percentage IS NOT NULL 
   OR monthly_rental_estimate IS NOT NULL
ORDER BY total_appraisals DESC;

-- Step 5: Create investment opportunity scoring based on real data
CREATE OR REPLACE FUNCTION calculate_investment_opportunity_score(
    location_name_param VARCHAR(255),
    location_type_param VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
    cache_data RECORD;
    opportunity_score INTEGER := 50; -- Base score
BEGIN
    -- Get the premium intelligence data for this location
    SELECT * INTO cache_data
    FROM market_intelligence_cache
    WHERE location_name = location_name_param 
      AND location_type = location_type_param;
    
    IF cache_data IS NULL THEN
        RETURN 0;
    END IF;
    
    -- Score based on rental yield (real data)
    IF cache_data.rental_yield_percentage IS NOT NULL THEN
        CASE 
            WHEN cache_data.rental_yield_percentage > 8 THEN opportunity_score := opportunity_score + 20;
            WHEN cache_data.rental_yield_percentage > 6 THEN opportunity_score := opportunity_score + 15;
            WHEN cache_data.rental_yield_percentage > 4 THEN opportunity_score := opportunity_score + 10;
            ELSE opportunity_score := opportunity_score + 5;
        END CASE;
    END IF;
    
    -- Score based on neighborhood quality (real data)
    IF cache_data.neighborhood_quality_rating IS NOT NULL THEN
        opportunity_score := opportunity_score + (cache_data.neighborhood_quality_rating * 2);
    END IF;
    
    -- Score based on market activity (real data)
    CASE cache_data.market_activity
        WHEN 'hot' THEN opportunity_score := opportunity_score + 15;
        WHEN 'moderate' THEN opportunity_score := opportunity_score + 10;
        WHEN 'active' THEN opportunity_score := opportunity_score + 12;
        ELSE opportunity_score := opportunity_score + 5;
    END CASE;
    
    -- Score based on investment attractiveness (calculated from real data)
    CASE cache_data.investment_attractiveness
        WHEN 'high' THEN opportunity_score := opportunity_score + 15;
        WHEN 'medium' THEN opportunity_score := opportunity_score + 10;
        ELSE opportunity_score := opportunity_score + 5;
    END CASE;
    
    -- Ensure score is within 0-100 range
    opportunity_score := LEAST(100, GREATEST(0, opportunity_score));
    
    RETURN opportunity_score;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Update investment scores in cache
UPDATE market_intelligence_cache 
SET investment_score = calculate_investment_opportunity_score(location_name, location_type)
WHERE location_name IS NOT NULL;

-- Step 7: Final verification and summary
DO $$
DECLARE
    total_locations INTEGER;
    locations_with_premium_data INTEGER;
    avg_rental_yield DECIMAL;
    avg_investment_score INTEGER;
BEGIN
    SELECT 
        COUNT(*),
        COUNT(CASE WHEN rental_yield_percentage IS NOT NULL OR monthly_rental_estimate IS NOT NULL THEN 1 END),
        AVG(rental_yield_percentage),
        AVG(investment_score)
    INTO total_locations, locations_with_premium_data, avg_rental_yield, avg_investment_score
    FROM market_intelligence_cache;
    
    RAISE NOTICE '';
    RAISE NOTICE '=== PHASE 1.1 PREMIUM INTELLIGENCE EXTRACTION COMPLETE ===';
    RAISE NOTICE 'Total locations in cache: %', total_locations;
    RAISE NOTICE 'Locations with premium data: %', locations_with_premium_data;
    RAISE NOTICE 'Average rental yield: % percent (based on real appraisal data)', ROUND(avg_rental_yield, 2);
    RAISE NOTICE 'Average investment score: %/100', avg_investment_score;
    RAISE NOTICE '';
    RAISE NOTICE '✅ Phase 1.1 Complete: Premium intelligence extracted from real appraisal data!';
    RAISE NOTICE 'Available premium metrics:';
    RAISE NOTICE '- Rental yield percentages (calculated from actual rental estimates)';
    RAISE NOTICE '- Monthly rental estimates (from appraiser assessments)';
    RAISE NOTICE '- Neighborhood quality ratings (from appraiser evaluations)';
    RAISE NOTICE '- Comparable sales prices (from market analysis)';
    RAISE NOTICE '- Investment attractiveness scores (calculated from real trends)';
    RAISE NOTICE '- Market activity levels (from appraiser observations)';
END $$;
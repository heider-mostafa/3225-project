-- Phase 3: Price History Tracking for Market Intelligence
-- Creates price history table and trend calculation functions
-- Date: 2025-09-21

-- Create price history table to track price changes over time
CREATE TABLE IF NOT EXISTS market_price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    location_type VARCHAR(50) NOT NULL,
    location_name VARCHAR(255) NOT NULL,
    price_per_sqm DECIMAL(12,2) NOT NULL,
    total_appraisals INTEGER NOT NULL DEFAULT 1,
    confidence_level VARCHAR(20) DEFAULT 'low',
    market_activity VARCHAR(20) DEFAULT 'low',
    data_source VARCHAR(50) DEFAULT 'appraisal', -- 'appraisal', 'market_report', 'external'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT price_history_price_positive CHECK (price_per_sqm > 0),
    CONSTRAINT price_history_appraisals_positive CHECK (total_appraisals > 0),
    CONSTRAINT price_history_confidence_valid CHECK (confidence_level IN ('low', 'medium', 'high')),
    CONSTRAINT price_history_activity_valid CHECK (market_activity IN ('low', 'moderate', 'high', 'hot'))
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_market_price_history_location ON market_price_history (location_type, location_name);
CREATE INDEX IF NOT EXISTS idx_market_price_history_date ON market_price_history (created_at);
CREATE INDEX IF NOT EXISTS idx_market_price_history_composite ON market_price_history (location_type, location_name, created_at);

-- Create RLS policies for price history
ALTER TABLE market_price_history ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read price history
CREATE POLICY "Allow authenticated users to read price history" ON market_price_history
    FOR SELECT USING (auth.role() = 'authenticated');

-- Allow service role to manage price history
CREATE POLICY "Allow service role to manage price history" ON market_price_history
    FOR ALL USING (auth.role() = 'service_role');

-- Function to calculate price trends
CREATE OR REPLACE FUNCTION calculate_price_trends(
    p_location_type VARCHAR(50),
    p_location_name VARCHAR(255),
    p_months_back INTEGER DEFAULT 12
) RETURNS TABLE(
    trend_period TEXT,
    price_change_percent DECIMAL(5,2),
    price_change_absolute DECIMAL(12,2),
    current_price DECIMAL(12,2),
    previous_price DECIMAL(12,2),
    data_points INTEGER
) AS $$
DECLARE
    current_avg_price DECIMAL(12,2);
    price_6_months_ago DECIMAL(12,2);
    price_12_months_ago DECIMAL(12,2);
    price_24_months_ago DECIMAL(12,2);
BEGIN
    -- Get current average price
    SELECT avg_price_per_sqm INTO current_avg_price
    FROM market_intelligence_cache
    WHERE location_type = p_location_type AND location_name = p_location_name
    LIMIT 1;
    
    -- If no current price, return empty
    IF current_avg_price IS NULL THEN
        RETURN;
    END IF;
    
    -- Get price 6 months ago
    SELECT price_per_sqm INTO price_6_months_ago
    FROM market_price_history
    WHERE location_type = p_location_type 
      AND location_name = p_location_name
      AND created_at <= NOW() - INTERVAL '6 months'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get price 12 months ago
    SELECT price_per_sqm INTO price_12_months_ago
    FROM market_price_history
    WHERE location_type = p_location_type 
      AND location_name = p_location_name
      AND created_at <= NOW() - INTERVAL '12 months'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get price 24 months ago
    SELECT price_per_sqm INTO price_24_months_ago
    FROM market_price_history
    WHERE location_type = p_location_type 
      AND location_name = p_location_name
      AND created_at <= NOW() - INTERVAL '24 months'
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Return 6-month trend
    IF price_6_months_ago IS NOT NULL THEN
        RETURN QUERY SELECT 
            '6_months'::TEXT,
            ROUND(((current_avg_price - price_6_months_ago) / price_6_months_ago * 100), 2),
            ROUND((current_avg_price - price_6_months_ago), 2),
            current_avg_price,
            price_6_months_ago,
            6;
    END IF;
    
    -- Return 12-month trend
    IF price_12_months_ago IS NOT NULL THEN
        RETURN QUERY SELECT 
            '1_year'::TEXT,
            ROUND(((current_avg_price - price_12_months_ago) / price_12_months_ago * 100), 2),
            ROUND((current_avg_price - price_12_months_ago), 2),
            current_avg_price,
            price_12_months_ago,
            12;
    END IF;
    
    -- Return 24-month trend
    IF price_24_months_ago IS NOT NULL THEN
        RETURN QUERY SELECT 
            '2_years'::TEXT,
            ROUND(((current_avg_price - price_24_months_ago) / price_24_months_ago * 100), 2),
            ROUND((current_avg_price - price_24_months_ago), 2),
            current_avg_price,
            price_24_months_ago,
            24;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to record price history automatically
CREATE OR REPLACE FUNCTION record_price_history() RETURNS TRIGGER AS $$
BEGIN
    -- Only record if price actually changed significantly (more than 1% or first entry)
    IF NOT EXISTS (
        SELECT 1 FROM market_price_history 
        WHERE location_type = NEW.location_type 
          AND location_name = NEW.location_name
    ) OR (
        SELECT ABS((NEW.avg_price_per_sqm - price_per_sqm) / price_per_sqm * 100) 
        FROM market_price_history
        WHERE location_type = NEW.location_type 
          AND location_name = NEW.location_name
        ORDER BY created_at DESC
        LIMIT 1
    ) > 1 THEN
        
        INSERT INTO market_price_history (
            location_type,
            location_name,
            price_per_sqm,
            total_appraisals,
            confidence_level,
            market_activity,
            data_source
        ) VALUES (
            NEW.location_type,
            NEW.location_name,
            NEW.avg_price_per_sqm,
            NEW.total_appraisals,
            NEW.confidence_level,
            NEW.market_activity,
            'appraisal'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically record price history
DROP TRIGGER IF EXISTS trigger_record_price_history ON market_intelligence_cache;
CREATE TRIGGER trigger_record_price_history
    AFTER INSERT OR UPDATE OF avg_price_per_sqm ON market_intelligence_cache
    FOR EACH ROW
    WHEN (NEW.avg_price_per_sqm IS NOT NULL AND NEW.avg_price_per_sqm > 0)
    EXECUTE FUNCTION record_price_history();

-- Function to update trend columns in market_intelligence_cache
CREATE OR REPLACE FUNCTION update_price_trends_in_cache() RETURNS VOID AS $$
DECLARE
    cache_record RECORD;
    trend_6_months DECIMAL(5,2);
    trend_1_year DECIMAL(5,2);
BEGIN
    -- Update trends for all cache entries
    FOR cache_record IN 
        SELECT location_type, location_name 
        FROM market_intelligence_cache 
        WHERE avg_price_per_sqm IS NOT NULL
    LOOP
        -- Get 6-month trend
        SELECT price_change_percent INTO trend_6_months
        FROM calculate_price_trends(cache_record.location_type, cache_record.location_name, 6)
        WHERE trend_period = '6_months'
        LIMIT 1;
        
        -- Get 1-year trend
        SELECT price_change_percent INTO trend_1_year
        FROM calculate_price_trends(cache_record.location_type, cache_record.location_name, 12)
        WHERE trend_period = '1_year'
        LIMIT 1;
        
        -- Update cache with calculated trends
        UPDATE market_intelligence_cache 
        SET 
            price_trend_6_months = COALESCE(trend_6_months, 0),
            price_trend_1_year = COALESCE(trend_1_year, 0),
            last_updated = NOW()
        WHERE location_type = cache_record.location_type 
          AND location_name = cache_record.location_name;
    END LOOP;
    
    RAISE NOTICE 'Price trends updated for all cache entries';
END;
$$ LANGUAGE plpgsql;

-- Create initial price history records from current cache
INSERT INTO market_price_history (
    location_type,
    location_name,
    price_per_sqm,
    total_appraisals,
    confidence_level,
    market_activity,
    data_source,
    created_at
)
SELECT 
    location_type,
    location_name,
    avg_price_per_sqm,
    total_appraisals,
    confidence_level,
    market_activity,
    'migration_baseline',
    COALESCE(last_price_update, last_updated, NOW())
FROM market_intelligence_cache
WHERE avg_price_per_sqm IS NOT NULL AND avg_price_per_sqm > 0
ON CONFLICT DO NOTHING;

-- Summary
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '=== PRICE HISTORY TRACKING SYSTEM INSTALLED ===';
    RAISE NOTICE 'Created table: market_price_history';
    RAISE NOTICE 'Created function: calculate_price_trends()';
    RAISE NOTICE 'Created function: record_price_history()';
    RAISE NOTICE 'Created function: update_price_trends_in_cache()';
    RAISE NOTICE 'Created trigger: trigger_record_price_history';
    RAISE NOTICE '';
    RAISE NOTICE 'Price history records created: %', (SELECT COUNT(*) FROM market_price_history);
    RAISE NOTICE '';
    RAISE NOTICE '✅ Phase 3 Complete: Price history tracking is now active!';
    RAISE NOTICE 'Future price changes will be automatically tracked for trend analysis.';
END $$;
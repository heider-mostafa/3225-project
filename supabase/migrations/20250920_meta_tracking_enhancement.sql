-- Meta Algorithm Optimization: Database Enhancement for Conversions API
-- Phase 1 Step C: Add Meta tracking columns to existing tables
-- This enhances existing OpenBeit platform tables with Meta tracking capabilities

-- 1. ENHANCE TOUR_SESSIONS TABLE (Virtual Tour Engagement Tracking)
-- =================================================================
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 0; -- 0-100 scoring
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS lead_quality_score INTEGER DEFAULT 0; -- 0-65 existing scoring system
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS facebook_click_id TEXT; -- fbclid parameter
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT; -- _fbp cookie
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS utm_campaign TEXT;
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS utm_content TEXT;
ALTER TABLE tour_sessions ADD COLUMN IF NOT EXISTS utm_term TEXT;

-- 2. ENHANCE PROPERTY_VIEWINGS TABLE (Highest Intent Event - Property Booking)
-- ===========================================================================
-- Note: This table represents your highest intent conversion event
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS lead_quality_score INTEGER DEFAULT 0; -- 0-65 scoring
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS conversion_probability INTEGER DEFAULT 0; -- 0-100%
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS estimated_commission_value DECIMAL(10,2); -- EGP estimated commission
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE property_viewings ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- 3. ENHANCE LEADS TABLE (Lead Capture and N8N Workflow Integration)
-- ==================================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS conversion_probability INTEGER DEFAULT 0; -- Based on your 0-65 scoring
ALTER TABLE leads ADD COLUMN IF NOT EXISTS estimated_value DECIMAL(10,2); -- EGP estimated lead value
ALTER TABLE leads ADD COLUMN IF NOT EXISTS meta_tracking_consent BOOLEAN DEFAULT TRUE; -- GDPR compliance

-- 4. ENHANCE HEYGEN_SESSIONS TABLE (AI Agent Conversation Tracking)
-- ================================================================
ALTER TABLE heygen_sessions ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE heygen_sessions ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
ALTER TABLE heygen_sessions ADD COLUMN IF NOT EXISTS engagement_quality_score INTEGER DEFAULT 0; -- 0-100
ALTER TABLE heygen_sessions ADD COLUMN IF NOT EXISTS conversion_indicator BOOLEAN DEFAULT FALSE; -- High-intent conversation
ALTER TABLE heygen_sessions ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
ALTER TABLE heygen_sessions ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;

-- 5. ENHANCE SAVED_PROPERTIES TABLE (Property Interest Tracking)
-- ==============================================================
ALTER TABLE saved_properties ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE saved_properties ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
ALTER TABLE saved_properties ADD COLUMN IF NOT EXISTS interest_score INTEGER DEFAULT 0; -- 0-100
ALTER TABLE saved_properties ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
ALTER TABLE saved_properties ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;
ALTER TABLE saved_properties ADD COLUMN IF NOT EXISTS source_page TEXT; -- Which page they saved from

-- 6. ENHANCE RENTAL_BOOKINGS TABLE (Rental Marketplace Conversions)
-- =================================================================
-- Note: This table exists from your rental marketplace system
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'rental_bookings') THEN
        -- Add Meta tracking columns to rental bookings
        ALTER TABLE rental_bookings ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
        ALTER TABLE rental_bookings ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
        ALTER TABLE rental_bookings ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
        ALTER TABLE rental_bookings ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;
        ALTER TABLE rental_bookings ADD COLUMN IF NOT EXISTS booking_source TEXT; -- direct, meta_ads, google, etc
    END IF;
END $$;

-- 7. ENHANCE PROPERTY_APPRAISALS TABLE (Appraisal System Integration)
-- ===================================================================
-- Note: This table exists from your smart appraisal system
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'property_appraisals') THEN
        ALTER TABLE property_appraisals ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
        ALTER TABLE property_appraisals ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
        ALTER TABLE property_appraisals ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
        ALTER TABLE property_appraisals ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;
        ALTER TABLE property_appraisals ADD COLUMN IF NOT EXISTS appraisal_value_impact DECIMAL(4,2); -- Multiplier for Meta value
    END IF;
END $$;

-- 8. CREATE META CONVERSION EVENTS LOG TABLE
-- ==========================================
-- Central table to track all Meta conversion events sent
CREATE TABLE IF NOT EXISTS meta_conversion_events (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    event_id TEXT UNIQUE NOT NULL, -- Meta event_id for deduplication
    event_name TEXT NOT NULL, -- Lead, CompleteRegistration, Purchase, ViewContent, etc
    table_name TEXT NOT NULL, -- Source table (leads, property_viewings, etc)
    record_id UUID NOT NULL, -- ID of the record in source table
    user_email TEXT,
    user_phone TEXT,
    event_value DECIMAL(10,2), -- EGP value sent to Meta
    custom_data JSONB, -- All custom data sent to Meta
    meta_response JSONB, -- Response from Meta API
    success BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CREATE INDEXES FOR PERFORMANCE
-- =================================
-- Tour sessions indexes
CREATE INDEX IF NOT EXISTS idx_tour_sessions_meta_event_sent ON tour_sessions(meta_event_sent);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_engagement_score ON tour_sessions(engagement_score);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_facebook_click_id ON tour_sessions(facebook_click_id);
CREATE INDEX IF NOT EXISTS idx_tour_sessions_utm_source ON tour_sessions(utm_source);

-- Property viewings indexes  
CREATE INDEX IF NOT EXISTS idx_property_viewings_meta_event_sent ON property_viewings(meta_event_sent);
CREATE INDEX IF NOT EXISTS idx_property_viewings_lead_quality_score ON property_viewings(lead_quality_score);
CREATE INDEX IF NOT EXISTS idx_property_viewings_facebook_click_id ON property_viewings(facebook_click_id);

-- Leads indexes
CREATE INDEX IF NOT EXISTS idx_leads_meta_event_sent ON leads(meta_event_sent);
CREATE INDEX IF NOT EXISTS idx_leads_facebook_click_id ON leads(facebook_click_id);
CREATE INDEX IF NOT EXISTS idx_leads_conversion_probability ON leads(conversion_probability);

-- HeyGen sessions indexes
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_meta_event_sent ON heygen_sessions(meta_event_sent);
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_engagement_quality_score ON heygen_sessions(engagement_quality_score);
CREATE INDEX IF NOT EXISTS idx_heygen_sessions_conversion_indicator ON heygen_sessions(conversion_indicator);

-- Saved properties indexes
CREATE INDEX IF NOT EXISTS idx_saved_properties_meta_event_sent ON saved_properties(meta_event_sent);
CREATE INDEX IF NOT EXISTS idx_saved_properties_interest_score ON saved_properties(interest_score);

-- Meta conversion events indexes
CREATE INDEX IF NOT EXISTS idx_meta_conversion_events_event_name ON meta_conversion_events(event_name);
CREATE INDEX IF NOT EXISTS idx_meta_conversion_events_table_name ON meta_conversion_events(table_name);
CREATE INDEX IF NOT EXISTS idx_meta_conversion_events_success ON meta_conversion_events(success);
CREATE INDEX IF NOT EXISTS idx_meta_conversion_events_sent_at ON meta_conversion_events(sent_at);
CREATE INDEX IF NOT EXISTS idx_meta_conversion_events_user_email ON meta_conversion_events(user_email);

-- 10. ENABLE ROW LEVEL SECURITY FOR NEW TABLE
-- ===========================================
ALTER TABLE meta_conversion_events ENABLE ROW LEVEL SECURITY;

-- Allow admin access to Meta conversion events
CREATE POLICY "Allow admin access to meta conversion events" ON meta_conversion_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_profiles up
            WHERE up.user_id = auth.uid()
            AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
        )
    );

-- 11. CREATE UTILITY FUNCTIONS FOR META TRACKING
-- ==============================================

-- Function to calculate engagement score for virtual tours
CREATE OR REPLACE FUNCTION calculate_tour_engagement_score(
    duration_seconds INTEGER,
    rooms_visited JSONB,
    actions_taken JSONB,
    completed BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
    score INTEGER := 0;
    rooms_count INTEGER;
    actions_count INTEGER;
BEGIN
    -- Initialize counts
    rooms_count := COALESCE(jsonb_array_length(rooms_visited), 0);
    actions_count := COALESCE(jsonb_array_length(actions_taken), 0);
    
    -- Time-based scoring (up to 30 points)
    IF duration_seconds >= 600 THEN score := score + 30; -- 10+ minutes
    ELSIF duration_seconds >= 300 THEN score := score + 20; -- 5-10 minutes  
    ELSIF duration_seconds >= 120 THEN score := score + 10; -- 2-5 minutes
    END IF;
    
    -- Exploration depth (up to 25 points)
    IF rooms_count >= 8 THEN score := score + 25; -- Visited many rooms
    ELSIF rooms_count >= 5 THEN score := score + 15; -- Visited several rooms
    ELSIF rooms_count >= 3 THEN score := score + 8; -- Visited some rooms
    END IF;
    
    -- Interaction quality (up to 25 points)
    IF actions_count >= 15 THEN score := score + 25; -- High interaction
    ELSIF actions_count >= 8 THEN score := score + 15; -- Medium interaction
    ELSIF actions_count >= 3 THEN score := score + 8; -- Some interaction
    END IF;
    
    -- Completion bonus (up to 20 points)
    IF completed THEN score := score + 20; END IF;
    
    RETURN LEAST(score, 100); -- Cap at 100
END;
$$ LANGUAGE plpgsql;

-- Function to calculate conversion probability for property viewings
CREATE OR REPLACE FUNCTION calculate_viewing_conversion_probability(
    lead_quality_score INTEGER,
    viewing_type TEXT,
    party_size INTEGER,
    user_email TEXT
) RETURNS INTEGER AS $$
DECLARE
    probability INTEGER := 0;
BEGIN
    -- Base probability from lead quality (0-65 scale to 0-60 probability)
    probability := COALESCE(lead_quality_score, 0);
    
    -- Viewing type multiplier
    CASE viewing_type
        WHEN 'in_person' THEN probability := probability + 20; -- Higher intent
        WHEN 'virtual' THEN probability := probability + 10; -- Medium intent
        WHEN 'phone_call' THEN probability := probability + 5; -- Lower intent
    END CASE;
    
    -- Party size indicator (larger party = more serious)
    IF party_size >= 3 THEN probability := probability + 10;
    ELSIF party_size = 2 THEN probability := probability + 5;
    END IF;
    
    -- Email provided indicator (higher intent)
    IF user_email IS NOT NULL AND user_email != '' THEN
        probability := probability + 5;
    END IF;
    
    RETURN LEAST(probability, 100); -- Cap at 100%
END;
$$ LANGUAGE plpgsql;

-- Function to estimate commission value for property viewings
CREATE OR REPLACE FUNCTION estimate_commission_value(
    property_id UUID,
    lead_quality_score INTEGER DEFAULT 0
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    property_price DECIMAL(15,2);
    commission_rate DECIMAL(4,2) := 2.5; -- Default 2.5%
    quality_multiplier DECIMAL(3,2) := 1.0;
    estimated_value DECIMAL(10,2);
BEGIN
    -- Get property price
    SELECT price INTO property_price 
    FROM properties 
    WHERE id = property_id;
    
    -- Adjust commission rate based on lead quality
    IF lead_quality_score >= 50 THEN 
        quality_multiplier := 1.0; -- High quality leads
    ELSIF lead_quality_score >= 35 THEN 
        quality_multiplier := 0.7; -- Medium quality leads
    ELSIF lead_quality_score >= 20 THEN 
        quality_multiplier := 0.4; -- Basic leads
    ELSE 
        quality_multiplier := 0.2; -- Low quality leads
    END IF;
    
    -- Calculate estimated commission value
    estimated_value := (property_price * commission_rate / 100) * quality_multiplier;
    
    RETURN COALESCE(estimated_value, 0);
END;
$$ LANGUAGE plpgsql;

-- 12. CREATE TRIGGERS TO AUTO-CALCULATE SCORES
-- ============================================

-- Trigger to auto-calculate engagement score for tour sessions
CREATE OR REPLACE FUNCTION update_tour_engagement_score()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate engagement score when tour is completed
    IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
        NEW.engagement_score := calculate_tour_engagement_score(
            NEW.total_duration_seconds,
            NEW.rooms_visited,
            NEW.actions_taken,
            NEW.completed
        );
        
        -- Calculate lead quality score based on engagement
        NEW.lead_quality_score := CASE 
            WHEN NEW.engagement_score >= 80 THEN 55 -- High engagement = high lead quality
            WHEN NEW.engagement_score >= 60 THEN 40 -- Medium engagement = medium lead quality
            WHEN NEW.engagement_score >= 30 THEN 25 -- Low engagement = low lead quality
            ELSE 10 -- Very low engagement = minimal lead quality
        END;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_tour_engagement_score
    BEFORE UPDATE ON tour_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_tour_engagement_score();

-- Trigger to auto-calculate conversion probability for property viewings
CREATE OR REPLACE FUNCTION update_viewing_conversion_probability()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate conversion probability and estimated commission
    NEW.conversion_probability := calculate_viewing_conversion_probability(
        NEW.lead_quality_score,
        NEW.viewing_type,
        NEW.party_size,
        NEW.user_email
    );
    
    NEW.estimated_commission_value := estimate_commission_value(
        NEW.property_id,
        NEW.lead_quality_score
    );
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_viewing_conversion_probability
    BEFORE INSERT OR UPDATE ON property_viewings
    FOR EACH ROW
    EXECUTE FUNCTION update_viewing_conversion_probability();

-- 13. CREATE VIEW FOR META ANALYTICS DASHBOARD
-- ============================================
CREATE OR REPLACE VIEW meta_analytics_dashboard AS
SELECT 
    -- Overall Meta performance
    COUNT(*) as total_events_sent,
    COUNT(*) FILTER (WHERE success = true) as successful_events,
    COUNT(*) FILTER (WHERE success = false) as failed_events,
    ROUND(COUNT(*) FILTER (WHERE success = true) * 100.0 / COUNT(*), 2) as success_rate,
    
    -- Event breakdown
    COUNT(*) FILTER (WHERE event_name = 'Lead') as lead_events,
    COUNT(*) FILTER (WHERE event_name = 'CompleteRegistration') as registration_events,
    COUNT(*) FILTER (WHERE event_name = 'Purchase') as purchase_events,
    COUNT(*) FILTER (WHERE event_name = 'ViewContent') as view_content_events,
    COUNT(*) FILTER (WHERE event_name = 'AddToCart') as add_to_cart_events,
    
    -- Value metrics
    SUM(event_value) as total_value_sent,
    AVG(event_value) as average_event_value,
    MAX(event_value) as highest_event_value,
    
    -- Time-based metrics
    DATE_TRUNC('day', sent_at) as date,
    COUNT(*) as daily_events
FROM meta_conversion_events
GROUP BY DATE_TRUNC('day', sent_at)
ORDER BY date DESC;

-- Comment explaining the enhancement
COMMENT ON TABLE meta_conversion_events IS 'Central tracking table for all Meta Conversions API events sent from OpenBeit platform. Integrates with existing tour_sessions, property_viewings, leads, heygen_sessions, and other tables to provide comprehensive conversion tracking for Meta algorithm optimization.';

COMMENT ON FUNCTION calculate_tour_engagement_score IS 'Calculates engagement score (0-100) for virtual tours based on duration, rooms visited, actions taken, and completion status. Used to determine lead quality and Meta event values.';

COMMENT ON FUNCTION calculate_viewing_conversion_probability IS 'Calculates conversion probability (0-100%) for property viewing bookings based on lead quality score, viewing type, party size, and contact info. Used for Meta optimization.';

COMMENT ON FUNCTION estimate_commission_value IS 'Estimates potential commission value in EGP for property viewings based on property price and lead quality. Used to set appropriate Meta event values for algorithm optimization.';
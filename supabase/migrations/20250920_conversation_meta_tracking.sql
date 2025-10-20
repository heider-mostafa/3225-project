-- Phase 2.3: OpenAI Realtime Conversation Meta Tracking Enhancement
-- Add Meta tracking for conversation events

-- Create conversation events tracking table
CREATE TABLE IF NOT EXISTS conversation_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_type TEXT NOT NULL, -- 'started', 'message_sent', 'qualified', 'completed', 'high_intent'
    conversation_type TEXT NOT NULL, -- 'openai_realtime', 'heygen_avatar', 'text_chat', 'phone_call'
    property_id UUID,
    user_id UUID REFERENCES auth.users(id),
    
    -- Conversation analytics
    qualification_score INTEGER DEFAULT 0, -- 1-10 scale from conversation analyzer
    engagement_quality INTEGER DEFAULT 0, -- 0-100 calculated score
    next_action TEXT, -- 'qualified', 'potential', 'unqualified', 'callback'
    conversation_duration INTEGER DEFAULT 0, -- seconds
    sentiment_score DECIMAL(3,2) DEFAULT 0, -- -1 to 1
    
    -- Intent detection
    buying_intent TEXT DEFAULT 'unknown', -- 'high', 'medium', 'low', 'unknown'
    timeline_urgency TEXT DEFAULT 'unknown', -- 'immediate', 'soon', 'exploring', 'unknown'
    budget_discussed BOOLEAN DEFAULT FALSE,
    financing_mentioned BOOLEAN DEFAULT FALSE,
    viewing_requested BOOLEAN DEFAULT FALSE,
    
    -- Conversation content analysis
    key_topics TEXT[] DEFAULT '{}',
    positive_signals TEXT[] DEFAULT '{}',
    red_flags TEXT[] DEFAULT '{}',
    conversation_summary TEXT,
    
    -- Meta tracking
    meta_event_sent BOOLEAN DEFAULT FALSE,
    meta_event_id TEXT,
    meta_event_name TEXT,
    meta_event_value DECIMAL(10,2) DEFAULT 0,
    facebook_click_id TEXT,
    facebook_browser_id TEXT,
    
    -- Additional conversation data
    event_data JSONB DEFAULT '{}',
    user_email TEXT,
    user_phone TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_events_session_id ON conversation_events(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_events_property_id ON conversation_events(property_id);
CREATE INDEX IF NOT EXISTS idx_conversation_events_user_id ON conversation_events(user_id);
CREATE INDEX IF NOT EXISTS idx_conversation_events_type ON conversation_events(conversation_type, event_type);
CREATE INDEX IF NOT EXISTS idx_conversation_events_meta_tracking ON conversation_events(meta_event_sent, created_at);
CREATE INDEX IF NOT EXISTS idx_conversation_events_qualification ON conversation_events(qualification_score, buying_intent);

-- Add Meta tracking columns to existing call_logs table
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS meta_event_value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
ALTER TABLE call_logs ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;

-- Add Meta tracking columns to existing ai_call_logs table  
ALTER TABLE ai_call_logs ADD COLUMN IF NOT EXISTS meta_event_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_call_logs ADD COLUMN IF NOT EXISTS meta_event_id TEXT;
ALTER TABLE ai_call_logs ADD COLUMN IF NOT EXISTS engagement_quality_score INTEGER DEFAULT 0;
ALTER TABLE ai_call_logs ADD COLUMN IF NOT EXISTS conversion_indicator BOOLEAN DEFAULT FALSE;
ALTER TABLE ai_call_logs ADD COLUMN IF NOT EXISTS facebook_click_id TEXT;
ALTER TABLE ai_call_logs ADD COLUMN IF NOT EXISTS facebook_browser_id TEXT;

-- Create function to calculate conversation value based on qualification score
CREATE OR REPLACE FUNCTION calculate_conversation_value(
    qualification_score INTEGER,
    buying_intent TEXT DEFAULT 'unknown',
    property_id UUID DEFAULT NULL
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    base_value DECIMAL(10,2) := 0;
    property_value DECIMAL(10,2) := 0;
    intent_multiplier DECIMAL(3,2) := 1.0;
BEGIN
    -- Get property value for commission calculation
    IF property_id IS NOT NULL THEN
        SELECT COALESCE(price, 0) * 0.025 INTO property_value -- 2.5% commission
        FROM properties WHERE id = property_id;
    END IF;
    
    -- Base value from qualification score (0-100 EGP per point)
    base_value := qualification_score * 50; -- 50 EGP per qualification point
    
    -- Intent multiplier
    intent_multiplier := CASE buying_intent
        WHEN 'high' THEN 2.0
        WHEN 'medium' THEN 1.5
        WHEN 'low' THEN 1.0
        ELSE 1.0
    END;
    
    -- Return higher of base value or property commission potential
    RETURN GREATEST(base_value * intent_multiplier, property_value * 0.1);
END;
$$ LANGUAGE plpgsql;

-- Create function to determine Meta event type based on conversation data
CREATE OR REPLACE FUNCTION determine_meta_event_type(
    qualification_score INTEGER,
    buying_intent TEXT,
    event_type TEXT,
    viewing_requested BOOLEAN DEFAULT FALSE,
    financing_mentioned BOOLEAN DEFAULT FALSE
) RETURNS TEXT AS $$
BEGIN
    -- High-value events for qualified conversations
    IF qualification_score >= 8 OR buying_intent = 'high' THEN
        RETURN 'Purchase';
    END IF;
    
    -- Viewing requests are high intent
    IF viewing_requested THEN
        RETURN 'Schedule';
    END IF;
    
    -- Financing discussions indicate serious interest
    IF financing_mentioned THEN
        RETURN 'AddPaymentInfo';
    END IF;
    
    -- Qualified conversations
    IF qualification_score >= 6 OR buying_intent = 'medium' THEN
        RETURN 'CompleteRegistration';
    END IF;
    
    -- General engagement
    IF qualification_score >= 4 OR event_type = 'completed' THEN
        RETURN 'Lead';
    END IF;
    
    -- Default to ViewContent for any conversation interaction
    RETURN 'ViewContent';
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-calculate Meta event values
CREATE OR REPLACE FUNCTION trigger_calculate_conversation_meta_value()
RETURNS TRIGGER AS $$
BEGIN
    -- Calculate Meta event value
    NEW.meta_event_value := calculate_conversation_value(
        NEW.qualification_score, 
        NEW.buying_intent, 
        NEW.property_id
    );
    
    -- Determine Meta event type
    NEW.meta_event_name := determine_meta_event_type(
        NEW.qualification_score,
        NEW.buying_intent,
        NEW.event_type,
        NEW.viewing_requested,
        NEW.financing_mentioned
    );
    
    -- Update timestamp
    NEW.updated_at := NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_conversation_meta_calculation ON conversation_events;
CREATE TRIGGER trigger_conversation_meta_calculation
    BEFORE INSERT OR UPDATE ON conversation_events
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_conversation_meta_value();

-- RLS Policies for conversation_events
ALTER TABLE conversation_events ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own conversation events
CREATE POLICY "Users can view their own conversation events"
    ON conversation_events FOR SELECT
    USING (auth.uid() = user_id);

-- Allow service role to manage all conversation events
CREATE POLICY "Service role can manage conversation events"
    ON conversation_events FOR ALL
    USING (auth.role() = 'service_role');

-- Allow authenticated users to insert conversation events
CREATE POLICY "Authenticated users can insert conversation events"
    ON conversation_events FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON conversation_events TO authenticated;
GRANT ALL ON conversation_events TO service_role;

-- Create indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_conversation_events_analytics 
    ON conversation_events(created_at, qualification_score, buying_intent, meta_event_sent);

-- Comments for documentation
COMMENT ON TABLE conversation_events IS 'Tracks all conversation events for Meta algorithm optimization';
COMMENT ON COLUMN conversation_events.qualification_score IS 'Lead qualification score from conversation analyzer (1-10 scale)';
COMMENT ON COLUMN conversation_events.engagement_quality IS 'Conversation engagement quality score (0-100 scale)';
COMMENT ON COLUMN conversation_events.meta_event_value IS 'Calculated value for Meta Conversions API in EGP';
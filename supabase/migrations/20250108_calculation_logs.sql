-- ================================================================
-- PROPERTY CALCULATION LOGS TABLE
-- For audit trail of all property value calculations
-- ================================================================

CREATE TABLE IF NOT EXISTS property_calculation_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
    
    -- Calculation details
    calculation_type VARCHAR(50) NOT NULL DEFAULT 'property_valuation',
    calculation_method VARCHAR(50) DEFAULT 'egyptian_standards',
    
    -- Input and output data
    input_data JSONB NOT NULL,
    result_data JSONB NOT NULL,
    
    -- Metadata
    calculation_duration_ms INTEGER,
    confidence_level DECIMAL(5,2),
    formula_version VARCHAR(20),
    
    -- Timestamps
    calculated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE property_calculation_logs ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_calculation_logs_user_id ON property_calculation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_calculation_logs_property_id ON property_calculation_logs(property_id);
CREATE INDEX IF NOT EXISTS idx_calculation_logs_type ON property_calculation_logs(calculation_type);
CREATE INDEX IF NOT EXISTS idx_calculation_logs_calculated_at ON property_calculation_logs(calculated_at DESC);

-- RLS Policies
CREATE POLICY "Users can view their own calculation logs"
    ON property_calculation_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own calculation logs"
    ON property_calculation_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admins can view all calculation logs"
    ON property_calculation_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin') 
            AND ur.is_active = true
        )
    );

-- Success message
SELECT 'Property calculation logs table created successfully!' as message;
-- Migration: Mortgage Eligibility System
-- Description: Add tables for tracking mortgage eligibility requests and bank responses

-- Create mortgage eligibility requests table
CREATE TABLE IF NOT EXISTS mortgage_eligibility_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
    
    -- Request data
    request_data JSONB NOT NULL DEFAULT '{}',
    response_data JSONB NOT NULL DEFAULT '{}',
    
    -- Basic eligibility results
    eligible BOOLEAN NOT NULL DEFAULT false,
    max_loan_amount NUMERIC(15,2) DEFAULT 0,
    risk_score INTEGER DEFAULT 5,
    compliance_score INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_mortgage_eligibility_user_id ON mortgage_eligibility_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_mortgage_eligibility_property_id ON mortgage_eligibility_requests(property_id);
CREATE INDEX IF NOT EXISTS idx_mortgage_eligibility_created_at ON mortgage_eligibility_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_mortgage_eligibility_eligible ON mortgage_eligibility_requests(eligible);

-- Enable RLS
ALTER TABLE mortgage_eligibility_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own mortgage requests"
ON mortgage_eligibility_requests FOR SELECT
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "Users can insert own mortgage requests"
ON mortgage_eligibility_requests FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('appraiser', 'broker', 'admin', 'super_admin')
    AND ur.is_active = true
  )
);

CREATE POLICY "Users can update own mortgage requests"
ON mortgage_eligibility_requests FOR UPDATE
USING (
  auth.uid() = user_id OR
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_mortgage_eligibility_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER trigger_mortgage_eligibility_updated_at
    BEFORE UPDATE ON mortgage_eligibility_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_mortgage_eligibility_updated_at();

-- Create bank configurations table for managing Egyptian banks
CREATE TABLE IF NOT EXISTS bank_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bank_name VARCHAR(255) NOT NULL,
    bank_code VARCHAR(10) NOT NULL UNIQUE,
    
    -- Configuration
    max_loan_to_value DECIMAL(3,2) NOT NULL DEFAULT 0.80,
    max_duration_years INTEGER NOT NULL DEFAULT 25,
    base_interest_rate DECIMAL(5,4) NOT NULL DEFAULT 0.135,
    
    -- API configuration
    api_endpoint VARCHAR(500),
    api_active BOOLEAN DEFAULT false,
    
    -- Additional settings
    processing_fee_percentage DECIMAL(5,4) DEFAULT 0.005,
    min_loan_amount NUMERIC(15,2) DEFAULT 100000,
    max_loan_amount NUMERIC(15,2) DEFAULT 10000000,
    
    -- Requirements
    requirements JSONB DEFAULT '[]',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default Egyptian banks data
INSERT INTO bank_configurations (bank_name, bank_code, max_loan_to_value, max_duration_years, base_interest_rate, requirements) VALUES
('National Bank of Egypt', 'NBE', 0.90, 30, 0.130, '["Valid ID", "Employment documentation", "Property valuation", "Life insurance"]'::jsonb),
('Banque Misr', 'BM', 0.85, 25, 0.135, '["Valid ID", "Employment documentation", "Property valuation", "Life insurance"]'::jsonb),
('Commercial International Bank', 'CIB', 0.80, 20, 0.145, '["Valid ID", "Employment documentation", "Property valuation", "Life insurance", "6-month salary transfer"]'::jsonb),
('Arab African International Bank', 'AAIB', 0.85, 25, 0.140, '["Valid ID", "Employment documentation", "Property valuation", "Life insurance"]'::jsonb),
('Housing and Development Bank', 'HDB', 0.95, 30, 0.125, '["Valid ID", "Employment documentation", "Property valuation", "Life insurance", "Residential use only"]'::jsonb)
ON CONFLICT (bank_code) DO NOTHING;

-- Create indexes for bank configurations
CREATE INDEX IF NOT EXISTS idx_bank_configurations_code ON bank_configurations(bank_code);
CREATE INDEX IF NOT EXISTS idx_bank_configurations_active ON bank_configurations(is_active);

-- Enable RLS for bank configurations
ALTER TABLE bank_configurations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bank configurations (read-only for all authenticated users)
CREATE POLICY "All users can view active bank configurations"
ON bank_configurations FOR SELECT
USING (
  auth.role() = 'authenticated' AND is_active = true
);

CREATE POLICY "Only admins can modify bank configurations"
ON bank_configurations FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role IN ('admin', 'super_admin')
    AND ur.is_active = true
  )
);

-- Create function for bank configurations updated_at
CREATE OR REPLACE FUNCTION update_bank_configurations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for bank configurations updated_at
CREATE TRIGGER trigger_bank_configurations_updated_at
    BEFORE UPDATE ON bank_configurations
    FOR EACH ROW
    EXECUTE FUNCTION update_bank_configurations_updated_at();

-- Create mortgage eligibility analytics view with security filtering
CREATE OR REPLACE VIEW mortgage_eligibility_analytics AS
SELECT 
    mer.user_id,
    mer.property_id,
    mer.created_at::date as request_date,
    mer.eligible,
    mer.max_loan_amount,
    mer.risk_score,
    mer.compliance_score,
    (mer.response_data->>'interest_rate')::decimal as best_interest_rate,
    COALESCE((mer.response_data->'bank_responses')::jsonb, '[]'::jsonb) as bank_responses,
    p.city as property_city,
    p.property_type,
    p.price as property_price,
    u.email as user_email
FROM mortgage_eligibility_requests mer
LEFT JOIN properties p ON mer.property_id = p.id
LEFT JOIN auth.users u ON mer.user_id = u.id
WHERE (
    auth.uid() = mer.user_id OR
    EXISTS (
        SELECT 1 FROM user_roles ur
        WHERE ur.user_id = auth.uid()
        AND ur.role IN ('admin', 'super_admin', 'appraiser')
        AND ur.is_active = true
    )
);

-- Grant permissions to authenticated users for the analytics view
GRANT SELECT ON mortgage_eligibility_analytics TO authenticated;

-- Add helpful comments
COMMENT ON TABLE mortgage_eligibility_requests IS 'Stores mortgage eligibility check requests and responses from Egyptian banks';
COMMENT ON TABLE bank_configurations IS 'Configuration for Egyptian banks mortgage parameters and requirements';
COMMENT ON VIEW mortgage_eligibility_analytics IS 'Analytics view for mortgage eligibility trends and bank performance';

-- Add function to get mortgage statistics
CREATE OR REPLACE FUNCTION get_mortgage_eligibility_stats(user_id UUID DEFAULT NULL)
RETURNS JSON AS $$
DECLARE
    stats JSON;
BEGIN
    SELECT json_build_object(
        'total_requests', COUNT(*),
        'eligible_requests', COUNT(*) FILTER (WHERE eligible = true),
        'average_loan_amount', COALESCE(AVG(max_loan_amount) FILTER (WHERE eligible = true), 0),
        'average_risk_score', COALESCE(AVG(risk_score), 0),
        'average_compliance_score', COALESCE(AVG(compliance_score), 0),
        'top_property_types', (
            SELECT json_agg(json_build_object('type', property_type, 'count', type_count))
            FROM (
                SELECT 
                    p.property_type,
                    COUNT(*) as type_count
                FROM mortgage_eligibility_requests mer
                LEFT JOIN properties p ON mer.property_id = p.id
                WHERE ($1 IS NULL OR mer.user_id = $1)
                AND mer.created_at >= NOW() - INTERVAL '30 days'
                GROUP BY p.property_type
                ORDER BY type_count DESC
                LIMIT 5
            ) t
        ),
        'monthly_trend', (
            SELECT json_agg(json_build_object('month', request_month, 'eligible', eligible_count, 'total', total_count))
            FROM (
                SELECT 
                    DATE_TRUNC('month', created_at) as request_month,
                    COUNT(*) FILTER (WHERE eligible = true) as eligible_count,
                    COUNT(*) as total_count
                FROM mortgage_eligibility_requests
                WHERE ($1 IS NULL OR user_id = $1)
                AND created_at >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY request_month DESC
            ) t
        )
    ) INTO stats
    FROM mortgage_eligibility_requests mer
    WHERE ($1 IS NULL OR mer.user_id = $1);
    
    RETURN COALESCE(stats, '{}'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
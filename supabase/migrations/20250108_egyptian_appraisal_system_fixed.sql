-- ================================================================
-- EGYPTIAN APPRAISAL SYSTEM DATABASE MIGRATION (FIXED)
-- Works with existing property_appraisals table structure
-- Migration: 20250108_egyptian_appraisal_system_fixed.sql
-- ================================================================

-- ================================================================
-- EXTEND BROKERS TABLE FOR APPRAISER CREDENTIALS
-- ================================================================

-- Extended appraiser fields based on Arabic PDF requirements
DO $$
BEGIN
    -- Enhanced appraiser credentials
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'appraiser_license_number') THEN
        ALTER TABLE brokers ADD COLUMN appraiser_license_number VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'appraiser_certification_authority') THEN
        ALTER TABLE brokers ADD COLUMN appraiser_certification_authority VARCHAR(100) DEFAULT 'Egyptian General Authority for Urban Planning & Housing';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'years_of_experience') THEN
        ALTER TABLE brokers ADD COLUMN years_of_experience INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'property_specialties') THEN
        ALTER TABLE brokers ADD COLUMN property_specialties TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'max_property_value_limit') THEN
        ALTER TABLE brokers ADD COLUMN max_property_value_limit DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'professional_headshot_url') THEN
        ALTER TABLE brokers ADD COLUMN professional_headshot_url TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'heygen_avatar_id') THEN
        ALTER TABLE brokers ADD COLUMN heygen_avatar_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'linkedin_profile_url') THEN
        ALTER TABLE brokers ADD COLUMN linkedin_profile_url TEXT;
    END IF;
END $$;

-- ================================================================
-- ENHANCE EXISTING PROPERTY_APPRAISALS TABLE
-- ================================================================

DO $$
BEGIN
    -- Add additional fields to existing property_appraisals table if they don't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_appraisals' AND column_name = 'appraisal_reference_number') THEN
        ALTER TABLE property_appraisals ADD COLUMN appraisal_reference_number VARCHAR(50) UNIQUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_appraisals' AND column_name = 'client_name') THEN
        ALTER TABLE property_appraisals ADD COLUMN client_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_appraisals' AND column_name = 'appraisal_date') THEN
        ALTER TABLE property_appraisals ADD COLUMN appraisal_date DATE DEFAULT CURRENT_DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_appraisals' AND column_name = 'market_value_estimate') THEN
        ALTER TABLE property_appraisals ADD COLUMN market_value_estimate DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_appraisals' AND column_name = 'confidence_level') THEN
        ALTER TABLE property_appraisals ADD COLUMN confidence_level DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'property_appraisals' AND column_name = 'calculation_results') THEN
        ALTER TABLE property_appraisals ADD COLUMN calculation_results JSONB DEFAULT '{}';
    END IF;
END $$;

-- ================================================================
-- AUTOMATED CALCULATION FORMULAS (Egyptian Standards)
-- ================================================================

CREATE TABLE IF NOT EXISTS appraisal_calculation_formulas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    formula_name VARCHAR(100) NOT NULL,
    formula_type VARCHAR(50) NOT NULL CHECK (formula_type IN ('depreciation', 'market_adjustment', 'location_factor')),
    property_type VARCHAR(50) NOT NULL,
    area_type VARCHAR(50) NOT NULL CHECK (area_type IN ('urban', 'suburban', 'rural')),
    
    -- Formula parameters
    base_rate DECIMAL(10,4),
    age_factor DECIMAL(6,4),
    condition_multipliers JSONB DEFAULT '{}',
    location_adjustments JSONB DEFAULT '{}',
    
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_until DATE,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- APPRAISAL REPORT TEMPLATES (Multi-language)
-- ================================================================

CREATE TABLE IF NOT EXISTS appraisal_report_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    template_name VARCHAR(100) NOT NULL,
    audience_type VARCHAR(50) NOT NULL CHECK (audience_type IN ('buyer', 'investor', 'bank', 'insurance', 'developer', 'legal')),
    language VARCHAR(10) NOT NULL CHECK (language IN ('ar', 'en', 'ar-en')),
    
    -- Template structure
    sections JSONB NOT NULL,
    field_mappings JSONB NOT NULL,
    styling_config JSONB DEFAULT '{}',
    
    -- Legal text blocks
    legal_disclaimers_ar TEXT,
    legal_disclaimers_en TEXT,
    
    -- Header/Footer templates
    header_template TEXT,
    footer_template TEXT,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- APPRAISER BILLING SYSTEM
-- ================================================================

CREATE TABLE IF NOT EXISTS appraiser_billing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    appraisal_id UUID REFERENCES property_appraisals(id) ON DELETE CASCADE,
    
    -- Service details
    service_type VARCHAR(50) NOT NULL CHECK (service_type IN ('basic_appraisal', 'comprehensive_report', '3d_tour_generation', 'legal_verification')),
    base_price DECIMAL(10,2) NOT NULL,
    additional_fees DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    
    -- Payment status
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method VARCHAR(50),
    payment_reference TEXT,
    
    -- Service delivery
    work_status VARCHAR(20) DEFAULT 'assigned' CHECK (work_status IN ('assigned', 'in_progress', 'completed', 'delivered')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    delivered_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- INDEXES FOR PERFORMANCE
-- ================================================================

-- Enhanced property_appraisals indexes
CREATE INDEX IF NOT EXISTS idx_property_appraisals_property_id ON property_appraisals(property_id);
CREATE INDEX IF NOT EXISTS idx_property_appraisals_appraiser_id ON property_appraisals(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_property_appraisals_reference_number ON property_appraisals(appraisal_reference_number);
CREATE INDEX IF NOT EXISTS idx_property_appraisals_status ON property_appraisals(status);
CREATE INDEX IF NOT EXISTS idx_property_appraisals_date ON property_appraisals(appraisal_date DESC);
CREATE INDEX IF NOT EXISTS idx_property_appraisals_client_name ON property_appraisals(client_name);

-- Calculation formulas indexes
CREATE INDEX IF NOT EXISTS idx_appraisal_formulas_type ON appraisal_calculation_formulas(formula_type);
CREATE INDEX IF NOT EXISTS idx_appraisal_formulas_property_type ON appraisal_calculation_formulas(property_type);
CREATE INDEX IF NOT EXISTS idx_appraisal_formulas_active ON appraisal_calculation_formulas(is_active) WHERE is_active = true;

-- Report templates indexes
CREATE INDEX IF NOT EXISTS idx_report_templates_audience ON appraisal_report_templates(audience_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_language ON appraisal_report_templates(language);
CREATE INDEX IF NOT EXISTS idx_report_templates_active ON appraisal_report_templates(is_active) WHERE is_active = true;

-- Billing indexes
CREATE INDEX IF NOT EXISTS idx_appraiser_billing_appraiser_id ON appraiser_billing(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_billing_payment_status ON appraiser_billing(payment_status);
CREATE INDEX IF NOT EXISTS idx_appraiser_billing_work_status ON appraiser_billing(work_status);

-- Enhanced broker indexes for appraiser fields
CREATE INDEX IF NOT EXISTS idx_brokers_appraiser_license ON brokers(appraiser_license_number) WHERE appraiser_license_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_brokers_property_specialties ON brokers USING GIN(property_specialties);
CREATE INDEX IF NOT EXISTS idx_brokers_max_value_limit ON brokers(max_property_value_limit) WHERE max_property_value_limit IS NOT NULL;

-- ================================================================
-- ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE appraisal_calculation_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_billing ENABLE ROW LEVEL SECURITY;

-- Calculation formulas policies
CREATE POLICY "Public read access to active formulas"
    ON appraisal_calculation_formulas FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage calculation formulas"
    ON appraisal_calculation_formulas FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin') 
            AND ur.is_active = true
        )
    );

-- Report templates policies
CREATE POLICY "Public read access to active templates"
    ON appraisal_report_templates FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage report templates"
    ON appraisal_report_templates FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin') 
            AND ur.is_active = true
        )
    );

-- Billing policies
CREATE POLICY "Appraisers can view their own billing"
    ON appraiser_billing FOR SELECT
    USING (
        appraiser_id IN (
            SELECT id FROM brokers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view billing for their appraisals"
    ON appraiser_billing FOR SELECT
    USING (
        appraisal_id IN (
            SELECT id FROM property_appraisals 
            WHERE appraiser_id IN (
                SELECT id FROM brokers WHERE user_id = auth.uid()
            )
        )
    );

CREATE POLICY "Admins can manage all billing"
    ON appraiser_billing FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin') 
            AND ur.is_active = true
        )
    );

-- ================================================================
-- FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to generate appraisal reference numbers
CREATE OR REPLACE FUNCTION generate_appraisal_reference_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appraisal_reference_number IS NULL THEN
        NEW.appraisal_reference_number := 'APR-' || 
            TO_CHAR(NOW(), 'YYYY') || '-' || 
            LPAD(EXTRACT(DOY FROM NOW())::text, 3, '0') || '-' || 
            LPAD(nextval('appraisal_ref_seq')::text, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for appraisal reference numbers
CREATE SEQUENCE IF NOT EXISTS appraisal_ref_seq START 1;

-- Trigger for appraisal reference number generation
DROP TRIGGER IF EXISTS trigger_generate_appraisal_reference_number ON property_appraisals;
CREATE TRIGGER trigger_generate_appraisal_reference_number
    BEFORE INSERT ON property_appraisals
    FOR EACH ROW EXECUTE FUNCTION generate_appraisal_reference_number();

-- ================================================================
-- INSERT DEFAULT DATA
-- ================================================================

-- Insert Egyptian calculation formulas
INSERT INTO appraisal_calculation_formulas (formula_name, formula_type, property_type, area_type, base_rate, age_factor, condition_multipliers, location_adjustments) 
SELECT * FROM (VALUES
    ('Egyptian Residential Depreciation', 'depreciation', 'residential', 'urban', 0.02, 0.02, 
     '{"excellent": 0.8, "good": 1.0, "fair": 1.2, "poor": 1.5}'::jsonb, 
     '{"new_cairo": 1.1, "zamalek": 1.3, "downtown": 0.9, "heliopolis": 1.2}'::jsonb),
    ('Commercial Property Depreciation', 'depreciation', 'commercial', 'urban', 0.025, 0.025,
     '{"excellent": 0.7, "good": 1.0, "fair": 1.3, "poor": 1.8}'::jsonb,
     '{"business_district": 1.2, "industrial": 0.8, "mixed_use": 1.0}'::jsonb),
    ('Villa Depreciation Formula', 'depreciation', 'villa', 'suburban', 0.018, 0.018,
     '{"excellent": 0.75, "good": 1.0, "fair": 1.25, "poor": 1.6}'::jsonb,
     '{"gated_community": 1.15, "standalone": 1.0, "compound": 1.05}'::jsonb)
) AS v(formula_name, formula_type, property_type, area_type, base_rate, age_factor, condition_multipliers, location_adjustments)
WHERE NOT EXISTS (
    SELECT 1 FROM appraisal_calculation_formulas 
    WHERE formula_name = v.formula_name AND formula_type = v.formula_type
);

-- Insert Egyptian appraisal report templates
INSERT INTO appraisal_report_templates (template_name, audience_type, language, sections, legal_disclaimers_ar, legal_disclaimers_en, field_mappings) 
SELECT * FROM (VALUES
    ('Egyptian Bank Report', 'bank', 'ar', 
     '["property_overview", "legal_compliance", "market_analysis", "risk_assessment", "mortgage_eligibility"]'::jsonb,
     'هذا التقرير معد وفقاً للمعايير المصرية للتقييم العقاري الصادرة عن الهيئة العامة للرقابة المالية',
     'This report complies with Egyptian Real Estate Valuation Standards',
     '{"property_address": "property_address_arabic", "market_value": "market_value_estimate", "legal_status": "ownership_type"}'::jsonb),
    ('Investor Analysis', 'investor', 'en',
     '["executive_summary", "property_details", "market_analysis", "roi_projections", "risk_factors"]'::jsonb,
     'تقرير استثماري معد وفقاً لمعايير السوق المصري',
     'Investment report prepared according to Egyptian market standards',
     '{"property_address": "property_address_english", "roi_estimate": "calculated_roi", "market_trend": "market_trend"}'::jsonb),
    ('Insurance Valuation', 'insurance', 'ar-en',
     '["property_description", "replacement_cost", "risk_factors", "recommendations"]'::jsonb,
     'تقرير تقييم لأغراض التأمين معد وفقاً للمعايير المصرية',
     'Insurance valuation report prepared according to Egyptian standards',
     '{"replacement_cost": "replacement_cost", "property_condition": "overall_condition_rating"}'::jsonb)
) AS v(template_name, audience_type, language, sections, legal_disclaimers_ar, legal_disclaimers_en, field_mappings)
WHERE NOT EXISTS (
    SELECT 1 FROM appraisal_report_templates 
    WHERE template_name = v.template_name AND audience_type = v.audience_type AND language = v.language
);

-- Success message
SELECT 'Egyptian Appraisal System migration completed successfully!' as message,
       'Enhanced existing property_appraisals table and added supporting tables' as changes_made;
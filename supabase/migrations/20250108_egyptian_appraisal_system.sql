-- ================================================================
-- EGYPTIAN APPRAISAL SYSTEM DATABASE MIGRATION
-- Based on Arabic PDF Analysis and Egyptian Real Estate Standards
-- Migration: 20250108_egyptian_appraisal_system.sql
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
        ALTER TABLE brokers ADD COLUMN property_specialties TEXT[] DEFAULT '{}'; -- ['residential', 'commercial', 'villa', 'apartment']
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
-- PROPERTY APPRAISAL FORMS TABLE (Arabic PDF Structure)
-- ================================================================

CREATE TABLE IF NOT EXISTS property_appraisal_forms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
    appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
    
    -- Header Information (from Arabic PDF analysis)
    appraisal_date DATE NOT NULL DEFAULT CURRENT_DATE,
    appraisal_valid_until DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 year'),
    appraisal_reference_number VARCHAR(50) UNIQUE NOT NULL,
    client_name TEXT NOT NULL,
    requested_by TEXT NOT NULL,
    
    -- Property Basic Info (matching Arabic form)
    property_address_arabic TEXT NOT NULL,
    property_address_english TEXT NOT NULL,
    district_name VARCHAR(100) NOT NULL,
    city_name VARCHAR(100) NOT NULL,
    governorate VARCHAR(100) NOT NULL,
    
    -- Building Information
    building_number VARCHAR(20),
    floor_number INTEGER,
    unit_number VARCHAR(20),
    building_age_years INTEGER,
    construction_type VARCHAR(50) CHECK (construction_type IN ('concrete', 'brick', 'steel', 'mixed')),
    
    -- Area Measurements (Egyptian standards)
    land_area_sqm DECIMAL(10,2),
    built_area_sqm DECIMAL(10,2),
    unit_area_sqm DECIMAL(10,2),
    balcony_area_sqm DECIMAL(10,2) DEFAULT 0,
    garage_area_sqm DECIMAL(10,2) DEFAULT 0,
    
    -- Technical Specifications
    finishing_level VARCHAR(50) CHECK (finishing_level IN ('core_shell', 'semi_finished', 'fully_finished', 'luxury')),
    floor_materials JSONB DEFAULT '{}', -- {'living': 'marble', 'bedrooms': 'parquet', 'kitchen': 'ceramic'}
    wall_finishes JSONB DEFAULT '{}', -- {'interior': 'paint', 'exterior': 'stone'}
    ceiling_type VARCHAR(50),
    windows_type VARCHAR(50) CHECK (windows_type IN ('aluminum', 'wood', 'upvc', 'steel')),
    doors_type VARCHAR(50),
    
    -- Condition Assessment (1-10 scale per Egyptian standards)
    overall_condition_rating INTEGER CHECK (overall_condition_rating >= 1 AND overall_condition_rating <= 10),
    structural_condition VARCHAR(20) CHECK (structural_condition IN ('excellent', 'good', 'fair', 'poor')),
    mechanical_systems_condition VARCHAR(20) CHECK (mechanical_systems_condition IN ('excellent', 'good', 'fair', 'poor')),
    exterior_condition VARCHAR(20) CHECK (exterior_condition IN ('excellent', 'good', 'fair', 'poor')),
    interior_condition VARCHAR(20) CHECK (interior_condition IN ('excellent', 'good', 'fair', 'poor')),
    
    -- Utilities and Services
    electricity_available BOOLEAN DEFAULT true,
    water_supply_available BOOLEAN DEFAULT true,
    sewage_system_available BOOLEAN DEFAULT true,
    gas_supply_available BOOLEAN DEFAULT true,
    internet_fiber_available BOOLEAN DEFAULT false,
    elevator_available BOOLEAN DEFAULT false,
    parking_available BOOLEAN DEFAULT false,
    security_system BOOLEAN DEFAULT false,
    
    -- Location Factors
    street_width_meters DECIMAL(5,2),
    accessibility_rating INTEGER CHECK (accessibility_rating >= 1 AND accessibility_rating <= 10),
    noise_level VARCHAR(20) CHECK (noise_level IN ('low', 'moderate', 'high')),
    view_quality VARCHAR(20) CHECK (view_quality IN ('excellent', 'good', 'average', 'poor')),
    neighborhood_quality_rating INTEGER CHECK (neighborhood_quality_rating >= 1 AND neighborhood_quality_rating <= 10),
    
    -- Market Analysis
    comparable_properties JSONB DEFAULT '[]', -- Array of comparable property data
    market_trend VARCHAR(20) CHECK (market_trend IN ('rising', 'stable', 'declining')),
    demand_supply_ratio DECIMAL(3,2), -- Market demand vs supply
    price_per_sqm_area DECIMAL(10,2),
    
    -- Valuation Calculations (Auto-calculated using Egyptian formulas)
    land_value DECIMAL(15,2),
    building_value DECIMAL(15,2),
    depreciation_amount DECIMAL(15,2),
    depreciation_percentage DECIMAL(5,2),
    replacement_cost DECIMAL(15,2),
    market_value_estimate DECIMAL(15,2),
    
    -- Legal Status (Egyptian real estate law)
    ownership_type VARCHAR(50) CHECK (ownership_type IN ('freehold', 'leasehold', 'usufruct', 'ibtida2i', 'tawkeel')),
    title_deed_available BOOLEAN DEFAULT false,
    building_permit_available BOOLEAN DEFAULT false,
    occupancy_certificate BOOLEAN DEFAULT false,
    real_estate_tax_paid BOOLEAN DEFAULT false,
    
    -- Photos and Documentation
    property_photos JSONB DEFAULT '[]', -- Array of photo URLs with descriptions
    aerial_photos JSONB DEFAULT '[]', -- Satellite and drone imagery
    floor_plan_url TEXT,
    legal_documents JSONB DEFAULT '[]', -- Array of legal document URLs
    
    -- Report Generation Tracking
    reports_generated JSONB DEFAULT '{}', -- Track which reports have been generated
    
    -- Workflow status
    status VARCHAR(30) DEFAULT 'draft' CHECK (status IN ('draft', 'in_review', 'completed', 'approved', 'archived')),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    condition_multipliers JSONB DEFAULT '{}', -- Different multipliers based on condition
    location_adjustments JSONB DEFAULT '{}', -- Area-specific adjustments
    
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
    sections JSONB NOT NULL, -- Ordered list of sections to include
    field_mappings JSONB NOT NULL, -- Map database fields to template placeholders
    styling_config JSONB DEFAULT '{}', -- Fonts, colors, layout
    
    -- Legal text blocks in Arabic and English
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
    appraisal_form_id UUID REFERENCES property_appraisal_forms(id) ON DELETE CASCADE,
    
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

-- Property appraisal forms indexes
CREATE INDEX IF NOT EXISTS idx_property_appraisal_forms_property_id ON property_appraisal_forms(property_id);
CREATE INDEX IF NOT EXISTS idx_property_appraisal_forms_appraiser_id ON property_appraisal_forms(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_property_appraisal_forms_reference_number ON property_appraisal_forms(appraisal_reference_number);
CREATE INDEX IF NOT EXISTS idx_property_appraisal_forms_status ON property_appraisal_forms(status);
CREATE INDEX IF NOT EXISTS idx_property_appraisal_forms_district ON property_appraisal_forms(district_name);
CREATE INDEX IF NOT EXISTS idx_property_appraisal_forms_date ON property_appraisal_forms(appraisal_date DESC);

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
ALTER TABLE property_appraisal_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_calculation_formulas ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraisal_report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_billing ENABLE ROW LEVEL SECURITY;

-- Property appraisal forms policies
CREATE POLICY "Appraisers can manage their own appraisal forms"
    ON property_appraisal_forms FOR ALL
    USING (
        appraiser_id IN (
            SELECT id FROM brokers WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Property owners can view their property appraisals"
    ON property_appraisal_forms FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE created_by = auth.uid() OR owner_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all appraisal forms"
    ON property_appraisal_forms FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            WHERE ur.user_id = auth.uid() 
            AND ur.role IN ('admin', 'super_admin') 
            AND ur.is_active = true
        )
    );

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

CREATE POLICY "Property owners can view billing for their properties"
    ON appraiser_billing FOR SELECT
    USING (
        property_id IN (
            SELECT id FROM properties 
            WHERE created_by = auth.uid() OR owner_id = auth.uid()
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
CREATE TRIGGER trigger_generate_appraisal_reference_number
    BEFORE INSERT ON property_appraisal_forms
    FOR EACH ROW EXECUTE FUNCTION generate_appraisal_reference_number();

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_appraisal_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamps
CREATE TRIGGER trigger_property_appraisal_forms_updated_at
    BEFORE UPDATE ON property_appraisal_forms
    FOR EACH ROW EXECUTE FUNCTION update_appraisal_updated_at();

-- ================================================================
-- INSERT DEFAULT DATA
-- ================================================================

-- Insert Egyptian calculation formulas
INSERT INTO appraisal_calculation_formulas (formula_name, formula_type, property_type, area_type, base_rate, age_factor, condition_multipliers, location_adjustments) VALUES
('Egyptian Residential Depreciation', 'depreciation', 'residential', 'urban', 0.02, 0.02, 
 '{"excellent": 0.8, "good": 1.0, "fair": 1.2, "poor": 1.5}', 
 '{"new_cairo": 1.1, "zamalek": 1.3, "downtown": 0.9, "heliopolis": 1.2}'),
('Commercial Property Depreciation', 'depreciation', 'commercial', 'urban', 0.025, 0.025,
 '{"excellent": 0.7, "good": 1.0, "fair": 1.3, "poor": 1.8}',
 '{"business_district": 1.2, "industrial": 0.8, "mixed_use": 1.0}'),
('Villa Depreciation Formula', 'depreciation', 'villa', 'suburban', 0.018, 0.018,
 '{"excellent": 0.75, "good": 1.0, "fair": 1.25, "poor": 1.6}',
 '{"gated_community": 1.15, "standalone": 1.0, "compound": 1.05}')
ON CONFLICT DO NOTHING;

-- Insert Egyptian appraisal report templates
INSERT INTO appraisal_report_templates (template_name, audience_type, language, sections, legal_disclaimers_ar, legal_disclaimers_en, field_mappings) VALUES
('Egyptian Bank Report', 'bank', 'ar', 
 '["property_overview", "legal_compliance", "market_analysis", "risk_assessment", "mortgage_eligibility"]',
 'هذا التقرير معد وفقاً للمعايير المصرية للتقييم العقاري الصادرة عن الهيئة العامة للرقابة المالية',
 'This report complies with Egyptian Real Estate Valuation Standards',
 '{"property_address": "property_address_arabic", "market_value": "market_value_estimate", "legal_status": "ownership_type"}'),
('Investor Analysis', 'investor', 'en',
 '["executive_summary", "property_details", "market_analysis", "roi_projections", "risk_factors"]',
 'تقرير استثماري معد وفقاً لمعايير السوق المصري',
 'Investment report prepared according to Egyptian market standards',
 '{"property_address": "property_address_english", "roi_estimate": "calculated_roi", "market_trend": "market_trend"}'),
('Insurance Valuation', 'insurance', 'ar-en',
 '["property_description", "replacement_cost", "risk_factors", "recommendations"]',
 'تقرير تقييم لأغراض التأمين معد وفقاً للمعايير المصرية',
 'Insurance valuation report prepared according to Egyptian standards',
 '{"replacement_cost": "replacement_cost", "property_condition": "overall_condition_rating"}')
ON CONFLICT DO NOTHING;

-- Success message
SELECT 'Egyptian Appraisal System database migration completed successfully!' as message,
       'Added: property_appraisal_forms, appraisal_calculation_formulas, appraisal_report_templates, appraiser_billing' as new_tables,
       'Extended: brokers table with appraiser credentials' as extended_tables;
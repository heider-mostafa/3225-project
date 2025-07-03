-- Contract Automation System Migration
-- Adds contract automation capabilities to existing VirtualEstate leads system
-- Maintains full backward compatibility with existing functionality

-- ===============================================================================
-- 1. CONTRACT TEMPLATES TABLE
-- ===============================================================================
-- Stores AI-powered contract templates for different property types and jurisdictions
CREATE TABLE IF NOT EXISTS contract_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(100) NOT NULL CHECK (template_type IN (
    'exclusive_listing',
    'sale_agreement', 
    'marketing_authorization',
    'commission_agreement',
    'property_disclosure',
    'emergency_authorization'
  )),
  
  -- Template categorization
  property_type VARCHAR(100) CHECK (property_type IN ('residential', 'commercial', 'luxury', 'land', 'development', 'all')),
  jurisdiction VARCHAR(100) CHECK (jurisdiction IN ('cairo', 'alexandria', 'giza', 'new_capital', 'north_coast', 'red_sea', 'all')),
  ownership_type VARCHAR(100) CHECK (ownership_type IN ('individual', 'company', 'trust', 'government', 'all')),
  
  -- Template content and structure
  template_content JSONB NOT NULL, -- Dynamic template with variable placeholders
  legal_requirements JSONB DEFAULT '{}', -- Mandatory clauses per jurisdiction
  variable_definitions JSONB DEFAULT '{}', -- Available variables and their types
  conditional_clauses JSONB DEFAULT '{}', -- If-then logic for dynamic content
  
  -- Performance and optimization
  success_rate DECIMAL(5,2) DEFAULT 0.00, -- Historical success rate percentage
  usage_count INTEGER DEFAULT 0, -- How many times this template has been used
  average_generation_time_ms INTEGER DEFAULT 0, -- Performance metric
  
  -- Version control
  version VARCHAR(20) DEFAULT '1.0',
  is_active BOOLEAN DEFAULT true,
  replaces_template_id UUID REFERENCES contract_templates(id), -- Template versioning
  
  -- Legal validation
  legal_reviewed_at TIMESTAMP WITH TIME ZONE,
  legal_reviewer_id UUID REFERENCES auth.users(id),
  compliance_status VARCHAR(50) DEFAULT 'pending' CHECK (compliance_status IN ('pending', 'approved', 'rejected', 'needs_update')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- 2. LEAD CONTRACTS TABLE  
-- ===============================================================================
-- Stores generated contracts for each lead, linking to existing leads table
CREATE TABLE IF NOT EXISTS lead_contracts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE, -- Links to existing leads table
  contract_type VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES contract_templates(id),
  
  -- Generation metadata
  generation_time_ms INTEGER, -- How long it took to generate
  ai_confidence_score DECIMAL(5,2), -- AI confidence in contract accuracy (0-100)
  legal_risk_score DECIMAL(5,2), -- Legal risk assessment (0-100, lower is better)
  auto_approved BOOLEAN DEFAULT false, -- Whether AI auto-approved this contract
  
  -- Contract content and data
  contract_data JSONB NOT NULL, -- Populated template variables and final content
  document_url TEXT, -- URL to generated PDF document
  document_hash VARCHAR(64), -- SHA-256 hash for integrity verification
  
  -- Status tracking - comprehensive workflow
  status VARCHAR(50) DEFAULT 'generated' CHECK (status IN (
    'generating', 'generated', 'pending_review', 'approved', 'rejected', 
    'sent', 'viewed', 'signed', 'completed', 'expired', 'cancelled'
  )),
  sent_at TIMESTAMP WITH TIME ZONE,
  first_viewed_at TIMESTAMP WITH TIME ZONE,
  signed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  
  -- Legal verification and compliance
  government_verified BOOLEAN DEFAULT false,
  government_verification_id TEXT, -- Reference ID from government API
  notary_required BOOLEAN DEFAULT false,
  witness_signatures_required INTEGER DEFAULT 0,
  
  -- E-signature integration
  docusign_envelope_id TEXT, -- DocuSign integration
  adobe_agreement_id TEXT, -- Adobe Sign integration
  signature_provider VARCHAR(50) CHECK (signature_provider IN ('docusign', 'adobe', 'internal', 'manual')),
  
  -- Communication tracking
  email_sent_count INTEGER DEFAULT 0,
  whatsapp_sent_count INTEGER DEFAULT 0,
  sms_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- 3. CONTRACT AI REVIEWS TABLE
-- ===============================================================================
-- Stores AI analysis and manual review data for generated contracts
CREATE TABLE IF NOT EXISTS contract_ai_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES lead_contracts(id) ON DELETE CASCADE,
  
  -- AI Analysis Results
  confidence_score DECIMAL(5,2) NOT NULL, -- Overall AI confidence (0-100)
  risk_factors JSONB DEFAULT '[]', -- Array of identified risk factors
  compliance_check JSONB DEFAULT '{}', -- Regulatory compliance status by category
  recommendations JSONB DEFAULT '[]', -- AI suggestions for improvement
  
  -- Detailed analysis breakdown
  language_quality_score DECIMAL(5,2), -- Grammar and language quality
  legal_completeness_score DECIMAL(5,2), -- All required clauses present
  consistency_score DECIMAL(5,2), -- Internal consistency check
  jurisdiction_compliance_score DECIMAL(5,2), -- Local law compliance
  
  -- Risk assessment details
  high_risk_clauses TEXT[], -- Clauses flagged as high risk
  missing_clauses TEXT[], -- Required clauses that are missing
  conflicting_clauses TEXT[], -- Clauses that conflict with each other
  outdated_references TEXT[], -- References to outdated laws/regulations
  
  -- Manual review workflow
  manual_review_required BOOLEAN DEFAULT false,
  specialist_assigned_to UUID REFERENCES auth.users(id),
  specialist_notes TEXT,
  specialist_modifications JSONB DEFAULT '{}', -- Changes made by specialist
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  
  -- Review performance tracking
  review_duration_minutes INTEGER, -- How long manual review took
  changes_made_count INTEGER DEFAULT 0, -- Number of changes made during review
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- 4. CONTRACT SIGNATURES TABLE
-- ===============================================================================
-- Tracks all signatures on contracts (client, witnesses, notary, company rep)
CREATE TABLE IF NOT EXISTS contract_signatures (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES lead_contracts(id) ON DELETE CASCADE,
  
  -- Signer information
  signer_type VARCHAR(50) NOT NULL CHECK (signer_type IN ('client', 'witness', 'notary', 'company_rep', 'legal_counsel')),
  signer_name VARCHAR(255) NOT NULL,
  signer_email VARCHAR(255),
  signer_phone VARCHAR(50),
  signer_national_id VARCHAR(50), -- For legal verification
  
  -- Signature details
  signature_method VARCHAR(50) CHECK (signature_method IN ('e_signature', 'digital_signature', 'wet_signature', 'biometric')),
  signature_url TEXT, -- URL to signature image/file
  signature_hash VARCHAR(64), -- Hash of signature for verification
  
  -- Legal and audit information
  signed_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ip_address INET, -- IP address where signature was made
  user_agent TEXT, -- Browser/device information
  location_data JSONB, -- GPS coordinates if available
  witness_name VARCHAR(255), -- If witnessed signature
  witness_signature_url TEXT,
  
  -- Document state at time of signing
  document_version_hash VARCHAR(64), -- Hash of document when signed
  timestamp_authority VARCHAR(255), -- Digital timestamp provider
  
  -- Verification status
  verified BOOLEAN DEFAULT false,
  verification_method VARCHAR(100),
  verification_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- 5. CONTRACT NOTIFICATIONS TABLE
-- ===============================================================================
-- Tracks all notifications sent related to contracts
CREATE TABLE IF NOT EXISTS contract_notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  contract_id UUID REFERENCES lead_contracts(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(100) NOT NULL CHECK (notification_type IN (
    'contract_generated', 'contract_sent', 'signature_requested', 'contract_signed',
    'contract_expired', 'reminder', 'review_required', 'contract_approved'
  )),
  delivery_method VARCHAR(50) NOT NULL CHECK (delivery_method IN ('whatsapp', 'email', 'sms', 'push', 'in_app')),
  
  -- Recipients
  recipient_type VARCHAR(50) CHECK (recipient_type IN ('client', 'admin', 'specialist', 'broker')),
  recipient_email VARCHAR(255),
  recipient_phone VARCHAR(50),
  
  -- Message content
  subject TEXT,
  message_content TEXT NOT NULL,
  template_used VARCHAR(100),
  variables_used JSONB DEFAULT '{}',
  
  -- Delivery tracking
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'delivered', 'read', 'failed')),
  sent_at TIMESTAMP WITH TIME ZONE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  read_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  
  -- Engagement tracking
  clicked BOOLEAN DEFAULT false,
  clicked_at TIMESTAMP WITH TIME ZONE,
  replied BOOLEAN DEFAULT false,
  reply_content TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===============================================================================
-- 6. EXTEND EXISTING LEADS TABLE
-- ===============================================================================
-- Add contract-related columns to existing leads table (non-breaking changes)
DO $$
BEGIN
  -- Contract status tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'contract_status') THEN
    ALTER TABLE leads ADD COLUMN contract_status VARCHAR(50) DEFAULT 'pending' CHECK (contract_status IN (
      'pending', 'generating', 'generated', 'pending_review', 'approved', 'sent', 'signed', 'completed', 'failed'
    ));
  END IF;
  
  -- Contract generation timestamp
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'contract_generated_at') THEN
    ALTER TABLE leads ADD COLUMN contract_generated_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Legal risk assessment
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'legal_risk_score') THEN
    ALTER TABLE leads ADD COLUMN legal_risk_score DECIMAL(5,2) DEFAULT 0.00;
  END IF;
  
  -- Manual review flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'manual_contract_review') THEN
    ALTER TABLE leads ADD COLUMN manual_contract_review BOOLEAN DEFAULT false;
  END IF;
  
  -- Template selection
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'contract_template_id') THEN
    ALTER TABLE leads ADD COLUMN contract_template_id UUID REFERENCES contract_templates(id);
  END IF;
  
  -- Contract completion tracking
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'contract_signed_at') THEN
    ALTER TABLE leads ADD COLUMN contract_signed_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  -- Emergency contract flag
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'expedited_contract') THEN
    ALTER TABLE leads ADD COLUMN expedited_contract BOOLEAN DEFAULT false;
  END IF;
  
  -- Property legal status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'leads' AND column_name = 'property_legal_status') THEN
    ALTER TABLE leads ADD COLUMN property_legal_status VARCHAR(50) DEFAULT 'pending_verification' CHECK (property_legal_status IN (
      'pending_verification', 'clear', 'disputed', 'encumbered', 'government_review', 'legal_issue'
    ));
  END IF;
END $$;

-- ===============================================================================
-- 7. CREATE PERFORMANCE INDEXES
-- ===============================================================================
-- Indexes for optimal query performance

-- Contract templates indexes
CREATE INDEX IF NOT EXISTS idx_contract_templates_type ON contract_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_property_type ON contract_templates(property_type);
CREATE INDEX IF NOT EXISTS idx_contract_templates_jurisdiction ON contract_templates(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_contract_templates_active ON contract_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_contract_templates_success_rate ON contract_templates(success_rate DESC);

-- Lead contracts indexes  
CREATE INDEX IF NOT EXISTS idx_lead_contracts_lead_id ON lead_contracts(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_contracts_status ON lead_contracts(status);
CREATE INDEX IF NOT EXISTS idx_lead_contracts_template_id ON lead_contracts(template_id);
CREATE INDEX IF NOT EXISTS idx_lead_contracts_auto_approved ON lead_contracts(auto_approved);
CREATE INDEX IF NOT EXISTS idx_lead_contracts_created_at ON lead_contracts(created_at);
CREATE INDEX IF NOT EXISTS idx_lead_contracts_signed_at ON lead_contracts(signed_at);
CREATE INDEX IF NOT EXISTS idx_lead_contracts_expires_at ON lead_contracts(expires_at);
CREATE INDEX IF NOT EXISTS idx_lead_contracts_risk_score ON lead_contracts(legal_risk_score);

-- AI reviews indexes
CREATE INDEX IF NOT EXISTS idx_contract_ai_reviews_contract_id ON contract_ai_reviews(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_ai_reviews_confidence_score ON contract_ai_reviews(confidence_score);
CREATE INDEX IF NOT EXISTS idx_contract_ai_reviews_manual_review ON contract_ai_reviews(manual_review_required);
CREATE INDEX IF NOT EXISTS idx_contract_ai_reviews_specialist ON contract_ai_reviews(specialist_assigned_to);

-- Signatures indexes
CREATE INDEX IF NOT EXISTS idx_contract_signatures_contract_id ON contract_signatures(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signer_type ON contract_signatures(signer_type);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_signed_at ON contract_signatures(signed_at);
CREATE INDEX IF NOT EXISTS idx_contract_signatures_verified ON contract_signatures(verified);

-- Notifications indexes
CREATE INDEX IF NOT EXISTS idx_contract_notifications_contract_id ON contract_notifications(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_lead_id ON contract_notifications(lead_id);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_type ON contract_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_status ON contract_notifications(status);
CREATE INDEX IF NOT EXISTS idx_contract_notifications_sent_at ON contract_notifications(sent_at);

-- Enhanced leads table indexes for contract functionality
CREATE INDEX IF NOT EXISTS idx_leads_contract_status ON leads(contract_status);
CREATE INDEX IF NOT EXISTS idx_leads_contract_generated_at ON leads(contract_generated_at);
CREATE INDEX IF NOT EXISTS idx_leads_legal_risk_score ON leads(legal_risk_score);
CREATE INDEX IF NOT EXISTS idx_leads_manual_contract_review ON leads(manual_contract_review);
CREATE INDEX IF NOT EXISTS idx_leads_property_legal_status ON leads(property_legal_status);

-- ===============================================================================
-- 8. ENABLE ROW LEVEL SECURITY
-- ===============================================================================
ALTER TABLE contract_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_ai_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_signatures ENABLE ROW LEVEL SECURITY;
ALTER TABLE contract_notifications ENABLE ROW LEVEL SECURITY;

-- ===============================================================================
-- 9. CREATE RLS POLICIES
-- ===============================================================================

-- Contract templates - Admin/super_admin access only
CREATE POLICY "Admin access to contract templates" ON contract_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Lead contracts - Admin access and lead owner access
CREATE POLICY "Admin access to lead contracts" ON lead_contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- AI reviews - Admin access only
CREATE POLICY "Admin access to contract AI reviews" ON contract_ai_reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Signatures - Admin access and contract owner access
CREATE POLICY "Admin access to contract signatures" ON contract_signatures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- Notifications - Admin access
CREATE POLICY "Admin access to contract notifications" ON contract_notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- ===============================================================================
-- 10. CREATE UPDATED_AT TRIGGERS
-- ===============================================================================
-- Use existing update_updated_at_column function
CREATE TRIGGER update_contract_templates_updated_at 
  BEFORE UPDATE ON contract_templates 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_lead_contracts_updated_at 
  BEFORE UPDATE ON lead_contracts 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ===============================================================================
-- 11. INSERT SAMPLE CONTRACT TEMPLATES
-- ===============================================================================
-- Basic contract templates for immediate use

INSERT INTO contract_templates (name, template_type, property_type, jurisdiction, ownership_type, template_content, legal_requirements, variable_definitions) VALUES

-- Exclusive Listing Agreement Template
('Residential Exclusive Listing - Cairo', 'exclusive_listing', 'residential', 'cairo', 'individual',
  '{
    "title": "Exclusive Marketing Authorization Agreement",
    "sections": {
      "property_details": "Property located at {{property_address}}, {{area}}, Cairo, with {{bedrooms}} bedrooms, {{bathrooms}} bathrooms, and {{size_sqm}} square meters.",
      "listing_price": "The agreed listing price is {{listing_price}} EGP, subject to market conditions and client approval.",
      "commission": "VirtualEstate commission is {{commission_rate}}% of the final sale price.",
      "duration": "This agreement is valid for {{contract_duration}} months from the date of signing.",
      "marketing_rights": "VirtualEstate has exclusive rights to market, advertise, and show the property through all channels including but not limited to: virtual tours, social media, real estate portals, and broker networks.",
      "seller_obligations": "The seller agrees to maintain the property in good condition and provide access for photography, virtual tours, and viewings as scheduled.",
      "termination": "Either party may terminate this agreement with {{termination_notice}} days written notice."
    }
  }',
  '{
    "required_clauses": ["property_details", "listing_price", "commission", "duration", "marketing_rights"],
    "cairo_specific": ["property_registration_number", "area_building_permits"],
    "legal_compliance": ["egyptian_real_estate_law_2023", "consumer_protection_law"]
  }',
  '{
    "property_address": {"type": "string", "required": true},
    "area": {"type": "string", "required": true},
    "bedrooms": {"type": "number", "required": true},
    "bathrooms": {"type": "number", "required": true},
    "size_sqm": {"type": "number", "required": true},
    "listing_price": {"type": "number", "required": true},
    "commission_rate": {"type": "number", "default": 2.5},
    "contract_duration": {"type": "number", "default": 6},
    "termination_notice": {"type": "number", "default": 30}
  }'
),

-- Sale Agreement Template
('Residential Sale Agreement - General', 'sale_agreement', 'residential', 'all', 'individual',
  '{
    "title": "Property Sale Agreement",
    "sections": {
      "parties": "This agreement is between {{seller_name}} (Seller) and {{buyer_name}} (Buyer) for the sale of property located at {{property_address}}.",
      "purchase_price": "The total purchase price is {{purchase_price}} EGP, to be paid as follows: {{payment_terms}}",
      "property_condition": "The property is sold in {{property_condition}} condition with {{included_items}}.",
      "closing_date": "The closing date is scheduled for {{closing_date}} or as mutually agreed.",
      "contingencies": "This sale is contingent upon: {{contingencies}}",
      "broker_commission": "Total broker commission of {{total_commission}}% will be paid at closing, split between listing and selling brokers."
    }
  }',
  '{
    "required_clauses": ["parties", "purchase_price", "property_condition", "closing_date"],
    "egyptian_law_compliance": ["title_verification", "tax_clearance", "building_permits"],
    "mandatory_disclosures": ["property_defects", "pending_litigation", "environmental_issues"]
  }',
  '{
    "seller_name": {"type": "string", "required": true},
    "buyer_name": {"type": "string", "required": true},
    "property_address": {"type": "string", "required": true},
    "purchase_price": {"type": "number", "required": true},
    "payment_terms": {"type": "string", "required": true},
    "property_condition": {"type": "string", "required": true},
    "closing_date": {"type": "date", "required": true},
    "total_commission": {"type": "number", "default": 2.5}
  }'
),

-- Marketing Authorization Template
('Marketing Authorization - Multi Jurisdiction', 'marketing_authorization', 'all', 'all', 'all',
  '{
    "title": "Property Marketing Authorization",
    "sections": {
      "authorization": "I/We {{owner_name}} hereby authorize VirtualEstate to market my/our property located at {{property_address}}.",
      "marketing_methods": "Authorized marketing methods include: virtual tours, photography, social media marketing, online portals, broker network distribution, and print advertising.",
      "duration": "This authorization is valid from {{start_date}} to {{end_date}}.",
      "compensation": "Marketing services will be provided at no upfront cost. Commission of {{commission_rate}}% will be paid only upon successful sale.",
      "property_access": "VirtualEstate is authorized to access the property for photography and virtual tour creation with {{notice_period}} hours notice.",
      "contact_authorization": "VirtualEstate may contact potential buyers and brokers on my/our behalf regarding this property."
    }
  }',
  '{
    "required_clauses": ["authorization", "marketing_methods", "duration", "compensation"],
    "universal_compliance": ["data_protection", "marketing_regulations", "consumer_rights"]
  }',
  '{
    "owner_name": {"type": "string", "required": true},
    "property_address": {"type": "string", "required": true},
    "start_date": {"type": "date", "required": true},
    "end_date": {"type": "date", "required": true},
    "commission_rate": {"type": "number", "default": 2.5},
    "notice_period": {"type": "number", "default": 24}
  }'
);

-- ===============================================================================
-- 12. CREATE HELPER FUNCTIONS FOR CONTRACT AUTOMATION
-- ===============================================================================

-- Function to automatically select the best template for a lead
CREATE OR REPLACE FUNCTION select_optimal_contract_template(
  lead_property_type TEXT,
  lead_location TEXT,
  lead_price_range TEXT
) RETURNS UUID AS $$
DECLARE
  template_id UUID;
BEGIN
  -- Select template based on property type, location, and price range
  SELECT id INTO template_id
  FROM contract_templates
  WHERE is_active = true
    AND (property_type = lead_property_type OR property_type = 'all')
    AND (jurisdiction = lead_location OR jurisdiction = 'all')
    AND template_type = 'exclusive_listing' -- Default to exclusive listing for leads
  ORDER BY 
    CASE WHEN property_type = lead_property_type THEN 1 ELSE 2 END,
    CASE WHEN jurisdiction = lead_location THEN 1 ELSE 2 END,
    success_rate DESC
  LIMIT 1;
  
  RETURN template_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate legal risk score for a lead
CREATE OR REPLACE FUNCTION calculate_legal_risk_score(
  lead_location TEXT,
  lead_price_range TEXT,
  property_type TEXT
) RETURNS DECIMAL AS $$
DECLARE
  risk_score DECIMAL DEFAULT 0.0;
BEGIN
  -- Base risk factors
  risk_score := 10.0; -- Base risk
  
  -- Location-based risk adjustments
  CASE lead_location
    WHEN 'New Cairo', 'Sheikh Zayed', 'New Capital' THEN risk_score := risk_score + 5.0; -- Lower risk areas
    WHEN 'Downtown Cairo', 'Old Cairo' THEN risk_score := risk_score + 20.0; -- Higher risk due to complex ownership
    ELSE risk_score := risk_score + 10.0; -- Medium risk
  END CASE;
  
  -- Price-based risk adjustments
  IF lead_price_range LIKE '%M%' OR lead_price_range LIKE '%million%' THEN
    risk_score := risk_score + 15.0; -- High-value properties have more legal complexity
  END IF;
  
  -- Property type risk adjustments
  CASE property_type
    WHEN 'commercial' THEN risk_score := risk_score + 25.0; -- Commercial properties more complex
    WHEN 'land' THEN risk_score := risk_score + 30.0; -- Land sales most complex
    WHEN 'luxury' THEN risk_score := risk_score + 20.0; -- Luxury properties have more requirements
    ELSE risk_score := risk_score + 5.0; -- Residential is lower risk
  END CASE;
  
  -- Cap the risk score at 100
  IF risk_score > 100.0 THEN
    risk_score := 100.0;
  END IF;
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- ===============================================================================
-- 13. CREATE CONTRACT AUTOMATION TRIGGER
-- ===============================================================================
-- Trigger to automatically initiate contract generation when lead status changes to 'completed'

CREATE OR REPLACE FUNCTION trigger_contract_generation() RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger for leads that have completed the photo/tour process and don't already have contracts
  IF NEW.status = 'completed' AND NEW.contract_status = 'pending' AND OLD.status != 'completed' THEN
    
    -- Update lead with contract generation start
    NEW.contract_status := 'generating';
    NEW.contract_generated_at := NOW();
    
    -- Calculate legal risk score
    NEW.legal_risk_score := calculate_legal_risk_score(
      NEW.location, 
      NEW.price_range, 
      NEW.property_type
    );
    
    -- Select optimal template
    NEW.contract_template_id := select_optimal_contract_template(
      NEW.property_type,
      NEW.location,
      NEW.price_range
    );
    
    -- If high risk, require manual review
    IF NEW.legal_risk_score > 70.0 THEN
      NEW.manual_contract_review := true;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER contract_generation_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION trigger_contract_generation();

-- ===============================================================================
-- SUCCESS MESSAGE
-- ===============================================================================
-- Add a confirmation that the migration completed successfully
DO $$
BEGIN
  RAISE NOTICE 'Contract Automation System migration completed successfully!';
  RAISE NOTICE 'New tables created: contract_templates, lead_contracts, contract_ai_reviews, contract_signatures, contract_notifications';
  RAISE NOTICE 'Extended leads table with contract automation columns';
  RAISE NOTICE 'Created automatic contract generation trigger';
  RAISE NOTICE 'Added sample contract templates for immediate use';
END $$;
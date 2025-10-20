-- Enhanced Payment System Migration
-- Comprehensive payment infrastructure for bookings and report generation

-- Enhanced payment transactions table
CREATE TABLE appraisal_payments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES appraiser_bookings(id), -- For client booking payments
  appraisal_request_id UUID REFERENCES appraisal_requests(id), -- Fallback compatibility
  appraisal_id UUID REFERENCES property_appraisals(id), -- For report generation payments
  payment_category VARCHAR NOT NULL DEFAULT 'booking', -- 'booking' or 'report_generation'
  payer_type VARCHAR NOT NULL DEFAULT 'client', -- 'client' or 'appraiser'
  payer_id UUID, -- References auth.users.id (client or appraiser)
  payer_email VARCHAR NOT NULL,
  payer_name VARCHAR NOT NULL,
  paymob_intention_id VARCHAR, -- Intention API support
  paymob_order_id VARCHAR NOT NULL,
  paymob_transaction_id VARCHAR,
  merchant_order_id VARCHAR UNIQUE, -- Our internal order tracking
  amount_egp DECIMAL(10,2) NOT NULL,
  amount_cents INTEGER NOT NULL, -- Amount in piasters (legacy support)
  currency VARCHAR DEFAULT 'EGP',
  payment_method VARCHAR, -- 'card', 'wallet', 'fawry', 'bnpl', 'instapay', etc.
  payment_submethod VARCHAR, -- Specific method: 'vodafone_cash', 'valu', 'cib_installments'
  installment_plan JSONB, -- Installment details if applicable
  fees_egp DECIMAL(10,2) DEFAULT 0, -- Platform fees
  gateway_fees_egp DECIMAL(10,2) DEFAULT 0, -- Paymob fees
  net_amount_egp DECIMAL(10,2), -- Amount after fees
  status VARCHAR DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded', 'partially_refunded'
  paymob_status VARCHAR, -- Raw Paymob status
  payment_date TIMESTAMP,
  expiry_date TIMESTAMP, -- Payment expiry
  refund_amount DECIMAL(10,2) DEFAULT 0,
  refund_reason TEXT,
  refunded_at TIMESTAMP,
  customer_data JSONB, -- Customer billing information
  metadata JSONB, -- Additional payment metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_payments_booking_id ON appraisal_payments(booking_id);
CREATE INDEX idx_payments_appraisal_id ON appraisal_payments(appraisal_id);
CREATE INDEX idx_payments_category ON appraisal_payments(payment_category);
CREATE INDEX idx_payments_payer ON appraisal_payments(payer_type, payer_id);
CREATE INDEX idx_payments_merchant_order ON appraisal_payments(merchant_order_id);
CREATE INDEX idx_payments_status ON appraisal_payments(status);
CREATE INDEX idx_payments_paymob_transaction ON appraisal_payments(paymob_transaction_id);

-- Report generation pricing and fees table
CREATE TABLE report_generation_pricing (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  report_type VARCHAR NOT NULL, -- 'standard', 'detailed', 'comprehensive'
  appraiser_tier VARCHAR NOT NULL DEFAULT 'basic', -- 'basic', 'premium', 'enterprise'
  base_fee_egp DECIMAL(10,2) NOT NULL, -- Base report generation fee
  rush_delivery_multiplier DECIMAL(3,2) DEFAULT 1.5, -- 1.5x for rush delivery
  platform_commission_percentage DECIMAL(5,2) DEFAULT 15.00, -- Platform commission
  additional_services JSONB, -- {'digital_signature': 25, 'notarization': 50, 'translation': 100}
  effective_from TIMESTAMP DEFAULT NOW(),
  effective_until TIMESTAMP,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for pricing table
CREATE INDEX idx_pricing_type_tier ON report_generation_pricing(report_type, appraiser_tier);
CREATE INDEX idx_pricing_active ON report_generation_pricing(is_active, effective_from, effective_until);

-- Appraiser report generation credits/quotas
CREATE TABLE appraiser_report_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  credit_type VARCHAR NOT NULL, -- 'monthly_quota', 'purchased_credits', 'bonus_credits'
  credits_available INTEGER DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  credits_total INTEGER DEFAULT 0,
  expires_at TIMESTAMP, -- For time-limited credits
  purchase_payment_id UUID REFERENCES appraisal_payments(id), -- If purchased
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for credits table
CREATE INDEX idx_credits_appraiser_id ON appraiser_report_credits(appraiser_id);
CREATE INDEX idx_credits_type ON appraiser_report_credits(credit_type);
CREATE INDEX idx_credits_expiry ON appraiser_report_credits(expires_at);

-- Report generation transactions log
CREATE TABLE report_generation_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraisal_id UUID REFERENCES property_appraisals(id),
  appraiser_id UUID REFERENCES brokers(id),
  payment_id UUID REFERENCES appraisal_payments(id), -- NULL if using credits
  report_type VARCHAR NOT NULL,
  generation_method VARCHAR NOT NULL, -- 'paid', 'credits', 'free_tier'
  base_fee_egp DECIMAL(10,2) DEFAULT 0,
  rush_fee_egp DECIMAL(10,2) DEFAULT 0,
  additional_services_fee_egp DECIMAL(10,2) DEFAULT 0,
  total_fee_egp DECIMAL(10,2) DEFAULT 0,
  credits_used INTEGER DEFAULT 0,
  additional_services JSONB, -- Services requested
  generation_status VARCHAR DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  report_generated_at TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for report transactions
CREATE INDEX idx_report_transactions_appraisal ON report_generation_transactions(appraisal_id);
CREATE INDEX idx_report_transactions_appraiser ON report_generation_transactions(appraiser_id);
CREATE INDEX idx_report_transactions_status ON report_generation_transactions(generation_status);

-- Enhanced payment webhooks log
CREATE TABLE paymob_webhook_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paymob_transaction_id VARCHAR,
  paymob_order_id VARCHAR,
  webhook_type VARCHAR, -- 'transaction', 'delivery_status', 'refund', 'chargeback'
  event_type VARCHAR, -- 'payment.success', 'payment.failed', 'refund.processed'
  raw_data JSONB NOT NULL,
  signature_verified BOOLEAN DEFAULT false,
  processed BOOLEAN DEFAULT false,
  processing_attempts INTEGER DEFAULT 0,
  last_processing_error TEXT,
  processed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for webhook logs
CREATE INDEX idx_webhook_transaction_id ON paymob_webhook_logs(paymob_transaction_id);
CREATE INDEX idx_webhook_processed ON paymob_webhook_logs(processed);
CREATE INDEX idx_webhook_type ON paymob_webhook_logs(webhook_type);

-- Payment method availability cache
CREATE TABLE payment_method_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  amount_range_min DECIMAL(10,2),
  amount_range_max DECIMAL(10,2),
  available_methods JSONB NOT NULL, -- Cached payment methods from Paymob
  installment_options JSONB, -- Available installment plans
  last_updated TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- Create indexes for payment cache
CREATE INDEX idx_payment_cache_amount ON payment_method_cache(amount_range_min, amount_range_max);
CREATE INDEX idx_payment_cache_expiry ON payment_method_cache(expires_at);

-- Customer payment profiles (for repeat customers)
CREATE TABLE customer_payment_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_email VARCHAR NOT NULL,
  customer_phone VARCHAR,
  preferred_payment_method VARCHAR,
  billing_data JSONB, -- Saved billing information (non-sensitive)
  payment_history_summary JSONB, -- Statistics and preferences
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for customer profiles
CREATE UNIQUE INDEX idx_customer_email ON customer_payment_profiles(customer_email);
CREATE INDEX idx_customer_phone ON customer_payment_profiles(customer_phone);

-- Payment disputes and chargebacks
CREATE TABLE payment_disputes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  payment_id UUID REFERENCES appraisal_payments(id),
  dispute_type VARCHAR NOT NULL, -- 'chargeback', 'refund_request', 'complaint'
  dispute_reason VARCHAR,
  dispute_amount DECIMAL(10,2),
  status VARCHAR DEFAULT 'open', -- 'open', 'investigating', 'resolved', 'lost'
  paymob_dispute_id VARCHAR,
  customer_evidence TEXT,
  merchant_response TEXT,
  resolution_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for disputes
CREATE INDEX idx_disputes_payment_id ON payment_disputes(payment_id);
CREATE INDEX idx_disputes_status ON payment_disputes(status);

-- Financial reconciliation table
CREATE TABLE payment_reconciliation (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  settlement_date DATE NOT NULL,
  paymob_settlement_id VARCHAR,
  total_transactions INTEGER DEFAULT 0,
  total_amount_egp DECIMAL(15,2) DEFAULT 0,
  total_fees_egp DECIMAL(15,2) DEFAULT 0,
  net_settlement_egp DECIMAL(15,2) DEFAULT 0,
  transaction_ids JSONB, -- Array of transaction IDs in this settlement
  reconciliation_status VARCHAR DEFAULT 'pending', -- 'pending', 'matched', 'discrepancy'
  discrepancy_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for reconciliation
CREATE UNIQUE INDEX idx_reconciliation_settlement ON payment_reconciliation(paymob_settlement_id);
CREATE INDEX idx_reconciliation_date ON payment_reconciliation(settlement_date);

-- Insert default pricing structure
INSERT INTO report_generation_pricing (report_type, appraiser_tier, base_fee_egp, additional_services) VALUES
-- Standard reports
('standard', 'basic', 50.00, '{"digital_signature": 25, "notarization": 50, "translation": 100}'),
('standard', 'premium', 40.00, '{"digital_signature": 20, "notarization": 40, "translation": 80}'),
('standard', 'enterprise', 30.00, '{"digital_signature": 15, "notarization": 30, "translation": 60}'),

-- Detailed reports
('detailed', 'basic', 100.00, '{"digital_signature": 25, "notarization": 50, "translation": 150}'),
('detailed', 'premium', 80.00, '{"digital_signature": 20, "notarization": 40, "translation": 120}'),
('detailed', 'enterprise', 60.00, '{"digital_signature": 15, "notarization": 30, "translation": 90}'),

-- Comprehensive reports
('comprehensive', 'basic', 200.00, '{"digital_signature": 25, "notarization": 50, "translation": 200}'),
('comprehensive', 'premium', 160.00, '{"digital_signature": 20, "notarization": 40, "translation": 160}'),
('comprehensive', 'enterprise', 120.00, '{"digital_signature": 15, "notarization": 30, "translation": 120}');

-- Add appraiser_tier column to brokers table if it doesn't exist
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS appraiser_tier VARCHAR DEFAULT 'basic';

-- Create function to auto-assign monthly credits
CREATE OR REPLACE FUNCTION assign_monthly_report_credits()
RETURNS void AS $$
BEGIN
  -- Insert monthly quota credits for all active appraisers
  INSERT INTO appraiser_report_credits (
    appraiser_id, 
    credit_type, 
    credits_available, 
    credits_total, 
    expires_at
  )
  SELECT 
    id as appraiser_id,
    'monthly_quota' as credit_type,
    CASE appraiser_tier
      WHEN 'basic' THEN 2
      WHEN 'premium' THEN 10
      WHEN 'enterprise' THEN 50
      ELSE 2
    END as credits_available,
    CASE appraiser_tier
      WHEN 'basic' THEN 2
      WHEN 'premium' THEN 10
      WHEN 'enterprise' THEN 50
      ELSE 2
    END as credits_total,
    (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - INTERVAL '1 day')::TIMESTAMP as expires_at
  FROM brokers 
  WHERE is_active = true 
  AND public_profile_active = true
  AND role = 'appraiser'
  -- Only insert if no monthly quota exists for current month
  AND NOT EXISTS (
    SELECT 1 FROM appraiser_report_credits 
    WHERE appraiser_id = brokers.id 
    AND credit_type = 'monthly_quota'
    AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Run the function to assign initial credits
SELECT assign_monthly_report_credits();

-- Create function to generate merchant order IDs
CREATE OR REPLACE FUNCTION generate_merchant_order_id()
RETURNS varchar AS $$
BEGIN
  RETURN 'ORDER-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTR(gen_random_uuid()::text, 1, 8));
END;
$$ LANGUAGE plpgsql;

-- Create function to calculate report fees
CREATE OR REPLACE FUNCTION calculate_report_fees(
  p_report_type VARCHAR,
  p_appraiser_tier VARCHAR,
  p_rush_delivery BOOLEAN DEFAULT false,
  p_additional_services TEXT[] DEFAULT ARRAY[]::TEXT[]
)
RETURNS JSONB AS $$
DECLARE
  pricing_row report_generation_pricing%ROWTYPE;
  base_fee DECIMAL(10,2);
  rush_fee DECIMAL(10,2) := 0;
  service_fees DECIMAL(10,2) := 0;
  total_fee DECIMAL(10,2);
  service TEXT;
  service_price DECIMAL(10,2);
BEGIN
  -- Get pricing for report type and tier
  SELECT * INTO pricing_row
  FROM report_generation_pricing 
  WHERE report_type = p_report_type 
  AND appraiser_tier = p_appraiser_tier 
  AND is_active = true 
  AND NOW() BETWEEN effective_from AND COALESCE(effective_until, NOW() + INTERVAL '1 year')
  ORDER BY effective_from DESC 
  LIMIT 1;
  
  IF NOT FOUND THEN
    -- Fallback to basic tier if tier not found
    SELECT * INTO pricing_row
    FROM report_generation_pricing 
    WHERE report_type = p_report_type 
    AND appraiser_tier = 'basic' 
    AND is_active = true 
    ORDER BY effective_from DESC 
    LIMIT 1;
  END IF;
  
  base_fee := pricing_row.base_fee_egp;
  
  -- Calculate rush delivery fee
  IF p_rush_delivery THEN
    rush_fee := base_fee * (pricing_row.rush_delivery_multiplier - 1);
  END IF;
  
  -- Calculate additional services fees
  IF p_additional_services IS NOT NULL THEN
    FOREACH service IN ARRAY p_additional_services
    LOOP
      service_price := (pricing_row.additional_services->>service)::DECIMAL(10,2);
      IF service_price IS NOT NULL THEN
        service_fees := service_fees + service_price;
      END IF;
    END LOOP;
  END IF;
  
  total_fee := base_fee + rush_fee + service_fees;
  
  RETURN jsonb_build_object(
    'base_fee', base_fee,
    'rush_fee', rush_fee,
    'service_fees', service_fees,
    'total_fee', total_fee,
    'currency', 'EGP'
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE appraisal_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_report_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_generation_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paymob_webhook_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_method_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payment_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_disputes ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_reconciliation ENABLE ROW LEVEL SECURITY;

-- Policies for appraisal_payments
CREATE POLICY "Users can view their own payments" ON appraisal_payments
  FOR SELECT USING (payer_id = auth.uid());

CREATE POLICY "Appraisers can view payments for their services" ON appraisal_payments
  FOR SELECT USING (
    booking_id IN (
      SELECT id FROM appraiser_bookings 
      WHERE appraiser_id IN (
        SELECT id FROM brokers WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System can insert payments" ON appraisal_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update payments" ON appraisal_payments
  FOR UPDATE USING (true);

-- Policies for report pricing (read-only for appraisers)
CREATE POLICY "Appraisers can view pricing" ON report_generation_pricing
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brokers WHERE user_id = auth.uid() AND role = 'appraiser')
  );

-- Policies for appraiser credits
CREATE POLICY "Appraisers can view their own credits" ON appraiser_report_credits
  FOR SELECT USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage credits" ON appraiser_report_credits
  FOR ALL USING (true);

-- Policies for report transactions
CREATE POLICY "Appraisers can view their report transactions" ON report_generation_transactions
  FOR SELECT USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "System can manage report transactions" ON report_generation_transactions
  FOR ALL USING (true);

-- Admin policies
CREATE POLICY "Super admins can view all payments" ON appraisal_payments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE id = auth.uid() 
      AND raw_user_meta_data->>'role' = 'super_admin'
    )
  );

-- Create notification for successful migration
DO $$
BEGIN
  RAISE NOTICE 'Payment system migration completed successfully!';
  RAISE NOTICE 'Created tables: appraisal_payments, report_generation_pricing, appraiser_report_credits, report_generation_transactions, paymob_webhook_logs, payment_method_cache, customer_payment_profiles, payment_disputes, payment_reconciliation';
  RAISE NOTICE 'Inserted default pricing structure for all report types and tiers';
  RAISE NOTICE 'Assigned initial monthly credits to active appraisers';
END $$;
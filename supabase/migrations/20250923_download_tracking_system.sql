-- Enhanced Download Tracking System
-- This migration creates comprehensive download tracking for appraisal reports

-- Create report_downloads table for detailed tracking
CREATE TABLE IF NOT EXISTS report_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appraisal_id UUID REFERENCES property_appraisals(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),
  report_type VARCHAR NOT NULL CHECK (report_type IN ('standard', 'detailed', 'comprehensive')),
  payment_amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR NOT NULL,
  payment_reference VARCHAR,
  downloaded_at TIMESTAMP DEFAULT NOW(),
  report_options JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT valid_payment_amount CHECK (payment_amount >= 0)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_report_downloads_appraisal_id ON report_downloads(appraisal_id);
CREATE INDEX IF NOT EXISTS idx_report_downloads_user_id ON report_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_report_downloads_downloaded_at ON report_downloads(downloaded_at);
CREATE INDEX IF NOT EXISTS idx_report_downloads_report_type ON report_downloads(report_type);

-- Enhanced report generation pricing table updates
ALTER TABLE report_generation_pricing 
ADD COLUMN IF NOT EXISTS privacy_level VARCHAR DEFAULT 'medium' CHECK (privacy_level IN ('low', 'medium', 'high')),
ADD COLUMN IF NOT EXISTS data_filtering_rules JSONB DEFAULT '{}';

-- Admin activity tracking for report access
CREATE TABLE IF NOT EXISTS admin_report_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id),
  appraisal_id UUID REFERENCES property_appraisals(id),
  action_type VARCHAR NOT NULL CHECK (action_type IN ('preview', 'download', 'view_analytics', 'bulk_export')),
  accessed_at TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Create indexes for admin tracking
CREATE INDEX IF NOT EXISTS idx_admin_report_access_admin_user_id ON admin_report_access(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_report_access_appraisal_id ON admin_report_access(appraisal_id);
CREATE INDEX IF NOT EXISTS idx_admin_report_access_accessed_at ON admin_report_access(accessed_at);

-- Update booking table for rush fees
ALTER TABLE appraiser_bookings 
ADD COLUMN IF NOT EXISTS rush_delivery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rush_fee_amount DECIMAL(8,2) DEFAULT 0;

-- RLS Policies for report_downloads
ALTER TABLE report_downloads ENABLE ROW LEVEL SECURITY;

-- Users can only see their own downloads
CREATE POLICY "Users can view own downloads" ON report_downloads
  FOR SELECT USING (auth.uid() = user_id);

-- Admin users can see all downloads
CREATE POLICY "Admins can view all downloads" ON report_downloads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- System can insert download records (for automated tracking)
CREATE POLICY "System can insert downloads" ON report_downloads
  FOR INSERT WITH CHECK (true);

-- RLS Policies for admin_report_access
ALTER TABLE admin_report_access ENABLE ROW LEVEL SECURITY;

-- Only admins can access admin report access logs
CREATE POLICY "Admins can view report access logs" ON admin_report_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin', 'super_admin') 
      AND is_active = true
    )
  );

-- Function to automatically track downloads when payments are completed
CREATE OR REPLACE FUNCTION track_report_download()
RETURNS TRIGGER AS $$
BEGIN
  -- Only track when payment status changes to 'paid' for report generation
  IF NEW.status = 'paid' AND NEW.payment_category = 'report_generation' AND OLD.status != 'paid' THEN
    INSERT INTO report_downloads (
      appraisal_id,
      user_id,
      report_type,
      payment_amount,
      payment_method,
      payment_reference,
      report_options
    ) VALUES (
      NEW.appraisal_id,
      NEW.payer_id,
      COALESCE(NEW.metadata->>'report_type', 'standard'),
      NEW.amount_egp,
      COALESCE(NEW.metadata->>'payment_method', 'paymob'),
      NEW.paymob_order_id::TEXT,
      NEW.metadata
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for automatic download tracking
DROP TRIGGER IF EXISTS trigger_track_report_download ON appraisal_payments;
CREATE TRIGGER trigger_track_report_download
  AFTER UPDATE ON appraisal_payments
  FOR EACH ROW
  EXECUTE FUNCTION track_report_download();

-- Function to get download analytics for appraisals
CREATE OR REPLACE FUNCTION get_download_analytics(appraisal_ids UUID[])
RETURNS TABLE (
  appraisal_id UUID,
  download_count BIGINT,
  total_revenue DECIMAL,
  recent_downloads JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    rd.appraisal_id,
    COUNT(rd.id) as download_count,
    COALESCE(SUM(rd.payment_amount), 0) as total_revenue,
    COALESCE(
      JSON_AGG(
        JSON_BUILD_OBJECT(
          'user_email', COALESCE(up.email, up.full_name, 'Unknown User'),
          'download_date', rd.downloaded_at,
          'amount_paid', rd.payment_amount,
          'report_type', rd.report_type
        ) ORDER BY rd.downloaded_at DESC
      ) FILTER (WHERE rd.id IS NOT NULL), 
      '[]'::jsonb
    ) as recent_downloads
  FROM unnest(appraisal_ids) AS input_id
  LEFT JOIN report_downloads rd ON rd.appraisal_id = input_id
  LEFT JOIN user_profiles up ON up.user_id = rd.user_id
  GROUP BY rd.appraisal_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON report_downloads TO authenticated;
GRANT ALL ON admin_report_access TO authenticated;
GRANT EXECUTE ON FUNCTION get_download_analytics TO authenticated;

-- Insert sample privacy levels into pricing table
UPDATE report_generation_pricing 
SET privacy_level = CASE report_type
  WHEN 'standard' THEN 'high'
  WHEN 'detailed' THEN 'medium' 
  WHEN 'comprehensive' THEN 'low'
  ELSE 'medium'
END,
data_filtering_rules = CASE report_type
  WHEN 'standard' THEN '{"includePersonalInfo": false, "includeFinancialDetails": false, "includeAppraiserInfo": false, "includeMethodologies": false, "includeComparables": true, "includeInvestmentProjections": false}'::jsonb
  WHEN 'detailed' THEN '{"includePersonalInfo": false, "includeFinancialDetails": true, "includeAppraiserInfo": true, "includeMethodologies": false, "includeComparables": true, "includeInvestmentProjections": true}'::jsonb
  WHEN 'comprehensive' THEN '{"includePersonalInfo": true, "includeFinancialDetails": true, "includeAppraiserInfo": true, "includeMethodologies": true, "includeComparables": true, "includeInvestmentProjections": true}'::jsonb
  ELSE '{}'::jsonb
END
WHERE privacy_level IS NULL OR data_filtering_rules IS NULL OR data_filtering_rules = '{}'::jsonb;

COMMENT ON TABLE report_downloads IS 'Tracks all report downloads with payment and user information';
COMMENT ON TABLE admin_report_access IS 'Tracks admin access to appraisal reports for audit purposes';
COMMENT ON FUNCTION track_report_download IS 'Automatically creates download tracking record when payment is completed';
COMMENT ON FUNCTION get_download_analytics IS 'Returns download analytics for specified appraisal IDs';
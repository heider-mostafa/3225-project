-- Valify OTP Enhancement Migration
-- Phase 2: Add OTP, CSO, and NTRA verification support
-- Date: 2025-01-30

-- Add new verification fields to brokers table
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS phone_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS cso_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS ntra_validated BOOLEAN DEFAULT FALSE;

-- Update the verification sessions table to support different session types
ALTER TABLE appraiser_verification_sessions ADD COLUMN IF NOT EXISTS session_type VARCHAR DEFAULT 'verification';
ALTER TABLE appraiser_verification_sessions ADD COLUMN IF NOT EXISTS transaction_id VARCHAR;
ALTER TABLE appraiser_verification_sessions ADD COLUMN IF NOT EXISTS status VARCHAR DEFAULT 'pending';
ALTER TABLE appraiser_verification_sessions ADD COLUMN IF NOT EXISTS data JSONB;

-- Drop old constraints and add new ones for session types
ALTER TABLE appraiser_verification_sessions DROP CONSTRAINT IF EXISTS check_session_status;
ALTER TABLE appraiser_verification_sessions DROP CONSTRAINT IF EXISTS check_current_step;

-- Add new constraints
ALTER TABLE appraiser_verification_sessions ADD CONSTRAINT check_session_type 
  CHECK (session_type IN ('verification', 'phone_otp', 'email_otp', 'cso_validation', 'ntra_validation'));

ALTER TABLE appraiser_verification_sessions ADD CONSTRAINT check_status 
  CHECK (status IN ('pending', 'completed', 'failed', 'expired'));

-- Update verification logs to support new verification types
ALTER TABLE appraiser_verification_logs DROP CONSTRAINT IF EXISTS check_verification_type;
ALTER TABLE appraiser_verification_logs ADD CONSTRAINT check_verification_type 
  CHECK (verification_type IN ('document', 'selfie', 'liveness', 'face_match', 'sanction_check', 
    'phone_otp_send', 'phone_otp_verify', 'email_otp_send', 'email_otp_verify', 
    'cso_validation', 'ntra_validation', 'voice_biometric'));

-- Create unique constraint for session_type per appraiser to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_verification_sessions_unique_type 
  ON appraiser_verification_sessions(appraiser_id, session_type);

-- Add indexes for performance on new columns
CREATE INDEX IF NOT EXISTS idx_verification_sessions_transaction_id ON appraiser_verification_sessions(transaction_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_session_type ON appraiser_verification_sessions(session_type);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_status ON appraiser_verification_sessions(status);
CREATE INDEX IF NOT EXISTS idx_brokers_phone_verified ON brokers(phone_verified);
CREATE INDEX IF NOT EXISTS idx_brokers_email_verified ON brokers(email_verified);
CREATE INDEX IF NOT EXISTS idx_brokers_cso_validated ON brokers(cso_validated);
CREATE INDEX IF NOT EXISTS idx_brokers_ntra_validated ON brokers(ntra_validated);

-- Update verification status values to include new statuses
ALTER TABLE brokers DROP CONSTRAINT IF EXISTS check_valify_status;
ALTER TABLE brokers ADD CONSTRAINT check_valify_status 
  CHECK (valify_status IN ('pending', 'in_progress', 'verified', 'failed', 'manual_review', 
    'phone_verified', 'email_verified', 'cso_verified', 'ntra_verified'));

-- Create function to check if appraiser has completed all verification steps
CREATE OR REPLACE FUNCTION check_appraiser_complete_verification(appraiser_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  verification_complete BOOLEAN := FALSE;
BEGIN
  SELECT 
    phone_verified = TRUE AND 
    email_verified = TRUE AND 
    cso_validated = TRUE AND 
    ntra_validated = TRUE AND
    valify_status = 'verified'
  INTO verification_complete
  FROM brokers 
  WHERE id = appraiser_uuid;
  
  RETURN COALESCE(verification_complete, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-update overall verification status
CREATE OR REPLACE FUNCTION update_appraiser_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if all verification steps are complete
  IF check_appraiser_complete_verification(NEW.id) THEN
    NEW.valify_status := 'verified';
    NEW.valify_completed_at := NOW();
  ELSIF NEW.phone_verified = TRUE AND OLD.phone_verified = FALSE THEN
    NEW.valify_status := 'phone_verified';
  ELSIF NEW.email_verified = TRUE AND OLD.email_verified = FALSE THEN
    NEW.valify_status := 'email_verified';
  ELSIF NEW.cso_validated = TRUE AND OLD.cso_validated = FALSE THEN
    NEW.valify_status := 'cso_verified';
  ELSIF NEW.ntra_validated = TRUE AND OLD.ntra_validated = FALSE THEN
    NEW.valify_status := 'ntra_verified';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update verification status
DROP TRIGGER IF EXISTS trigger_update_verification_status ON brokers;
CREATE TRIGGER trigger_update_verification_status
  BEFORE UPDATE ON brokers
  FOR EACH ROW
  EXECUTE FUNCTION update_appraiser_verification_status();

-- Update comments for documentation
COMMENT ON COLUMN brokers.phone_verified IS 'Whether phone number has been verified via OTP';
COMMENT ON COLUMN brokers.email_verified IS 'Whether email address has been verified via OTP';
COMMENT ON COLUMN brokers.cso_validated IS 'Whether National ID has been validated with CSO';
COMMENT ON COLUMN brokers.ntra_validated IS 'Whether phone number has been validated with NTRA';
COMMENT ON COLUMN appraiser_verification_sessions.session_type IS 'Type of verification session (verification, phone_otp, email_otp, cso_validation, ntra_validation)';
COMMENT ON COLUMN appraiser_verification_sessions.transaction_id IS 'Valify transaction ID for this session';
COMMENT ON COLUMN appraiser_verification_sessions.data IS 'Session data including request/response details';

-- Insert sample data for testing (optional - remove in production)
-- This helps test the new verification flow
/*
-- Example: Insert a test appraiser verification session
INSERT INTO appraiser_verification_sessions (appraiser_id, session_type, transaction_id, status, data)
SELECT 
  id,
  'phone_otp',
  'test_tx_' || id::text,
  'pending',
  '{"phone_number": "+201234567890", "trials_remaining": 5}'::jsonb
FROM brokers 
WHERE email LIKE '%test%' 
LIMIT 1;
*/
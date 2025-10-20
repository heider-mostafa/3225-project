-- Valify OTP Safe Enhancement Migration
-- Phase 2: Add OTP, CSO, and NTRA verification support (SAFE VERSION)
-- Date: 2025-01-30

-- IMPORTANT: Run check_existing_schema.sql first to see what exists

-- Add new verification fields to brokers table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'phone_verified') THEN
    ALTER TABLE brokers ADD COLUMN phone_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'email_verified') THEN
    ALTER TABLE brokers ADD COLUMN email_verified BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'cso_validated') THEN
    ALTER TABLE brokers ADD COLUMN cso_validated BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'brokers' AND column_name = 'ntra_validated') THEN
    ALTER TABLE brokers ADD COLUMN ntra_validated BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Add new columns to appraiser_verification_sessions table (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appraiser_verification_sessions' AND column_name = 'session_type') THEN
    ALTER TABLE appraiser_verification_sessions ADD COLUMN session_type VARCHAR DEFAULT 'verification';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appraiser_verification_sessions' AND column_name = 'transaction_id') THEN
    ALTER TABLE appraiser_verification_sessions ADD COLUMN transaction_id VARCHAR;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appraiser_verification_sessions' AND column_name = 'status') THEN
    ALTER TABLE appraiser_verification_sessions ADD COLUMN status VARCHAR DEFAULT 'pending';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appraiser_verification_sessions' AND column_name = 'data') THEN
    ALTER TABLE appraiser_verification_sessions ADD COLUMN data JSONB;
  END IF;
END $$;

-- Safely update constraints (only add if they don't exist)
DO $$ 
BEGIN
  -- Add session_type constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_session_type' 
    AND table_name = 'appraiser_verification_sessions'
  ) THEN
    ALTER TABLE appraiser_verification_sessions 
    ADD CONSTRAINT check_session_type 
    CHECK (session_type IN ('verification', 'phone_otp', 'email_otp', 'cso_validation', 'ntra_validation'));
  END IF;
  
  -- Add status constraint if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_status' 
    AND table_name = 'appraiser_verification_sessions'
  ) THEN
    ALTER TABLE appraiser_verification_sessions 
    ADD CONSTRAINT check_status 
    CHECK (status IN ('pending', 'completed', 'failed', 'expired'));
  END IF;
  
  -- Update verification_type constraint if it exists, otherwise create it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_verification_type' 
    AND table_name = 'appraiser_verification_logs'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE appraiser_verification_logs DROP CONSTRAINT check_verification_type;
  END IF;
  
  -- Add the updated verification_type constraint
  ALTER TABLE appraiser_verification_logs 
  ADD CONSTRAINT check_verification_type 
  CHECK (verification_type IN (
    'document', 'selfie', 'liveness', 'face_match', 'sanction_check', 
    'phone_otp_send', 'phone_otp_verify', 'email_otp_send', 'email_otp_verify', 
    'cso_validation', 'ntra_validation', 'voice_biometric'
  ));
  
  -- Update valify_status constraint if it exists, otherwise create it
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'check_valify_status' 
    AND table_name = 'brokers'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE brokers DROP CONSTRAINT check_valify_status;
  END IF;
  
  -- Add the updated valify_status constraint
  ALTER TABLE brokers 
  ADD CONSTRAINT check_valify_status 
  CHECK (valify_status IN (
    'pending', 'in_progress', 'verified', 'failed', 'manual_review', 
    'phone_verified', 'email_verified', 'cso_verified', 'ntra_verified'
  ));
END $$;

-- Create unique constraint for session_type per appraiser (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'idx_verification_sessions_unique_type'
  ) THEN
    CREATE UNIQUE INDEX idx_verification_sessions_unique_type 
    ON appraiser_verification_sessions(appraiser_id, session_type);
  END IF;
END $$;

-- Add indexes for performance on new columns (only if they don't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_verification_sessions_transaction_id') THEN
    CREATE INDEX idx_verification_sessions_transaction_id ON appraiser_verification_sessions(transaction_id);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_verification_sessions_session_type') THEN
    CREATE INDEX idx_verification_sessions_session_type ON appraiser_verification_sessions(session_type);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_verification_sessions_status') THEN
    CREATE INDEX idx_verification_sessions_status ON appraiser_verification_sessions(status);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_brokers_phone_verified') THEN
    CREATE INDEX idx_brokers_phone_verified ON brokers(phone_verified);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_brokers_email_verified') THEN
    CREATE INDEX idx_brokers_email_verified ON brokers(email_verified);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_brokers_cso_validated') THEN
    CREATE INDEX idx_brokers_cso_validated ON brokers(cso_validated);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_brokers_ntra_validated') THEN
    CREATE INDEX idx_brokers_ntra_validated ON brokers(ntra_validated);
  END IF;
END $$;

-- Create function to check if appraiser has completed all verification steps (replace if exists)
CREATE OR REPLACE FUNCTION check_appraiser_complete_verification(appraiser_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  verification_complete BOOLEAN := FALSE;
BEGIN
  -- Check if all required verification fields are true
  SELECT 
    COALESCE(phone_verified, FALSE) = TRUE AND 
    COALESCE(email_verified, FALSE) = TRUE AND 
    COALESCE(cso_validated, FALSE) = TRUE AND 
    COALESCE(ntra_validated, FALSE) = TRUE AND
    COALESCE(valify_status, 'pending') = 'verified'
  INTO verification_complete
  FROM brokers 
  WHERE id = appraiser_uuid;
  
  RETURN COALESCE(verification_complete, FALSE);
END;
$$ LANGUAGE plpgsql;

-- Create trigger function to auto-update overall verification status (replace if exists)
CREATE OR REPLACE FUNCTION update_appraiser_verification_status()
RETURNS TRIGGER AS $$
BEGIN
  -- Ensure NEW has the required columns (defensive programming)
  IF NEW IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Check if all verification steps are complete
  IF check_appraiser_complete_verification(NEW.id) THEN
    NEW.valify_status := 'verified';
    NEW.valify_completed_at := NOW();
  ELSIF COALESCE(NEW.phone_verified, FALSE) = TRUE AND COALESCE(OLD.phone_verified, FALSE) = FALSE THEN
    NEW.valify_status := 'phone_verified';
  ELSIF COALESCE(NEW.email_verified, FALSE) = TRUE AND COALESCE(OLD.email_verified, FALSE) = FALSE THEN
    NEW.valify_status := 'email_verified';
  ELSIF COALESCE(NEW.cso_validated, FALSE) = TRUE AND COALESCE(OLD.cso_validated, FALSE) = FALSE THEN
    NEW.valify_status := 'cso_verified';
  ELSIF COALESCE(NEW.ntra_validated, FALSE) = TRUE AND COALESCE(OLD.ntra_validated, FALSE) = FALSE THEN
    NEW.valify_status := 'ntra_verified';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update verification status (only if it doesn't exist)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_update_verification_status' 
    AND event_object_table = 'brokers'
  ) THEN
    CREATE TRIGGER trigger_update_verification_status
      BEFORE UPDATE ON brokers
      FOR EACH ROW
      EXECUTE FUNCTION update_appraiser_verification_status();
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON COLUMN brokers.phone_verified IS 'Whether phone number has been verified via OTP';
COMMENT ON COLUMN brokers.email_verified IS 'Whether email address has been verified via OTP';
COMMENT ON COLUMN brokers.cso_validated IS 'Whether National ID has been validated with CSO';
COMMENT ON COLUMN brokers.ntra_validated IS 'Whether phone number has been validated with NTRA';
COMMENT ON COLUMN appraiser_verification_sessions.session_type IS 'Type of verification session (verification, phone_otp, email_otp, cso_validation, ntra_validation)';
COMMENT ON COLUMN appraiser_verification_sessions.transaction_id IS 'Valify transaction ID for this session';
COMMENT ON COLUMN appraiser_verification_sessions.data IS 'Session data including request/response details';

-- Migration completed successfully
SELECT 'Safe Valify OTP enhancement migration completed successfully!' as result;
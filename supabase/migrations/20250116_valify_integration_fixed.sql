-- Valify Integration Migration (FIXED)
-- Phase 1: Identity Verification System for Appraisers
-- Date: 2025-01-16
-- Fixed to use user_roles table instead of users table

-- Add Valify verification columns to existing brokers table
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS valify_verification_id VARCHAR;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS valify_status VARCHAR DEFAULT 'pending';
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS valify_score INTEGER;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS valify_completed_at TIMESTAMP;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS identity_document_url VARCHAR;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS selfie_url VARCHAR;
ALTER TABLE brokers ADD COLUMN IF NOT EXISTS standardized_headshot_url VARCHAR;

-- Create verification logs table for audit trail
CREATE TABLE IF NOT EXISTS appraiser_verification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  valify_verification_id VARCHAR NOT NULL,
  verification_type VARCHAR NOT NULL, -- 'document', 'selfie', 'liveness', 'face_match', 'sanction_check'
  status VARCHAR NOT NULL, -- 'pending', 'success', 'failed', 'manual_review'
  score INTEGER,
  details JSONB,
  transaction_id VARCHAR, -- Valify transaction ID
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create identity documents table for document management
CREATE TABLE IF NOT EXISTS appraiser_identity_documents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  document_type VARCHAR NOT NULL, -- 'national_id', 'passport', 'license'
  document_number VARCHAR,
  extracted_data JSONB, -- OCR extracted data from Valify
  verification_status VARCHAR DEFAULT 'pending',
  file_url VARCHAR,
  valify_transaction_id VARCHAR,
  confidence_score INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create verification sessions table for tracking the complete verification flow
CREATE TABLE IF NOT EXISTS appraiser_verification_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  appraiser_id UUID REFERENCES brokers(id) ON DELETE CASCADE,
  session_status VARCHAR DEFAULT 'started', -- 'started', 'document_uploaded', 'selfie_uploaded', 'completed', 'failed'
  current_step VARCHAR DEFAULT 'document_upload', -- 'document_upload', 'selfie_capture', 'review', 'completed'
  document_verification_id VARCHAR,
  selfie_verification_id VARCHAR,
  face_match_transaction_id VARCHAR,
  sanction_check_transaction_id VARCHAR,
  overall_score INTEGER,
  verification_notes TEXT,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_brokers_valify_status ON brokers(valify_status);
CREATE INDEX IF NOT EXISTS idx_brokers_valify_verification_id ON brokers(valify_verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_appraiser_id ON appraiser_verification_logs(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_verification_logs_transaction_id ON appraiser_verification_logs(transaction_id);
CREATE INDEX IF NOT EXISTS idx_identity_documents_appraiser_id ON appraiser_identity_documents(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_verification_sessions_appraiser_id ON appraiser_verification_sessions(appraiser_id);

-- Row Level Security (RLS) Policies

-- Enable RLS on new tables
ALTER TABLE appraiser_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE appraiser_verification_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for appraiser_verification_logs
CREATE POLICY "Appraisers can view their own verification logs" ON appraiser_verification_logs
  FOR SELECT USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all verification logs" ON appraiser_verification_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- RLS Policies for appraiser_identity_documents
CREATE POLICY "Appraisers can manage their own identity documents" ON appraiser_identity_documents
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all identity documents" ON appraiser_identity_documents
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- RLS Policies for appraiser_verification_sessions
CREATE POLICY "Appraisers can manage their own verification sessions" ON appraiser_verification_sessions
  FOR ALL USING (
    appraiser_id IN (
      SELECT id FROM brokers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all verification sessions" ON appraiser_verification_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_roles.user_id = auth.uid() 
      AND user_roles.role IN ('admin', 'super_admin')
      AND user_roles.is_active = true
    )
  );

-- Add verification status check constraint
ALTER TABLE brokers ADD CONSTRAINT check_valify_status 
  CHECK (valify_status IN ('pending', 'in_progress', 'verified', 'failed', 'manual_review'));

-- Add verification type check constraint
ALTER TABLE appraiser_verification_logs ADD CONSTRAINT check_verification_type 
  CHECK (verification_type IN ('document', 'selfie', 'liveness', 'face_match', 'sanction_check'));

-- Add session status check constraint
ALTER TABLE appraiser_verification_sessions ADD CONSTRAINT check_session_status 
  CHECK (session_status IN ('started', 'document_uploaded', 'selfie_uploaded', 'completed', 'failed'));

-- Add current step check constraint
ALTER TABLE appraiser_verification_sessions ADD CONSTRAINT check_current_step 
  CHECK (current_step IN ('document_upload', 'selfie_capture', 'review', 'completed'));

-- Comments for documentation
COMMENT ON TABLE appraiser_verification_logs IS 'Audit trail for all Valify verification activities';
COMMENT ON TABLE appraiser_identity_documents IS 'Storage for identity documents and OCR extracted data';
COMMENT ON TABLE appraiser_verification_sessions IS 'Tracks complete verification workflow for each appraiser';
COMMENT ON COLUMN brokers.valify_status IS 'Overall Valify verification status';
COMMENT ON COLUMN brokers.valify_score IS 'Combined confidence score from all verification steps';
COMMENT ON COLUMN appraiser_verification_logs.details IS 'JSON object containing detailed response from Valify API';
COMMENT ON COLUMN appraiser_identity_documents.extracted_data IS 'OCR extracted data from identity documents';
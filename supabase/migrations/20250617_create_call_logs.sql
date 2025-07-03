-- Create call_logs table for storing AI agent call transcripts and outcomes
CREATE TABLE IF NOT EXISTS call_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  call_schedule_id UUID,
  phone_number TEXT NOT NULL,
  call_status TEXT DEFAULT 'initiated' CHECK (call_status IN ('initiated', 'connected', 'completed', 'failed', 'no_answer')),
  call_duration INTEGER, -- Duration in seconds
  call_started_at TIMESTAMPTZ,
  call_ended_at TIMESTAMPTZ,
  transcript TEXT,
  conversation_summary TEXT,
  key_information JSONB DEFAULT '{}', -- Structured data extracted from conversation
  lead_qualification_score INTEGER, -- Score based on conversation
  next_action TEXT, -- What should happen next
  agent_notes TEXT,
  openai_session_id TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_schedule_id ON call_logs(call_schedule_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_phone_number ON call_logs(phone_number);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_status ON call_logs(call_status);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_started_at ON call_logs(call_started_at);

-- Add foreign key constraints
-- ALTER TABLE call_logs 
-- ADD CONSTRAINT fk_call_logs_lead_id 
-- FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE CASCADE;

ALTER TABLE call_logs 
ADD CONSTRAINT fk_call_logs_call_schedule_id 
FOREIGN KEY (call_schedule_id) REFERENCES call_schedules(id) ON DELETE SET NULL;

-- Add RLS (Row Level Security) policies
ALTER TABLE call_logs ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own data
CREATE POLICY "Users can view call logs" ON call_logs
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to insert/update/delete
CREATE POLICY "Service role can manage call logs" ON call_logs
  FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE TRIGGER update_call_logs_updated_at 
  BEFORE UPDATE ON call_logs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
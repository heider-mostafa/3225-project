-- Create call_schedules table for managing AI agent call scheduling
CREATE TABLE IF NOT EXISTS call_schedules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  scheduled_time TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'failed', 'cancelled')),
  call_type TEXT DEFAULT 'qualification' CHECK (call_type IN ('qualification', 'follow_up', 'confirmation')),
  preferred_time_slot TEXT,
  phone_number TEXT NOT NULL,
  max_retries INTEGER DEFAULT 3,
  retry_count INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_schedules_lead_id ON call_schedules(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_schedules_scheduled_time ON call_schedules(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_call_schedules_status ON call_schedules(status);
CREATE INDEX IF NOT EXISTS idx_call_schedules_phone_number ON call_schedules(phone_number);

-- Add foreign key constraint if leads table exists
-- ALTER TABLE call_schedules 
-- ADD CONSTRAINT fk_call_schedules_lead_id 
-- FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE CASCADE;

-- Add RLS (Row Level Security) policies
ALTER TABLE call_schedules ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own data
CREATE POLICY "Users can view call schedules" ON call_schedules
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to insert/update/delete
CREATE POLICY "Service role can manage call schedules" ON call_schedules
  FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE TRIGGER update_call_schedules_updated_at 
  BEFORE UPDATE ON call_schedules 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
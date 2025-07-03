-- Create whatsapp_messages table for tracking WhatsApp conversation history
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  message_text TEXT NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  message_type TEXT DEFAULT 'text',
  whatsapp_message_id TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_lead_id ON whatsapp_messages(lead_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_phone_number ON whatsapp_messages(phone_number);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_direction ON whatsapp_messages(direction);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_timestamp ON whatsapp_messages(timestamp);

-- Add foreign key constraint if leads table exists
-- ALTER TABLE whatsapp_messages 
-- ADD CONSTRAINT fk_whatsapp_messages_lead_id 
-- FOREIGN KEY (lead_id) REFERENCES leads(lead_id) ON DELETE CASCADE;

-- Add RLS (Row Level Security) policies
ALTER TABLE whatsapp_messages ENABLE ROW LEVEL SECURITY;

-- Policy for authenticated users to read their own data
CREATE POLICY "Users can view whatsapp messages" ON whatsapp_messages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy for service role to insert/update/delete
CREATE POLICY "Service role can manage whatsapp messages" ON whatsapp_messages
  FOR ALL USING (auth.role() = 'service_role');

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_whatsapp_messages_updated_at 
  BEFORE UPDATE ON whatsapp_messages 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- Migration: Add RLS policy for brokers to update inquiries for their assigned properties
-- Created: 2024-12-27

-- Allow brokers to update inquiries for properties they are assigned to
CREATE POLICY "Allow brokers to update inquiries for assigned properties"
  ON inquiries FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 
      FROM property_brokers pb
      INNER JOIN brokers b ON pb.broker_id = b.id
      WHERE pb.property_id = inquiries.property_id
        AND b.user_id = auth.uid()
        AND pb.is_active = true
        AND b.is_active = true
    )
  );

-- Allow brokers to read inquiries for properties they are assigned to
CREATE POLICY "Allow brokers to read inquiries for assigned properties"
  ON inquiries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 
      FROM property_brokers pb
      INNER JOIN brokers b ON pb.broker_id = b.id
      WHERE pb.property_id = inquiries.property_id
        AND b.user_id = auth.uid()
        AND pb.is_active = true
        AND b.is_active = true
    )
  ); 
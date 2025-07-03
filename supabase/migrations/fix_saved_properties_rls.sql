-- Fix saved_properties RLS policies
-- This migration ensures clean, consistent RLS policies for the saved_properties table
-- Safe to run multiple times (idempotent)

-- Verify table exists before proceeding
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'saved_properties') THEN
        RAISE EXCEPTION 'Table saved_properties does not exist. Please run the base table migrations first.';
    END IF;
END $$;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view and manage their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can manage their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can delete their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can view their saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can view their own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can manage their own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can insert their own saved properties" ON saved_properties;
DROP POLICY IF EXISTS "Users can delete their own saved properties" ON saved_properties;

-- Create comprehensive RLS policies for saved_properties
-- Each policy is specific to one operation for clarity and maintainability

CREATE POLICY "saved_properties_select_policy" ON saved_properties
  FOR SELECT 
  USING (user_id = auth.uid());

CREATE POLICY "saved_properties_insert_policy" ON saved_properties
  FOR INSERT 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_properties_update_policy" ON saved_properties
  FOR UPDATE 
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "saved_properties_delete_policy" ON saved_properties
  FOR DELETE 
  USING (user_id = auth.uid());

-- Ensure RLS is enabled (safe to run multiple times)
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY; 
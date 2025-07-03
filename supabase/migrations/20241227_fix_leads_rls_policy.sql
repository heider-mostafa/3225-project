-- Fix RLS policies for leads table to allow public form submissions
-- This migration fixes the RLS policy violation when submitting leads from the public form

-- Drop all existing policies for leads table to avoid conflicts
DROP POLICY IF EXISTS "Allow admin access to leads" ON leads;
DROP POLICY IF EXISTS "Allow public lead creation" ON leads;
DROP POLICY IF EXISTS "Allow service role access to leads" ON leads;
DROP POLICY IF EXISTS "Users can view own leads" ON leads;

-- Create new policies for proper access control
-- 1. Allow public insertion of new leads (for form submissions)
CREATE POLICY "Allow public lead creation" ON leads
  FOR INSERT WITH CHECK (true);

-- 2. Allow admin users full access to leads
CREATE POLICY "Allow admin access to leads" ON leads
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up
      WHERE up.user_id = auth.uid()
      AND (up.preferences->>'role')::text IN ('admin', 'super_admin')
    )
  );

-- 3. Allow service role access (for API operations and automated processes)
CREATE POLICY "Allow service role access to leads" ON leads
  FOR ALL USING (auth.role() = 'service_role');

-- 4. Allow authenticated users to view only their own leads (if we add user_id in future)
-- This is commented out for now since leads don't have user_id association yet
-- CREATE POLICY "Users can view own leads" ON leads
--   FOR SELECT USING (auth.uid() = user_id); 
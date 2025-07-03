-- FIX REMAINING MULTIPLE PERMISSIVE POLICIES
-- This migration consolidates the remaining overlapping RLS policies
-- Following the same structure as the previous successful migration

-- ================================================================
-- WHATSAPP_MESSAGES TABLE - Consolidate SELECT policies
-- ================================================================

-- Drop all existing SELECT policies that overlap
DROP POLICY IF EXISTS "Service role can manage whatsapp messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Users can view whatsapp messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Allow service role full access to whatsapp_messages" ON whatsapp_messages;
DROP POLICY IF EXISTS "Allow public read access to whatsapp_messages" ON whatsapp_messages;

-- Create single comprehensive SELECT policy
CREATE POLICY "whatsapp_messages_consolidated_read" ON whatsapp_messages
  FOR SELECT 
  USING (
    -- Authenticated users can see messages
    (SELECT auth.role()) = 'authenticated'
    OR
    -- Service role can see all messages
    (SELECT auth.role()) = 'service_role'
    OR
    -- Admins can see all messages
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate INSERT policy
CREATE POLICY "whatsapp_messages_insert" ON whatsapp_messages
  FOR INSERT 
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate UPDATE policy
CREATE POLICY "whatsapp_messages_update" ON whatsapp_messages
  FOR UPDATE 
  USING (
    (SELECT auth.role()) = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    (SELECT auth.role()) = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- Create separate DELETE policy
CREATE POLICY "whatsapp_messages_delete" ON whatsapp_messages
  FOR DELETE 
  USING (
    (SELECT auth.role()) = 'service_role'
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- USER_ROLES TABLE - Fix UPDATE policy conflicts
-- ================================================================

-- Drop all existing UPDATE policies that overlap
DROP POLICY IF EXISTS "user_roles_admin_access_final" ON user_roles;
DROP POLICY IF EXISTS "user_roles_admin_update" ON user_roles;
DROP POLICY IF EXISTS "user_roles_full_access" ON user_roles;
DROP POLICY IF EXISTS "Super admins can manage roles" ON user_roles;

-- Keep the consolidated READ policy we created before
-- Create single comprehensive UPDATE policy
CREATE POLICY "user_roles_consolidated_update" ON user_roles
  FOR UPDATE 
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role = 'super_admin' 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- PROFILES TABLE - Consolidate overlapping policies
-- ================================================================

-- Drop all existing overlapping policies
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their profile" ON profiles;
DROP POLICY IF EXISTS "Allow public read access to profiles" ON profiles;
DROP POLICY IF EXISTS "Allow users to update their own profile" ON profiles;

-- Create single comprehensive SELECT policy
CREATE POLICY "profiles_consolidated_read" ON profiles
  FOR SELECT 
  USING (
    -- Public can view all profiles OR user can view their own
    true
  );

-- Create single INSERT policy
CREATE POLICY "profiles_consolidated_insert" ON profiles
  FOR INSERT 
  WITH CHECK (id = (SELECT auth.uid()));

-- Create single UPDATE policy
CREATE POLICY "profiles_consolidated_update" ON profiles
  FOR UPDATE 
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

-- Create single DELETE policy
CREATE POLICY "profiles_consolidated_delete" ON profiles
  FOR DELETE 
  USING (
    id = (SELECT auth.uid())
    OR
    EXISTS (
      SELECT 1 FROM user_roles ur 
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin') 
      AND ur.is_active = true
    )
  );

-- ================================================================
-- Fix other commonly conflicting tables
-- ================================================================

-- CALL_LOGS table - if it has conflicts
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'call_logs') THEN
        -- Drop overlapping policies
        DROP POLICY IF EXISTS "Users can view call logs" ON call_logs;
        DROP POLICY IF EXISTS "Service role can manage call logs" ON call_logs;
        DROP POLICY IF EXISTS "Admins can view call logs" ON call_logs;
        
        -- Create consolidated policies
        CREATE POLICY "call_logs_consolidated_read" ON call_logs
          FOR SELECT 
          USING (
            (SELECT auth.role()) = 'authenticated'
            OR 
            (SELECT auth.role()) = 'service_role'
            OR
            EXISTS (
              SELECT 1 FROM user_roles ur 
              WHERE ur.user_id = (SELECT auth.uid())
              AND ur.role IN ('admin', 'super_admin') 
              AND ur.is_active = true
            )
          );
          
        CREATE POLICY "call_logs_service_manage" ON call_logs
          FOR ALL 
          USING ((SELECT auth.role()) = 'service_role')
          WITH CHECK ((SELECT auth.role()) = 'service_role');
    END IF;
END $$;

-- LEADS table - if it has conflicts
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'leads') THEN
        -- Drop any overlapping policies
        DROP POLICY IF EXISTS "Allow service role full access to leads" ON leads;
        DROP POLICY IF EXISTS "Allow authenticated admin and service role to update leads" ON leads;
        DROP POLICY IF EXISTS "Photographers can view assigned leads" ON leads;
        DROP POLICY IF EXISTS "Admins can manage leads" ON leads;
        
        -- Create consolidated SELECT policy
        CREATE POLICY "leads_consolidated_read" ON leads
          FOR SELECT 
          USING (
            (SELECT auth.role()) = 'service_role'
            OR
            -- Photographers can view assigned leads
            id IN (
              SELECT pa.lead_id FROM photographer_assignments pa
              JOIN photographers p ON pa.photographer_id = p.id
              WHERE p.email = (SELECT email FROM auth.users WHERE id = (SELECT auth.uid()))
            )
            OR
            -- Admins can view all leads
            EXISTS (
              SELECT 1 FROM user_roles ur 
              WHERE ur.user_id = (SELECT auth.uid())
              AND ur.role IN ('admin', 'super_admin') 
              AND ur.is_active = true
            )
          );
          
        -- Create service role management policy
        CREATE POLICY "leads_service_manage" ON leads
          FOR ALL 
          USING ((SELECT auth.role()) = 'service_role')
          WITH CHECK ((SELECT auth.role()) = 'service_role');
          
        -- Create admin management policy
        CREATE POLICY "leads_admin_update" ON leads
          FOR UPDATE 
          USING (
            EXISTS (
              SELECT 1 FROM user_roles ur 
              WHERE ur.user_id = (SELECT auth.uid())
              AND ur.role IN ('admin', 'super_admin') 
              AND ur.is_active = true
            )
          )
          WITH CHECK (
            EXISTS (
              SELECT 1 FROM user_roles ur 
              WHERE ur.user_id = (SELECT auth.uid())
              AND ur.role IN ('admin', 'super_admin') 
              AND ur.is_active = true
            )
          );
    END IF;
END $$;

-- INQUIRIES table - if it has conflicts
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'inquiries') THEN
        -- Drop overlapping policies
        DROP POLICY IF EXISTS "Users can view their own inquiries" ON inquiries;
        DROP POLICY IF EXISTS "Admins can view all inquiries" ON inquiries;
        DROP POLICY IF EXISTS "Users can create inquiries" ON inquiries;
        DROP POLICY IF EXISTS "Allow public insert for inquiries" ON inquiries;
        
        -- Create consolidated policies
        CREATE POLICY "inquiries_consolidated_read" ON inquiries
          FOR SELECT 
          USING (
            user_id = (SELECT auth.uid())
            OR
            EXISTS (
              SELECT 1 FROM user_roles ur 
              WHERE ur.user_id = (SELECT auth.uid())
              AND ur.role IN ('admin', 'super_admin') 
              AND ur.is_active = true
            )
          );
          
        CREATE POLICY "inquiries_consolidated_insert" ON inquiries
          FOR INSERT 
          WITH CHECK (true); -- Allow public inquiries
    END IF;
END $$;

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================
SELECT 'Remaining multiple permissive policies have been consolidated! Performance should be significantly improved.' as message;
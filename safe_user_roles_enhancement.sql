-- SAFE Migration: Add user_roles assignment without breaking existing signup
-- This adds role functionality while preserving existing user creation logic

-- First, let's create a separate function for role assignment
CREATE OR REPLACE FUNCTION public.assign_user_role_from_metadata()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_platform TEXT;
BEGIN
  -- Only proceed if user_metadata contains role information
  IF NEW.raw_user_meta_data IS NOT NULL AND NEW.raw_user_meta_data ? 'role' THEN
    
    -- Extract role information from user_metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'user');
    user_platform := NEW.raw_user_meta_data->>'platform';
    
    -- Validate and assign user role
    IF user_role IN ('user', 'broker', 'appraiser', 'developer', 'compound_manager', 'resident_owner', 'resident_tenant', 'security_guard', 'admin', 'super_admin', 'photographer') THEN
      
      -- Check if user already has a role (avoid duplicates)
      IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO user_roles (
          user_id, 
          role, 
          is_active, 
          assigned_at, 
          created_at
        ) VALUES (
          NEW.id, 
          user_role::TEXT, 
          true, 
          NOW(), 
          NOW()
        );
        
        -- Log role assignment (only if user_activity_logs table exists)
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_activity_logs') THEN
          INSERT INTO user_activity_logs (
            user_id,
            activity_type,
            activity_data,
            created_at
          ) VALUES (
            NEW.id,
            'role_assigned',
            jsonb_build_object(
              'role', user_role,
              'platform', user_platform,
              'auto_assigned', true,
              'source', 'signup_metadata'
            ),
            NOW()
          );
        END IF;
        
      END IF;
      
    ELSE
      -- Default to 'user' role if invalid role provided
      IF NOT EXISTS (SELECT 1 FROM user_roles WHERE user_id = NEW.id) THEN
        INSERT INTO user_roles (
          user_id, 
          role, 
          is_active, 
          assigned_at, 
          created_at
        ) VALUES (
          NEW.id, 
          'user', 
          true, 
          NOW(), 
          NOW()
        );
      END IF;
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create a separate trigger for role assignment (doesn't interfere with existing signup)
-- Use a different trigger name to avoid conflicts
CREATE TRIGGER assign_user_role_on_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_user_role_from_metadata();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.assign_user_role_from_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_user_role_from_metadata() TO anon;

COMMENT ON FUNCTION public.assign_user_role_from_metadata() IS 'SAFE: Assigns user roles based on signup metadata without interfering with existing signup logic. Only runs when role metadata is present.';
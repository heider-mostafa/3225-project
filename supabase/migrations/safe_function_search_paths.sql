-- Migration: Safely Fix Function Search Path Security Issues
-- Date: 2024-12-24
-- Description: Add explicit search_path to existing functions without changing implementations
-- WARNING: Run this during maintenance window and test thoroughly

BEGIN;

-- STEP 1: First, let's check what functions actually exist
-- Run this query first to see your actual functions:
/*
SELECT 
  routine_name,
  routine_type,
  data_type as return_type,
  routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name IN (
    'update_broker_availability_bookings',
    'generate_confirmation_code',
    'update_updated_at_column',
    'is_broker',
    'get_broker_by_user_id',
    'get_all_users_for_admin',
    'get_users_simple',
    'get_user_email_stats',
    'is_email_suppressed',
    'increment_property_views',
    'handle_new_user',
    'handle_new_user_preferences',
    'complete_tour_session',
    'end_heygen_session',
    'get_user_role',
    'is_admin',
    'has_permission',
    'update_inquiries_updated_at',
    'create_user_profile_extended',
    'log_user_activity',
    'generate_verification_token',
    'update_geo_point',
    'update_property_search_fields',
    'log_search_activity',
    'get_popular_search_terms',
    'search_properties_near_point'
  )
ORDER BY routine_name;
*/

-- STEP 2: For each function, we'll ALTER it instead of dropping/recreating
-- This preserves the original implementation and just adds search_path

-- Example template for altering functions:
-- ALTER FUNCTION function_name SET search_path = 'public';

-- Note: You need to run ALTER FUNCTION for each function individually
-- after confirming they exist and checking their current implementations

-- STEP 3: Alternative approach - Create a simple script to fix search paths
DO $$
DECLARE
    func_record RECORD;
    fix_query TEXT;
BEGIN
    -- Loop through all functions that need fixing
    FOR func_record IN 
        SELECT 
            routine_name as func_name,
            specific_name,
            routine_type
        FROM information_schema.routines 
        WHERE routine_schema = 'public' 
          AND routine_name IN (
            'update_broker_availability_bookings',
            'generate_confirmation_code', 
            'update_updated_at_column',
            'is_broker',
            'get_broker_by_user_id',
            'get_all_users_for_admin',
            'get_users_simple',
            'get_user_email_stats',
            'is_email_suppressed',
            'increment_property_views',
            'handle_new_user',
            'handle_new_user_preferences',
            'complete_tour_session',
            'end_heygen_session',
            'get_user_role',
            'is_admin',
            'has_permission',
            'update_inquiries_updated_at',
            'create_user_profile_extended',
            'log_user_activity',
            'generate_verification_token',
            'update_geo_point',
            'update_property_search_fields',
            'log_search_activity',
            'get_popular_search_terms',
            'search_properties_near_point'
          )
    LOOP
        -- Try to set search_path for each function
        BEGIN
            fix_query := format('ALTER FUNCTION public.%I SET search_path = ''public''', func_record.func_name);
            EXECUTE fix_query;
            RAISE NOTICE 'Fixed search_path for function: %', func_record.func_name;
        EXCEPTION 
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not fix function % (might have overloads): %', func_record.func_name, SQLERRM;
        END;
    END LOOP;
END;
$$;

COMMIT;

-- MANUAL STEPS TO COMPLETE:
-- 1. Check function signatures with overloads using:
--    \df+ function_name in psql
-- 2. For overloaded functions, use specific signatures:
--    ALTER FUNCTION public.function_name(param_types) SET search_path = 'public';
-- 3. Test each function after alteration
-- 4. Monitor application logs for any broken functionality 
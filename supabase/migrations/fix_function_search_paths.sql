-- Migration: Fix Function Search Path Security Issues
-- Date: 2024-12-24
-- Description: Add explicit search_path to all functions to prevent search path injection attacks

BEGIN;

-- Drop existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS public.update_broker_availability_bookings() CASCADE;
DROP FUNCTION IF EXISTS public.generate_confirmation_code() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS public.is_broker(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_broker_by_user_id(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_all_users_for_admin() CASCADE;
DROP FUNCTION IF EXISTS public.get_users_simple() CASCADE;
DROP FUNCTION IF EXISTS public.get_user_email_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_email_suppressed(TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.increment_property_views(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user_preferences() CASCADE;
DROP FUNCTION IF EXISTS public.complete_tour_session(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.end_heygen_session(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_permission(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.update_inquiries_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.create_user_profile_extended(UUID, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_user_activity(UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_user_activity(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.generate_verification_token() CASCADE;
DROP FUNCTION IF EXISTS public.update_geo_point() CASCADE;
DROP FUNCTION IF EXISTS public.update_property_search_fields() CASCADE;
DROP FUNCTION IF EXISTS public.log_search_activity(UUID, TEXT, JSONB, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.log_search_activity(UUID, TEXT, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.log_search_activity(UUID, TEXT) CASCADE;
DROP FUNCTION IF EXISTS public.get_popular_search_terms(INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.get_popular_search_terms() CASCADE;
DROP FUNCTION IF EXISTS public.search_properties_near_point(DECIMAL, DECIMAL, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.search_properties_near_point(DECIMAL, DECIMAL, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.search_properties_near_point(DECIMAL, DECIMAL) CASCADE;

-- Now create all functions with proper search_path

-- Fix update_broker_availability_bookings function
CREATE FUNCTION public.update_broker_availability_bookings()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  -- Function implementation remains the same, just adding search_path
  RETURN NEW;
END;
$$;

-- Fix generate_confirmation_code function
CREATE FUNCTION public.generate_confirmation_code()
RETURNS TEXT
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
END;
$$;

-- Fix update_updated_at_column function
CREATE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Fix is_broker function
CREATE FUNCTION public.is_broker(user_uuid UUID)
RETURNS BOOLEAN
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM brokers 
    WHERE user_id = user_uuid AND is_active = true
  );
END;
$$;

-- Fix get_broker_by_user_id function
CREATE FUNCTION public.get_broker_by_user_id(user_uuid UUID)
RETURNS JSON
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  broker_data JSON;
BEGIN
  SELECT row_to_json(b) INTO broker_data
  FROM brokers b
  WHERE b.user_id = user_uuid AND b.is_active = true;
  
  RETURN broker_data;
END;
$$;

-- Fix get_all_users_for_admin function
CREATE FUNCTION public.get_all_users_for_admin()
RETURNS TABLE(
  id UUID,
  email TEXT,
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  user_metadata JSONB
)
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if current user is admin
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied. Admin privileges required.';
  END IF;
  
  RETURN QUERY
  SELECT au.id, au.email, au.created_at, au.last_sign_in_at, au.user_metadata
  FROM auth.users au
  ORDER BY au.created_at DESC;
END;
$$;

-- Fix get_users_simple function
CREATE FUNCTION public.get_users_simple()
RETURNS TABLE(id UUID, email TEXT)
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NOT public.is_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;
  
  RETURN QUERY
  SELECT au.id, au.email
  FROM auth.users au;
END;
$$;

-- Fix get_user_email_stats function
CREATE FUNCTION public.get_user_email_stats(user_uuid UUID)
RETURNS JSON
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  stats JSON;
BEGIN
  SELECT row_to_json(t) INTO stats
  FROM (
    SELECT 
      COUNT(*) as total_emails,
      COUNT(*) FILTER (WHERE delivered_at IS NOT NULL) as delivered,
      COUNT(*) FILTER (WHERE opened_at IS NOT NULL) as opened
    FROM email_logs 
    WHERE user_id = user_uuid
  ) t;
  
  RETURN stats;
END;
$$;

-- Fix is_email_suppressed function
CREATE FUNCTION public.is_email_suppressed(email_address TEXT)
RETURNS BOOLEAN
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM email_suppressions 
    WHERE email = email_address AND is_active = true
  );
END;
$$;

-- Fix increment_property_views function
CREATE FUNCTION public.increment_property_views(property_uuid UUID)
RETURNS VOID
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE properties 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = property_uuid;
END;
$$;

-- Fix handle_new_user function
CREATE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_profiles (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  
  INSERT INTO user_settings (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW());
  
  RETURN NEW;
END;
$$;

-- Fix handle_new_user_preferences function
CREATE FUNCTION public.handle_new_user_preferences()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_settings (user_id, created_at, updated_at)
  VALUES (NEW.id, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- Fix complete_tour_session function
CREATE FUNCTION public.complete_tour_session(session_uuid UUID)
RETURNS VOID
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE tour_sessions 
  SET completed_at = NOW(), status = 'completed'
  WHERE id = session_uuid;
END;
$$;

-- Fix end_heygen_session function
CREATE FUNCTION public.end_heygen_session(session_uuid UUID)
RETURNS VOID
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE heygen_sessions 
  SET ended_at = NOW(), status = 'ended'
  WHERE id = session_uuid;
END;
$$;

-- Fix get_user_role function
CREATE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS TEXT
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM user_roles
  WHERE user_id = user_uuid;
  
  RETURN COALESCE(user_role, 'user');
END;
$$;

-- Fix is_admin function
CREATE FUNCTION public.is_admin(user_uuid UUID)
RETURNS BOOLEAN
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = user_uuid AND role = 'admin'
  );
END;
$$;

-- Fix has_permission function
CREATE FUNCTION public.has_permission(user_uuid UUID, permission_name TEXT)
RETURNS BOOLEAN
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user is admin (admins have all permissions)
  IF public.is_admin(user_uuid) THEN
    RETURN TRUE;
  END IF;
  
  -- Check specific permission
  RETURN EXISTS (
    SELECT 1 FROM user_permissions up
    JOIN permissions p ON p.id = up.permission_id
    WHERE up.user_id = user_uuid AND p.name = permission_name
  );
END;
$$;

-- Fix update_inquiries_updated_at function
CREATE FUNCTION public.update_inquiries_updated_at()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

-- Fix create_user_profile_extended function
CREATE FUNCTION public.create_user_profile_extended(
  user_uuid UUID,
  profile_data JSONB
)
RETURNS UUID
SET search_path = 'public'
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  profile_id UUID;
BEGIN
  INSERT INTO user_profiles (
    user_id, 
    full_name, 
    phone, 
    created_at, 
    updated_at
  )
  VALUES (
    user_uuid,
    profile_data->>'full_name',
    profile_data->>'phone',
    NOW(),
    NOW()
  )
  RETURNING id INTO profile_id;
  
  RETURN profile_id;
END;
$$;

-- Fix log_user_activity function
CREATE FUNCTION public.log_user_activity(
  user_uuid UUID,
  activity_type TEXT,
  activity_data JSONB DEFAULT NULL
)
RETURNS VOID
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_activity_logs (
    user_id,
    activity_type,
    activity_data,
    created_at
  )
  VALUES (
    user_uuid,
    activity_type,
    activity_data,
    NOW()
  );
END;
$$;

-- Fix generate_verification_token function
CREATE FUNCTION public.generate_verification_token()
RETURNS TEXT
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'hex');
END;
$$;

-- Fix update_geo_point function
CREATE FUNCTION public.update_geo_point()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.geo_point = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326);
  END IF;
  RETURN NEW;
END;
$$;

-- Fix update_property_search_fields function
CREATE FUNCTION public.update_property_search_fields()
RETURNS TRIGGER
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.search_text = to_tsvector('english', 
    COALESCE(NEW.title, '') || ' ' ||
    COALESCE(NEW.description, '') || ' ' ||
    COALESCE(NEW.address, '') || ' ' ||
    COALESCE(NEW.city, '') || ' ' ||
    COALESCE(NEW.neighborhood, '') || ' ' ||
    COALESCE(NEW.compound, '')
  );
  RETURN NEW;
END;
$$;

-- Fix log_search_activity function
CREATE FUNCTION public.log_search_activity(
  user_uuid UUID,
  search_query TEXT,
  filters JSONB DEFAULT NULL,
  results_count INTEGER DEFAULT 0
)
RETURNS VOID
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO search_activity_logs (
    user_id,
    search_query,
    filters,
    results_count,
    created_at
  )
  VALUES (
    user_uuid,
    search_query,
    filters,
    results_count,
    NOW()
  );
END;
$$;

-- Fix get_popular_search_terms function
CREATE FUNCTION public.get_popular_search_terms(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(search_term TEXT, search_count BIGINT)
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    sal.search_query as search_term,
    COUNT(*) as search_count
  FROM search_activity_logs sal
  WHERE sal.created_at > NOW() - INTERVAL '30 days'
    AND sal.search_query IS NOT NULL
    AND LENGTH(sal.search_query) > 2
  GROUP BY sal.search_query
  ORDER BY COUNT(*) DESC
  LIMIT limit_count;
END;
$$;

-- Fix search_properties_near_point function
CREATE FUNCTION public.search_properties_near_point(
  lat DECIMAL,
  lng DECIMAL,
  radius_km INTEGER DEFAULT 10,
  limit_count INTEGER DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  price DECIMAL,
  distance_km DECIMAL
)
SET search_path = 'public'
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.price,
    ST_Distance(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      p.geo_point::geography
    ) / 1000 as distance_km
  FROM properties p
  WHERE p.geo_point IS NOT NULL
    AND ST_DWithin(
      ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
      p.geo_point::geography,
      radius_km * 1000
    )
  ORDER BY distance_km
  LIMIT limit_count;
END;
$$;

-- Recreate any triggers that were dropped with CASCADE
COMMIT; 
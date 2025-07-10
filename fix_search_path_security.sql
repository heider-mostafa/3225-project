-- =============================================================================
-- SECURITY FIX: Function Search Path Mutable
-- =============================================================================
-- 
-- ISSUE: Function public.calculate_lifestyle_score has a role mutable search_path
-- RISK: Potential function hijacking attacks, privilege escalation
-- SOLUTION: Set secure search_path and make it immutable
--
-- =============================================================================

BEGIN;

-- Drop and recreate the function with secure search_path
DROP FUNCTION IF EXISTS public.calculate_lifestyle_score(UUID, UUID);

-- Create function with secure, immutable search_path
CREATE OR REPLACE FUNCTION public.calculate_lifestyle_score(
  p_property_id UUID,
  p_user_id UUID
) RETURNS DECIMAL(3,1) 
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
  total_destinations INTEGER;
  total_weighted_score DECIMAL(10,2) := 0;
  total_weight INTEGER := 0;
  destination_record RECORD;
  commute_score DECIMAL(3,1);
  final_score DECIMAL(3,1);
BEGIN
  -- Get all user destinations
  SELECT COUNT(*) INTO total_destinations
  FROM public.user_destinations 
  WHERE user_id = p_user_id;
  
  IF total_destinations = 0 THEN
    RETURN 5.0; -- Default neutral score
  END IF;
  
  -- Calculate weighted score based on commute times and importance
  FOR destination_record IN 
    SELECT ud.importance, cd.duration_car, cd.distance_km
    FROM public.user_destinations ud
    LEFT JOIN public.commute_data cd ON ud.id = cd.destination_id AND cd.property_id = p_property_id
    WHERE ud.user_id = p_user_id
  LOOP
    -- Score based on commute time (0-10 scale)
    IF destination_record.duration_car IS NOT NULL THEN
      IF destination_record.duration_car <= 10 THEN
        commute_score := 10.0;
      ELSIF destination_record.duration_car <= 20 THEN
        commute_score := 8.0;
      ELSIF destination_record.duration_car <= 30 THEN
        commute_score := 6.0;
      ELSIF destination_record.duration_car <= 45 THEN
        commute_score := 4.0;
      ELSIF destination_record.duration_car <= 60 THEN
        commute_score := 2.0;
      ELSE
        commute_score := 1.0;
      END IF;
    ELSE
      commute_score := 5.0; -- Default if no data
    END IF;
    
    total_weighted_score := total_weighted_score + (commute_score * destination_record.importance);
    total_weight := total_weight + destination_record.importance;
  END LOOP;
  
  IF total_weight > 0 THEN
    final_score := total_weighted_score / total_weight;
  ELSE
    final_score := 5.0;
  END IF;
  
  RETURN ROUND(final_score, 1);
END;
$$ LANGUAGE plpgsql;

-- Also fix the get_commute_analysis function
DROP FUNCTION IF EXISTS public.get_commute_analysis(UUID, UUID);

CREATE OR REPLACE FUNCTION public.get_commute_analysis(
  p_property_id UUID,
  p_user_id UUID
) RETURNS JSON 
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  total_daily_time INTEGER := 0;
  total_monthly_cost DECIMAL(10,2) := 0;
  destination_count INTEGER := 0;
BEGIN
  SELECT json_agg(
    json_build_object(
      'destination_id', ud.id,
      'label', ud.label,
      'category', ud.category,
      'importance', ud.importance,
      'distance_km', cd.distance_km,
      'duration_car', cd.duration_car,
      'duration_public', cd.duration_public,
      'cost_estimate', cd.cost_estimate,
      'traffic_factor', cd.traffic_factor
    )
  ) INTO result
  FROM public.user_destinations ud
  LEFT JOIN public.commute_data cd ON ud.id = cd.destination_id AND cd.property_id = p_property_id
  WHERE ud.user_id = p_user_id;
  
  RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql;

-- Grant appropriate permissions
GRANT EXECUTE ON FUNCTION public.calculate_lifestyle_score(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_commute_analysis(UUID, UUID) TO authenticated;

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify the fix:

-- Check if search_path is properly set
SELECT 
  proname as function_name,
  proconfig as configuration
FROM pg_proc 
WHERE proname IN ('calculate_lifestyle_score', 'get_commute_analysis')
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Verify function exists and has correct signature
\df public.calculate_lifestyle_score
\df public.get_commute_analysis
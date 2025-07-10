-- =============================================================================
-- SECURITY FIX: Function Search Path Mutable - Complete Fix
-- =============================================================================
-- 
-- FUNCTIONS TO FIX:
-- 1. public.update_campaign_analytics
-- 2. public.update_down_payment_progress  
-- 3. public.select_optimal_contract_template
-- 4. public.calculate_legal_risk_score
-- 5. public.trigger_contract_generation
--
-- ISSUE: All functions have role mutable search_path
-- RISK: Potential function hijacking attacks, privilege escalation
-- SOLUTION: Set secure search_path and make them immutable
--
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. FIX: update_campaign_analytics (Social Media)
-- =============================================================================

DROP FUNCTION IF EXISTS public.update_campaign_analytics();

CREATE OR REPLACE FUNCTION public.update_campaign_analytics()
RETURNS TRIGGER 
SET search_path = public
SECURITY DEFINER
AS $$
BEGIN
  -- Update campaign totals when post analytics change
  UPDATE public.social_media_campaigns 
  SET 
    total_engagement = (
      SELECT COALESCE(SUM(likes_count + comments_count + shares_count), 0)
      FROM public.social_media_posts 
      WHERE campaign_id = NEW.campaign_id
    ),
    total_reach = (
      SELECT COALESCE(SUM(reach_count), 0)
      FROM public.social_media_posts 
      WHERE campaign_id = NEW.campaign_id
    ),
    total_clicks = (
      SELECT COALESCE(SUM(clicks_count), 0)
      FROM public.social_media_posts 
      WHERE campaign_id = NEW.campaign_id
    ),
    updated_at = NOW()
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 2. FIX: update_down_payment_progress (Mortgage)
-- =============================================================================

DROP FUNCTION IF EXISTS public.update_down_payment_progress();

CREATE OR REPLACE FUNCTION public.update_down_payment_progress()
RETURNS TRIGGER 
SET search_path = public
SECURITY DEFINER
AS $$
BEGIN
  -- Update the total amount saved in down_payment_tracking
  UPDATE public.down_payment_tracking 
  SET 
    amount_saved = (
      SELECT COALESCE(SUM(amount), 0) 
      FROM public.down_payment_savings 
      WHERE down_payment_tracking_id = NEW.down_payment_tracking_id
    ),
    updated_at = NOW()
  WHERE id = NEW.down_payment_tracking_id;
  
  -- Check if down payment is completed
  UPDATE public.down_payment_tracking 
  SET 
    is_completed = (amount_saved >= total_required),
    completed_at = CASE 
      WHEN amount_saved >= total_required AND NOT is_completed THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = NEW.down_payment_tracking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 3. FIX: select_optimal_contract_template (Contract System)
-- =============================================================================

DROP FUNCTION IF EXISTS public.select_optimal_contract_template(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.select_optimal_contract_template(
  lead_property_type TEXT,
  lead_location TEXT,
  lead_price_range TEXT
) RETURNS UUID 
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
  template_id UUID;
BEGIN
  -- Select template based on property type, location, and price range
  SELECT id INTO template_id
  FROM public.contract_templates
  WHERE is_active = true
    AND (property_type = lead_property_type OR property_type = 'all')
    AND (jurisdiction = lead_location OR jurisdiction = 'all')
    AND template_type = 'exclusive_listing' -- Default to exclusive listing for leads
  ORDER BY 
    CASE WHEN property_type = lead_property_type THEN 1 ELSE 2 END,
    CASE WHEN jurisdiction = lead_location THEN 1 ELSE 2 END,
    success_rate DESC
  LIMIT 1;
  
  RETURN template_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 4. FIX: calculate_legal_risk_score (Contract System)
-- =============================================================================

DROP FUNCTION IF EXISTS public.calculate_legal_risk_score(TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION public.calculate_legal_risk_score(
  lead_location TEXT,
  lead_price_range TEXT,
  property_type TEXT
) RETURNS DECIMAL 
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
  risk_score DECIMAL DEFAULT 0.0;
BEGIN
  -- Base risk factors
  risk_score := 10.0; -- Base risk
  
  -- Location-based risk adjustments
  CASE lead_location
    WHEN 'New Cairo', 'Sheikh Zayed', 'New Capital' THEN risk_score := risk_score + 5.0; -- Lower risk areas
    WHEN 'Downtown Cairo', 'Old Cairo' THEN risk_score := risk_score + 20.0; -- Higher risk due to complex ownership
    ELSE risk_score := risk_score + 10.0; -- Medium risk
  END CASE;
  
  -- Price-based risk adjustments
  IF lead_price_range LIKE '%M%' OR lead_price_range LIKE '%million%' THEN
    risk_score := risk_score + 15.0; -- High-value properties have more legal complexity
  END IF;
  
  -- Property type risk adjustments
  CASE property_type
    WHEN 'commercial' THEN risk_score := risk_score + 25.0; -- Commercial properties more complex
    WHEN 'land' THEN risk_score := risk_score + 30.0; -- Land sales most complex
    WHEN 'luxury' THEN risk_score := risk_score + 20.0; -- Luxury properties have more requirements
    ELSE risk_score := risk_score + 5.0; -- Residential is lower risk
  END CASE;
  
  -- Cap the risk score at 100
  IF risk_score > 100.0 THEN
    risk_score := 100.0;
  END IF;
  
  RETURN risk_score;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 5. FIX: trigger_contract_generation (Contract System)
-- =============================================================================

DROP FUNCTION IF EXISTS public.trigger_contract_generation();

CREATE OR REPLACE FUNCTION public.trigger_contract_generation() 
RETURNS TRIGGER 
SET search_path = public
SECURITY DEFINER
AS $$
DECLARE
  template_id UUID;
  risk_score DECIMAL;
BEGIN
  -- Only trigger for leads that have completed the photo/tour process and don't already have contracts
  IF NEW.status = 'completed' AND NEW.contract_status = 'pending' AND OLD.status != 'completed' THEN
    
    -- Update lead with contract generation start
    NEW.contract_status := 'generating';
    NEW.contract_generated_at := NOW();
    
    -- Select optimal template
    SELECT public.select_optimal_contract_template(
      NEW.property_type, 
      NEW.location, 
      NEW.price_range
    ) INTO template_id;
    
    -- Calculate legal risk
    SELECT public.calculate_legal_risk_score(
      NEW.location, 
      NEW.price_range, 
      NEW.property_type
    ) INTO risk_score;
    
    -- Create contract record (async operation in real implementation)
    INSERT INTO public.lead_contracts (
      lead_id,
      contract_type,
      template_id,
      legal_risk_score,
      status,
      contract_data
    ) VALUES (
      NEW.id,
      'exclusive_listing',
      template_id,
      risk_score,
      'generating',
      jsonb_build_object(
        'lead_data', row_to_json(NEW),
        'generation_timestamp', NOW(),
        'template_id', template_id,
        'risk_score', risk_score
      )
    );
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant appropriate permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.select_optimal_contract_template(TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_legal_risk_score(TEXT, TEXT, TEXT) TO authenticated;

-- Trigger functions don't need explicit grants as they run automatically

-- =============================================================================
-- RECREATE TRIGGERS (if they exist)
-- =============================================================================

-- Social media trigger
DROP TRIGGER IF EXISTS trigger_update_campaign_analytics ON social_media_posts;
CREATE TRIGGER trigger_update_campaign_analytics
  AFTER INSERT OR UPDATE ON public.social_media_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_campaign_analytics();

-- Mortgage trigger  
DROP TRIGGER IF EXISTS trigger_update_down_payment_progress ON down_payment_savings;
CREATE TRIGGER trigger_update_down_payment_progress
  AFTER INSERT OR UPDATE ON public.down_payment_savings
  FOR EACH ROW EXECUTE FUNCTION public.update_down_payment_progress();

-- Contract trigger
DROP TRIGGER IF EXISTS trigger_contract_generation ON leads;
CREATE TRIGGER trigger_contract_generation
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.trigger_contract_generation();

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify all fixes are applied correctly:

SELECT 
  proname as function_name,
  proconfig as configuration,
  CASE 
    WHEN proconfig IS NULL THEN '❌ NOT FIXED'
    WHEN 'search_path=public' = ANY(proconfig) THEN '✅ FIXED'
    ELSE '⚠️ PARTIAL'
  END as status
FROM pg_proc 
WHERE proname IN (
  'update_campaign_analytics',
  'update_down_payment_progress', 
  'select_optimal_contract_template',
  'calculate_legal_risk_score',
  'trigger_contract_generation'
)
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY proname;

-- Expected result: All functions should show 'FIXED' status
-- with configuration showing search_path=public
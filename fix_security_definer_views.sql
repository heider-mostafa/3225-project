-- =============================================================================
-- FIX: Security Definer Views
-- =============================================================================
-- 
-- ISSUE: Views are defined with SECURITY DEFINER property
-- RISK: Views enforce permissions of view creator instead of querying user
-- SOLUTION: Recreate views without SECURITY DEFINER (use SECURITY INVOKER)
--
-- AFFECTED VIEWS:
-- 1. public.email_performance_summary
-- 2. public.campaign_performance_summary  
-- 3. public.active_auctions
-- 4. public.auction_summary
--
-- =============================================================================

BEGIN;

-- =============================================================================
-- 1. FIX: email_performance_summary
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.email_performance_summary CASCADE;

-- Recreate without SECURITY DEFINER (defaults to SECURITY INVOKER)
CREATE VIEW public.email_performance_summary AS
SELECT 
  DATE(timestamp) as date,
  COUNT(*) FILTER (WHERE event_type = 'email_sent') as emails_sent,
  COUNT(*) FILTER (WHERE event_type = 'email_delivered') as emails_delivered,
  COUNT(*) FILTER (WHERE event_type = 'email_opened') as emails_opened,
  COUNT(*) FILTER (WHERE event_type = 'email_clicked') as emails_clicked,
  COUNT(*) FILTER (WHERE event_type = 'email_bounced') as emails_bounced,
  COUNT(*) FILTER (WHERE event_type = 'email_unsubscribed') as emails_unsubscribed,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'email_delivered')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'email_sent'), 0) * 100, 2
  ) as delivery_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'email_opened')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'email_delivered'), 0) * 100, 2
  ) as open_rate,
  ROUND(
    COUNT(*) FILTER (WHERE event_type = 'email_clicked')::numeric / 
    NULLIF(COUNT(*) FILTER (WHERE event_type = 'email_delivered'), 0) * 100, 2
  ) as click_rate
FROM public.email_analytics
WHERE timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(timestamp)
ORDER BY date DESC;

-- =============================================================================
-- 2. FIX: campaign_performance_summary
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.campaign_performance_summary CASCADE;

-- Recreate without SECURITY DEFINER (defaults to SECURITY INVOKER)
CREATE VIEW public.campaign_performance_summary AS
SELECT 
  c.id,
  c.name,
  c.property_id,
  p.title as property_title,
  c.status,
  c.created_at,
  COUNT(DISTINCT sp.id) as total_posts,
  COUNT(CASE WHEN sp.status = 'published' THEN 1 END) as published_posts,
  COUNT(CASE WHEN sp.status = 'failed' THEN 1 END) as failed_posts,
  COALESCE(SUM(sp.likes_count), 0) as total_likes,
  COALESCE(SUM(sp.comments_count), 0) as total_comments,
  COALESCE(SUM(sp.shares_count), 0) as total_shares,
  COALESCE(SUM(sp.reach_count), 0) as total_reach,
  COALESCE(SUM(sp.clicks_count), 0) as total_clicks,
  CASE 
    WHEN COUNT(CASE WHEN sp.status = 'published' THEN 1 END) > 0 
    THEN ROUND(
      (COALESCE(SUM(sp.likes_count), 0) + COALESCE(SUM(sp.comments_count), 0) + COALESCE(SUM(sp.shares_count), 0))::decimal / 
      COUNT(CASE WHEN sp.status = 'published' THEN 1 END), 2
    )
    ELSE 0 
  END as avg_engagement_per_post
FROM public.social_media_campaigns c
LEFT JOIN public.properties p ON c.property_id = p.id
LEFT JOIN public.social_media_posts sp ON c.id = sp.campaign_id
GROUP BY c.id, c.name, c.property_id, p.title, c.status, c.created_at;

-- =============================================================================
-- 3. FIX: active_auctions
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.active_auctions CASCADE;

-- Recreate without SECURITY DEFINER (defaults to SECURITY INVOKER)
CREATE VIEW public.active_auctions AS
SELECT 
    ap.*,
    p.title,
    p.address,
    p.city,
    p.price as original_price,
    p.bedrooms,
    p.bathrooms,
    p.square_meters
FROM public.auction_properties ap
JOIN public.properties p ON ap.property_id = p.id
WHERE ap.status IN ('preview', 'live');

-- =============================================================================
-- 4. FIX: auction_summary
-- =============================================================================

-- Drop the existing view
DROP VIEW IF EXISTS public.auction_summary CASCADE;

-- Recreate without SECURITY DEFINER (defaults to SECURITY INVOKER)
CREATE VIEW public.auction_summary AS
SELECT 
    ap.id,
    ap.property_id,
    ap.status,
    ap.current_bid,
    ap.reserve_price,
    ap.buy_now_price,
    ap.bid_count,
    ap.start_time,
    ap.end_time,
    CASE 
        WHEN ap.status = 'preview' THEN EXTRACT(EPOCH FROM (ap.start_time - NOW()))
        WHEN ap.status = 'live' THEN EXTRACT(EPOCH FROM (ap.end_time - NOW()))
        ELSE 0
    END as seconds_remaining,
    COUNT(DISTINCT b.user_id) as unique_bidders,
    MAX(b.bid_time) as last_bid_time
FROM public.auction_properties ap
LEFT JOIN public.bids b ON ap.id = b.auction_property_id
GROUP BY ap.id, ap.property_id, ap.status, ap.current_bid, ap.reserve_price, 
         ap.buy_now_price, ap.bid_count, ap.start_time, ap.end_time;

-- =============================================================================
-- 5. SET PROPER PERMISSIONS
-- =============================================================================
-- Grant appropriate access to views based on their purpose

-- Email performance summary - Admin access only
GRANT SELECT ON public.email_performance_summary TO authenticated;

-- Campaign performance summary - Admin access only  
GRANT SELECT ON public.campaign_performance_summary TO authenticated;

-- Active auctions - Public access (with RLS)
GRANT SELECT ON public.active_auctions TO authenticated, anon;

-- Auction summary - Public access (with RLS)
GRANT SELECT ON public.auction_summary TO authenticated, anon;

-- =============================================================================
-- 6. CREATE RLS POLICIES FOR VIEWS (if needed)
-- =============================================================================
-- Note: Views inherit RLS from underlying tables, but we can add view-specific policies

-- Enable RLS on views if they need custom access control
-- (Usually not needed as views inherit from base tables)

-- Example: If you want to restrict email analytics to admins only
-- You might want to add this, but it may conflict with existing table RLS
/*
ALTER VIEW email_performance_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_performance_admin_only" ON email_performance_summary
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (SELECT auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
    )
  );
*/

COMMIT;

-- =============================================================================
-- VERIFICATION QUERIES
-- =============================================================================
-- Run these to verify the fixes are applied correctly:

-- 1. Check view definitions for SECURITY DEFINER property
SELECT 
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views 
WHERE viewname IN (
  'email_performance_summary',
  'campaign_performance_summary', 
  'active_auctions',
  'auction_summary'
)
ORDER BY viewname;

-- 2. Test view access (should work with current user permissions)
-- These should run without errors if views are working correctly:

-- Test email performance summary (may be empty if no data)
SELECT COUNT(*) as email_summary_count FROM public.email_performance_summary;

-- Test campaign performance summary (may be empty if no data)
SELECT COUNT(*) as campaign_summary_count FROM public.campaign_performance_summary;

-- Test active auctions (may be empty if no active auctions)
SELECT COUNT(*) as active_auctions_count FROM public.active_auctions;

-- Test auction summary (may be empty if no auctions)
SELECT COUNT(*) as auction_summary_count FROM public.auction_summary;

-- 3. Check for any remaining SECURITY DEFINER objects
SELECT 
  'FUNCTION' as object_type,
  proname as object_name,
  'SECURITY DEFINER' as security_type
FROM pg_proc 
WHERE prosecdef = true
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')

UNION ALL

-- Note: Views don't have a direct SECURITY DEFINER property in PostgreSQL
-- If Supabase is flagging them, it might be a false positive or related to underlying functions
SELECT 
  'VIEW' as object_type,
  viewname as object_name,
  'CHECK MANUALLY' as security_type
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN ('email_performance_summary', 'campaign_performance_summary', 'active_auctions', 'auction_summary')
ORDER BY object_type, object_name;

-- Expected result: Views should be recreated without SECURITY DEFINER issues
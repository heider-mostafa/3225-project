-- Fix RLS Performance Issues: Community Management Tables
-- This migration optimizes RLS policies by wrapping auth function calls in subqueries
-- and consolidating multiple permissive policies to eliminate performance warnings.
-- Based on the actual table structure in sql-extension.sql

SET search_path = 'public';

-- ===============================================
-- 1. COMMUNITY DEVELOPERS - Fix performance and add admin access
-- ===============================================
DROP POLICY IF EXISTS "Developers can manage their own data" ON community_developers;
CREATE POLICY "Consolidated developers access" ON community_developers
  FOR ALL USING (
    contact_email = (select auth.jwt()) ->> 'email' OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('developer', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 2. COMPOUNDS - Consolidate policies and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Public read access to active compounds" ON compounds;
DROP POLICY IF EXISTS "Compound managers can manage their compounds" ON compounds;

CREATE POLICY "Consolidated compounds access" ON compounds
  FOR ALL USING (
    (is_active = true) OR
    (compound_manager_user_id = (select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 3. COMMUNITY UNITS - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Public read access to active units" ON community_units;
DROP POLICY IF EXISTS "Unit owners can manage their units" ON community_units;
DROP POLICY IF EXISTS "Tenants can view their units" ON community_units;
DROP POLICY IF EXISTS "Compound managers can manage units in their compounds" ON community_units;

CREATE POLICY "Consolidated community units access" ON community_units
  FOR ALL USING (
    (is_active = true) OR
    (owner_user_id = (select auth.uid())) OR
    (tenant_user_id = (select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM compounds c
      WHERE c.id = community_units.compound_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 4. COMPOUND RESIDENTS - Consolidate and fix performance 
-- Note: compound_residents has unit_id, not compound_id directly
-- ===============================================
DROP POLICY IF EXISTS "Residents can view their own data" ON compound_residents;
DROP POLICY IF EXISTS "Compound managers can manage residents" ON compound_residents;
DROP POLICY IF EXISTS "Admins can access all community data" ON compound_residents;

CREATE POLICY "Consolidated compound residents access" ON compound_residents
  FOR ALL USING (
    (user_id = (select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cu.id = compound_residents.unit_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 5. RESIDENT VEHICLES - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can manage their vehicles" ON resident_vehicles;
DROP POLICY IF EXISTS "Compound managers can view vehicles" ON resident_vehicles;

CREATE POLICY "Consolidated resident vehicles access" ON resident_vehicles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.id = resident_vehicles.resident_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cr.id = resident_vehicles.resident_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 6. COMPOUND AMENITIES - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Public read access to active amenities" ON compound_amenities;
DROP POLICY IF EXISTS "Compound managers can manage amenities" ON compound_amenities;

CREATE POLICY "Consolidated compound amenities access" ON compound_amenities
  FOR ALL USING (
    (is_active = true) OR
    EXISTS (
      SELECT 1 FROM compounds c
      WHERE c.id = compound_amenities.compound_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 7. AMENITY BOOKINGS - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can manage their bookings" ON amenity_bookings;
DROP POLICY IF EXISTS "Compound managers can view all bookings" ON amenity_bookings;

CREATE POLICY "Consolidated amenity bookings access" ON amenity_bookings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.id = amenity_bookings.resident_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM compound_amenities ca
      JOIN compounds c ON c.id = ca.compound_id
      WHERE ca.id = amenity_bookings.amenity_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 8. VISITOR PASSES - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can manage their visitor passes" ON visitor_passes;
DROP POLICY IF EXISTS "Security guards can view visitor passes" ON visitor_passes;
DROP POLICY IF EXISTS "Security guards can update visitor passes" ON visitor_passes;

CREATE POLICY "Consolidated visitor passes access" ON visitor_passes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.id = visitor_passes.resident_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('security_guard', 'compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 9. COMMUNITY FEES - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can view their fees" ON community_fees;
DROP POLICY IF EXISTS "Compound managers can manage fees" ON community_fees;

CREATE POLICY "Consolidated community fees access" ON community_fees
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compound_residents cr ON cr.unit_id = cu.id
      WHERE cu.id = community_fees.unit_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cu.id = community_fees.unit_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 10. COMMUNITY SERVICE REQUESTS - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can manage their service requests" ON community_service_requests;
DROP POLICY IF EXISTS "Compound managers can view service requests" ON community_service_requests;
DROP POLICY IF EXISTS "Compound managers can update service requests" ON community_service_requests;

CREATE POLICY "Consolidated community service requests access" ON community_service_requests
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.id = community_service_requests.resident_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM community_units cu
      JOIN compounds c ON c.id = cu.compound_id
      WHERE cu.id = community_service_requests.unit_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 11. COMMUNITY ANNOUNCEMENTS - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can view published announcements" ON community_announcements;
DROP POLICY IF EXISTS "Compound managers can manage announcements" ON community_announcements;

CREATE POLICY "Consolidated community announcements access" ON community_announcements
  FOR ALL USING (
    (
      is_published = true 
      AND is_active = true
      AND (publish_at <= NOW())
      AND (expires_at IS NULL OR expires_at > NOW())
      AND EXISTS (
        SELECT 1 FROM compound_residents cr
        JOIN community_units cu ON cu.id = cr.unit_id
        WHERE cu.compound_id = community_announcements.compound_id
        AND cr.user_id = (select auth.uid())
      )
    ) OR
    EXISTS (
      SELECT 1 FROM compounds c
      WHERE c.id = community_announcements.compound_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 12. COMMUNITY EVENTS - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can view published events" ON community_events;
DROP POLICY IF EXISTS "Event creators and managers can manage events" ON community_events;

CREATE POLICY "Consolidated community events access" ON community_events
  FOR ALL USING (
    (
      event_status = 'published'
      AND EXISTS (
        SELECT 1 FROM compound_residents cr
        JOIN community_units cu ON cu.id = cr.unit_id
        WHERE cu.compound_id = community_events.compound_id
        AND cr.user_id = (select auth.uid())
      )
    ) OR
    (created_by_user_id = (select auth.uid())) OR
    EXISTS (
      SELECT 1 FROM compounds c
      WHERE c.id = community_events.compound_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 13. EVENT REGISTRATIONS - Fix performance and add admin access
-- ===============================================
DROP POLICY IF EXISTS "Residents can manage their event registrations" ON event_registrations;

CREATE POLICY "Consolidated event registrations access" ON event_registrations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.id = event_registrations.resident_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 14. COMMUNITY MARKETPLACE - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can view marketplace items" ON community_marketplace;
DROP POLICY IF EXISTS "Residents can manage their own marketplace items" ON community_marketplace;

CREATE POLICY "Consolidated community marketplace access" ON community_marketplace
  FOR ALL USING (
    (
      is_available = true
      AND EXISTS (
        SELECT 1 FROM compound_residents cr
        JOIN community_units cu ON cu.id = cr.unit_id
        WHERE cu.compound_id = community_marketplace.compound_id
        AND cr.user_id = (select auth.uid())
      )
    ) OR
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.id = community_marketplace.seller_resident_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 15. SECURITY INCIDENTS - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can view security incidents" ON security_incidents;
DROP POLICY IF EXISTS "Residents can report security incidents" ON security_incidents;
DROP POLICY IF EXISTS "Security staff can manage incidents" ON security_incidents;

CREATE POLICY "Consolidated security incidents access" ON security_incidents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      JOIN community_units cu ON cu.id = cr.unit_id
      WHERE cu.compound_id = security_incidents.compound_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('security_guard', 'compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 16. COMMUNITY POLLS - Consolidate and fix performance
-- ===============================================
DROP POLICY IF EXISTS "Residents can view active polls" ON community_polls;
DROP POLICY IF EXISTS "Compound managers can manage polls" ON community_polls;

CREATE POLICY "Consolidated community polls access" ON community_polls
  FOR ALL USING (
    (
      poll_status = 'active'
      AND EXISTS (
        SELECT 1 FROM compound_residents cr
        JOIN community_units cu ON cu.id = cr.unit_id
        WHERE cu.compound_id = community_polls.compound_id
        AND cr.user_id = (select auth.uid())
      )
    ) OR
    EXISTS (
      SELECT 1 FROM compounds c
      WHERE c.id = community_polls.compound_id
      AND c.compound_manager_user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('compound_manager', 'admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 17. POLL RESPONSES - Fix performance and add admin access
-- ===============================================
DROP POLICY IF EXISTS "Residents can manage their poll responses" ON poll_responses;

CREATE POLICY "Consolidated poll responses access" ON poll_responses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.id = poll_responses.resident_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- 18. GUEST COMMUNITY ACCESS - Fix performance and add admin access
-- Note: guest_community_access has community_unit_id, not unit_id
-- ===============================================
DROP POLICY IF EXISTS "Unit residents can manage guest access" ON guest_community_access;

CREATE POLICY "Consolidated guest community access" ON guest_community_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM compound_residents cr
      WHERE cr.unit_id = guest_community_access.community_unit_id
      AND cr.user_id = (select auth.uid())
    ) OR
    EXISTS (
      SELECT 1 FROM user_roles ur
      WHERE ur.user_id = (select auth.uid())
      AND ur.role IN ('admin', 'super_admin')
      AND ur.is_active = true
      AND ur.revoked_at IS NULL
    )
  );

-- ===============================================
-- COMPLETION MESSAGE
-- ===============================================
DO $$
BEGIN
  RAISE NOTICE 'Community Management RLS Performance Optimization Completed Successfully';
  RAISE NOTICE 'All auth.uid() calls have been wrapped with (select auth.uid())';
  RAISE NOTICE 'Multiple permissive policies have been consolidated into single policies';
  RAISE NOTICE 'Admin and super_admin access has been added to all relevant tables';
  RAISE NOTICE 'Performance warnings should now be resolved';
END $$;
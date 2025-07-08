-- Fix contract table policies - remove duplicates and optimize auth functions

-- =============================================
-- CONTRACT_AI_REVIEWS - REMOVE DUPLICATE
-- =============================================

-- Remove the duplicate public policy
DROP POLICY IF EXISTS "Admin access to contract AI reviews" ON contract_ai_reviews;

-- =============================================
-- CHECK CURRENT POLICY DEFINITIONS TO SEE AUTH PATTERN
-- =============================================

-- First, let's see the actual policy definitions to understand the current auth pattern
SELECT 
    schemaname,
    tablename, 
    policyname,
    definition
FROM pg_policies 
WHERE tablename IN ('contract_templates', 'lead_contracts', 'contract_ai_reviews', 'contract_signatures', 'contract_notifications')
ORDER BY tablename, policyname;
-- Comprehensive Database State Check
-- Run this in Supabase SQL Editor before applying performance indexes migration

-- =====================================================
-- 1. CHECK EXISTING INDEXES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND (
        tablename IN ('properties', 'property_photos', 'property_appraisals', 'tour_sessions', 'broker_assignments', 'user_roles', 'admin_activity_log', 'viewings')
        OR indexname LIKE '%properties%'
        OR indexname LIKE '%property_photos%'
        OR indexname LIKE '%property_appraisals%'
        OR indexname LIKE '%tour_sessions%'
        OR indexname LIKE '%broker_assignments%'
    )
ORDER BY tablename, indexname;


| schemaname | tablename               | indexname                                          | indexdef                                                                                                                                                                                                                                        |
| ---------- | ----------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | admin_activity_log      | admin_activity_log_pkey                            | CREATE UNIQUE INDEX admin_activity_log_pkey ON public.admin_activity_log USING btree (id)                                                                                                                                                       |
| public     | admin_activity_log      | idx_admin_activity_log_action                      | CREATE INDEX idx_admin_activity_log_action ON public.admin_activity_log USING btree (action)                                                                                                                                                    |
| public     | admin_activity_log      | idx_admin_activity_log_admin_user_id               | CREATE INDEX idx_admin_activity_log_admin_user_id ON public.admin_activity_log USING btree (admin_user_id)                                                                                                                                      |
| public     | admin_activity_log      | idx_admin_activity_log_created_at                  | CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log USING btree (created_at)                                                                                                                                            |
| public     | auction_properties      | auction_properties_pkey                            | CREATE UNIQUE INDEX auction_properties_pkey ON public.auction_properties USING btree (id)                                                                                                                                                       |
| public     | auction_properties      | idx_auction_properties_end_time                    | CREATE INDEX idx_auction_properties_end_time ON public.auction_properties USING btree (end_time)                                                                                                                                                |
| public     | auction_properties      | idx_auction_properties_property_id                 | CREATE INDEX idx_auction_properties_property_id ON public.auction_properties USING btree (property_id)                                                                                                                                          |
| public     | auction_properties      | idx_auction_properties_start_time                  | CREATE INDEX idx_auction_properties_start_time ON public.auction_properties USING btree (start_time)                                                                                                                                            |
| public     | auction_properties      | idx_auction_properties_status                      | CREATE INDEX idx_auction_properties_status ON public.auction_properties USING btree (status)                                                                                                                                                    |
| public     | lead_broker_assignments | idx_lead_broker_assignments_broker_id              | CREATE INDEX idx_lead_broker_assignments_broker_id ON public.lead_broker_assignments USING btree (broker_id)                                                                                                                                    |
| public     | lead_broker_assignments | idx_lead_broker_assignments_lead_id                | CREATE INDEX idx_lead_broker_assignments_lead_id ON public.lead_broker_assignments USING btree (lead_id)                                                                                                                                        |
| public     | lead_broker_assignments | idx_lead_broker_assignments_status                 | CREATE INDEX idx_lead_broker_assignments_status ON public.lead_broker_assignments USING btree (status)                                                                                                                                          |
| public     | lead_broker_assignments | lead_broker_assignments_pkey                       | CREATE UNIQUE INDEX lead_broker_assignments_pkey ON public.lead_broker_assignments USING btree (id)                                                                                                                                             |
| public     | pending_properties      | idx_pending_properties_assignment_id               | CREATE INDEX idx_pending_properties_assignment_id ON public.pending_properties USING btree (assignment_id)                                                                                                                                      |
| public     | pending_properties      | idx_pending_properties_lead_id                     | CREATE INDEX idx_pending_properties_lead_id ON public.pending_properties USING btree (lead_id)                                                                                                                                                  |
| public     | pending_properties      | idx_pending_properties_photographer_id             | CREATE INDEX idx_pending_properties_photographer_id ON public.pending_properties USING btree (photographer_id)                                                                                                                                  |
| public     | pending_properties      | idx_pending_properties_status                      | CREATE INDEX idx_pending_properties_status ON public.pending_properties USING btree (status)                                                                                                                                                    |
| public     | pending_properties      | pending_properties_pkey                            | CREATE UNIQUE INDEX pending_properties_pkey ON public.pending_properties USING btree (id)                                                                                                                                                       |
| public     | pending_property_photos | idx_pending_property_photos_is_primary             | CREATE INDEX idx_pending_property_photos_is_primary ON public.pending_property_photos USING btree (is_primary)                                                                                                                                  |
| public     | pending_property_photos | idx_pending_property_photos_pending_property_id    | CREATE INDEX idx_pending_property_photos_pending_property_id ON public.pending_property_photos USING btree (pending_property_id)                                                                                                                |
| public     | pending_property_photos | pending_property_photos_pkey                       | CREATE UNIQUE INDEX pending_property_photos_pkey ON public.pending_property_photos USING btree (id)                                                                                                                                             |
| public     | properties              | idx_properties_amenities                           | CREATE INDEX idx_properties_amenities ON public.properties USING gin (amenities)                                                                                                                                                                |
| public     | properties              | idx_properties_annual_property_tax                 | CREATE INDEX idx_properties_annual_property_tax ON public.properties USING btree (annual_property_tax)                                                                                                                                          |
| public     | properties              | idx_properties_available_date                      | CREATE INDEX idx_properties_available_date ON public.properties USING btree (available_date)                                                                                                                                                    |
| public     | properties              | idx_properties_city                                | CREATE INDEX idx_properties_city ON public.properties USING btree (city)                                                                                                                                                                        |
| public     | properties              | idx_properties_created_at                          | CREATE INDEX idx_properties_created_at ON public.properties USING btree (created_at)                                                                                                                                                            |
| public     | properties              | idx_properties_features                            | CREATE INDEX idx_properties_features ON public.properties USING gin (features)                                                                                                                                                                  |
| public     | properties              | idx_properties_floor_level                         | CREATE INDEX idx_properties_floor_level ON public.properties USING btree (floor_level)                                                                                                                                                          |
| public     | properties              | idx_properties_latitude                            | CREATE INDEX idx_properties_latitude ON public.properties USING btree (latitude)                                                                                                                                                                |
| public     | properties              | idx_properties_longitude                           | CREATE INDEX idx_properties_longitude ON public.properties USING btree (longitude)                                                                                                                                                              |
| public     | properties              | idx_properties_lot_size                            | CREATE INDEX idx_properties_lot_size ON public.properties USING btree (lot_size)                                                                                                                                                                |
| public     | properties              | idx_properties_monthly_hoa_fee                     | CREATE INDEX idx_properties_monthly_hoa_fee ON public.properties USING btree (monthly_hoa_fee)                                                                                                                                                  |
| public     | properties              | idx_properties_neighborhood                        | CREATE INDEX idx_properties_neighborhood ON public.properties USING btree (neighborhood)                                                                                                                                                        |
| public     | properties              | idx_properties_parking_spaces                      | CREATE INDEX idx_properties_parking_spaces ON public.properties USING btree (parking_spaces)                                                                                                                                                    |
| public     | properties              | idx_properties_pet_policy                          | CREATE INDEX idx_properties_pet_policy ON public.properties USING btree (pet_policy)                                                                                                                                                            |
| public     | properties              | idx_properties_price                               | CREATE INDEX idx_properties_price ON public.properties USING btree (price)                                                                                                                                                                      |
| public     | properties              | idx_properties_property_condition                  | CREATE INDEX idx_properties_property_condition ON public.properties USING btree (property_condition)                                                                                                                                            |
| public     | properties              | idx_properties_property_type                       | CREATE INDEX idx_properties_property_type ON public.properties USING btree (property_type)                                                                                                                                                      |
| public     | properties              | idx_properties_realsee_tour_id                     | CREATE INDEX idx_properties_realsee_tour_id ON public.properties USING btree (realsee_tour_id)                                                                                                                                                  |
| public     | properties              | idx_properties_square_meters                       | CREATE INDEX idx_properties_square_meters ON public.properties USING btree (square_meters)                                                                                                                                                      |
| public     | properties              | idx_properties_state                               | CREATE INDEX idx_properties_state ON public.properties USING btree (state)                                                                                                                                                                      |
| public     | properties              | idx_properties_status                              | CREATE INDEX idx_properties_status ON public.properties USING btree (status)                                                                                                                                                                    |
| public     | properties              | idx_properties_year_built                          | CREATE INDEX idx_properties_year_built ON public.properties USING btree (year_built)                                                                                                                                                            |
| public     | properties              | properties_geo_point_idx                           | CREATE INDEX properties_geo_point_idx ON public.properties USING gist (geo_point)                                                                                                                                                               |
| public     | properties              | properties_location_idx                            | CREATE INDEX properties_location_idx ON public.properties USING btree (city, state)                                                                                                                                                             |
| public     | properties              | properties_pkey                                    | CREATE UNIQUE INDEX properties_pkey ON public.properties USING btree (id)                                                                                                                                                                       |
| public     | properties              | properties_search_idx                              | CREATE INDEX properties_search_idx ON public.properties USING gin (to_tsvector('english'::regconfig, ((((((((title || ' '::text) || COALESCE(description, ''::text)) || ' '::text) || address) || ' '::text) || city) || ' '::text) || state))) |
| public     | property_appraisals     | idx_property_appraisals_appraiser_id               | CREATE INDEX idx_property_appraisals_appraiser_id ON public.property_appraisals USING btree (appraiser_id)                                                                                                                                      |
| public     | property_appraisals     | idx_property_appraisals_client                     | CREATE INDEX idx_property_appraisals_client ON public.property_appraisals USING btree (client_name, status)                                                                                                                                     |
| public     | property_appraisals     | idx_property_appraisals_client_name                | CREATE INDEX idx_property_appraisals_client_name ON public.property_appraisals USING btree (client_name)                                                                                                                                        |
| public     | property_appraisals     | idx_property_appraisals_date                       | CREATE INDEX idx_property_appraisals_date ON public.property_appraisals USING btree (appraisal_date DESC)                                                                                                                                       |
| public     | property_appraisals     | idx_property_appraisals_property_id                | CREATE INDEX idx_property_appraisals_property_id ON public.property_appraisals USING btree (property_id)                                                                                                                                        |
| public     | property_appraisals     | idx_property_appraisals_reference_number           | CREATE INDEX idx_property_appraisals_reference_number ON public.property_appraisals USING btree (appraisal_reference_number)                                                                                                                    |
| public     | property_appraisals     | idx_property_appraisals_status                     | CREATE INDEX idx_property_appraisals_status ON public.property_appraisals USING btree (status)                                                                                                                                                  |
| public     | property_appraisals     | property_appraisals_appraisal_reference_number_key | CREATE UNIQUE INDEX property_appraisals_appraisal_reference_number_key ON public.property_appraisals USING btree (appraisal_reference_number)                                                                                                   |
| public     | property_appraisals     | property_appraisals_pkey                           | CREATE UNIQUE INDEX property_appraisals_pkey ON public.property_appraisals USING btree (id)                                                                                                                                                     |
| public     | property_photos         | idx_property_photos_appraisal_id                   | CREATE INDEX idx_property_photos_appraisal_id ON public.property_photos USING btree (appraisal_id)                                                                                                                                              |
| public     | property_photos         | idx_property_photos_category                       | CREATE INDEX idx_property_photos_category ON public.property_photos USING btree (category)                                                                                                                                                      |
| public     | property_photos         | idx_property_photos_order_index                    | CREATE INDEX idx_property_photos_order_index ON public.property_photos USING btree (order_index)                                                                                                                                                |
| public     | property_photos         | idx_property_photos_property_id                    | CREATE INDEX idx_property_photos_property_id ON public.property_photos USING btree (property_id)                                                                                                                                                |
| public     | property_photos         | idx_property_photos_source                         | CREATE INDEX idx_property_photos_source ON public.property_photos USING btree (source)                                                                                                                                                          |
| public     | property_photos         | property_photos_pkey                               | CREATE UNIQUE INDEX property_photos_pkey ON public.property_photos USING btree (id)                                                                                                                                                             |
| public     | saved_properties        | idx_saved_properties_interest_score                | CREATE INDEX idx_saved_properties_interest_score ON public.saved_properties USING btree (interest_score)                                                                                                                                        |
| public     | saved_properties        | idx_saved_properties_meta_event_sent               | CREATE INDEX idx_saved_properties_meta_event_sent ON public.saved_properties USING btree (meta_event_sent)                                                                                                                                      |
| public     | saved_properties        | idx_saved_properties_property_id                   | CREATE INDEX idx_saved_properties_property_id ON public.saved_properties USING btree (property_id)                                                                                                                                              |
| public     | saved_properties        | idx_saved_properties_user_created                  | CREATE INDEX idx_saved_properties_user_created ON public.saved_properties USING btree (user_id, created_at DESC)                                                                                                                                |
| public     | saved_properties        | idx_saved_properties_user_id                       | CREATE INDEX idx_saved_properties_user_id ON public.saved_properties USING btree (user_id)                                                                                                                                                      |
| public     | saved_properties        | saved_properties_pkey                              | CREATE UNIQUE INDEX saved_properties_pkey ON public.saved_properties USING btree (id)                                                                                                                                                           |
| public     | saved_properties        | saved_properties_user_id_property_id_key           | CREATE UNIQUE INDEX saved_properties_user_id_property_id_key ON public.saved_properties USING btree (user_id, property_id)                                                                                                                      |
| public     | tour_sessions           | idx_tour_sessions_engagement_score                 | CREATE INDEX idx_tour_sessions_engagement_score ON public.tour_sessions USING btree (engagement_score)                                                                                                                                          |
| public     | tour_sessions           | idx_tour_sessions_facebook_click_id                | CREATE INDEX idx_tour_sessions_facebook_click_id ON public.tour_sessions USING btree (facebook_click_id)                                                                                                                                        |
| public     | tour_sessions           | idx_tour_sessions_meta_event_sent                  | CREATE INDEX idx_tour_sessions_meta_event_sent ON public.tour_sessions USING btree (meta_event_sent)                                                                                                                                            |
| public     | tour_sessions           | idx_tour_sessions_property_id                      | CREATE INDEX idx_tour_sessions_property_id ON public.tour_sessions USING btree (property_id)                                                                                                                                                    |
| public     | tour_sessions           | idx_tour_sessions_session_id                       | CREATE INDEX idx_tour_sessions_session_id ON public.tour_sessions USING btree (session_id)                                                                                                                                                      |
| public     | tour_sessions           | idx_tour_sessions_user_id                          | CREATE INDEX idx_tour_sessions_user_id ON public.tour_sessions USING btree (user_id)                                                                                                                                                            |
| public     | tour_sessions           | idx_tour_sessions_utm_source                       | CREATE INDEX idx_tour_sessions_utm_source ON public.tour_sessions USING btree (utm_source)                                                                                                                                                      |
| public     | tour_sessions           | tour_sessions_pkey                                 | CREATE UNIQUE INDEX tour_sessions_pkey ON public.tour_sessions USING btree (id)                                                                                                                                                                 |
| public     | tour_sessions           | tour_sessions_session_id_key                       | CREATE UNIQUE INDEX tour_sessions_session_id_key ON public.tour_sessions USING btree (session_id)                                                                                                                                               |
| public     | user_roles              | idx_user_roles_active                              | CREATE INDEX idx_user_roles_active ON public.user_roles USING btree (is_active)                                                                                                                                                                 |
| public     | user_roles              | idx_user_roles_role                                | CREATE INDEX idx_user_roles_role ON public.user_roles USING btree (role)                                                                                                                                                                        |
| public     | user_roles              | idx_user_roles_unique_active                       | CREATE UNIQUE INDEX idx_user_roles_unique_active ON public.user_roles USING btree (user_id, role) WHERE (is_active = true)                                                                                                                      |
| public     | user_roles              | idx_user_roles_user_id                             | CREATE INDEX idx_user_roles_user_id ON public.user_roles USING btree (user_id)                                                                                                                                                                  |
| public     | user_roles              | idx_user_roles_user_id_active                      | CREATE INDEX idx_user_roles_user_id_active ON public.user_roles USING btree (user_id, is_active) WHERE (is_active = true)                                                                                                                       |
| public     | user_roles              | user_roles_pkey                                    | CREATE UNIQUE INDEX user_roles_pkey ON public.user_roles USING btree (id)                                                                                                                                                                       |

-- =====================================================
-- 2. CHECK EXISTING RLS POLICIES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
    AND tablename IN ('properties', 'property_photos', 'property_appraisals', 'tour_sessions', 'broker_assignments', 'user_roles', 'admin_activity_log', 'viewings')
ORDER BY tablename, policyname;


| schemaname | tablename           | policyname                            | permissive | roles    | cmd    | qual                                                                                                                                                                                                                                                                                                                                                                                              | with_check                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ---------- | ------------------- | ------------------------------------- | ---------- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| public     | admin_activity_log  | admin_activity_log_system_insert      | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                                              | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | properties          | properties_delete_optimized           | PERMISSIVE | {public} | DELETE | (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true))))                                                                                                                                                                                               | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | properties          | properties_insert_optimized           | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                                              | (( SELECT auth.uid() AS uid) IS NOT NULL)                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| public     | properties          | properties_select_optimized           | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | properties          | properties_update_optimized           | PERMISSIVE | {public} | UPDATE | (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true))))                                                                                                                                                                                               | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | property_appraisals | Access to property appraisals         | PERMISSIVE | {public} | ALL    | ((( SELECT auth.uid() AS uid) IS NOT NULL) AND ((appraiser_id IN ( SELECT brokers.id
   FROM brokers
  WHERE (brokers.user_id = ( SELECT auth.uid() AS uid)))) OR (appraiser_id IS NULL) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true)))))) | ((( SELECT auth.uid() AS uid) IS NOT NULL) AND ((appraiser_id IN ( SELECT brokers.id
   FROM brokers
  WHERE (brokers.user_id = ( SELECT auth.uid() AS uid)))) OR (appraiser_id IS NULL) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true))))))                                                                                    |
| public     | property_photos     | Single property photos policy         | PERMISSIVE | {public} | ALL    | true                                                                                                                                                                                                                                                                                                                                                                                              | (( SELECT auth.uid() AS uid) IN ( SELECT ur.user_id
   FROM user_roles ur
  WHERE ((ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true))
UNION ALL
 SELECT b.user_id
   FROM (property_appraisals pa
     JOIN brokers b ON ((pa.appraiser_id = b.id)))
  WHERE ((pa.id = property_photos.appraisal_id) AND ((property_photos.source)::text = 'appraisal_extracted'::text) AND (( SELECT auth.role() AS role) = 'authenticated'::text)))) |
| public     | tour_sessions       | Allow tour session updates            | PERMISSIVE | {public} | UPDATE | ((auth.role() = 'service_role'::text) OR (auth.uid() = user_id) OR (user_id IS NULL))                                                                                                                                                                                                                                                                                                             | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | tour_sessions       | Public insert access to tour sessions | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                                              | true                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | tour_sessions       | Public read access to tour sessions   | PERMISSIVE | {public} | SELECT | true                                                                                                                                                                                                                                                                                                                                                                                              | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | user_roles          | user_roles_delete_admin_safe          | PERMISSIVE | {public} | DELETE | ((( SELECT current_setting('role'::text) AS current_setting) = 'service_role'::text) OR (( SELECT auth.uid() AS uid) IN ( SELECT DISTINCT ur.user_id
   FROM user_roles ur
  WHERE ((ur.role = 'super_admin'::user_role) AND (ur.is_active = true))
 LIMIT 1)))                                                                                                                                   | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | user_roles          | user_roles_insert_admin               | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                                                                                                                              | ((( SELECT current_setting('role'::text) AS current_setting) = 'service_role'::text) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = 'super_admin'::user_role) AND (ur.is_active = true)))))                                                                                                                                                                                                                          |
| public     | user_roles          | user_roles_select_for_auth            | PERMISSIVE | {public} | SELECT | ((( SELECT current_setting('role'::text) AS current_setting) = 'service_role'::text) OR (user_id = ( SELECT auth.uid() AS uid)) OR true)                                                                                                                                                                                                                                                          | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| public     | user_roles          | user_roles_update_admin_safe          | PERMISSIVE | {public} | UPDATE | ((( SELECT current_setting('role'::text) AS current_setting) = 'service_role'::text) OR (( SELECT auth.uid() AS uid) IN ( SELECT DISTINCT ur.user_id
   FROM user_roles ur
  WHERE ((ur.role = 'super_admin'::user_role) AND (ur.is_active = true))
 LIMIT 1)))                                                                                                                                   | null                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |

-- =====================================================
-- 3. CHECK EXISTING FUNCTIONS
-- =====================================================
SELECT 
    routine_name,
    routine_type,
    data_type AS return_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_schema = 'public' 
    AND (
        routine_name LIKE '%property%' 
        OR routine_name LIKE '%tour%'
        OR routine_name = 'get_property_statistics'
    )
ORDER BY routine_name;

| routine_name                    | routine_type | return_type | routine_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------- | ------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| calculate_tour_engagement_score | FUNCTION     | integer     | 
  DECLARE
      score INTEGER := 0;
      rooms_count INTEGER;
      actions_count INTEGER;
  BEGIN
      rooms_count := COALESCE(jsonb_array_length(rooms_visited), 0);
      actions_count := COALESCE(jsonb_array_length(actions_taken), 0);

      IF duration_seconds >= 600 THEN score := score + 30;
      ELSIF duration_seconds >= 300 THEN score := score + 20;
      ELSIF duration_seconds >= 120 THEN score := score + 10;
      END IF;

      IF rooms_count >= 8 THEN score := score + 25;
      ELSIF rooms_count >= 5 THEN score := score + 15;
      ELSIF rooms_count >= 3 THEN score := score + 8;
      END IF;

      IF actions_count >= 15 THEN score := score + 25;
      ELSIF actions_count >= 8 THEN score := score + 15;
      ELSIF actions_count >= 3 THEN score := score + 8;
      END IF;

      IF completed THEN score := score + 20; END IF;

      RETURN LEAST(score, 100);
  END;
   |
| complete_tour_session           | FUNCTION     | void        | 
BEGIN
  UPDATE tour_sessions
  SET 
    ended_at = TIMEZONE('utc'::text, NOW()),
    completed = TRUE,
    total_duration_seconds = EXTRACT(EPOCH FROM (TIMEZONE('utc'::text, NOW()) - started_at))::INTEGER
  WHERE session_id = session_id_param;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| increment_property_views        | FUNCTION     | void        | 
BEGIN
  UPDATE properties
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE id = property_id;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| update_property_search_fields   | FUNCTION     | trigger     | 
BEGIN
  IF NEW.features IS NOT NULL THEN
    NEW.features_search = NEW.features;
  END IF;
  
  IF NEW.amenities IS NOT NULL THEN
    NEW.amenities_search = NEW.amenities;
  END IF;
  
  RETURN NEW;
END;
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| update_tour_engagement_score    | FUNCTION     | trigger     | 
  BEGIN
      -- Calculate engagement score when tour is completed
      IF NEW.completed = TRUE AND (OLD.completed IS NULL OR OLD.completed = FALSE) THEN
          NEW.engagement_score := calculate_tour_engagement_score(
              NEW.total_duration_seconds,
              NEW.rooms_visited,
              NEW.actions_taken,
              NEW.completed
          );

          -- Calculate lead quality score based on engagement
          NEW.lead_quality_score := CASE
              WHEN NEW.engagement_score >= 80 THEN 55 -- High engagement = high lead quality
              WHEN NEW.engagement_score >= 60 THEN 40 -- Medium engagement = medium lead quality
              WHEN NEW.engagement_score >= 30 THEN 25 -- Low engagement = low lead quality
              ELSE 10 -- Very low engagement = minimal lead quality
          END;
      END IF;

      RETURN NEW;
  END;
               |

-- =====================================================
-- 4. CHECK EXISTING VIEWS
-- =====================================================
SELECT 
    table_name,
    view_definition
FROM information_schema.views 
WHERE table_schema = 'public' 
    AND (
        table_name LIKE '%property%' 
        OR table_name LIKE '%performance%'
        OR table_name = 'admin_performance_metrics'
    )
ORDER BY table_name;

| table_name                   | view_definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| ---------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| campaign_performance_summary |  SELECT c.id,
    c.name,
    c.property_id,
    p.title AS property_title,
    c.status,
    c.created_at,
    count(DISTINCT sp.id) AS total_posts,
    count(
        CASE
            WHEN (sp.status = 'published'::text) THEN 1
            ELSE NULL::integer
        END) AS published_posts,
    count(
        CASE
            WHEN (sp.status = 'failed'::text) THEN 1
            ELSE NULL::integer
        END) AS failed_posts,
    COALESCE(sum(sp.likes_count), (0)::bigint) AS total_likes,
    COALESCE(sum(sp.comments_count), (0)::bigint) AS total_comments,
    COALESCE(sum(sp.shares_count), (0)::bigint) AS total_shares,
    COALESCE(sum(sp.reach_count), (0)::bigint) AS total_reach,
    COALESCE(sum(sp.clicks_count), (0)::bigint) AS total_clicks,
        CASE
            WHEN (count(
            CASE
                WHEN (sp.status = 'published'::text) THEN 1
                ELSE NULL::integer
            END) > 0) THEN round(((((COALESCE(sum(sp.likes_count), (0)::bigint) + COALESCE(sum(sp.comments_count), (0)::bigint)) + COALESCE(sum(sp.shares_count), (0)::bigint)))::numeric / (count(
            CASE
                WHEN (sp.status = 'published'::text) THEN 1
                ELSE NULL::integer
            END))::numeric), 2)
            ELSE (0)::numeric
        END AS avg_engagement_per_post
   FROM ((social_media_campaigns c
     LEFT JOIN properties p ON ((c.property_id = p.id)))
     LEFT JOIN social_media_posts sp ON ((c.id = sp.campaign_id)))
  GROUP BY c.id, c.name, c.property_id, p.title, c.status, c.created_at;                                   |
| email_performance_summary    |  SELECT date(email_analytics."timestamp") AS date,
    count(*) FILTER (WHERE (email_analytics.event_type = 'email_sent'::text)) AS emails_sent,
    count(*) FILTER (WHERE (email_analytics.event_type = 'email_delivered'::text)) AS emails_delivered,
    count(*) FILTER (WHERE (email_analytics.event_type = 'email_opened'::text)) AS emails_opened,
    count(*) FILTER (WHERE (email_analytics.event_type = 'email_clicked'::text)) AS emails_clicked,
    count(*) FILTER (WHERE (email_analytics.event_type = 'email_bounced'::text)) AS emails_bounced,
    count(*) FILTER (WHERE (email_analytics.event_type = 'email_unsubscribed'::text)) AS emails_unsubscribed,
    round((((count(*) FILTER (WHERE (email_analytics.event_type = 'em
  ail_delivered'::text)))::numeric / (NULLIF(count(*) FILTER (WHERE (email_analytics.event_type = 'email_sent'::text)), 0))::numeric) * (100)::numeric), 2) AS delivery_rate,
    round((((count(*) FILTER (WHERE (email_analytics.event_type = 'email_opened'::text)))::numeric / (NULLIF(count(*) FILTER (WHERE (email_analytics.event_type = 'email_delivered'::text)), 0))::numeric) * (100)::numeric), 2) AS open_rate,
    round((((count(*) FILTER (WHERE (email_analytics.event_type = 'email_clicked'::text)))::numeric / (NULLIF(count(*) FILTER (WHERE (email_analytics.event_type = 'email_delivered'::text)), 0))::numeric) * (100)::numeric), 2) AS click_rate
   FROM email_analytics
  WHERE (email_analytics."timestamp" >= (CURRENT_DATE - '30 days'::interval))
  GROUP BY (date(email_analytics."timestamp"))
  ORDER BY (date(email_analytics."timestamp")) DESC; |

-- =====================================================
-- 5. CHECK TABLE STRUCTURES AND CONSTRAINTS
-- =====================================================
-- Properties table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'properties'
ORDER BY ordinal_position;

| column_name                   | data_type                | is_nullable | column_default               | character_maximum_length |
| ----------------------------- | ------------------------ | ----------- | ---------------------------- | ------------------------ |
| id                            | uuid                     | NO          | uuid_generate_v4()           | null                     |
| title                         | text                     | NO          | null                         | null                     |
| description                   | text                     | YES         | null                         | null                     |
| price                         | numeric                  | NO          | null                         | null                     |
| bedrooms                      | integer                  | YES         | null                         | null                     |
| bathrooms                     | integer                  | YES         | null                         | null                     |
| address                       | text                     | NO          | null                         | null                     |
| city                          | text                     | NO          | null                         | null                     |
| state                         | text                     | NO          | null                         | null                     |
| zip_code                      | text                     | NO          | null                         | null                     |
| property_type                 | text                     | NO          | null                         | null                     |
| status                        | text                     | NO          | null                         | null                     |
| year_built                    | integer                  | YES         | null                         | null                     |
| view_count                    | integer                  | YES         | 0                            | null                     |
| created_at                    | timestamp with time zone | YES         | timezone('utc'::text, now()) | null                     |
| updated_at                    | timestamp with time zone | YES         | timezone('utc'::text, now()) | null                     |
| realsee_tour_id               | text                     | YES         | null                         | null                     |
| realsee_model_url             | text                     | YES         | null                         | null                     |
| realsee_floor_plan_url        | text                     | YES         | null                         | null                     |
| realsee_images                | jsonb                    | YES         | null                         | null                     |
| features                      | jsonb                    | YES         | null                         | null                     |
| compound                      | text                     | YES         | null                         | null                     |
| nearest_schools               | jsonb                    | YES         | null                         | null                     |
| amenities                     | jsonb                    | YES         | null                         | null                     |
| distance_to_metro             | numeric                  | YES         | null                         | null                     |
| distance_to_airport           | numeric                  | YES         | null                         | null                     |
| distance_to_mall              | numeric                  | YES         | null                         | null                     |
| distance_to_hospital          | numeric                  | YES         | null                         | null                     |
| furnished                     | boolean                  | YES         | false                        | null                     |
| has_pool                      | boolean                  | YES         | false                        | null                     |
| has_garden                    | boolean                  | YES         | false                        | null                     |
| has_security                  | boolean                  | YES         | false                        | null                     |
| has_parking                   | boolean                  | YES         | false                        | null                     |
| has_gym                       | boolean                  | YES         | false                        | null                     |
| has_playground                | boolean                  | YES         | false                        | null                     |
| has_community_center          | boolean                  | YES         | false                        | null                     |
| latitude                      | numeric                  | YES         | null                         | null                     |
| longitude                     | numeric                  | YES         | null                         | null                     |
| geo_point                     | USER-DEFINED             | YES         | null                         | null                     |
| features_search               | jsonb                    | YES         | '[]'::jsonb                  | null                     |
| amenities_search              | jsonb                    | YES         | '[]'::jsonb                  | null                     |
| lot_size                      | numeric                  | YES         | null                         | null                     |
| neighborhood                  | text                     | YES         | null                         | null                     |
| property_condition            | text                     | YES         | 'good'::text                 | null                     |
| heating_type                  | text                     | YES         | null                         | null                     |
| cooling_type                  | text                     | YES         | null                         | null                     |
| water_source                  | text                     | YES         | null                         | null                     |
| sewer_type                    | text                     | YES         | null                         | null                     |
| internet_speed                | text                     | YES         | null                         | null                     |
| monthly_hoa_fee               | numeric                  | YES         | 0                            | null                     |
| annual_property_tax           | numeric                  | YES         | 0                            | null                     |
| insurance_cost                | numeric                  | YES         | 0                            | null                     |
| floor_level                   | integer                  | YES         | null                         | null                     |
| total_floors                  | integer                  | YES         | null                         | null                     |
| balconies                     | integer                  | YES         | 0                            | null                     |
| parking_spaces                | integer                  | YES         | 0                            | null                     |
| available_date                | date                     | YES         | null                         | null                     |
| lease_terms                   | ARRAY                    | YES         | null                         | null                     |
| pet_policy                    | text                     | YES         | 'not_allowed'::text          | null                     |
| virtual_tour_url              | text                     | YES         | null                         | null                     |
| video_tour_url                | text                     | YES         | null                         | null                     |
| key_features                  | ARRAY                    | YES         | null                         | null                     |
| recent_updates                | jsonb                    | YES         | null                         | null                     |
| marketing_headline            | text                     | YES         | null                         | null                     |
| internal_notes                | text                     | YES         | null                         | null                     |
| seo_title                     | text                     | YES         | null                         | null                     |
| seo_description               | text                     | YES         | null                         | null                     |
| has_elevator                  | boolean                  | YES         | false                        | null                     |
| has_balcony                   | boolean                  | YES         | false                        | null                     |
| has_terrace                   | boolean                  | YES         | false                        | null                     |
| has_storage                   | boolean                  | YES         | false                        | null                     |
| has_maid_room                 | boolean                  | YES         | false                        | null                     |
| has_driver_room               | boolean                  | YES         | false                        | null                     |
| square_meters                 | integer                  | YES         | null                         | null                     |
| walkability_score             | integer                  | YES         | null                         | null                     |
| transit_score                 | integer                  | YES         | null                         | null                     |
| bike_score                    | integer                  | YES         | null                         | null                     |
| nearby_amenities              | jsonb                    | YES         | '{}'::jsonb                  | null                     |
| metro_travel_time_peak        | integer                  | YES         | null                         | null                     |
| metro_travel_time_off_peak    | integer                  | YES         | null                         | null                     |
| airport_travel_time_peak      | integer                  | YES         | null                         | null                     |
| airport_travel_time_off_peak  | integer                  | YES         | null                         | null                     |
| mall_travel_time_peak         | integer                  | YES         | null                         | null                     |
| mall_travel_time_off_peak     | integer                  | YES         | null                         | null                     |
| hospital_travel_time_peak     | integer                  | YES         | null                         | null                     |
| hospital_travel_time_off_peak | integer                  | YES         | null                         | null                     |
-- Property photos table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'property_photos'
ORDER BY ordinal_position;


| column_name                 | data_type                | is_nullable | column_default               |
| --------------------------- | ------------------------ | ----------- | ---------------------------- |
| id                          | uuid                     | NO          | uuid_generate_v4()           |
| property_id                 | uuid                     | YES         | null                         |
| url                         | text                     | NO          | null                         |
| is_primary                  | boolean                  | YES         | false                        |
| order_index                 | integer                  | YES         | null                         |
| created_at                  | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| filename                    | text                     | YES         | null                         |
| file_size                   | bigint                   | YES         | null                         |
| mime_type                   | text                     | YES         | null                         |
| category                    | text                     | YES         | 'general'::text              |
| storage_path                | text                     | YES         | null                         |
| thumbnail_url               | text                     | YES         | null                         |
| alt_text                    | text                     | YES         | null                         |
| caption                     | text                     | YES         | null                         |
| is_virtually_staged         | boolean                  | YES         | false                        |
| original_image_id           | uuid                     | YES         | null                         |
| staging_request_id          | text                     | YES         | null                         |
| staging_design              | text                     | YES         | null                         |
| staging_room_type           | text                     | YES         | null                         |
| staging_transformation_type | text                     | YES         | null                         |
| staging_status              | text                     | YES         | 'pending'::text              |
| staging_settings            | jsonb                    | YES         | null                         |
| source                      | character varying        | YES         | null                         |
| appraisal_id                | uuid                     | YES         | null                         |
| document_page               | integer                  | YES         | null                         |
| original_category           | text                     | YES         | null                         |
| extraction_metadata         | jsonb                    | YES         | '{}'::jsonb                  |
-- Property appraisals table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'property_appraisals'
ORDER BY ordinal_position;

| column_name                       | data_type                | is_nullable | column_default                                                                                                                                                                                                                                                                                                                                    |
| --------------------------------- | ------------------------ | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| id                                | uuid                     | NO          | gen_random_uuid()                                                                                                                                                                                                                                                                                                                                 |
| property_id                       | uuid                     | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| appraiser_id                      | uuid                     | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| form_data                         | jsonb                    | NO          | null                                                                                                                                                                                                                                                                                                                                              |
| status                            | character varying        | YES         | 'draft'::character varying                                                                                                                                                                                                                                                                                                                        |
| reports_generated                 | jsonb                    | YES         | '{}'::jsonb                                                                                                                                                                                                                                                                                                                                       |
| created_at                        | timestamp with time zone | YES         | now()                                                                                                                                                                                                                                                                                                                                             |
| appraisal_reference_number        | character varying        | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| client_name                       | text                     | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| appraisal_date                    | date                     | YES         | CURRENT_DATE                                                                                                                                                                                                                                                                                                                                      |
| market_value_estimate             | numeric                  | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| confidence_level                  | numeric                  | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| calculation_results               | jsonb                    | YES         | '{}'::jsonb                                                                                                                                                                                                                                                                                                                                       |
| appraiser_certification_statement | text                     | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| legal_assumptions_confirmed       | boolean                  | YES         | true                                                                                                                                                                                                                                                                                                                                              |
| egyptian_legal_standards          | jsonb                    | YES         | '{"fra_resolution_date": "2015-04-19", "fra_resolution_year": "2015", "standards_compliance": true, "fra_resolution_number": "39", "highest_best_use_applied": true, "ownership_disputes_confirmed": false, "physical_inspection_completed": true, "market_value_definition_confirmed": true, "professional_independence_declared": true}'::jsonb |
| meta_event_sent                   | boolean                  | YES         | false                                                                                                                                                                                                                                                                                                                                             |
| meta_event_id                     | text                     | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| facebook_click_id                 | text                     | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| facebook_browser_id               | text                     | YES         | null                                                                                                                                                                                                                                                                                                                                              |
| appraisal_value_impact            | numeric                  | YES         | null                                                                                                                                                                                                                                                                                                                                              |

-- Tour sessions table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'tour_sessions'
ORDER BY ordinal_position;

| column_name            | data_type                | is_nullable | column_default               |
| ---------------------- | ------------------------ | ----------- | ---------------------------- |
| id                     | uuid                     | NO          | uuid_generate_v4()           |
| property_id            | uuid                     | YES         | null                         |
| user_id                | uuid                     | YES         | null                         |
| session_id             | text                     | NO          | null                         |
| tour_type              | text                     | NO          | 'virtual_3d'::text           |
| started_at             | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| ended_at               | timestamp with time zone | YES         | null                         |
| total_duration_seconds | integer                  | YES         | null                         |
| rooms_visited          | jsonb                    | YES         | null                         |
| actions_taken          | jsonb                    | YES         | null                         |
| user_agent             | text                     | YES         | null                         |
| ip_address             | text                     | YES         | null                         |
| completed              | boolean                  | YES         | false                        |
| engagement_score       | integer                  | YES         | 0                            |
| lead_quality           | character varying        | YES         | 'cold'::character varying    |
| meta_events_sent       | jsonb                    | YES         | '[]'::jsonb                  |
| meta_event_sent        | boolean                  | YES         | false                        |
| meta_event_id          | text                     | YES         | null                         |
| lead_quality_score     | integer                  | YES         | 0                            |
| facebook_click_id      | text                     | YES         | null                         |
| facebook_browser_id    | text                     | YES         | null                         |
| utm_source             | text                     | YES         | null                         |
| utm_medium             | text                     | YES         | null                         |
| utm_campaign           | text                     | YES         | null                         |
| utm_content            | text                     | YES         | null                         |
| utm_term               | text                     | YES         | null                         |

-- User roles table structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
ORDER BY ordinal_position;

| column_name | data_type                | is_nullable | column_default               |
| ----------- | ------------------------ | ----------- | ---------------------------- |
| id          | uuid                     | NO          | uuid_generate_v4()           |
| user_id     | uuid                     | YES         | null                         |
| role        | USER-DEFINED             | NO          | 'user'::user_role            |
| granted_by  | uuid                     | YES         | null                         |
| granted_at  | timestamp with time zone | YES         | timezone('utc'::text, now()) |
| revoked_at  | timestamp with time zone | YES         | null                         |
| is_active   | boolean                  | YES         | true                         |
| created_at  | timestamp with time zone | YES         | now()                        |

-- =====================================================
-- 6. CHECK RLS STATUS FOR TABLES
-- =====================================================
SELECT 
    schemaname,
    tablename,
    rowsecurity AS rls_enabled,
    hasoids
FROM pg_tables 
WHERE schemaname = 'public' 
    AND tablename IN ('properties', 'property_photos', 'property_appraisals', 'tour_sessions', 'broker_assignments', 'user_roles', 'admin_activity_log', 'viewings')
ORDER BY tablename;

ERROR:  42703: column "hasoids" does not exist
LINE 5:     hasoids
            ^
Note: A limit of 100 was applied to your query. If this was the cause of a syntax error, try selecting "No limit" instead and re-run the query.
-- =====================================================
-- 7. CHECK EXISTING GRANTS AND PERMISSIONS
-- =====================================================
SELECT 
    table_schema,
    table_name,
    privilege_type,
    grantee,
    is_grantable
FROM information_schema.table_privileges 
WHERE table_schema = 'public' 
    AND table_name IN ('properties', 'property_photos', 'property_appraisals', 'tour_sessions', 'broker_assignments', 'user_roles', 'admin_activity_log', 'viewings')
    AND grantee IN ('authenticated', 'anon', 'service_role')
ORDER BY table_name, grantee, privilege_type;

| table_schema | table_name          | privilege_type | grantee       | is_grantable |
| ------------ | ------------------- | -------------- | ------------- | ------------ |
| public       | admin_activity_log  | DELETE         | anon          | NO           |
| public       | admin_activity_log  | INSERT         | anon          | NO           |
| public       | admin_activity_log  | REFERENCES     | anon          | NO           |
| public       | admin_activity_log  | SELECT         | anon          | NO           |
| public       | admin_activity_log  | TRIGGER        | anon          | NO           |
| public       | admin_activity_log  | TRUNCATE       | anon          | NO           |
| public       | admin_activity_log  | UPDATE         | anon          | NO           |
| public       | admin_activity_log  | DELETE         | authenticated | NO           |
| public       | admin_activity_log  | INSERT         | authenticated | NO           |
| public       | admin_activity_log  | REFERENCES     | authenticated | NO           |
| public       | admin_activity_log  | SELECT         | authenticated | NO           |
| public       | admin_activity_log  | TRIGGER        | authenticated | NO           |
| public       | admin_activity_log  | TRUNCATE       | authenticated | NO           |
| public       | admin_activity_log  | UPDATE         | authenticated | NO           |
| public       | admin_activity_log  | DELETE         | service_role  | NO           |
| public       | admin_activity_log  | INSERT         | service_role  | NO           |
| public       | admin_activity_log  | REFERENCES     | service_role  | NO           |
| public       | admin_activity_log  | SELECT         | service_role  | NO           |
| public       | admin_activity_log  | TRIGGER        | service_role  | NO           |
| public       | admin_activity_log  | TRUNCATE       | service_role  | NO           |
| public       | admin_activity_log  | UPDATE         | service_role  | NO           |
| public       | properties          | DELETE         | anon          | NO           |
| public       | properties          | INSERT         | anon          | NO           |
| public       | properties          | REFERENCES     | anon          | NO           |
| public       | properties          | SELECT         | anon          | NO           |
| public       | properties          | TRIGGER        | anon          | NO           |
| public       | properties          | TRUNCATE       | anon          | NO           |
| public       | properties          | UPDATE         | anon          | NO           |
| public       | properties          | DELETE         | authenticated | NO           |
| public       | properties          | INSERT         | authenticated | NO           |
| public       | properties          | REFERENCES     | authenticated | NO           |
| public       | properties          | SELECT         | authenticated | NO           |
| public       | properties          | TRIGGER        | authenticated | NO           |
| public       | properties          | TRUNCATE       | authenticated | NO           |
| public       | properties          | UPDATE         | authenticated | NO           |
| public       | properties          | DELETE         | service_role  | NO           |
| public       | properties          | INSERT         | service_role  | NO           |
| public       | properties          | REFERENCES     | service_role  | NO           |
| public       | properties          | SELECT         | service_role  | NO           |
| public       | properties          | TRIGGER        | service_role  | NO           |
| public       | properties          | TRUNCATE       | service_role  | NO           |
| public       | properties          | UPDATE         | service_role  | NO           |
| public       | property_appraisals | DELETE         | anon          | NO           |
| public       | property_appraisals | INSERT         | anon          | NO           |
| public       | property_appraisals | REFERENCES     | anon          | NO           |
| public       | property_appraisals | SELECT         | anon          | NO           |
| public       | property_appraisals | TRIGGER        | anon          | NO           |
| public       | property_appraisals | TRUNCATE       | anon          | NO           |
| public       | property_appraisals | UPDATE         | anon          | NO           |
| public       | property_appraisals | DELETE         | authenticated | NO           |
| public       | property_appraisals | INSERT         | authenticated | NO           |
| public       | property_appraisals | REFERENCES     | authenticated | NO           |
| public       | property_appraisals | SELECT         | authenticated | NO           |
| public       | property_appraisals | TRIGGER        | authenticated | NO           |
| public       | property_appraisals | TRUNCATE       | authenticated | NO           |
| public       | property_appraisals | UPDATE         | authenticated | NO           |
| public       | property_appraisals | DELETE         | service_role  | NO           |
| public       | property_appraisals | INSERT         | service_role  | NO           |
| public       | property_appraisals | REFERENCES     | service_role  | NO           |
| public       | property_appraisals | SELECT         | service_role  | NO           |
| public       | property_appraisals | TRIGGER        | service_role  | NO           |
| public       | property_appraisals | TRUNCATE       | service_role  | NO           |
| public       | property_appraisals | UPDATE         | service_role  | NO           |
| public       | property_photos     | DELETE         | anon          | NO           |
| public       | property_photos     | INSERT         | anon          | NO           |
| public       | property_photos     | REFERENCES     | anon          | NO           |
| public       | property_photos     | SELECT         | anon          | NO           |
| public       | property_photos     | TRIGGER        | anon          | NO           |
| public       | property_photos     | TRUNCATE       | anon          | NO           |
| public       | property_photos     | UPDATE         | anon          | NO           |
| public       | property_photos     | DELETE         | authenticated | NO           |
| public       | property_photos     | INSERT         | authenticated | NO           |
| public       | property_photos     | REFERENCES     | authenticated | NO           |
| public       | property_photos     | SELECT         | authenticated | NO           |
| public       | property_photos     | TRIGGER        | authenticated | NO           |
| public       | property_photos     | TRUNCATE       | authenticated | NO           |
| public       | property_photos     | UPDATE         | authenticated | NO           |
| public       | property_photos     | DELETE         | service_role  | NO           |
| public       | property_photos     | INSERT         | service_role  | NO           |
| public       | property_photos     | REFERENCES     | service_role  | NO           |
| public       | property_photos     | SELECT         | service_role  | NO           |
| public       | property_photos     | TRIGGER        | service_role  | NO           |
| public       | property_photos     | TRUNCATE       | service_role  | NO           |
| public       | property_photos     | UPDATE         | service_role  | NO           |
| public       | tour_sessions       | DELETE         | anon          | NO           |
| public       | tour_sessions       | INSERT         | anon          | NO           |
| public       | tour_sessions       | REFERENCES     | anon          | NO           |
| public       | tour_sessions       | SELECT         | anon          | NO           |
| public       | tour_sessions       | TRIGGER        | anon          | NO           |
| public       | tour_sessions       | TRUNCATE       | anon          | NO           |
| public       | tour_sessions       | UPDATE         | anon          | NO           |
| public       | tour_sessions       | DELETE         | authenticated | NO           |
| public       | tour_sessions       | INSERT         | authenticated | NO           |
| public       | tour_sessions       | REFERENCES     | authenticated | NO           |
| public       | tour_sessions       | SELECT         | authenticated | NO           |
| public       | tour_sessions       | TRIGGER        | authenticated | NO           |
| public       | tour_sessions       | TRUNCATE       | authenticated | NO           |
| public       | tour_sessions       | UPDATE         | authenticated | NO           |
| public       | tour_sessions       | DELETE         | service_role  | NO           |
| public       | tour_sessions       | INSERT         | service_role  | NO           |

-- =====================================================
-- 8. CHECK FOR SPECIFIC PERFORMANCE-RELATED OBJECTS
-- =====================================================
-- Check if get_property_statistics function exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
        AND routine_name = 'get_property_statistics'
) AS get_property_statistics_exists;


| get_property_statistics_exists |
| ------------------------------ |
| false                          |
-- Check if admin_performance_metrics view exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
        AND table_name = 'admin_performance_metrics'
) AS admin_performance_metrics_exists;

| admin_performance_metrics_exists |
| -------------------------------- |
| false                            |

-- =====================================================
-- 9. CHECK ADMIN ACTIVITY LOG TABLE
-- =====================================================
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
        AND table_name = 'admin_activity_log'
) AS admin_activity_log_exists;

| admin_activity_log_exists |
| ------------------------- |
| true                      |

-- If admin_activity_log exists, check its structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
    AND table_name = 'admin_activity_log'
ORDER BY ordinal_position;

| column_name   | data_type                | is_nullable |
| ------------- | ------------------------ | ----------- |
| id            | uuid                     | NO          |
| admin_user_id | uuid                     | YES         |
| action        | text                     | NO          |
| resource_type | text                     | YES         |
| resource_id   | text                     | YES         |
| details       | jsonb                    | YES         |
| ip_address    | text                     | YES         |
| user_agent    | text                     | YES         |
| created_at    | timestamp with time zone | YES         |

-- =====================================================
-- 10. CHECK FOR CONFLICTING INDEXES (that we plan to create)
-- =====================================================
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
    AND indexname IN (
        'idx_properties_search',
        'idx_properties_location',
        'idx_properties_rooms',
        'idx_properties_virtual_tour',
        'idx_properties_created_at',
        'idx_property_photos_primary',
        'idx_property_photos_ordered',
        'idx_property_appraisals_latest',
        'idx_property_appraisals_appraiser',
        'idx_user_roles_active',
        'idx_tour_sessions_property_user',
        'idx_tour_sessions_status',
        'idx_broker_assignments_schedule',
        'idx_broker_assignments_property',
        'idx_admin_activity_user_date',
        'idx_admin_activity_type',
        'idx_viewings_property_date',
        'idx_viewings_user_date'
    );

| indexname                 | tablename  | indexdef                                                                             |
| ------------------------- | ---------- | ------------------------------------------------------------------------------------ |
| idx_properties_created_at | properties | CREATE INDEX idx_properties_created_at ON public.properties USING btree (created_at) |
| idx_user_roles_active     | user_roles | CREATE INDEX idx_user_roles_active ON public.user_roles USING btree (is_active)      |
-- =====================================================
-- 11. CHECK DATABASE CONFIGURATION AND EXTENSIONS
-- =====================================================
-- Check if PostGIS extension is available (needed for GIST indexes)
SELECT 
    extname,
    extversion,
    extnamespace::regnamespace AS schema
FROM pg_extension 
WHERE extname IN ('postgis', 'postgis_topology');

| extname | extversion | schema |
| ------- | ---------- | ------ |
| postgis | 3.3.7      | public |

-- Check current database configuration
SELECT 
    name,
    setting,
    unit,
    context,
    short_desc
FROM pg_settings 
WHERE name IN (
    'shared_preload_libraries',
    'max_connections',
    'work_mem',
    'maintenance_work_mem',
    'random_page_cost',
    'effective_cache_size'
);

| name                     | setting                                                                                                                                        | unit | context    | short_desc                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- | ---- | ---------- | ------------------------------------------------------------------------------- |
| effective_cache_size     | 49152                                                                                                                                          | 8kB  | user       | Sets the planner's assumption about the total size of the data caches.          |
| maintenance_work_mem     | 32768                                                                                                                                          | kB   | user       | Sets the maximum memory to be used for maintenance operations.                  |
| max_connections          | 60                                                                                                                                             | null | postmaster | Sets the maximum number of concurrent connections.                              |
| random_page_cost         | 1.1                                                                                                                                            | null | user       | Sets the planner's estimate of the cost of a nonsequentially fetched disk page. |
| shared_preload_libraries | pg_stat_statements, pgaudit, plpgsql, plpgsql_check, pg_cron, pg_net, pgsodium, timescaledb, auto_explain, pg_tle, plan_filter, supabase_vault | null | postmaster | Lists shared libraries to preload into server.                                  |
| work_mem                 | 2184                                                                                                                                           | kB   | user       | Sets the maximum memory to be used for query workspaces.                        |
-- =====================================================
-- 12. FINAL SUMMARY
-- =====================================================
SELECT 
    'Database State Check Complete' AS status,
    NOW() AS checked_at,
    current_database() AS database_name,
    current_user AS current_user,
    version() AS postgres_version;

    | status                        | checked_at                    | database_name | current_user | postgres_version                                                                   |
| ----------------------------- | ----------------------------- | ------------- | ------------ | ---------------------------------------------------------------------------------- |
| Database State Check Complete | 2025-10-01 12:14:33.673462+00 | postgres      | postgres     | PostgreSQL 15.8 on aarch64-unknown-linux-gnu, compiled by gcc (GCC) 13.2.0, 64-bit |
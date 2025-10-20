-- Check if property_viewings table exists and analyze its structure
-- Run these queries in Supabase SQL Editor to understand the current implementation

-- 1. Check if the table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables 
WHERE table_name = 'property_viewings' 
AND table_schema = 'public';

| table_name        | table_schema |
| ----------------- | ------------ |
| property_viewings | public       |

-- 2. If table exists, get its complete structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'property_viewings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

| column_name                | data_type                | is_nullable | column_default                 | character_maximum_length | numeric_precision | numeric_scale |
| -------------------------- | ------------------------ | ----------- | ------------------------------ | ------------------------ | ----------------- | ------------- |
| id                         | uuid                     | NO          | uuid_generate_v4()             | null                     | null              | null          |
| property_id                | uuid                     | YES         | null                           | null                     | null              | null          |
| broker_id                  | uuid                     | YES         | null                           | null                     | null              | null          |
| user_id                    | uuid                     | YES         | null                           | null                     | null              | null          |
| viewing_date               | date                     | NO          | null                           | null                     | null              | null          |
| viewing_time               | time without time zone   | NO          | null                           | null                     | null              | null          |
| end_time                   | time without time zone   | NO          | null                           | null                     | null              | null          |
| duration_minutes           | integer                  | YES         | 60                             | null                     | 32                | 0             |
| visitor_name               | character varying        | NO          | null                           | 255                      | null              | null          |
| visitor_email              | character varying        | NO          | null                           | 255                      | null              | null          |
| visitor_phone              | character varying        | YES         | null                           | 20                       | null              | null          |
| party_size                 | integer                  | YES         | 1                              | null                     | 32                | 0             |
| viewing_type               | character varying        | YES         | 'in_person'::character varying | 50                       | null              | null          |
| special_requests           | text                     | YES         | null                           | null                     | null              | null          |
| preparation_notes          | text                     | YES         | null                           | null                     | null              | null          |
| status                     | character varying        | YES         | 'scheduled'::character varying | 20                       | null              | null          |
| confirmation_code          | character varying        | YES         | null                           | 10                       | null              | null          |
| booking_source             | character varying        | YES         | 'website'::character varying   | 50                       | null              | null          |
| reminded_at                | timestamp with time zone | YES         | null                           | null                     | null              | null          |
| reminder_count             | integer                  | YES         | 0                              | null                     | 32                | 0             |
| checked_in_at              | timestamp with time zone | YES         | null                           | null                     | null              | null          |
| completed_at               | timestamp with time zone | YES         | null                           | null                     | null              | null          |
| cancelled_at               | timestamp with time zone | YES         | null                           | null                     | null              | null          |
| cancellation_reason        | text                     | YES         | null                           | null                     | null              | null          |
| follow_up_required         | boolean                  | YES         | true                           | null                     | null              | null          |
| follow_up_completed        | boolean                  | YES         | false                          | null                     | null              | null          |
| rating                     | integer                  | YES         | null                           | null                     | 32                | 0             |
| feedback                   | text                     | YES         | null                           | null                     | null              | null          |
| lead_quality_score         | integer                  | YES         | null                           | null                     | 32                | 0             |
| notes                      | text                     | YES         | null                           | null                     | null              | null          |
| metadata                   | jsonb                    | YES         | '{}'::jsonb                    | null                     | null              | null          |
| created_at                 | timestamp with time zone | YES         | now()                          | null                     | null              | null          |
| updated_at                 | timestamp with time zone | YES         | now()                          | null                     | null              | null          |
| meta_event_value           | numeric                  | YES         | 0                              | null                     | 10                | 2             |
| meta_events_sent           | jsonb                    | YES         | '[]'::jsonb                    | null                     | null              | null          |
| conversion_probability     | integer                  | YES         | 0                              | null                     | 32                | 0             |
| meta_event_sent            | boolean                  | YES         | false                          | null                     | null              | null          |
| meta_event_id              | text                     | YES         | null                           | null                     | null              | null          |
| estimated_commission_value | numeric                  | YES         | null                           | null                     | 10                | 2             |
| facebook_click_id          | text                     | YES         | null                           | null                     | null              | null          |
| facebook_browser_id        | text                     | YES         | null                           | null                     | null              | null          |
| utm_source                 | text                     | YES         | null                           | null                     | null              | null          |
| utm_medium                 | text                     | YES         | null                           | null                     | null              | null          |
| utm_campaign               | text                     | YES         | null                           | null                     | null              | null          |

-- 3. Check constraints on the table
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    cc.check_clause,
    kcu.column_name
FROM information_schema.table_constraints tc
LEFT JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
LEFT JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'property_viewings' 
AND tc.table_schema = 'public';

| constraint_name                            | constraint_type | check_clause                                                 | column_name       |
| ------------------------------------------ | --------------- | ------------------------------------------------------------ | ----------------- |
| property_viewings_broker_id_fkey           | FOREIGN KEY     | null                                                         | broker_id         |
| property_viewings_confirmation_code_key    | UNIQUE          | null                                                         | confirmation_code |
| property_viewings_lead_quality_score_check | CHECK           | (((lead_quality_score >= 1) AND (lead_quality_score <= 10))) | null              |
| property_viewings_party_size_check         | CHECK           | ((party_size > 0))                                           | null              |
| property_viewings_pkey                     | PRIMARY KEY     | null                                                         | id                |
| property_viewings_property_id_fkey         | FOREIGN KEY     | null                                                         | property_id       |
| property_viewings_rating_check             | CHECK           | (((rating >= 1) AND (rating <= 5)))                          | null              |
| property_viewings_user_id_fkey             | FOREIGN KEY     | null                                                         | user_id           |
| 2200_22285_1_not_null                      | CHECK           | id IS NOT NULL                                               | null              |
| 2200_22285_5_not_null                      | CHECK           | viewing_date IS NOT NULL                                     | null              |
| 2200_22285_6_not_null                      | CHECK           | viewing_time IS NOT NULL                                     | null              |
| 2200_22285_7_not_null                      | CHECK           | end_time IS NOT NULL                                         | null              |
| 2200_22285_9_not_null                      | CHECK           | visitor_name IS NOT NULL                                     | null              |
| 2200_22285_10_not_null                     | CHECK           | visitor_email IS NOT NULL                                    | null              |

-- 4. Check indexes on the table
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'property_viewings' 
AND schemaname = 'public';

| schemaname | tablename         | indexname                                | indexdef                                                                                                                |
| ---------- | ----------------- | ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| public     | property_viewings | property_viewings_pkey                   | CREATE UNIQUE INDEX property_viewings_pkey ON public.property_viewings USING btree (id)                                 |
| public     | property_viewings | property_viewings_confirmation_code_key  | CREATE UNIQUE INDEX property_viewings_confirmation_code_key ON public.property_viewings USING btree (confirmation_code) |
| public     | property_viewings | idx_property_viewings_property_id        | CREATE INDEX idx_property_viewings_property_id ON public.property_viewings USING btree (property_id)                    |
| public     | property_viewings | idx_property_viewings_broker_id          | CREATE INDEX idx_property_viewings_broker_id ON public.property_viewings USING btree (broker_id)                        |
| public     | property_viewings | idx_property_viewings_user_id            | CREATE INDEX idx_property_viewings_user_id ON public.property_viewings USING btree (user_id)                            |
| public     | property_viewings | idx_property_viewings_date               | CREATE INDEX idx_property_viewings_date ON public.property_viewings USING btree (viewing_date)                          |
| public     | property_viewings | idx_property_viewings_status             | CREATE INDEX idx_property_viewings_status ON public.property_viewings USING btree (status)                              |
| public     | property_viewings | idx_property_viewings_confirmation_code  | CREATE INDEX idx_property_viewings_confirmation_code ON public.property_viewings USING btree (confirmation_code)        |
| public     | property_viewings | idx_property_viewings_broker_date        | CREATE INDEX idx_property_viewings_broker_date ON public.property_viewings USING btree (broker_id, viewing_date)        |
| public     | property_viewings | idx_property_viewings_meta_event_sent    | CREATE INDEX idx_property_viewings_meta_event_sent ON public.property_viewings USING btree (meta_event_sent)            |
| public     | property_viewings | idx_property_viewings_lead_quality_score | CREATE INDEX idx_property_viewings_lead_quality_score ON public.property_viewings USING btree (lead_quality_score)      |
| public     | property_viewings | idx_property_viewings_facebook_click_id  | CREATE INDEX idx_property_viewings_facebook_click_id ON public.property_viewings USING btree (facebook_click_id)        |

-- 5. Check foreign key relationships
SELECT
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc 
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'property_viewings'
AND tc.table_schema = 'public';

| column_name | foreign_table_name | foreign_column_name |
| ----------- | ------------------ | ------------------- |
| broker_id   | brokers            | id                  |
| property_id | properties         | id                  |

-- 6. Check RLS policies
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
WHERE tablename = 'property_viewings' 
AND schemaname = 'public';

| schemaname | tablename         | policyname                         | permissive | roles    | cmd    | qual                                                                                                                                                                                                                                                                                          | with_check                                                                                                                                                                                                                                         |
| ---------- | ----------------- | ---------------------------------- | ---------- | -------- | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public     | property_viewings | property_viewings_delete_optimized | PERMISSIVE | {public} | DELETE | ((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true)))))                                              | null                                                                                                                                                                                                                                               |
| public     | property_viewings | property_viewings_insert_optimized | PERMISSIVE | {public} | INSERT | null                                                                                                                                                                                                                                                                                          | ((user_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true)))))   |
| public     | property_viewings | property_viewings_select_optimized | PERMISSIVE | {public} | SELECT | ((user_id = ( SELECT auth.uid() AS uid)) OR (broker_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true))))) | null                                                                                                                                                                                                                                               |
| public     | property_viewings | property_viewings_update_optimized | PERMISSIVE | {public} | UPDATE | ((broker_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true)))))                                            | ((broker_id = ( SELECT auth.uid() AS uid)) OR (EXISTS ( SELECT 1
   FROM user_roles ur
  WHERE ((ur.user_id = ( SELECT auth.uid() AS uid)) AND (ur.role = ANY (ARRAY['admin'::user_role, 'super_admin'::user_role])) AND (ur.is_active = true))))) |

-- 7. Sample data (first 5 rows to understand the data structure)
SELECT * 
FROM property_viewings 
LIMIT 5;

-- 8. Check data types and sample values for each column
SELECT 
    column_name,
    data_type,
    COUNT(*) as total_rows,
    COUNT(CASE WHEN column_name IS NOT NULL THEN 1 END) as non_null_count,
    (
        SELECT string_agg(DISTINCT value::text, ', ') 
        FROM (
            SELECT column_name as value 
            FROM property_viewings 
            WHERE column_name IS NOT NULL 
            LIMIT 3
        ) sample_values
    ) as sample_values
FROM information_schema.columns 
CROSS JOIN property_viewings
WHERE table_name = 'property_viewings' 
AND table_schema = 'public'
GROUP BY column_name, data_type
ORDER BY column_name;


| column_name                | data_type                | total_rows | non_null_count | sample_values              |
| -------------------------- | ------------------------ | ---------- | -------------- | -------------------------- |
| booking_source             | character varying        | 4          | 4              | booking_source             |
| broker_id                  | uuid                     | 4          | 4              | broker_id                  |
| cancellation_reason        | text                     | 4          | 4              | cancellation_reason        |
| cancelled_at               | timestamp with time zone | 4          | 4              | cancelled_at               |
| checked_in_at              | timestamp with time zone | 4          | 4              | checked_in_at              |
| completed_at               | timestamp with time zone | 4          | 4              | completed_at               |
| confirmation_code          | character varying        | 4          | 4              | confirmation_code          |
| conversion_probability     | integer                  | 4          | 4              | conversion_probability     |
| created_at                 | timestamp with time zone | 4          | 4              | created_at                 |
| duration_minutes           | integer                  | 4          | 4              | duration_minutes           |
| end_time                   | time without time zone   | 4          | 4              | end_time                   |
| estimated_commission_value | numeric                  | 4          | 4              | estimated_commission_value |
| facebook_browser_id        | text                     | 4          | 4              | facebook_browser_id        |
| facebook_click_id          | text                     | 4          | 4              | facebook_click_id          |
| feedback                   | text                     | 4          | 4              | feedback                   |
| follow_up_completed        | boolean                  | 4          | 4              | follow_up_completed        |
| follow_up_required         | boolean                  | 4          | 4              | follow_up_required         |
| id                         | uuid                     | 4          | 4              | id                         |
| lead_quality_score         | integer                  | 4          | 4              | lead_quality_score         |
| meta_event_id              | text                     | 4          | 4              | meta_event_id              |
| meta_event_sent            | boolean                  | 4          | 4              | meta_event_sent            |
| meta_event_value           | numeric                  | 4          | 4              | meta_event_value           |
| meta_events_sent           | jsonb                    | 4          | 4              | meta_events_sent           |
| metadata                   | jsonb                    | 4          | 4              | metadata                   |
| notes                      | text                     | 4          | 4              | notes                      |
| party_size                 | integer                  | 4          | 4              | party_size                 |
| preparation_notes          | text                     | 4          | 4              | preparation_notes          |
| property_id                | uuid                     | 4          | 4              | property_id                |
| rating                     | integer                  | 4          | 4              | rating                     |
| reminded_at                | timestamp with time zone | 4          | 4              | reminded_at                |
| reminder_count             | integer                  | 4          | 4              | reminder_count             |
| special_requests           | text                     | 4          | 4              | special_requests           |
| status                     | character varying        | 4          | 4              | status                     |
| updated_at                 | timestamp with time zone | 4          | 4              | updated_at                 |
| user_id                    | uuid                     | 4          | 4              | user_id                    |
| utm_campaign               | text                     | 4          | 4              | utm_campaign               |
| utm_medium                 | text                     | 4          | 4              | utm_medium                 |
| utm_source                 | text                     | 4          | 4              | utm_source                 |
| viewing_date               | date                     | 4          | 4              | viewing_date               |
| viewing_time               | time without time zone   | 4          | 4              | viewing_time               |
| viewing_type               | character varying        | 4          | 4              | viewing_type               |
| visitor_email              | character varying        | 4          | 4              | visitor_email              |
| visitor_name               | character varying        | 4          | 4              | visitor_name               |
| visitor_phone              | character varying        | 4          | 4              | visitor_phone              |

-- 9. Check if there are any related booking/viewing tables
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (
    table_name ILIKE '%viewing%' 
    OR table_name ILIKE '%booking%' 
    OR table_name ILIKE '%appointment%'
    OR table_name ILIKE '%schedule%'
)
ORDER BY table_name;

| table_name                |
| ------------------------- |
| admin_booking_qr_overview |
| appraiser_bookings        |
| booking_qr_codes          |
| broker_schedules          |
| call_schedules            |
| guest_rental_bookings     |
| payment_schedules         |
| property_viewings         |
| rental_bookings           |

-- 10. Check for any existing functions related to viewings/bookings
SELECT 
    routine_name,
    routine_type,
    data_type as return_type
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND (
    routine_name ILIKE '%viewing%' 
    OR routine_name ILIKE '%booking%' 
    OR routine_name ILIKE '%appointment%'
    OR routine_name ILIKE '%schedule%'
)
ORDER BY routine_name;

| routine_name                             | routine_type | return_type |
| ---------------------------------------- | ------------ | ----------- |
| calculate_viewing_conversion_probability | FUNCTION     | integer     |
| generate_booking_confirmation            | FUNCTION     | trigger     |
| update_booking_count                     | FUNCTION     | trigger     |
| update_booking_qr_status                 | FUNCTION     | trigger     |
| update_broker_availability_bookings      | FUNCTION     | trigger     |
| update_calendar_on_booking               | FUNCTION     | trigger     |
| update_viewing_conversion_probability    | FUNCTION     | trigger     |
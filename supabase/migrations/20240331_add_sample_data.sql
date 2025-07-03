-- First, add any missing columns that might not exist
ALTER TABLE properties 
ADD COLUMN IF NOT EXISTS compound TEXT,
ADD COLUMN IF NOT EXISTS nearest_schools JSONB,
ADD COLUMN IF NOT EXISTS amenities JSONB,
ADD COLUMN IF NOT EXISTS distance_to_metro DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS distance_to_airport DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS distance_to_mall DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS distance_to_hospital DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS furnished BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_pool BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_garden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_security BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_gym BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_playground BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS has_community_center BOOLEAN DEFAULT false;

-- Add sample properties for Egypt (Cairo and Alexandria) with basic required columns first (only if they don't exist)
DO $$
BEGIN
  -- Insert properties only if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Luxury New Capital Penthouse') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Luxury New Capital Penthouse', 'Stunning penthouse with panoramic views of the New Administrative Capital. Features floor-to-ceiling windows, marble finishes, and smart home technology.', 185000, 3, 3, 2500, 'Downtown District, R7', 'New Capital', 'Cairo', '11835', 'penthouse', 'active', 2022, 1245);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Zamalek Nile View Apartment') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Zamalek Nile View Apartment', 'Elegant apartment with direct Nile views in prestigious Zamalek district. Classic architecture with modern renovations.', 125000, 4, 3, 3200, '26th July Street', 'Cairo', 'Cairo', '11211', 'apartment', 'active', 1960, 987);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Alexandria Corniche Villa') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Alexandria Corniche Villa', 'Magnificent Mediterranean villa on Alexandria Corniche with direct sea access. Private beach and stunning sunset views.', 220000, 5, 6, 4500, 'Corniche El Nil, Stanley', 'Alexandria', 'Alexandria', '21599', 'villa', 'active', 2018, 834);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Maadi Modern Townhouse') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Maadi Modern Townhouse', 'Contemporary townhouse in quiet Maadi district with garden and garage. Perfect for families seeking tranquility.', 95000, 4, 4, 3000, 'Road 9, Maadi Sarayat', 'Cairo', 'Cairo', '11431', 'townhouse', 'active', 2020, 756);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Heliopolis Palace District Apartment') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Heliopolis Palace District Apartment', 'Spacious apartment near Baron Palace with historical charm and modern amenities. Walking distance to Cairo Airport.', 75000, 3, 2, 2200, 'El-Ahram Street, Heliopolis', 'Cairo', 'Cairo', '11757', 'apartment', 'active', 2019, 698);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'North Coast Chalet') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('North Coast Chalet', 'Luxury beach chalet in Marina with direct beach access. Perfect summer retreat with resort amenities.', 110000, 2, 2, 1600, 'Marina Walk, North Coast', 'Marina', 'Alexandria', '23712', 'apartment', 'active', 2021, 645);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Fifth Settlement Villa') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Fifth Settlement Villa', 'Modern villa in gated community with swimming pool and landscaped garden. Family-friendly neighborhood with international schools.', 145000, 4, 4, 3500, 'Compound 90, Fifth Settlement', 'New Cairo', 'Cairo', '11835', 'villa', 'active', 2017, 543);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Downtown Cairo Heritage Loft') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Downtown Cairo Heritage Loft', 'Restored heritage building loft in Downtown Cairo. High ceilings, original features, and modern conveniences.', 65000, 2, 2, 1800, 'Talaat Harb Street', 'Cairo', 'Cairo', '11111', 'apartment', 'active', 1925, 467);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'New Alamein Resort Apartment') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('New Alamein Resort Apartment', 'Brand new resort-style apartment in New Alamein with beach club access and world-class amenities.', 89000, 2, 2, 1400, 'New Alamein City, North Coast', 'New Alamein', 'Alexandria', '23811', 'apartment', 'active', 2023, 389);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM properties WHERE title = 'Mohandessin Executive Apartment') THEN
    INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, year_built, view_count)
    VALUES ('Mohandessin Executive Apartment', 'Executive apartment in prime Mohandessin location with Nile glimpses. Close to business districts and shopping centers.', 98000, 3, 2, 2000, 'Giza Street, Mohandessin', 'Giza', 'Cairo', '12411', 'apartment', 'active', 2019, 321);
  END IF;
END $$;

-- Update properties with additional details if columns exist
DO $$
BEGIN
  -- Check if amenities column exists before updating
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'amenities') THEN
    UPDATE properties SET 
      compound = CASE title
        WHEN 'Luxury New Capital Penthouse' THEN 'The New Capital Tower'
        WHEN 'Zamalek Nile View Apartment' THEN 'Zamalek View'
        WHEN 'Alexandria Corniche Villa' THEN 'Corniche View'
        WHEN 'Maadi Modern Townhouse' THEN 'Maadi Residence'
        WHEN 'Heliopolis Palace District Apartment' THEN 'Palace District'
        WHEN 'North Coast Chalet' THEN 'Marina Retreat'
        WHEN 'Fifth Settlement Villa' THEN 'Fifth Settlement'
        WHEN 'Downtown Cairo Heritage Loft' THEN 'Downtown Cairo'
        WHEN 'New Alamein Resort Apartment' THEN 'New Alamein Resort'
        WHEN 'Mohandessin Executive Apartment' THEN 'Mohandessin'
      END,
      amenities = CASE title
        WHEN 'Luxury New Capital Penthouse' THEN '["Doorman", "Concierge", "Rooftop Terrace", "Wine Cellar", "Smart Home System"]'::jsonb
        WHEN 'Zamalek Nile View Apartment' THEN '["Nile Views", "Classic Architecture", "Modern Renovations"]'::jsonb
        WHEN 'Alexandria Corniche Villa' THEN '["Sea Access", "Private Beach", "Stunning Sunset Views"]'::jsonb
        WHEN 'Maadi Modern Townhouse' THEN '["Garden", "Garage", "Modern Conveniences"]'::jsonb
        WHEN 'Heliopolis Palace District Apartment' THEN '["Historical Charm", "Modern Amenities", "Walking Distance to Cairo Airport"]'::jsonb
        WHEN 'North Coast Chalet' THEN '["Resort Amenities", "Direct Beach Access", "Perfect Summer Retreat"]'::jsonb
        WHEN 'Fifth Settlement Villa' THEN '["Swimming Pool", "Landscaped Garden", "International Schools"]'::jsonb
        WHEN 'Downtown Cairo Heritage Loft' THEN '["High Ceilings", "Original Features", "Modern Conveniences"]'::jsonb
        WHEN 'New Alamein Resort Apartment' THEN '["Beach Club Access", "World-Class Amenities", "Brand New Resort-Style"]'::jsonb
        WHEN 'Mohandessin Executive Apartment' THEN '["Nile Glimpses", "Close to Business Districts", "Shopping Centers"]'::jsonb
      END,
      distance_to_metro = CASE title
        WHEN 'Luxury New Capital Penthouse' THEN 0.2
        WHEN 'Zamalek Nile View Apartment' THEN 0.3
        WHEN 'Alexandria Corniche Villa' THEN 0.5
        WHEN 'Maadi Modern Townhouse' THEN 0.1
        WHEN 'Heliopolis Palace District Apartment' THEN 0.8
        WHEN 'North Coast Chalet' THEN 0.5
        WHEN 'Fifth Settlement Villa' THEN 0.3
        WHEN 'Downtown Cairo Heritage Loft' THEN 0.2
        WHEN 'New Alamein Resort Apartment' THEN 0.8
        WHEN 'Mohandessin Executive Apartment' THEN 0.5
      END,
      has_pool = title IN ('Alexandria Corniche Villa', 'North Coast Chalet'),
      has_garden = title IN ('Maadi Modern Townhouse', 'Fifth Settlement Villa'),
      has_security = title IN ('Luxury New Capital Penthouse', 'Zamalek Nile View Apartment', 'Alexandria Corniche Villa', 'Maadi Modern Townhouse', 'Heliopolis Palace District Apartment', 'North Coast Chalet', 'Fifth Settlement Villa', 'Downtown Cairo Heritage Loft', 'New Alamein Resort Apartment', 'Mohandessin Executive Apartment'),
      has_parking = title IN ('Luxury New Capital Penthouse', 'Zamalek Nile View Apartment', 'Alexandria Corniche Villa', 'Maadi Modern Townhouse', 'Heliopolis Palace District Apartment', 'North Coast Chalet', 'Fifth Settlement Villa', 'Downtown Cairo Heritage Loft', 'New Alamein Resort Apartment', 'Mohandessin Executive Apartment'),
      furnished = title IN ('Luxury New Capital Penthouse', 'Zamalek Nile View Apartment', 'Heliopolis Palace District Apartment', 'Mohandessin Executive Apartment')
    WHERE title IN ('Luxury New Capital Penthouse', 'Zamalek Nile View Apartment', 'Alexandria Corniche Villa', 'Maadi Modern Townhouse', 'Heliopolis Palace District Apartment', 'North Coast Chalet', 'Fifth Settlement Villa', 'Downtown Cairo Heritage Loft', 'New Alamein Resort Apartment', 'Mohandessin Executive Apartment');
  END IF;
END $$;

-- Add property photos for sample properties
INSERT INTO property_photos (property_id, url, is_primary, order_index)
SELECT 
  p.id,
  'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=800',
  true,
  1
FROM properties p
WHERE NOT EXISTS (SELECT 1 FROM property_photos pp WHERE pp.property_id = p.id AND pp.is_primary = true);

-- Add property views for the last 30 days
INSERT INTO property_views (property_id, viewed_at, user_agent, ip_address)
SELECT 
  p.id,
  TIMEZONE('utc'::text, NOW()) - (random() * interval '30 days'),
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '192.168.' || (1 + random() * 254)::int || '.' || (1 + random() * 254)::int
FROM properties p
CROSS JOIN generate_series(1, (5 + random() * 20)::int) -- 5-25 views per property
WHERE NOT EXISTS (
  SELECT 1 FROM property_views pv 
  WHERE pv.property_id = p.id 
  AND pv.viewed_at > TIMEZONE('utc'::text, NOW()) - interval '31 days'
  LIMIT 5  -- Limit check to avoid too many existing views
);

-- Add property analytics events
INSERT INTO property_analytics (property_id, event_type, event_data, user_agent, ip_address, created_at)
SELECT 
  p.id,
  CASE (random() * 4)::int
    WHEN 0 THEN 'property_view'
    WHEN 1 THEN 'virtual_tour_started'
    WHEN 2 THEN 'heygen_live_call_started'
    ELSE 'contact_form_viewed'
  END,
  '{"source": "website", "device": "desktop"}'::jsonb,
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  '192.168.' || (1 + random() * 254)::int || '.' || (1 + random() * 254)::int,
  TIMEZONE('utc'::text, NOW()) - (random() * interval '30 days')
FROM properties p
CROSS JOIN generate_series(1, (3 + random() * 15)::int) -- 3-18 analytics events per property
WHERE NOT EXISTS (
  SELECT 1 FROM property_analytics pa 
  WHERE pa.property_id = p.id 
  AND pa.created_at > TIMEZONE('utc'::text, NOW()) - interval '31 days'
  LIMIT 5  -- Limit check to avoid too many existing analytics
);

-- Add tour sessions
INSERT INTO tour_sessions (property_id, session_id, tour_type, started_at, ended_at, total_duration_seconds, rooms_visited, actions_taken, completed)
SELECT 
  sessions.id,
  'tour_' || sessions.id || '_' || gen_random_uuid(),
  CASE (random() * 3)::int
    WHEN 0 THEN 'virtual_3d'
    WHEN 1 THEN 'realsee'
    ELSE 'video'
  END,
  sessions.session_start,
  sessions.session_start + (sessions.duration_minutes || ' minutes')::interval,
  sessions.duration_minutes * 60,
  '["living_room", "kitchen", "master_bedroom"]'::jsonb,
  '["zoom_in", "rotate_view", "measure_room"]'::jsonb,
  sessions.duration_minutes > 5
FROM (
  SELECT 
    p.id,
    TIMEZONE('utc'::text, NOW()) - (random() * interval '30 days') as session_start,
    (2 + random() * 15)::int as duration_minutes
  FROM properties p
  CROSS JOIN generate_series(1, (1 + random() * 8)::int) -- 1-8 tour sessions per property
  WHERE NOT EXISTS (
    SELECT 1 FROM tour_sessions ts 
    WHERE ts.property_id = p.id 
    AND ts.started_at > TIMEZONE('utc'::text, NOW()) - interval '31 days'
    LIMIT 3  -- Limit check to avoid too many existing sessions
  )
) as sessions(id, session_start, duration_minutes);

-- Add HeyGen sessions
INSERT INTO heygen_sessions (property_id, session_id, agent_type, agent_name, started_at, ended_at, duration_seconds, questions_asked, topics_discussed, call_rating, follow_up_requested, meeting_scheduled)
SELECT 
  sessions.id,
  'heygen_' || sessions.id || '_' || gen_random_uuid(),
  'virtual_agent',
  CASE (random() * 3)::int
    WHEN 0 THEN 'Yasmin Hassan'
    WHEN 1 THEN 'Ahmed Mahmoud'
    ELSE 'Nour El-Din'
  END,
  sessions.session_start,
  sessions.session_start + (sessions.duration_minutes || ' minutes')::interval,
  sessions.duration_minutes * 60,
  '["What is the price?", "Is parking included?", "When can I schedule a viewing?", "What about maintenance fees?"]'::jsonb,
  '["property_features", "neighborhood", "pricing", "amenities", "location_benefits"]'::jsonb,
  (1 + random() * 4)::int,
  random() > 0.7,
  random() > 0.8
FROM (
  SELECT 
    p.id,
    TIMEZONE('utc'::text, NOW()) - (random() * interval '30 days') as session_start,
    (3 + random() * 20)::int as duration_minutes
  FROM properties p
  CROSS JOIN generate_series(1, (0 + random() * 5)::int) -- 0-5 HeyGen sessions per property
  WHERE random() > 0.3 -- Only 70% of properties have HeyGen sessions
  AND NOT EXISTS (
    SELECT 1 FROM heygen_sessions hs 
    WHERE hs.property_id = p.id 
    AND hs.started_at > TIMEZONE('utc'::text, NOW()) - interval '31 days'
    LIMIT 2  -- Limit check to avoid too many existing sessions
  )
) as sessions(id, session_start, duration_minutes);

-- Update property view counts based on actual views
UPDATE properties SET view_count = (
  SELECT COUNT(*) 
  FROM property_views pv 
  WHERE pv.property_id = properties.id
);

-- Add sample inquiries for the properties
INSERT INTO inquiries (property_id, name, email, phone, message, status, source, priority, created_at)
SELECT 
  p.id,
  CASE (random() * 8)::int
    WHEN 0 THEN 'Ahmed Hassan'
    WHEN 1 THEN 'Sarah Mohammed'
    WHEN 2 THEN 'Omar Ali'
    WHEN 3 THEN 'Fatima Ahmed'
    WHEN 4 THEN 'Mohamed Elsayed'
    WHEN 5 THEN 'Nour Mahmoud'
    WHEN 6 THEN 'Youssef Ibrahim'
    ELSE 'Mariam Khalil'
  END,
  CASE (random() * 8)::int
    WHEN 0 THEN 'ahmed.hassan@email.com'
    WHEN 1 THEN 'sarah.mohammed@email.com'
    WHEN 2 THEN 'omar.ali@email.com'
    WHEN 3 THEN 'fatima.ahmed@email.com'
    WHEN 4 THEN 'mohamed.elsayed@email.com'
    WHEN 5 THEN 'nour.mahmoud@email.com'
    WHEN 6 THEN 'youssef.ibrahim@email.com'
    ELSE 'mariam.khalil@email.com'
  END,
  '+20 ' || (1000000000 + (random() * 99999999)::bigint)::text,
  CASE (random() * 5)::int
    WHEN 0 THEN 'I am interested in viewing this property. Please contact me to schedule a visit.'
    WHEN 1 THEN 'Could you provide more information about the amenities and nearby facilities?'
    WHEN 2 THEN 'I would like to know about the financing options available for this property.'
    WHEN 3 THEN 'Is this property still available? I am looking to move in next month.'
    ELSE 'Can you send me more photos and details about the neighborhood?'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'new'
    WHEN 1 THEN 'contacted'
    WHEN 2 THEN 'qualified'
    ELSE 'closed'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'website'
    WHEN 1 THEN 'phone'
    WHEN 2 THEN 'email'
    ELSE 'referral'
  END,
  CASE (random() * 4)::int
    WHEN 0 THEN 'low'
    WHEN 1 THEN 'medium'
    WHEN 2 THEN 'high'
    ELSE 'urgent'
  END,
  TIMEZONE('utc'::text, NOW()) - (random() * interval '30 days')
FROM properties p
CROSS JOIN generate_series(1, (1 + random() * 3)::int) -- 1-3 inquiries per property
WHERE random() < 0.8  -- Create inquiries for about 80% of properties
AND NOT EXISTS (
  SELECT 1 FROM inquiries i 
  WHERE i.property_id = p.id 
  LIMIT 1  -- Avoid duplicates if migration is run multiple times
);

-- Update properties with geographic coordinates for Egypt
DO $$
BEGIN
  -- Add coordinates if latitude/longitude columns exist
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'latitude') 
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'properties' AND column_name = 'longitude') THEN
    
    UPDATE properties SET 
      latitude = CASE title
        WHEN 'Luxury New Capital Penthouse' THEN 30.005493 -- New Administrative Capital
        WHEN 'Zamalek Nile View Apartment' THEN 30.064742 -- Zamalek, Cairo
        WHEN 'Alexandria Corniche Villa' THEN 31.200092 -- Alexandria Corniche
        WHEN 'Maadi Modern Townhouse' THEN 29.959574 -- Maadi, Cairo
        WHEN 'Heliopolis Palace District Apartment' THEN 30.087989 -- Heliopolis, Cairo
        WHEN 'North Coast Chalet' THEN 30.822361 -- North Coast Marina
        WHEN 'Fifth Settlement Villa' THEN 30.028294 -- Fifth Settlement, New Cairo
        WHEN 'Downtown Cairo Heritage Loft' THEN 30.044420 -- Downtown Cairo
        WHEN 'New Alamein Resort Apartment' THEN 30.839167 -- New Alamein
        WHEN 'Mohandessin Executive Apartment' THEN 30.061644 -- Mohandessin, Giza
      END,
      longitude = CASE title
        WHEN 'Luxury New Capital Penthouse' THEN 31.661129 -- New Administrative Capital
        WHEN 'Zamalek Nile View Apartment' THEN 31.222071 -- Zamalek, Cairo
        WHEN 'Alexandria Corniche Villa' THEN 29.906662 -- Alexandria Corniche
        WHEN 'Maadi Modern Townhouse' THEN 31.254808 -- Maadi, Cairo
        WHEN 'Heliopolis Palace District Apartment' THEN 31.324226 -- Heliopolis, Cairo
        WHEN 'North Coast Chalet' THEN 28.713056 -- North Coast Marina
        WHEN 'Fifth Settlement Villa' THEN 31.495615 -- Fifth Settlement, New Cairo
        WHEN 'Downtown Cairo Heritage Loft' THEN 31.235712 -- Downtown Cairo
        WHEN 'New Alamein Resort Apartment' THEN 28.708889 -- New Alamein
        WHEN 'Mohandessin Executive Apartment' THEN 31.200874 -- Mohandessin, Giza
      END
    WHERE title IN (
      'Luxury New Capital Penthouse', 'Zamalek Nile View Apartment', 'Alexandria Corniche Villa', 
      'Maadi Modern Townhouse', 'Heliopolis Palace District Apartment', 'North Coast Chalet', 
      'Fifth Settlement Villa', 'Downtown Cairo Heritage Loft', 'New Alamein Resort Apartment', 
      'Mohandessin Executive Apartment'
    );
  END IF;
END $$; 
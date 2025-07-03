-- Comprehensive Homepage Test Data for VirtualEstate
-- This script populates properties across all categories with photos and features

-- First, let's clear any existing test data (optional)
-- DELETE FROM property_photos WHERE property_id IN (SELECT id FROM properties WHERE title LIKE '%Test%');
-- DELETE FROM properties WHERE title LIKE '%Test%';

-- Insert Featured Properties for Hero Section (with photos for tour rotation)
INSERT INTO properties (
    id, title, description, price, bedrooms, bathrooms, square_feet, 
    address, city, state, zip_code, property_type, status, year_built,
    features, amenities, furnished, has_pool, has_garden, has_security, 
    has_parking, has_gym, created_at
) VALUES 
-- Luxury Villa for Hero Section
(
    gen_random_uuid(),
    'Stunning Villa with Pool - Katameya Heights',
    'Magnificent 5-bedroom villa in prestigious Katameya Heights featuring private pool, landscaped gardens, and golf course views. Modern architecture with premium finishes throughout.',
    450000,
    5,
    4,
    4200,
    'Katameya Heights Compound',
    'New Cairo',
    'Cairo',
    '11835',
    'villa',
    'available',
    2020,
    ARRAY['Golf Course View', 'Modern Kitchen', 'Master Suite', 'Walk-in Closets', 'High Ceilings'],
    ARRAY['Swimming Pool', 'Private Garden', 'Gym', 'Security', 'Parking', 'Clubhouse', 'Golf Course'],
    true,
    true,
    true,
    true,
    true,
    true,
    NOW() - INTERVAL '5 days'
),

-- Luxury Apartment for Hero Section  
(
    gen_random_uuid(),
    'Premium Penthouse with Nile Views - Zamalek',
    'Exclusive penthouse apartment with panoramic Nile views in the heart of Zamalek. Features spacious terraces, modern amenities, and prime location.',
    380000,
    3,
    3,
    2800,
    '26th July Street',
    'Cairo',
    'Cairo',
    '11211',
    'penthouse',
    'available',
    2019,
    ARRAY['Nile Views', 'Terrace', 'Modern Kitchen', 'Marble Floors', 'Central AC'],
    ARRAY['Concierge', 'Elevator', 'Security', 'Parking', 'Rooftop Access'],
    true,
    false,
    false,
    true,
    true,
    false,
    NOW() - INTERVAL '3 days'
),

-- Modern Apartment for Hero Section
(
    gen_random_uuid(),
    'Contemporary Apartment - Sheikh Zayed',
    'Beautiful 3-bedroom apartment in upscale Sheikh Zayed. Open-plan living with premium finishes and community amenities.',
    220000,
    3,
    2,
    1800,
    'The Square Mall Area',
    'Sheikh Zayed',
    'Giza',
    '12588',
    'apartment',
    'available',
    2021,
    ARRAY['Open Plan', 'Built-in Wardrobes', 'Modern Kitchen', 'Balcony'],
    ARRAY['Swimming Pool', 'Gym', 'Security', 'Parking', 'Playground'],
    false,
    true,
    false,
    true,
    true,
    true,
    NOW() - INTERVAL '2 days'
),

-- APARTMENTS Category
(
    gen_random_uuid(),
    'Affordable Family Apartment - Maadi',
    'Comfortable 2-bedroom apartment in family-friendly Maadi. Close to international schools and metro station.',
    120000,
    2,
    2,
    1200,
    'Road 9, Maadi',
    'Cairo',
    'Cairo',
    '11431',
    'apartment',
    'available',
    2018,
    ARRAY['Family Friendly', 'Near Schools', 'Metro Access'],
    ARRAY['Security', 'Parking', 'Elevator'],
    false,
    false,
    false,
    true,
    true,
    false,
    NOW() - INTERVAL '1 day'
),

(
    gen_random_uuid(),
    'Modern Studio - Downtown Cairo',
    'Stylish studio apartment in vibrant Downtown Cairo. Perfect for young professionals.',
    85000,
    1,
    1,
    650,
    'Tahrir Square Area',
    'Cairo',
    'Cairo',
    '11511',
    'studio',
    'available',
    2022,
    ARRAY['City Views', 'Modern Design', 'Efficient Layout'],
    ARRAY['Security', 'Elevator', 'Central Location'],
    true,
    false,
    false,
    true,
    false,
    false,
    NOW() - INTERVAL '1 day'
),

-- VILLAS Category
(
    gen_random_uuid(),
    'Family Villa with Garden - 6th October',
    'Spacious 4-bedroom villa in peaceful 6th October City. Large garden and family-friendly community.',
    320000,
    4,
    3,
    3200,
    'Dreamland Compound',
    '6th of October',
    'Giza',
    '12566',
    'villa',
    'available',
    2017,
    ARRAY['Large Garden', 'Family Oriented', 'Quiet Area'],
    ARRAY['Private Garden', 'Security', 'Parking', 'Playground'],
    false,
    false,
    true,
    true,
    true,
    false,
    NOW() - INTERVAL '4 days'
),

(
    gen_random_uuid(),
    'Luxury Beach Villa - North Coast',
    'Exclusive beachfront villa in Marina with direct beach access and resort amenities.',
    650000,
    4,
    4,
    3800,
    'Marina Resort',
    'Marina',
    'Alexandria',
    '23712',
    'villa',
    'available',
    2020,
    ARRAY['Beach Front', 'Sea Views', 'Resort Style'],
    ARRAY['Beach Access', 'Swimming Pool', 'Security', 'Marina', 'Golf Course'],
    true,
    true,
    true,
    true,
    true,
    true,
    NOW() - INTERVAL '6 days'
),

-- PENTHOUSES Category
(
    gen_random_uuid(),
    'Sky Penthouse - New Capital',
    'Ultra-modern penthouse in New Administrative Capital with city skyline views.',
    520000,
    3,
    3,
    2200,
    'Downtown District R7',
    'New Capital',
    'Cairo',
    '11865',
    'penthouse',
    'available',
    2021,
    ARRAY['Sky Views', 'Smart Home', 'Premium Finishes'],
    ARRAY['Rooftop Terrace', 'Concierge', 'Valet Parking', 'Smart Home System'],
    true,
    false,
    false,
    true,
    true,
    true,
    NOW() - INTERVAL '7 days'
),

-- TOWNHOUSES Category
(
    gen_random_uuid(),
    'Modern Townhouse - New Cairo',
    'Contemporary 3-bedroom townhouse in gated community with modern amenities.',
    280000,
    3,
    3,
    2400,
    'Fifth Settlement',
    'New Cairo',
    'Cairo',
    '11835',
    'townhouse',
    'available',
    2019,
    ARRAY['Gated Community', 'Modern Design', 'Family Friendly'],
    ARRAY['Swimming Pool', 'Gym', 'Security', 'Parking', 'Clubhouse'],
    false,
    true,
    false,
    true,
    true,
    true,
    NOW() - INTERVAL '8 days'
),

-- UNDER $150K Properties for Filter Testing
(
    gen_random_uuid(),
    'Cozy Apartment - Heliopolis',
    'Charming 2-bedroom apartment in historic Heliopolis neighborhood.',
    135000,
    2,
    1,
    1100,
    'El-Ahram Street',
    'Cairo',
    'Cairo',
    '11757',
    'apartment',
    'available',
    2016,
    ARRAY['Historic Area', 'Near Airport', 'Tree-lined Streets'],
    ARRAY['Security', 'Parking', 'Elevator'],
    false,
    false,
    false,
    true,
    true,
    false,
    NOW() - INTERVAL '2 days'
),

(
    gen_random_uuid(),
    'Budget-Friendly Villa - 10th of Ramadan',
    'Affordable 3-bedroom villa in growing 10th of Ramadan City.',
    145000,
    3,
    2,
    2000,
    '10th of Ramadan Industrial City',
    '10th of Ramadan',
    'Cairo',
    '44629',
    'villa',
    'available',
    2015,
    ARRAY['Affordable', 'Growing Area', 'Investment Opportunity'],
    ARRAY['Private Garden', 'Parking', 'Security'],
    false,
    false,
    true,
    true,
    true,
    false,
    NOW() - INTERVAL '3 days'
),

-- Properties WITH POOL for Filter Testing
(
    gen_random_uuid(),
    'Pool Villa - Palm Hills',
    'Beautiful villa with private swimming pool in prestigious Palm Hills compound.',
    420000,
    4,
    4,
    3500,
    'Palm Hills Compound',
    '6th of October',
    'Giza',
    '12566',
    'villa',
    'available',
    2018,
    ARRAY['Private Pool', 'Compound Living', 'Golf Course Nearby'],
    ARRAY['Swimming Pool', 'Private Garden', 'Security', 'Golf Course', 'Clubhouse'],
    true,
    true,
    true,
    true,
    true,
    true,
    NOW() - INTERVAL '5 days'
),

-- Properties with CITY VIEWS
(
    gen_random_uuid(),
    'High-Rise Apartment with Views - Mokattam',
    'Stunning apartment with panoramic city views from Mokattam Hills.',
    190000,
    2,
    2,
    1400,
    'Mokattam Hills',
    'Cairo',
    'Cairo',
    '11571',
    'apartment',
    'available',
    2020,
    ARRAY['City Views', 'High Floor', 'Mountain Location'],
    ARRAY['Security', 'Parking', 'Elevator', 'Garden Views'],
    false,
    false,
    false,
    true,
    true,
    false,
    NOW() - INTERVAL '4 days'
),

-- FURNISHED Properties
(
    gen_random_uuid(),
    'Fully Furnished Apartment - Degla',
    'Move-in ready furnished apartment in upscale Degla, Maadi.',
    160000,
    2,
    2,
    1300,
    'Street 231, Degla',
    'Maadi',
    'Cairo',
    '11431',
    'apartment',
    'available',
    2019,
    ARRAY['Fully Furnished', 'Move-in Ready', 'Upscale Area'],
    ARRAY['Security', 'Parking', 'Elevator', 'Garden'],
    true,
    false,
    true,
    true,
    true,
    false,
    NOW() - INTERVAL '1 day'
);

-- Now add property photos for all properties to ensure hero section works
-- First, let's get the property IDs we just created
DO $$
DECLARE 
    prop_record RECORD;
    photo_urls TEXT[] := ARRAY[
        'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80',
        'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80',
        'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80',
        'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80',
        'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80',
        'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
        'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
    ];
    url_index INTEGER := 1;
BEGIN
    -- Add photos for properties created today
    FOR prop_record IN 
        SELECT id, property_type 
        FROM properties 
        WHERE created_at::date = CURRENT_DATE
    LOOP
        -- Add 3-4 photos per property
        FOR i IN 1..3 LOOP
            INSERT INTO property_photos (
                id, 
                property_id, 
                url, 
                is_primary, 
                order_index
            ) VALUES (
                gen_random_uuid(),
                prop_record.id,
                photo_urls[((url_index - 1) % array_length(photo_urls, 1)) + 1],
                (i = 1), -- First photo is primary
                i
            );
            url_index := url_index + 1;
        END LOOP;
        
        -- Add extra photo for villas and penthouses
        IF prop_record.property_type IN ('villa', 'penthouse') THEN
            INSERT INTO property_photos (
                id, 
                property_id, 
                url, 
                is_primary, 
                order_index
            ) VALUES (
                gen_random_uuid(),
                prop_record.id,
                photo_urls[((url_index - 1) % array_length(photo_urls, 1)) + 1],
                false,
                4
            );
            url_index := url_index + 1;
        END IF;
    END LOOP;
END $$;

-- Update view counts for realistic data
UPDATE properties 
SET view_count = (RANDOM() * 1000 + 50)::INTEGER 
WHERE created_at::date = CURRENT_DATE;

-- Add some variety to created_at timestamps for "New Listings" filter
UPDATE properties 
SET created_at = NOW() - (RANDOM() * INTERVAL '10 days')
WHERE created_at::date = CURRENT_DATE;

-- Summary query to verify data
SELECT 
    property_type,
    COUNT(*) as count,
    AVG(price)::INTEGER as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM properties 
WHERE created_at > NOW() - INTERVAL '1 day'
GROUP BY property_type
ORDER BY property_type; 
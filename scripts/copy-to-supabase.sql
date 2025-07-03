-- COPY THIS ENTIRE SCRIPT TO SUPABASE SQL EDITOR
-- Comprehensive Homepage Test Data for VirtualEstate

-- Insert Test Properties for All Categories
INSERT INTO properties (
    id, title, description, price, bedrooms, bathrooms, square_feet, 
    address, city, state, zip_code, property_type, status, year_built,
    features, amenities, furnished, has_pool, has_garden, has_security, 
    has_parking, has_gym, created_at
) VALUES 
-- Hero Section Properties (Will rotate in hero tour)
(gen_random_uuid(), 'Stunning Villa with Pool - Katameya Heights', 'Magnificent 5-bedroom villa in prestigious Katameya Heights featuring private pool, landscaped gardens, and golf course views.', 450000, 5, 4, 4200, 'Katameya Heights Compound', 'New Cairo', 'Cairo', '11835', 'villa', 'available', 2020, '["Golf Course View", "Modern Kitchen", "Master Suite"]'::jsonb, '["Swimming Pool", "Private Garden", "Gym", "Security", "Parking"]'::jsonb, true, true, true, true, true, true, NOW() - INTERVAL '5 days'),

(gen_random_uuid(), 'Premium Penthouse with Nile Views - Zamalek', 'Exclusive penthouse apartment with panoramic Nile views in the heart of Zamalek.', 380000, 3, 3, 2800, '26th July Street', 'Cairo', 'Cairo', '11211', 'penthouse', 'available', 2019, '["Nile Views", "Terrace", "Modern Kitchen"]'::jsonb, '["Concierge", "Elevator", "Security", "Parking"]'::jsonb, true, false, false, true, true, false, NOW() - INTERVAL '3 days'),

(gen_random_uuid(), 'Contemporary Apartment - Sheikh Zayed', 'Beautiful 3-bedroom apartment in upscale Sheikh Zayed with premium finishes.', 220000, 3, 2, 1800, 'The Square Mall Area', 'Sheikh Zayed', 'Giza', '12588', 'apartment', 'available', 2021, '["Open Plan", "Built-in Wardrobes", "Modern Kitchen"]'::jsonb, '["Swimming Pool", "Gym", "Security", "Parking"]'::jsonb, false, true, false, true, true, true, NOW() - INTERVAL '2 days'),

-- APARTMENTS Category
(gen_random_uuid(), 'Affordable Family Apartment - Maadi', 'Comfortable 2-bedroom apartment in family-friendly Maadi.', 120000, 2, 2, 1200, 'Road 9, Maadi', 'Cairo', 'Cairo', '11431', 'apartment', 'available', 2018, '["Family Friendly", "Near Schools"]'::jsonb, '["Security", "Parking", "Elevator"]'::jsonb, false, false, false, true, true, false, NOW() - INTERVAL '1 day'),

(gen_random_uuid(), 'Modern Studio - Downtown Cairo', 'Stylish studio apartment in vibrant Downtown Cairo.', 85000, 1, 1, 650, 'Tahrir Square Area', 'Cairo', 'Cairo', '11511', 'studio', 'available', 2022, '["City Views", "Modern Design"]'::jsonb, '["Security", "Elevator"]'::jsonb, true, false, false, true, false, false, NOW() - INTERVAL '1 day'),

-- VILLAS Category  
(gen_random_uuid(), 'Family Villa with Garden - 6th October', 'Spacious 4-bedroom villa in peaceful 6th October City.', 320000, 4, 3, 3200, 'Dreamland Compound', '6th of October', 'Giza', '12566', 'villa', 'available', 2017, '["Large Garden", "Family Oriented"]'::jsonb, '["Private Garden", "Security", "Parking"]'::jsonb, false, false, true, true, true, false, NOW() - INTERVAL '4 days'),

(gen_random_uuid(), 'Luxury Beach Villa - North Coast', 'Exclusive beachfront villa in Marina with direct beach access.', 650000, 4, 4, 3800, 'Marina Resort', 'Marina', 'Alexandria', '23712', 'villa', 'available', 2020, '["Beach Front", "Sea Views"]'::jsonb, '["Beach Access", "Swimming Pool", "Security"]'::jsonb, true, true, true, true, true, true, NOW() - INTERVAL '6 days'),

-- PENTHOUSES Category
(gen_random_uuid(), 'Sky Penthouse - New Capital', 'Ultra-modern penthouse in New Administrative Capital.', 520000, 3, 3, 2200, 'Downtown District R7', 'New Capital', 'Cairo', '11865', 'penthouse', 'available', 2021, '["Sky Views", "Smart Home"]'::jsonb, '["Rooftop Terrace", "Concierge", "Valet Parking"]'::jsonb, true, false, false, true, true, true, NOW() - INTERVAL '7 days'),

-- TOWNHOUSES Category
(gen_random_uuid(), 'Modern Townhouse - New Cairo', 'Contemporary 3-bedroom townhouse in gated community.', 280000, 3, 3, 2400, 'Fifth Settlement', 'New Cairo', 'Cairo', '11835', 'townhouse', 'available', 2019, '["Gated Community", "Modern Design"]'::jsonb, '["Swimming Pool", "Gym", "Security"]'::jsonb, false, true, false, true, true, true, NOW() - INTERVAL '8 days'),

-- UNDER $150K Properties (for filter testing)
(gen_random_uuid(), 'Cozy Apartment - Heliopolis', 'Charming 2-bedroom apartment in historic Heliopolis.', 135000, 2, 1, 1100, 'El-Ahram Street', 'Cairo', 'Cairo', '11757', 'apartment', 'available', 2016, '["Historic Area", "Near Airport"]'::jsonb, '["Security", "Parking"]'::jsonb, false, false, false, true, true, false, NOW() - INTERVAL '2 days'),

(gen_random_uuid(), 'Budget Villa - 10th of Ramadan', 'Affordable 3-bedroom villa in growing area.', 145000, 3, 2, 2000, '10th of Ramadan', '10th of Ramadan', 'Cairo', '44629', 'villa', 'available', 2015, '["Affordable", "Investment Opportunity"]'::jsonb, '["Private Garden", "Parking"]'::jsonb, false, false, true, true, true, false, NOW() - INTERVAL '3 days'),

-- Properties WITH POOL (for filter testing)
(gen_random_uuid(), 'Pool Villa - Palm Hills', 'Beautiful villa with private swimming pool in Palm Hills.', 420000, 4, 4, 3500, 'Palm Hills Compound', '6th of October', 'Giza', '12566', 'villa', 'available', 2018, '["Private Pool", "Compound Living"]'::jsonb, '["Swimming Pool", "Private Garden", "Security"]'::jsonb, true, true, true, true, true, true, NOW() - INTERVAL '5 days'),

-- Properties with CITY VIEWS (for filter testing)
(gen_random_uuid(), 'High-Rise Apartment - Mokattam', 'Stunning apartment with panoramic city views.', 190000, 2, 2, 1400, 'Mokattam Hills', 'Cairo', 'Cairo', '11571', 'apartment', 'available', 2020, '["City Views", "High Floor"]'::jsonb, '["Security", "Parking", "Elevator"]'::jsonb, false, false, false, true, true, false, NOW() - INTERVAL '4 days'),

-- FURNISHED Properties (for filter testing)
(gen_random_uuid(), 'Furnished Apartment - Degla', 'Move-in ready furnished apartment in upscale Degla.', 160000, 2, 2, 1300, 'Street 231, Degla', 'Maadi', 'Cairo', '11431', 'apartment', 'available', 2019, '["Fully Furnished", "Move-in Ready"]'::jsonb, '["Security", "Parking", "Elevator"]'::jsonb, true, false, true, true, true, false, NOW() - INTERVAL '1 day');

-- Add Property Photos (Critical for Hero Section)
WITH new_properties AS (
    SELECT id, property_type, 
           ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM properties 
    WHERE created_at > NOW() - INTERVAL '1 hour'
),
photo_data AS (
    SELECT 
        gen_random_uuid() as photo_id,
        id as property_id,
        CASE 
            WHEN (rn - 1) % 10 = 0 THEN 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&q=80'
            WHEN (rn - 1) % 10 = 1 THEN 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80'
            WHEN (rn - 1) % 10 = 2 THEN 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&q=80'
            WHEN (rn - 1) % 10 = 3 THEN 'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?w=800&q=80'
            WHEN (rn - 1) % 10 = 4 THEN 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800&q=80'
            WHEN (rn - 1) % 10 = 5 THEN 'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=800&q=80'
            WHEN (rn - 1) % 10 = 6 THEN 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&q=80'
            WHEN (rn - 1) % 10 = 7 THEN 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80'
            WHEN (rn - 1) % 10 = 8 THEN 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'
            ELSE 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=80'
        END as photo_url,
        true as is_primary,
        1 as order_index
    FROM new_properties
)
INSERT INTO property_photos (id, property_id, url, is_primary, order_index)
SELECT photo_id, property_id, photo_url, is_primary, order_index FROM photo_data;

-- Add secondary photos
WITH new_properties AS (
    SELECT id, property_type, 
           ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
    FROM properties 
    WHERE created_at > NOW() - INTERVAL '1 hour'
),
photo_data AS (
    SELECT 
        gen_random_uuid() as photo_id,
        id as property_id,
        CASE 
            WHEN (rn - 1) % 8 = 0 THEN 'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800&q=80'
            WHEN (rn - 1) % 8 = 1 THEN 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800&q=80'
            WHEN (rn - 1) % 8 = 2 THEN 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800&q=80'
            WHEN (rn - 1) % 8 = 3 THEN 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800&q=80'
            WHEN (rn - 1) % 8 = 4 THEN 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800&q=80'
            WHEN (rn - 1) % 8 = 5 THEN 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800&q=80'
            WHEN (rn - 1) % 8 = 6 THEN 'https://images.unsplash.com/photo-1519833547608-93ce27ff7d51?w=800&q=80'
            ELSE 'https://images.unsplash.com/photo-1569946709208-e9b97aa3b05e?w=800&q=80'
        END as photo_url,
        false as is_primary,
        2 as order_index
    FROM new_properties
)
INSERT INTO property_photos (id, property_id, url, is_primary, order_index)
SELECT photo_id, property_id, photo_url, is_primary, order_index FROM photo_data;

-- Update view counts for realistic homepage data
UPDATE properties 
SET view_count = (RANDOM() * 1000 + 50)::INTEGER 
WHERE created_at > NOW() - INTERVAL '1 hour';

-- Verify the data was inserted correctly
SELECT 
    'Data Summary:' as info,
    property_type,
    COUNT(*) as count,
    AVG(price)::INTEGER as avg_price,
    MIN(price) as min_price,
    MAX(price) as max_price
FROM properties 
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY property_type
ORDER BY property_type; 
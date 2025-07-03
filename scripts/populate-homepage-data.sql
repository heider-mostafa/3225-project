-- Populate database with test properties for homepage AI recommendations
-- This script adds properties that match various filter combinations

-- Insert properties for "Under $150K" + "Apartments"
INSERT INTO properties (
  id, title, description, address, city, state, zip_code, property_type, 
  price, bedrooms, bathrooms, square_feet, year_built, status,
  features, amenities, has_pool, has_parking, has_garden, has_gym, furnished,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'Cozy Studio Apartment - Maadi',
  'Modern studio apartment in the heart of Maadi. Perfect for young professionals or couples. Features modern appliances and easy access to public transportation.',
  '123 Corniche Street',
  'Maadi',
  'Cairo',
  '12345',
  'apartment',
  120000,
  1,
  1,
  500,
  2020,
  'For Sale',
  '["Modern Kitchen", "City Views", "24/7 Security"]'::jsonb,
  '["Elevator", "Security"]'::jsonb,
  false,
  true,
  false,
  false,
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Budget-Friendly Apartment - Heliopolis',
  'Affordable 2-bedroom apartment in Heliopolis. Great for first-time buyers. Close to schools and shopping centers.',
  '456 El Hegaz Street',
  'Heliopolis',
  'Cairo',
  '12346',
  'apartment',
  135000,
  2,
  1,
  750,
  2018,
  'For Sale',
  '["Balcony", "Parking", "Storage"]'::jsonb,
  '["Parking", "Elevator"]'::jsonb,
  false,
  true,
  false,
  false,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Charming 1BR Apartment - Downtown',
  'Well-maintained 1-bedroom apartment in downtown Cairo. Walking distance to metro station and major attractions.',
  '789 Tahrir Square',
  'Downtown',
  'Cairo',
  '12347',
  'apartment',
  149000,
  1,
  1,
  600,
  2019,
  'For Sale',
  '["Central Location", "Metro Access", "Historic Area"]'::jsonb,
  '["Security", "Elevator"]'::jsonb,
  false,
  false,
  false,
  false,
  false,
  NOW(),
  NOW()
);

-- Insert properties for "New Listings" (created recently)
INSERT INTO properties (
  id, title, description, address, city, state, zip_code, property_type, 
  price, bedrooms, bathrooms, square_feet, year_built, status,
  features, amenities, has_pool, has_parking, has_garden, has_gym, furnished,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'Brand New Apartment - New Cairo',
  'Just listed! Modern 3-bedroom apartment in New Cairo with contemporary finishes and smart home features.',
  '100 New Cairo Boulevard',
  'New Cairo',
  'Cairo',
  '12348',
  'apartment',
  280000,
  3,
  2,
  1200,
  2024,
  'For Sale',
  '["Smart Home", "Modern Finishes", "Balcony", "Parking"]'::jsonb,
  '["Gym", "Swimming Pool", "Security"]'::jsonb,
  true,
  true,
  false,
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'New Listing: Luxury Villa - Sheikh Zayed',
  'Newly available luxury villa in gated community. Private garden, swimming pool, and modern amenities.',
  '200 Sheikh Zayed City',
  'Sheikh Zayed',
  'Giza',
  '12349',
  'villa',
  450000,
  4,
  3,
  2500,
  2023,
  'For Sale',
  '["Private Garden", "Swimming Pool", "Garage", "Security", "Modern Kitchen"]'::jsonb,
  '["Swimming Pool", "Security", "Gym", "Clubhouse"]'::jsonb,
  true,
  true,
  true,
  true,
  false,
  NOW(),
  NOW()
);

-- Insert properties with pools
INSERT INTO properties (
  id, title, description, address, city, state, zip_code, property_type, 
  price, bedrooms, bathrooms, square_feet, year_built, status,
  features, amenities, has_pool, has_parking, has_garden, has_gym, furnished,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'Pool Villa - Palm Hills Compound',
  'Stunning villa with private swimming pool in Palm Hills. Perfect for families who love entertaining.',
  '300 Palm Hills Drive',
  '6th of October',
  'Giza',
  '12350',
  'villa',
  520000,
  5,
  4,
  3000,
  2022,
  'For Sale',
  '["Private Pool", "Garden", "Garage", "Maid Room", "Driver Room"]'::jsonb,
  '["Swimming Pool", "Security", "Clubhouse", "Tennis Court"]'::jsonb,
  true,
  true,
  true,
  false,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Apartment with Pool Access - Zamalek',
  'Elegant apartment in Zamalek with access to building swimming pool and gym facilities.',
  '400 Gezira Street',
  'Zamalek',
  'Cairo',
  '12351',
  'apartment',
  380000,
  3,
  2,
  1400,
  2021,
  'For Sale',
  '["Pool Access", "Gym Access", "Nile Views", "Concierge"]'::jsonb,
  '["Swimming Pool", "Gym", "Concierge", "Security"]'::jsonb,
  true,
  true,
  false,
  true,
  false,
  NOW(),
  NOW()
);

-- Insert properties with city views
INSERT INTO properties (
  id, title, description, address, city, state, zip_code, property_type, 
  price, bedrooms, bathrooms, square_feet, year_built, status,
  features, amenities, has_pool, has_parking, has_garden, has_gym, furnished,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'Penthouse with Panoramic Views - Downtown',
  'Spectacular penthouse with 360-degree city views. Features rooftop terrace and premium finishes.',
  '500 Downtown Tower',
  'Downtown',
  'Cairo',
  '12352',
  'penthouse',
  650000,
  4,
  3,
  2200,
  2023,
  'For Sale',
  '["Panoramic Views", "Rooftop Terrace", "Premium Finishes", "City Views"]'::jsonb,
  '["Concierge", "Gym", "Security", "Elevator"]'::jsonb,
  false,
  true,
  false,
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'High-Floor Apartment with Views - New Capital',
  'Modern apartment on high floor with stunning city and landscape views.',
  '600 Capital Heights',
  'New Capital',
  'Cairo',
  '12353',
  'apartment',
  320000,
  2,
  2,
  1000,
  2024,
  'For Sale',
  '["City Views", "High Floor", "Modern Design", "Balcony"]'::jsonb,
  '["Security", "Elevator", "Parking"]'::jsonb,
  false,
  true,
  false,
  false,
  false,
  NOW(),
  NOW()
);

-- Insert properties with parking
INSERT INTO properties (
  id, title, description, address, city, state, zip_code, property_type, 
  price, bedrooms, bathrooms, square_feet, year_built, status,
  features, amenities, has_pool, has_parking, has_garden, has_gym, furnished,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'Apartment with Covered Parking - Maadi',
  'Spacious 3-bedroom apartment with dedicated covered parking space in secure building.',
  '700 Maadi Avenue',
  'Maadi',
  'Cairo',
  '12354',
  'apartment',
  250000,
  3,
  2,
  1100,
  2020,
  'For Sale',
  '["Covered Parking", "Security", "Balcony", "Storage"]'::jsonb,
  '["Parking", "Security", "Elevator"]'::jsonb,
  false,
  true,
  false,
  false,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Villa with Garage - New Cairo',
  'Family villa with 2-car garage and additional parking space.',
  '800 New Cairo Residence',
  'New Cairo',
  'Cairo',
  '12355',
  'villa',
  420000,
  4,
  3,
  2000,
  2021,
  'For Sale',
  '["2-Car Garage", "Additional Parking", "Garden", "Modern Kitchen"]'::jsonb,
  '["Parking", "Security", "Playground"]'::jsonb,
  false,
  true,
  true,
  false,
  false,
  NOW(),
  NOW()
);

-- Insert furnished properties
INSERT INTO properties (
  id, title, description, address, city, state, zip_code, property_type, 
  price, bedrooms, bathrooms, square_feet, year_built, status,
  features, amenities, has_pool, has_parking, has_garden, has_gym, furnished,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'Fully Furnished Apartment - Zamalek',
  'Move-in ready apartment with high-quality furniture and appliances. Perfect for expatriates.',
  '900 Zamalik Street',
  'Zamalek',
  'Cairo',
  '12356',
  'apartment',
  340000,
  2,
  2,
  900,
  2022,
  'For Sale',
  '["Fully Furnished", "High-Quality Furniture", "Modern Appliances", "Nile Views"]'::jsonb,
  '["Concierge", "Security", "Elevator"]'::jsonb,
  false,
  false,
  false,
  false,
  true,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Furnished Studio - New Administrative Capital',
  'Contemporary furnished studio perfect for professionals working in the New Capital.',
  '1000 Administrative District',
  'New Capital',
  'Cairo',
  '12357',
  'apartment',
  180000,
  1,
  1,
  550,
  2023,
  'For Sale',
  '["Fully Furnished", "Modern Design", "Smart Home Features"]'::jsonb,
  '["Security", "Gym", "Business Center"]'::jsonb,
  false,
  true,
  false,
  true,
  true,
  NOW(),
  NOW()
);

-- Insert some penthouses
INSERT INTO properties (
  id, title, description, address, city, state, zip_code, property_type, 
  price, bedrooms, bathrooms, square_feet, year_built, status,
  features, amenities, has_pool, has_parking, has_garden, has_gym, furnished,
  created_at, updated_at
) VALUES
(
  gen_random_uuid(),
  'Luxury Penthouse - Heliopolis',
  'Exclusive penthouse with private rooftop and premium amenities.',
  '1100 Heliopolis Heights',
  'Heliopolis',
  'Cairo',
  '12358',
  'penthouse',
  850000,
  5,
  4,
  3500,
  2024,
  'For Sale',
  '["Private Rooftop", "Premium Finishes", "Smart Home", "City Views"]'::jsonb,
  '["Concierge", "Gym", "Swimming Pool", "Security"]'::jsonb,
  true,
  true,
  false,
  true,
  false,
  NOW(),
  NOW()
),
(
  gen_random_uuid(),
  'Penthouse with Terrace - Sheikh Zayed',
  'Modern penthouse with large terrace and panoramic views.',
  '1200 Sheikh Zayed Towers',
  'Sheikh Zayed',
  'Giza',
  '12359',
  'penthouse',
  720000,
  4,
  3,
  2800,
  2023,
  'For Sale',
  '["Large Terrace", "Panoramic Views", "Modern Design", "Premium Location"]'::jsonb,
  '["Security", "Gym", "Parking", "Concierge"]'::jsonb,
  false,
  true,
  false,
  true,
  false,
  NOW(),
  NOW()
);

-- Add some property photos for better display
INSERT INTO property_photos (property_id, url, is_primary, order_index, created_at)
SELECT 
  p.id,
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop&crop=house',
  true,
  1,
  NOW()
FROM properties p 
WHERE p.property_type = 'apartment'
AND NOT EXISTS (SELECT 1 FROM property_photos pp WHERE pp.property_id = p.id)
LIMIT 5;

INSERT INTO property_photos (property_id, url, is_primary, order_index, created_at)
SELECT 
  p.id,
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=800&h=600&fit=crop&crop=house',
  true,
  1,
  NOW()
FROM properties p 
WHERE p.property_type = 'villa'
AND NOT EXISTS (SELECT 1 FROM property_photos pp WHERE pp.property_id = p.id)
LIMIT 3;

INSERT INTO property_photos (property_id, url, is_primary, order_index, created_at)
SELECT 
  p.id,
  'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800&h=600&fit=crop&crop=house',
  true,
  1,
  NOW()
FROM properties p 
WHERE p.property_type = 'penthouse'
AND NOT EXISTS (SELECT 1 FROM property_photos pp WHERE pp.property_id = p.id)
LIMIT 3; 
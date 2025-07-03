-- Simplified Egyptian Real Estate Sample Data
-- This script populates the database with realistic properties across Egypt

-- Clear existing data (optional - uncomment if you want to start fresh)
-- DELETE FROM property_photos;
-- DELETE FROM inquiries; 
-- DELETE FROM properties;

-- Insert Sample Properties
INSERT INTO properties (title, description, price, bedrooms, bathrooms, square_feet, address, city, state, zip_code, property_type, status, created_at, updated_at) VALUES
('Luxury Apartment in Madinaty', 
 'Stunning 3-bedroom apartment in the prestigious Madinaty compound. Features modern Italian kitchen, marble floors, central AC, and panoramic views of the landscaped gardens. Located in a prime location with easy access to schools, shopping centers, and recreational facilities. The apartment boasts high-end finishes, built-in wardrobes, and a spacious balcony perfect for entertaining. Madinaty offers world-class amenities including golf course, clubhouse, and 24/7 security.',
 4500000, 3, 2, 2100, 'B7 Street, Madinaty', 'New Cairo', 'Cairo Governorate', '11835', 'apartment', 'for_sale', NOW(), NOW()),

('Modern Penthouse in Hyde Park',
 'Exceptional 4-bedroom penthouse with private rooftop terrace in Hyde Park New Cairo. This architectural masterpiece features floor-to-ceiling windows, premium hardwood floors, and a gourmet kitchen with top-of-the-line appliances. The master suite includes a walk-in closet and spa-like bathroom. Enjoy breathtaking city views from the 300 sqm private terrace with jacuzzi and outdoor kitchen. Hyde Park offers exclusive amenities including beach lagoon, central park, and commercial hub.',
 12000000, 4, 3, 3200, 'Hyde Park Compound', 'New Cairo', 'Cairo Governorate', '11835', 'penthouse', 'for_sale', NOW(), NOW()),

('Elegant Villa in Beverly Hills',
 'Magnificent 5-bedroom villa in the exclusive Beverly Hills compound, Sheikh Zayed. This contemporary home spans 450 sqm on a 600 sqm plot with private pool and landscaped garden. Features include marble entrance, spacious living areas, formal dining room, family room, and maid''s quarters. The villa offers privacy and luxury with high ceilings, premium finishes, and smart home systems. Beverly Hills provides resort-style living with clubhouse, kids area, and 24/7 security.',
 8500000, 5, 4, 4800, 'Beverly Hills Compound', 'Sheikh Zayed', 'Giza Governorate', '12588', 'villa', 'for_sale', NOW(), NOW()),

('Contemporary Villa in Allegria',
 'Stunning 4-bedroom villa in Allegria Golf Resort, Sheikh Zayed. Overlooking the championship 18-hole golf course, this home features open-plan living, designer kitchen, and floor-to-ceiling windows. The master bedroom includes golf course views and ensuite bathroom. Additional features include private garden, covered parking, and storage room. Allegria offers world-class amenities including golf academy, spa, restaurants, and exclusive beach club access.',
 15000000, 4, 3, 3800, 'Allegria Golf Resort', 'Sheikh Zayed', 'Giza Governorate', '12588', 'villa', 'for_sale', NOW(), NOW()),

('Classic Apartment in Zamalek',
 'Charming 2-bedroom apartment in the heart of Zamalek with Nile views. This classic home features high ceilings, hardwood floors, and period details. The spacious living room opens to a balcony overlooking the Nile Corniche. Updated kitchen and bathrooms while maintaining original character. Perfect location near cafes, restaurants, and cultural sites. Walking distance to Gezira Club and Opera House. Ideal for those seeking authentic Cairo living in an upscale neighborhood.',
 3200000, 2, 2, 1400, '15 Shagaret El Dor Street', 'Zamalek', 'Cairo Governorate', '11211', 'apartment', 'for_sale', NOW(), NOW()),

('Family Townhouse in Dreamland',
 'Spacious 3-bedroom townhouse in Dreamland Golf Resort, 6th of October. This family-friendly home features modern design, private garden, and covered parking. Open-plan ground floor with living room, dining area, and fitted kitchen. Three bedrooms upstairs including master with ensuite. Dreamland offers golf course, clubhouse, swimming pools, and kids playground. Excellent community for families with international schools nearby.',
 5200000, 3, 2, 2400, 'Dreamland Golf Resort', '6th of October', 'Giza Governorate', '12566', 'townhouse', 'for_sale', NOW(), NOW()),

('Beachfront Villa in Marina',
 'Exclusive beachfront villa in Marina North Coast. This luxury retreat features direct beach access, private pool, and panoramic sea views. The villa includes 4 bedrooms, open-plan living areas, modern kitchen, and multiple terraces. Premium finishes throughout with marble floors and high-end fixtures. Marina offers 5-star resort amenities including golf course, marina, restaurants, and beach clubs. Perfect for year-round living or vacation home.',
 18000000, 4, 4, 4200, 'Marina Resort', 'Marina', 'North Coast', '12345', 'villa', 'for_sale', NOW(), NOW()),

('Modern Apartment in Capital Gardens',
 'Brand new 2-bedroom apartment in Capital Gardens, New Administrative Capital. This contemporary home features smart home technology, premium finishes, and city views. Open-plan living with modern kitchen and spacious bedrooms. The compound offers swimming pools, gym, commercial area, and green spaces. Strategic location near government district and business hub. Perfect for professionals working in the new capital.',
 2800000, 2, 2, 1300, 'Capital Gardens Compound', 'New Administrative Capital', 'Cairo Governorate', '11865', 'apartment', 'for_sale', NOW(), NOW()),

('Seafront Apartment in Alexandria',
 'Elegant 3-bedroom apartment with Mediterranean Sea views in Sidi Bishr, Alexandria. This coastal home features spacious rooms, updated kitchen, and multiple balconies overlooking the sea. Classic Alexandria architecture with modern amenities. Close to beaches, restaurants, and cultural sites. Perfect for those seeking seaside living with easy access to Cairo. The building offers concierge service and underground parking.',
 4200000, 3, 2, 1800, '25 Corniche Road', 'Sidi Bishr', 'Alexandria Governorate', '21599', 'apartment', 'for_sale', NOW(), NOW()),

('Prime Retail Space in Mall of Egypt',
 'Premium retail space in Mall of Egypt, Sheikh Zayed. This commercial unit offers high visibility, modern fit-out, and excellent foot traffic. Located in one of Egypt''s largest shopping destinations with international brands, restaurants, and entertainment. Perfect for retail, restaurant, or service business. The mall attracts millions of visitors annually and offers ample parking. Flexible lease terms available for serious investors.',
 8000000, NULL, NULL, 1500, 'Mall of Egypt', 'Sheikh Zayed', 'Giza Governorate', '12588', 'commercial', 'for_sale', NOW(), NOW()),

('Affordable Family Apartment in Maadi',
 'Comfortable 2-bedroom apartment in Old Maadi perfect for young families. This well-maintained home features traditional layout, updated bathroom, and balcony with garden view. Quiet residential street with tree-lined avenues and community atmosphere. Close to international schools, Metro station, and Maadi Grand Mall. Great value in one of Cairo''s most established expatriate communities.',
 2100000, 2, 1, 1100, '45 Road 9', 'Maadi', 'Cairo Governorate', '11431', 'apartment', 'for_sale', NOW(), NOW()),

('Modern Studio in Downtown Cairo',
 'Stylish studio apartment in the heart of Downtown Cairo with city views. This contemporary space features efficient layout, modern kitchen, and updated bathroom. Large windows provide plenty of natural light and urban views. Perfect for young professionals or investors. Walking distance to restaurants, cafes, cultural sites, and business district. Easy access to public transportation and major attractions.',
 850000, 1, 1, 450, '12 Tahrir Square', 'Downtown', 'Cairo Governorate', '11511', 'studio', 'for_sale', NOW(), NOW()),

('Luxury Villa for Rent in Katameya Heights',
 'Magnificent furnished villa for rent in prestigious Katameya Heights. This executive home features 5 bedrooms, private pool, landscaped garden, and golf course views. Fully furnished with high-end furniture and appliances. Katameya Heights offers 5-star amenities including golf course, clubhouse, spa, and 24/7 security. Perfect for executives, diplomats, or families seeking luxury lifestyle. Available for long-term lease.',
 80000, 5, 4, 5000, 'Katameya Heights', 'New Cairo', 'Cairo Governorate', '11835', 'villa', 'for_rent', NOW(), NOW()),

('Furnished Apartment for Rent in Degla',
 'Beautiful furnished 3-bedroom apartment for rent in Degla, Maadi. This family-friendly home features modern furniture, equipped kitchen, and balcony with garden view. Close to international schools, clubs, and shopping. Quiet neighborhood with excellent public transportation. Perfect for expatriate families or professionals. Utilities and maintenance included in rent.',
 25000, 3, 2, 1600, '8 Street 231', 'Degla', 'Cairo Governorate', '11431', 'apartment', 'for_rent', NOW(), NOW());

-- Add property photos (2 photos per property)
-- First, add primary photos for each property
INSERT INTO property_photos (property_id, url, is_primary, order_index, created_at)
SELECT 
  p.id,
  CASE 
    WHEN p.title = 'Luxury Apartment in Madinaty' THEN 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
    WHEN p.title = 'Modern Penthouse in Hyde Park' THEN 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
    WHEN p.title = 'Elegant Villa in Beverly Hills' THEN 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    WHEN p.title = 'Contemporary Villa in Allegria' THEN 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?w=800'
    WHEN p.title = 'Classic Apartment in Zamalek' THEN 'https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800'
    WHEN p.title = 'Family Townhouse in Dreamland' THEN 'https://images.unsplash.com/photo-1555636222-cae831e670b3?w=800'
    WHEN p.title = 'Beachfront Villa in Marina' THEN 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    WHEN p.title = 'Modern Apartment in Capital Gardens' THEN 'https://images.unsplash.com/photo-1571055058425-e12285c5b5ba?w=800'
    WHEN p.title = 'Seafront Apartment in Alexandria' THEN 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'
    WHEN p.title = 'Prime Retail Space in Mall of Egypt' THEN 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
    WHEN p.title = 'Affordable Family Apartment in Maadi' THEN 'https://images.unsplash.com/photo-1519833547608-93ce27ff7d51?w=800'
    WHEN p.title = 'Modern Studio in Downtown Cairo' THEN 'https://images.unsplash.com/photo-1569946709208-e9b97aa3b05e?w=800'
    WHEN p.title = 'Luxury Villa for Rent in Katameya Heights' THEN 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800'
    ELSE 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=800'
  END as url,
  true as is_primary,
  1 as order_index,
  NOW() as created_at
FROM properties p;

-- Add secondary photos for each property
INSERT INTO property_photos (property_id, url, is_primary, order_index, created_at)
SELECT 
  p.id,
  CASE 
    WHEN p.title = 'Luxury Apartment in Madinaty' THEN 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'
    WHEN p.title = 'Modern Penthouse in Hyde Park' THEN 'https://images.unsplash.com/photo-1574362848149-11496d93a7c7?w=800'
    WHEN p.title = 'Elegant Villa in Beverly Hills' THEN 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800'
    WHEN p.title = 'Contemporary Villa in Allegria' THEN 'https://images.unsplash.com/photo-1505843513577-28017fcf54dd?w=800'
    WHEN p.title = 'Classic Apartment in Zamalek' THEN 'https://images.unsplash.com/photo-1560185008-b033106af5c3?w=800'
    WHEN p.title = 'Family Townhouse in Dreamland' THEN 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=800'
    WHEN p.title = 'Beachfront Villa in Marina' THEN 'https://images.unsplash.com/photo-1571055107559-3e67626fa8be?w=800'
    WHEN p.title = 'Modern Apartment in Capital Gardens' THEN 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800'
    WHEN p.title = 'Seafront Apartment in Alexandria' THEN 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=800'
    WHEN p.title = 'Prime Retail Space in Mall of Egypt' THEN 'https://images.unsplash.com/photo-1519833547608-93ce27ff7d51?w=800'
    WHEN p.title = 'Affordable Family Apartment in Maadi' THEN 'https://images.unsplash.com/photo-1569946709208-e9b97aa3b05e?w=800'
    WHEN p.title = 'Modern Studio in Downtown Cairo' THEN 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800'
    WHEN p.title = 'Luxury Villa for Rent in Katameya Heights' THEN 'https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=800'
    ELSE 'https://images.unsplash.com/photo-1560185007-cde436f6a4d0?w=800'
  END as url,
  false as is_primary,
  2 as order_index,
  NOW() as created_at
FROM properties p;

-- Insert sample inquiries
INSERT INTO inquiries (property_id, name, email, phone, message, status, source, created_at, updated_at)
SELECT 
  p.id,
  'Ahmed Hassan',
  'ahmed.hassan@email.com',
  '+201234567890',
  'I am interested in viewing this apartment. What is the availability for this weekend?',
  'new',
  'website',
  NOW(),
  NOW()
FROM properties p WHERE p.title = 'Luxury Apartment in Madinaty'
LIMIT 1;

INSERT INTO inquiries (property_id, name, email, phone, message, status, source, created_at, updated_at)
SELECT 
  p.id,
  'Sarah Mohamed',
  'sarah.mohamed@email.com',
  '+201987654321',
  'This villa looks perfect for my family. Can you provide more details about the compound amenities?',
  'contacted',
  'website',
  NOW(),
  NOW()
FROM properties p WHERE p.title = 'Elegant Villa in Beverly Hills'
LIMIT 1;

INSERT INTO inquiries (property_id, name, email, phone, message, status, source, created_at, updated_at)
SELECT 
  p.id,
  'John Smith',
  'john.smith@email.com',
  '+201555666777',
  'I am an expat looking for an apartment in Zamalek. Is this property still available?',
  'new',
  'referral',
  NOW(),
  NOW()
FROM properties p WHERE p.title = 'Classic Apartment in Zamalek'
LIMIT 1;

INSERT INTO inquiries (property_id, name, email, phone, message, status, source, created_at, updated_at)
SELECT 
  p.id,
  'Mona Abdel Rahman',
  'mona.abdel@email.com',
  '+201444555666',
  'Interested in this beachfront villa for summer residence. What are the payment options?',
  'qualified',
  'website',
  NOW(),
  NOW()
FROM properties p WHERE p.title = 'Beachfront Villa in Marina'
LIMIT 1;

INSERT INTO inquiries (property_id, name, email, phone, message, status, source, created_at, updated_at)
SELECT 
  p.id,
  'Michael Johnson',
  'michael.johnson@email.com',
  '+201333444555',
  'Looking for executive housing. Is this villa available for immediate occupancy?',
  'new',
  'agent',
  NOW(),
  NOW()
FROM properties p WHERE p.title = 'Luxury Villa for Rent in Katameya Heights'
LIMIT 1;

-- Display success message
SELECT 
  'Database successfully seeded!' as message,
  COUNT(*) as properties_count
FROM properties; 
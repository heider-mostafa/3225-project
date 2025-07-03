-- Add Virtual Tour URLs to Featured Properties
-- This migration adds Realsee and virtual tour URLs to key properties for hero section

-- Update featured properties with virtual tour URLs
UPDATE properties 
SET virtual_tour_url = CASE title
  -- Maadi Modern Townhouse (5th option in hero) - Real Realsee URL provided by user
  WHEN 'Maadi Modern Townhouse' THEN 'https://realsee.ai/KlNNkv54'
  
  -- Other hero section featured properties with virtual tours (using real realsee.ai format)
  WHEN 'Luxury New Capital Penthouse' THEN 'https://realsee.ai/LNC2024demo'
  WHEN 'Zamalek Nile View Apartment' THEN 'https://realsee.ai/ZNV2024demo'
  WHEN 'Alexandria Corniche Villa' THEN 'https://realsee.ai/ACV2024demo'
  WHEN 'Heliopolis Palace District Apartment' THEN 'https://realsee.ai/HPD2024demo'
  WHEN 'Fifth Settlement Villa' THEN 'https://realsee.ai/FSV2024demo'
  WHEN 'North Coast Chalet' THEN 'https://realsee.ai/NCC2024demo'
  WHEN 'Downtown Cairo Heritage Loft' THEN 'https://realsee.ai/DCH2024demo'
  WHEN 'New Alamein Resort Apartment' THEN 'https://realsee.ai/NAR2024demo'
  ELSE virtual_tour_url
END
WHERE title IN (
  'Maadi Modern Townhouse',
  'Luxury New Capital Penthouse', 
  'Zamalek Nile View Apartment',
  'Alexandria Corniche Villa',
  'Heliopolis Palace District Apartment',
  'Fifth Settlement Villa',
  'North Coast Chalet',
  'Downtown Cairo Heritage Loft',
  'New Alamein Resort Apartment'
);

-- Add Virtual 3D Tour Available to key features for properties with virtual tours
UPDATE properties 
SET key_features = CASE 
  WHEN key_features IS NULL OR NOT ('Virtual 3D Tour Available' = ANY(key_features)) 
  THEN COALESCE(key_features, '{}') || ARRAY['Virtual 3D Tour Available']
  ELSE key_features
END
WHERE virtual_tour_url IS NOT NULL AND virtual_tour_url != '';

-- Verify the updates
SELECT title, virtual_tour_url, key_features 
FROM properties 
WHERE virtual_tour_url IS NOT NULL 
ORDER BY title;

-- Also update video tour URLs for backup/alternative viewing
UPDATE properties 
SET video_tour_url = CASE title
  WHEN 'Maadi Modern Townhouse' THEN 'https://www.youtube.com/embed/dummyMaadi2024'
  WHEN 'Luxury New Capital Penthouse' THEN 'https://www.youtube.com/embed/dummyLNC2024'
  WHEN 'Zamalek Nile View Apartment' THEN 'https://www.youtube.com/embed/dummyZNV2024'
  WHEN 'Alexandria Corniche Villa' THEN 'https://www.youtube.com/embed/dummyACV2024'
  WHEN 'Heliopolis Palace District Apartment' THEN 'https://www.youtube.com/embed/dummyHPD2024'
  WHEN 'North Coast Chalet' THEN 'https://www.youtube.com/embed/dummyNCC2024'
  WHEN 'Fifth Settlement Villa' THEN 'https://www.youtube.com/embed/dummyFSV2024'
  WHEN 'Downtown Cairo Heritage Loft' THEN 'https://www.youtube.com/embed/dummyDCH2024'
  WHEN 'New Alamein Resort Apartment' THEN 'https://www.youtube.com/embed/dummyNAR2024'
  WHEN 'Mohandessin Executive Apartment' THEN 'https://www.youtube.com/embed/dummyMEA2024'
  ELSE video_tour_url
END
WHERE title IN (
  'Maadi Modern Townhouse',
  'Luxury New Capital Penthouse',
  'Zamalek Nile View Apartment',
  'Alexandria Corniche Villa',
  'Heliopolis Palace District Apartment',
  'North Coast Chalet',
  'Fifth Settlement Villa',
  'Downtown Cairo Heritage Loft',
  'New Alamein Resort Apartment',
  'Mohandessin Executive Apartment'
);

-- Add marketing headlines to make properties more appealing in hero section
UPDATE properties 
SET marketing_headline = CASE title
  WHEN 'Maadi Modern Townhouse' THEN 'Modern Family Haven with Garden Views'
  WHEN 'Luxury New Capital Penthouse' THEN 'Exclusive Sky-High Living Experience'
  WHEN 'Zamalek Nile View Apartment' THEN 'Timeless Elegance with River Views'
  WHEN 'Alexandria Corniche Villa' THEN 'Mediterranean Luxury by the Sea'
  WHEN 'Heliopolis Palace District Apartment' THEN 'Historic Charm Meets Modern Comfort'
  WHEN 'North Coast Chalet' THEN 'Beachfront Paradise Awaits'
  WHEN 'Fifth Settlement Villa' THEN 'Contemporary Living in Gated Community'
  WHEN 'Downtown Cairo Heritage Loft' THEN 'Urban Sophistication Redefined'
  WHEN 'New Alamein Resort Apartment' THEN 'Resort-Style Living by the Coast'
  WHEN 'Mohandessin Executive Apartment' THEN 'Executive Comfort in Prime Location'
  ELSE marketing_headline
END
WHERE title IN (
  'Maadi Modern Townhouse',
  'Luxury New Capital Penthouse',
  'Zamalek Nile View Apartment',
  'Alexandria Corniche Villa',
  'Heliopolis Palace District Apartment',
  'North Coast Chalet',
  'Fifth Settlement Villa',
  'Downtown Cairo Heritage Loft',
  'New Alamein Resort Apartment',
  'Mohandessin Executive Apartment'
);

-- Update key features to highlight virtual tour availability
-- Check if key_features is jsonb or text[] and handle accordingly
DO $$
DECLARE
  column_type text;
BEGIN
  -- Get the data type of key_features column
  SELECT data_type INTO column_type
  FROM information_schema.columns 
  WHERE table_name = 'properties' 
  AND column_name = 'key_features';
  
  -- Handle different column types
  IF column_type = 'jsonb' THEN
    -- For jsonb arrays
    UPDATE properties 
    SET key_features = COALESCE(key_features, '[]'::jsonb) || '["Virtual 3D Tour Available"]'::jsonb
    WHERE title IN (
      'Maadi Modern Townhouse',
      'Luxury New Capital Penthouse',
      'Zamalek Nile View Apartment',
      'Alexandria Corniche Villa',
      'Heliopolis Palace District Apartment',
      'North Coast Chalet',
      'Fifth Settlement Villa',
      'Downtown Cairo Heritage Loft',
      'New Alamein Resort Apartment',
      'Mohandessin Executive Apartment'
    )
    AND NOT (key_features ? 'Virtual 3D Tour Available');
    
  ELSIF column_type = 'ARRAY' OR column_type LIKE '%[]' THEN
    -- For text arrays
    UPDATE properties 
    SET key_features = COALESCE(key_features, '{}') || ARRAY['Virtual 3D Tour Available']
    WHERE title IN (
      'Maadi Modern Townhouse',
      'Luxury New Capital Penthouse',
      'Zamalek Nile View Apartment',
      'Alexandria Corniche Villa',
      'Heliopolis Palace District Apartment',
      'North Coast Chalet',
      'Fifth Settlement Villa',
      'Downtown Cairo Heritage Loft',
      'New Alamein Resort Apartment',
      'Mohandessin Executive Apartment'
    )
    AND NOT ('Virtual 3D Tour Available' = ANY(COALESCE(key_features, '{}')));
    
  ELSE
    -- For other types, skip this update
    RAISE NOTICE 'Skipping key_features update - unsupported column type: %', column_type;
  END IF;
END $$;

-- Log the update for debugging
DO $$
BEGIN
  RAISE NOTICE 'Virtual tour URLs added to % properties', 
    (SELECT COUNT(*) FROM properties WHERE virtual_tour_url IS NOT NULL);
  
  RAISE NOTICE 'Maadi Modern Townhouse virtual tour URL: %', 
    (SELECT virtual_tour_url FROM properties WHERE title = 'Maadi Modern Townhouse');
END $$; 
-- Enhanced Media Schema Migration
-- Adds missing fields to property_photos and creates new tables for videos and documents

-- Add missing fields to property_photos table
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS filename TEXT;
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS file_size BIGINT;
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS alt_text TEXT;
ALTER TABLE property_photos ADD COLUMN IF NOT EXISTS caption TEXT;

-- Create property_videos table
CREATE TABLE IF NOT EXISTS property_videos (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  duration INTEGER, -- in seconds
  file_size BIGINT,
  mime_type TEXT,
  storage_path TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create property_documents table  
CREATE TABLE IF NOT EXISTS property_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  filename TEXT NOT NULL,
  file_size BIGINT,
  mime_type TEXT,
  document_type TEXT, -- floor_plan, brochure, contract, etc.
  storage_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create indexes for new tables
CREATE INDEX IF NOT EXISTS idx_property_videos_property_id ON property_videos(property_id);
CREATE INDEX IF NOT EXISTS idx_property_videos_order_index ON property_videos(order_index);
CREATE INDEX IF NOT EXISTS idx_property_documents_property_id ON property_documents(property_id);
CREATE INDEX IF NOT EXISTS idx_property_documents_type ON property_documents(document_type);

-- Create indexes for new property_photos columns
CREATE INDEX IF NOT EXISTS idx_property_photos_category ON property_photos(category);
CREATE INDEX IF NOT EXISTS idx_property_photos_order_index ON property_photos(order_index);

-- Enable RLS for new tables
ALTER TABLE property_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_documents ENABLE ROW LEVEL SECURITY;

-- Create policies for property_videos
CREATE POLICY "Allow public read access to property_videos"
  ON property_videos FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert property_videos"
  ON property_videos FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update property_videos"
  ON property_videos FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete property_videos"
  ON property_videos FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create policies for property_documents
CREATE POLICY "Allow public read access to property_documents"
  ON property_documents FOR SELECT
  USING (true);

CREATE POLICY "Allow authenticated users to insert property_documents"
  ON property_documents FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to update property_documents"
  ON property_documents FOR UPDATE
  USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to delete property_documents"
  ON property_documents FOR DELETE
  USING (auth.role() = 'authenticated');

-- Create additional storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('property-videos', 'property-videos', true),
  ('property-documents', 'property-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Add storage policies for property videos
CREATE POLICY "Allow public read access to property videos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'property-videos');

CREATE POLICY "Allow authenticated uploads to property videos"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-videos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated updates to property videos"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-videos' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated deletes to property videos"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-videos' 
    AND auth.role() = 'authenticated'
  );

-- Add storage policies for property documents
CREATE POLICY "Allow authenticated read access to property documents"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'property-documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated uploads to property documents" 
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'property-documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated updates to property documents"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'property-documents' 
    AND auth.role() = 'authenticated'
  );

CREATE POLICY "Allow authenticated deletes to property documents"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'property-documents' 
    AND auth.role() = 'authenticated'
  );

-- Create update triggers for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_property_videos_updated_at'
  ) THEN
    CREATE TRIGGER update_property_videos_updated_at 
      BEFORE UPDATE ON property_videos 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_property_documents_updated_at'
  ) THEN
    CREATE TRIGGER update_property_documents_updated_at 
      BEFORE UPDATE ON property_documents 
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$; 
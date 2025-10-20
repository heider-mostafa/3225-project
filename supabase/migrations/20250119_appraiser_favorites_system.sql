-- Appraiser Favorites/Bookmark System
-- Allows users to save and manage their preferred appraisers

-- Table for storing user favorites
CREATE TABLE IF NOT EXISTS appraiser_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  appraiser_id UUID NOT NULL REFERENCES brokers(id) ON DELETE CASCADE,
  notes TEXT, -- Personal notes about the appraiser
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, appraiser_id) -- Prevent duplicate favorites
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_appraiser_favorites_user_id ON appraiser_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_favorites_appraiser_id ON appraiser_favorites(appraiser_id);
CREATE INDEX IF NOT EXISTS idx_appraiser_favorites_created_at ON appraiser_favorites(created_at DESC);

-- Enable RLS
ALTER TABLE appraiser_favorites ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only manage their own favorites
CREATE POLICY "Users can view their own favorites" ON appraiser_favorites
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add their own favorites" ON appraiser_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own favorites" ON appraiser_favorites
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" ON appraiser_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- Function to get user's favorite appraisers with full details
CREATE OR REPLACE FUNCTION get_user_favorite_appraisers(p_user_id UUID DEFAULT auth.uid())
RETURNS TABLE (
  favorite_id UUID,
  notes TEXT,
  favorited_at TIMESTAMP,
  appraiser_id UUID,
  full_name VARCHAR,
  profile_headline VARCHAR,
  standardized_headshot_url VARCHAR,
  average_rating DECIMAL(3,2),
  total_reviews INTEGER,
  years_of_experience INTEGER,
  response_time_hours INTEGER,
  service_areas JSONB,
  property_types TEXT[]
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    af.id as favorite_id,
    af.notes,
    af.created_at as favorited_at,
    b.id as appraiser_id,
    b.full_name,
    b.profile_headline,
    b.standardized_headshot_url,
    b.average_rating,
    b.total_reviews,
    b.years_of_experience,
    b.response_time_hours,
    b.service_areas,
    array_agg(DISTINCT aps.property_type) as property_types
  FROM appraiser_favorites af
  JOIN brokers b ON af.appraiser_id = b.id
  LEFT JOIN appraiser_property_statistics aps ON b.id = aps.appraiser_id
  WHERE af.user_id = p_user_id
    AND b.public_profile_active = true
    AND b.is_active = true
  GROUP BY af.id, af.notes, af.created_at, b.id, b.full_name, b.profile_headline, 
           b.standardized_headshot_url, b.average_rating, b.total_reviews, 
           b.years_of_experience, b.response_time_hours, b.service_areas
  ORDER BY af.created_at DESC;
END;
$$;

-- Function to check if appraiser is favorited by user
CREATE OR REPLACE FUNCTION is_appraiser_favorited(p_appraiser_id UUID, p_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM appraiser_favorites 
    WHERE user_id = p_user_id AND appraiser_id = p_appraiser_id
  );
END;
$$;

-- Function to toggle favorite status
CREATE OR REPLACE FUNCTION toggle_appraiser_favorite(
  p_appraiser_id UUID,
  p_notes TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT auth.uid()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_favorite_id UUID;
  v_action TEXT;
BEGIN
  -- Check if already favorited
  SELECT id INTO v_favorite_id 
  FROM appraiser_favorites 
  WHERE user_id = p_user_id AND appraiser_id = p_appraiser_id;
  
  IF v_favorite_id IS NOT NULL THEN
    -- Remove from favorites
    DELETE FROM appraiser_favorites WHERE id = v_favorite_id;
    v_action := 'removed';
  ELSE
    -- Add to favorites
    INSERT INTO appraiser_favorites (user_id, appraiser_id, notes)
    VALUES (p_user_id, p_appraiser_id, p_notes)
    RETURNING id INTO v_favorite_id;
    v_action := 'added';
  END IF;
  
  RETURN jsonb_build_object(
    'action', v_action,
    'favorite_id', v_favorite_id,
    'is_favorited', CASE WHEN v_action = 'added' THEN true ELSE false END
  );
END;
$$;

-- Comments for documentation
COMMENT ON TABLE appraiser_favorites IS 'User favorites/bookmarks for appraisers';
COMMENT ON FUNCTION get_user_favorite_appraisers IS 'Gets all favorite appraisers for a user with full details';
COMMENT ON FUNCTION is_appraiser_favorited IS 'Checks if an appraiser is favorited by a user';
COMMENT ON FUNCTION toggle_appraiser_favorite IS 'Toggles favorite status for an appraiser';
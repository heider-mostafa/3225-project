-- Social Media Campaign System Migration
-- This migration adds comprehensive social media automation capabilities

-- Create social_media_accounts table for managing connected platforms
CREATE TABLE IF NOT EXISTS social_media_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube')),
  account_name TEXT NOT NULL,
  account_id TEXT, -- Platform-specific account ID
  access_token TEXT, -- Encrypted access token
  refresh_token TEXT, -- For token refresh
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_metadata JSONB DEFAULT '{}', -- Platform-specific data like page_id, business_account_id, etc.
  is_active BOOLEAN DEFAULT true,
  is_business_account BOOLEAN DEFAULT false,
  posting_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(platform, account_id)
);

-- Create social_media_campaigns table for campaign management
CREATE TABLE IF NOT EXISTS social_media_campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT DEFAULT 'property_listing' CHECK (campaign_type IN ('property_listing', 'property_update', 'price_drop', 'open_house', 'custom')),
  
  -- Selected images and content
  selected_image_ids UUID[] DEFAULT '{}', -- References to property_photos.id
  primary_image_id UUID, -- Main image for the campaign
  
  -- Generated content
  generated_captions JSONB DEFAULT '{}', -- Platform-specific captions
  custom_captions JSONB DEFAULT '{}', -- User customized captions
  hashtags JSONB DEFAULT '{}', -- Platform-specific hashtags
  
  -- Scheduling
  scheduled_posts JSONB DEFAULT '{}', -- Array of scheduled posts with platform, datetime, status
  auto_generate_content BOOLEAN DEFAULT true,
  use_ai_optimization BOOLEAN DEFAULT true,
  
  -- Targeting and optimization
  target_audience JSONB DEFAULT '{}', -- Demographic and geographic targeting
  optimization_goal TEXT DEFAULT 'engagement' CHECK (optimization_goal IN ('engagement', 'reach', 'clicks', 'leads')),
  budget_allocation JSONB DEFAULT '{}', -- Budget per platform if using paid promotion
  
  -- Status and analytics
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'active', 'completed', 'paused', 'cancelled')),
  total_posts_scheduled INTEGER DEFAULT 0,
  total_posts_published INTEGER DEFAULT 0,
  total_engagement INTEGER DEFAULT 0,
  total_reach INTEGER DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  total_leads INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create social_media_posts table for individual post tracking
CREATE TABLE IF NOT EXISTS social_media_posts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  campaign_id UUID REFERENCES social_media_campaigns(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('facebook', 'instagram', 'twitter', 'linkedin', 'tiktok', 'youtube')),
  
  -- Post content
  caption TEXT NOT NULL,
  hashtags TEXT[] DEFAULT '{}',
  image_urls TEXT[] DEFAULT '{}', -- URLs of images to post
  video_url TEXT,
  
  -- Scheduling
  scheduled_time TIMESTAMP WITH TIME ZONE NOT NULL,
  published_at TIMESTAMP WITH TIME ZONE,
  
  -- Platform-specific data
  platform_post_id TEXT, -- ID returned by the platform after posting
  platform_post_url TEXT, -- Direct URL to the post
  post_type TEXT DEFAULT 'image' CHECK (post_type IN ('image', 'video', 'carousel', 'story', 'reel')),
  
  -- Analytics from platforms
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  shares_count INTEGER DEFAULT 0,
  reach_count INTEGER DEFAULT 0,
  impressions_count INTEGER DEFAULT 0,
  clicks_count INTEGER DEFAULT 0,
  saves_count INTEGER DEFAULT 0,
  
  -- Status
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'publishing', 'published', 'failed', 'cancelled')),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  
  -- Metadata
  posting_metadata JSONB DEFAULT '{}', -- Platform-specific posting options
  analytics_last_updated TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create social_media_analytics table for detailed analytics tracking
CREATE TABLE IF NOT EXISTS social_media_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  post_id UUID REFERENCES social_media_posts(id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES social_media_campaigns(id) ON DELETE CASCADE,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  platform TEXT NOT NULL,
  
  -- Metrics snapshot
  metric_type TEXT NOT NULL CHECK (metric_type IN ('engagement', 'reach', 'impressions', 'clicks', 'saves', 'shares', 'comments', 'likes', 'leads')),
  metric_value INTEGER NOT NULL,
  metric_date DATE NOT NULL,
  
  -- Additional context
  demographic_data JSONB DEFAULT '{}', -- Age, gender, location breakdowns
  time_of_day_data JSONB DEFAULT '{}', -- Performance by hour
  content_performance JSONB DEFAULT '{}', -- Which content elements performed best
  
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  UNIQUE(post_id, metric_type, metric_date)
);

-- Create content_templates table for reusable post templates
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT DEFAULT 'general' CHECK (category IN ('luxury', 'affordable', 'commercial', 'rental', 'villa', 'apartment', 'general')),
  property_type TEXT, -- apartment, villa, townhouse, etc.
  
  -- Template content
  caption_template TEXT NOT NULL, -- With placeholders like {property_title}, {price}, {location}
  hashtag_sets JSONB DEFAULT '{}', -- Different hashtag combinations for different platforms
  cta_templates JSONB DEFAULT '{}', -- Call-to-action variations
  
  -- Template metadata
  performance_score DECIMAL(3,2) DEFAULT 0.0, -- Based on historical performance
  usage_count INTEGER DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE,
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Create campaign_performance_summary view for easy analytics
CREATE OR REPLACE VIEW campaign_performance_summary AS
SELECT 
  c.id,
  c.name,
  c.property_id,
  p.title as property_title,
  c.status,
  c.created_at,
  COUNT(DISTINCT sp.id) as total_posts,
  COUNT(CASE WHEN sp.status = 'published' THEN 1 END) as published_posts,
  COUNT(CASE WHEN sp.status = 'failed' THEN 1 END) as failed_posts,
  COALESCE(SUM(sp.likes_count), 0) as total_likes,
  COALESCE(SUM(sp.comments_count), 0) as total_comments,
  COALESCE(SUM(sp.shares_count), 0) as total_shares,
  COALESCE(SUM(sp.reach_count), 0) as total_reach,
  COALESCE(SUM(sp.clicks_count), 0) as total_clicks,
  CASE 
    WHEN COUNT(CASE WHEN sp.status = 'published' THEN 1 END) > 0 
    THEN ROUND(
      (COALESCE(SUM(sp.likes_count), 0) + COALESCE(SUM(sp.comments_count), 0) + COALESCE(SUM(sp.shares_count), 0))::decimal / 
      COUNT(CASE WHEN sp.status = 'published' THEN 1 END), 2
    )
    ELSE 0 
  END as avg_engagement_per_post
FROM social_media_campaigns c
LEFT JOIN properties p ON c.property_id = p.id
LEFT JOIN social_media_posts sp ON c.id = sp.campaign_id
GROUP BY c.id, c.name, c.property_id, p.title, c.status, c.created_at;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_platform ON social_media_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_accounts_active ON social_media_accounts(is_active);

CREATE INDEX IF NOT EXISTS idx_social_media_campaigns_property_id ON social_media_campaigns(property_id);
CREATE INDEX IF NOT EXISTS idx_social_media_campaigns_status ON social_media_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_social_media_campaigns_created_at ON social_media_campaigns(created_at);

CREATE INDEX IF NOT EXISTS idx_social_media_posts_campaign_id ON social_media_posts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_property_id ON social_media_posts(property_id);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_platform ON social_media_posts(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_status ON social_media_posts(status);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_scheduled_time ON social_media_posts(scheduled_time);
CREATE INDEX IF NOT EXISTS idx_social_media_posts_published_at ON social_media_posts(published_at);

CREATE INDEX IF NOT EXISTS idx_social_media_analytics_post_id ON social_media_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_campaign_id ON social_media_analytics(campaign_id);
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_property_id ON social_media_analytics(property_id);
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_platform ON social_media_analytics(platform);
CREATE INDEX IF NOT EXISTS idx_social_media_analytics_metric_date ON social_media_analytics(metric_date);

CREATE INDEX IF NOT EXISTS idx_content_templates_category ON content_templates(category);
CREATE INDEX IF NOT EXISTS idx_content_templates_property_type ON content_templates(property_type);
CREATE INDEX IF NOT EXISTS idx_content_templates_active ON content_templates(is_active);

-- Enable RLS on all tables
ALTER TABLE social_media_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE social_media_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;

-- Add some default content templates for Egyptian real estate
INSERT INTO content_templates (name, category, property_type, caption_template, hashtag_sets, cta_templates) VALUES
('Luxury Apartment Showcase', 'luxury', 'apartment', '🏢 Discover luxury living at its finest! This stunning {bedrooms}-bedroom apartment in {location} offers {key_feature}. 💎

✨ Highlights:
• {amenities}
• Premium location in {compound}
• {square_feet} sqft of elegant space

💰 Price: {price} EGP

Ready to call this home? 🏠', 
'{"facebook": ["#LuxuryLiving", "#Egypt", "#CairoProperties", "#RealEstate", "#Apartment", "#LuxuryHomes"], "instagram": ["#LuxuryLiving", "#Egypt", "#CairoProperties", "#RealEstate", "#Apartment", "#LuxuryHomes", "#PropertyForSale", "#DreamHome"], "linkedin": ["#RealEstate", "#Investment", "#Egypt", "#Properties"]}', 
'{"facebook": "Contact us today for a private viewing!", "instagram": "DM us for more details! 📱", "linkedin": "Connect with us for investment opportunities."}'),

('Villa Lifestyle Focus', 'luxury', 'villa', '🏡 Villa living redefined! Experience the perfect blend of luxury and comfort in this magnificent {bedrooms}-bedroom villa.

🌟 What makes this special:
• Private {amenities}
• Located in prestigious {compound}
• {square_feet} sqft of pure elegance
• {key_feature}

💲 {price} EGP

Your dream villa awaits! 🌟', 
'{"facebook": ["#VillaLife", "#Egypt", "#LuxuryVillas", "#Properties", "#RealEstate", "#DreamHome"], "instagram": ["#VillaLife", "#Egypt", "#LuxuryVillas", "#Properties", "#RealEstate", "#DreamHome", "#PropertyGoals", "#VillaForSale"], "twitter": ["#VillaLife", "#Egypt", "#RealEstate", "#Properties"]}', 
'{"facebook": "Schedule your tour today!", "instagram": "Swipe for more photos! ➡️", "twitter": "Thread with full details below 🧵"}'),

('Affordable Housing Solution', 'affordable', 'apartment', '🏠 Affordable luxury within reach! This beautiful {bedrooms}-bedroom apartment in {location} proves you don''t have to compromise on quality.

💫 Features:
• {amenities}
• {square_feet} sqft
• {key_feature}
• Great location in {compound}

💰 Only {price} EGP

Home ownership made accessible! 🔑', 
'{"facebook": ["#AffordableHousing", "#Egypt", "#Properties", "#RealEstate", "#FirstHome", "#Investment"], "instagram": ["#AffordableHousing", "#Egypt", "#Properties", "#RealEstate", "#FirstHome", "#Investment", "#PropertyInvestment"], "linkedin": ["#RealEstate", "#Investment", "#AffordableHousing", "#Egypt"]}', 
'{"facebook": "Message us to learn about our flexible payment plans!", "instagram": "Comment below for payment options! 💬", "linkedin": "Let''s discuss investment opportunities."}'),

('Commercial Property Investment', 'commercial', 'commercial', '🏢 Premium commercial opportunity in {location}! This {square_feet} sqft space is perfect for businesses looking to establish themselves in a prime location.

📈 Investment Highlights:
• {amenities}
• Strategic location in {compound}
• {key_feature}
• High ROI potential

💼 Price: {price} EGP

Invest in your business future! 📊', 
'{"facebook": ["#Commercial", "#Investment", "#Business", "#Egypt", "#RealEstate", "#CommercialSpace"], "instagram": ["#Commercial", "#Investment", "#Business", "#Egypt", "#RealEstate", "#CommercialSpace", "#BusinessOpportunity"], "linkedin": ["#Commercial", "#Investment", "#Business", "#RealEstate", "#Egypt", "#CommercialProperty"]}', 
'{"facebook": "Contact our commercial team today!", "instagram": "DM for detailed ROI analysis! 📊", "linkedin": "Let''s schedule a commercial consultation."}');

-- Add function to automatically update campaign analytics
CREATE OR REPLACE FUNCTION update_campaign_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update campaign totals when post analytics change
  UPDATE social_media_campaigns 
  SET 
    total_engagement = (
      SELECT COALESCE(SUM(likes_count + comments_count + shares_count), 0)
      FROM social_media_posts 
      WHERE campaign_id = NEW.campaign_id
    ),
    total_reach = (
      SELECT COALESCE(SUM(reach_count), 0)
      FROM social_media_posts 
      WHERE campaign_id = NEW.campaign_id
    ),
    total_clicks = (
      SELECT COALESCE(SUM(clicks_count), 0)
      FROM social_media_posts 
      WHERE campaign_id = NEW.campaign_id
    ),
    updated_at = NOW()
  WHERE id = NEW.campaign_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update campaign analytics
CREATE TRIGGER trigger_update_campaign_analytics
  AFTER UPDATE OF likes_count, comments_count, shares_count, reach_count, clicks_count
  ON social_media_posts
  FOR EACH ROW
  EXECUTE FUNCTION update_campaign_analytics();

-- Add success message
SELECT 'Social Media Campaign System successfully created!' as message; 
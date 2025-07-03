import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { generateEnhancedContent } from '@/components/social-media/enhanced-content-generator'

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')

    let query = supabase
      .from('social_media_campaigns')
      .select(`
        *,
        properties!inner(id, title, address, price, property_type),
        social_media_posts(
          id,
          platform,
          status,
          scheduled_time,
          published_at,
          likes_count,
          comments_count,
          shares_count,
          reach_count,
          clicks_count
        )
      `)
      .order('created_at', { ascending: false })

    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }

    const { data, error } = await query

    if (error) throw error

    return NextResponse.json({ campaigns: data })
  } catch (error) {
    console.error('Error fetching campaigns:', error)
    return NextResponse.json(
      { error: 'Failed to fetch campaigns' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    
    const {
      property_id,
      name,
      description,
      campaign_type = 'property_listing',
      selected_image_ids = [],
      primary_image_id,
      platforms,
      scheduled_times,
      auto_generate_content = true,
      use_ai_optimization = true,
      target_audience = {},
      optimization_goal = 'engagement'
    } = body

    // Validate required fields
    if (!property_id || !name || !platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: property_id, name, platforms' },
        { status: 400 }
      )
    }

    // Fetch property data for content generation
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single()

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      )
    }

    // Fetch selected images
    const { data: images, error: imagesError } = await supabase
      .from('property_photos')
      .select('*')
      .in('id', selected_image_ids)
      .order('order_index')

    if (imagesError) {
      console.error('Error fetching images:', imagesError)
    }

    // Generate content if auto_generate_content is true
    let generated_captions: Record<string, string> = {}
    let hashtags: Record<string, string[]> = {}

    if (auto_generate_content) {
      // Use our enhanced content generator instead of templates
      for (const platform of platforms) {
        const enhancedContent = generateEnhancedContent(property, platform, campaign_type)
        generated_captions[platform] = enhancedContent
        
        // Extract hashtags from the generated content (they're at the end)
        const hashtagMatch = enhancedContent.match(/#\w+(?:\s+#\w+)*/g)
        if (hashtagMatch) {
          hashtags[platform] = hashtagMatch[0].split(' ').map(tag => tag.replace('#', ''))
        } else {
          // Fallback hashtags
          hashtags[platform] = getDefaultHashtags(property, platform)
        }
      }
    }

    // Create the campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('social_media_campaigns')
      .insert({
        property_id,
        name,
        description,
        campaign_type,
        selected_image_ids,
        primary_image_id,
        generated_captions,
        hashtags,
        auto_generate_content,
        use_ai_optimization,
        target_audience,
        optimization_goal,
        status: 'draft'
      })
      .select()
      .single()

    if (campaignError) throw campaignError

    // Create individual posts for each platform and time
    const posts = []
    for (const platform of platforms) {
      const platformTimes = (scheduled_times as Record<string, string[]>)[platform] || []
      
      for (const timeSlot of platformTimes) {
        const postData = {
          campaign_id: campaign.id,
          property_id,
          platform,
          caption: generated_captions[platform] || '',
          hashtags: hashtags[platform] || [],
          image_urls: images?.map((img: any) => img.url) || [],
          scheduled_time: timeSlot,
          post_type: (images && images.length > 1) ? 'carousel' : 'image',
          status: 'scheduled'
        }
        posts.push(postData)
      }
    }

    if (posts.length > 0) {
      const { error: postsError } = await supabase
        .from('social_media_posts')
        .insert(posts)

      if (postsError) {
        console.error('Error creating posts:', postsError)
      }
    }

    // Update campaign with post count
    await supabase
      .from('social_media_campaigns')
      .update({ total_posts_scheduled: posts.length })
      .eq('id', campaign.id)

    return NextResponse.json({ 
      campaign,
      posts_created: posts.length,
      message: 'Campaign created successfully' 
    })

  } catch (error) {
    console.error('Error creating campaign:', error)
    return NextResponse.json(
      { error: 'Failed to create campaign' },
      { status: 500 }
    )
  }
}

function getDefaultHashtags(property: any, platform: string): string[] {
  const baseHashtags = ['RealEstate', 'Egypt', 'Property', 'DreamHome']
  const cityTag = property.city?.replace(/\s+/g, '') || 'Cairo'
  const typeTag = property.property_type?.replace(/\s+/g, '') || 'Apartment'
  
  const platformTags = {
    facebook: [...baseHashtags, cityTag, typeTag, 'Investment', 'NewHome'],
    instagram: [...baseHashtags, cityTag, typeTag, 'PropertyGoals', 'NewHome', 'Lifestyle', 'HomeDesign'],
    twitter: [...baseHashtags, cityTag, typeTag, 'Investment'],
    linkedin: [...baseHashtags, cityTag, 'Investment', 'PropertyInvestment', 'RealEstateInvestment']
  }
  
  return platformTags[platform as keyof typeof platformTags] || baseHashtags
}

function generateCaption(property: any, template: any, platform: string): string {
  let caption = template.caption_template

  // Replace placeholders with property data
  const replacements = {
    '{property_title}': property.title || '',
    '{bedrooms}': property.bedrooms?.toString() || '',
    '{bathrooms}': property.bathrooms?.toString() || '',
    '{price}': formatPrice(property.price),
    '{location}': property.city || property.address || '',
    '{compound}': property.compound || '',
    '{square_feet}': property.square_feet?.toString() || '',
    '{key_feature}': getKeyFeature(property),
    '{amenities}': getAmenities(property)
  }

  for (const [placeholder, value] of Object.entries(replacements)) {
    caption = caption.replace(new RegExp(placeholder, 'g'), value)
  }

  // Add platform-specific CTA
  const cta = (template.cta_templates as Record<string, string>)?.[platform] || 'Contact us for more information!'
  caption += `\n\n${cta}`

  return caption
}

function formatPrice(price: number): string {
  if (!price) return 'Price on request'
  
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`
  }
  return price.toString()
}

function getKeyFeature(property: any): string {
  const features = []
  
  if (property.has_pool) features.push('private pool')
  if (property.has_garden) features.push('beautiful garden')
  if (property.has_security) features.push('24/7 security')
  if (property.has_gym) features.push('fitness center')
  if (property.furnished) features.push('fully furnished')
  
  return features.length > 0 ? features[0] : 'premium amenities'
}

function getAmenities(property: any): string {
  const amenities = []
  
  if (property.has_pool) amenities.push('Swimming Pool')
  if (property.has_garden) amenities.push('Garden')
  if (property.has_security) amenities.push('Security')
  if (property.has_gym) amenities.push('Gym')
  if (property.has_parking) amenities.push('Parking')
  if (property.has_playground) amenities.push('Playground')
  
  return amenities.slice(0, 3).join('\n• ') || 'Premium amenities'
} 
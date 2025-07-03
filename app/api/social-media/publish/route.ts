import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Types for better type safety
interface SocialMediaPost {
  id: string
  campaign_id: string
  property_id: string
  platform: string
  caption: string
  hashtags: string[]
  image_urls: string[]
  scheduled_time: string
  post_type: 'text' | 'image' | 'carousel' | 'video'
  status: 'scheduled' | 'published' | 'failed' | 'draft'
  retry_count: number
  platform_post_id?: string
  platform_post_url?: string
  error_message?: string
  published_at?: string
}

interface PostResult {
  success: boolean
  message: string
  platform_post_id?: string
  platform_post_url?: string
  error?: string
}

interface PropertyData {
  id: string
  title: string
  address: string
  price?: number
  property_type: string
  bedrooms?: number
  bathrooms?: number
  square_feet?: number
  compound?: string
  city?: string
  description?: string
}

// Social Media Platform Posting API
// This is where you'll integrate the actual social media APIs once you have tokens

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await request.json()
    const { 
      post_id, 
      platform, 
      test_mode = false,
      immediate_publish = false,
      retry_attempt = false 
    } = body

    // Validation
    if (!post_id || !platform) {
      return NextResponse.json(
        { error: 'Missing required fields: post_id, platform' },
        { status: 400 }
      )
    }

    // Validate platform
    const supportedPlatforms = ['facebook', 'instagram', 'twitter', 'linkedin', 'tiktok']
    if (!supportedPlatforms.includes(platform)) {
      return NextResponse.json(
        { error: `Platform "${platform}" is not supported. Supported platforms: ${supportedPlatforms.join(', ')}` },
        { status: 400 }
      )
    }

    // Fetch the post with related data
    const { data: post, error: postError } = await supabase
      .from('social_media_posts')
      .select(`
        *,
        social_media_campaigns!inner(
          id,
          property_id,
          name,
          campaign_type,
          properties!inner(*)
        )
      `)
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      )
    }

    // Check if post is ready for publishing
    if (!immediate_publish && post.status !== 'scheduled') {
      return NextResponse.json(
        { error: `Post status is "${post.status}". Only "scheduled" posts can be published.` },
        { status: 400 }
      )
    }

    // Check if it's the right time (unless immediate_publish is true)
    if (!immediate_publish && !retry_attempt) {
      const scheduledTime = new Date(post.scheduled_time)
      const now = new Date()
      const timeDiff = scheduledTime.getTime() - now.getTime()
      
      // Allow publishing if within 5 minutes of scheduled time
      if (timeDiff > 5 * 60 * 1000) {
        return NextResponse.json(
          { error: `Post is scheduled for ${scheduledTime.toISOString()}. Too early to publish.` },
          { status: 400 }
        )
      }
    }

    // Check retry limits (max 3 retries)
    if (post.retry_count >= 3) {
      return NextResponse.json(
        { error: 'Maximum retry attempts exceeded' },
        { status: 400 }
      )
    }

    let result: PostResult

    // Update post status to publishing
    await supabase
      .from('social_media_posts')
      .update({ status: 'publishing' })
      .eq('id', post_id)

    try {
      if (test_mode) {
        // Test mode - simulate posting
        result = await simulatePosting(post, platform)
      } else {
        // Real posting
        result = await postToSocialMedia(post, platform)
      }
    } catch (error) {
      result = {
        success: false,
        message: 'Publishing failed with exception',
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }

    // Update post status based on result
    const updateData: any = {
      status: result.success ? 'published' : 'failed',
      error_message: result.error || null,
      retry_count: result.success ? 0 : post.retry_count + 1,
      last_attempt_at: new Date().toISOString()
    }

    if (result.success) {
      updateData.published_at = new Date().toISOString()
      updateData.platform_post_id = result.platform_post_id
      updateData.platform_post_url = result.platform_post_url
    }

    const { error: updateError } = await supabase
      .from('social_media_posts')
      .update(updateData)
      .eq('id', post_id)

    if (updateError) {
      console.error('Error updating post status:', updateError)
    }

    // Record analytics event
    if (result.success) {
      await recordAnalyticsEvent(supabase, {
        post_id,
        campaign_id: post.campaign_id,
        event_type: 'post_published',
        platform,
        metadata: {
          platform_post_id: result.platform_post_id,
          platform_post_url: result.platform_post_url
        }
      })
    }

    return NextResponse.json({
      success: result.success,
      message: result.message,
      platform_post_id: result.platform_post_id,
      platform_post_url: result.platform_post_url,
      retry_count: updateData.retry_count,
      ...(result.error && { error: result.error })
    })

  } catch (error) {
    console.error('Error in publish route:', error)
    return NextResponse.json(
      { error: 'Internal server error during publishing' },
      { status: 500 }
    )
  }
}

// Simulate posting for testing purposes
async function simulatePosting(post: SocialMediaPost, platform: string): Promise<PostResult> {
  // Simulate realistic API delay
  await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 1000))
  
  // Simulate different failure scenarios occasionally
  const rand = Math.random()
  
  if (rand < 0.05) { // 5% rate limiting
    return {
      success: false,
      message: `Rate limit exceeded for ${platform}`,
      error: 'API_RATE_LIMIT_EXCEEDED'
    }
  }
  
  if (rand < 0.08) { // 3% authentication error
    return {
      success: false,
      message: `Authentication failed for ${platform}`,
      error: 'AUTHENTICATION_FAILED'
    }
  }
  
  if (rand < 0.1) { // 2% general failure
    return {
      success: false,
      message: `Failed to post to ${platform}`,
      error: 'PLATFORM_API_ERROR'
    }
  }

  // 90% success rate
  const platformPostId = `test_${platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const platformUrls = {
    facebook: `https://facebook.com/${platformPostId}`,
    instagram: `https://instagram.com/p/${platformPostId}`,
    twitter: `https://twitter.com/user/status/${platformPostId}`,
    linkedin: `https://linkedin.com/feed/update/urn:li:share:${platformPostId}`,
    tiktok: `https://tiktok.com/@user/video/${platformPostId}`
  }

  return {
    success: true,
    message: `Successfully posted to ${platform} (test mode)`,
    platform_post_id: platformPostId,
    platform_post_url: platformUrls[platform as keyof typeof platformUrls] || `https://${platform}.com/post/${platformPostId}`
  }
}

// Main routing function for real social media posting
async function postToSocialMedia(post: SocialMediaPost, platform: string): Promise<PostResult> {
  switch (platform) {
    case 'facebook':
      return await postToFacebook(post)
    case 'instagram':
      return await postToInstagram(post)
    case 'twitter':
      return await postToTwitter(post)
    case 'linkedin':
      return await postToLinkedIn(post)
    case 'tiktok':
      return await postToTikTok(post)
    default:
      return {
        success: false,
        message: `Platform ${platform} integration not implemented yet`,
        error: `Platform ${platform} integration not implemented yet`
      }
  }
}

// Facebook posting implementation
async function postToFacebook(post: SocialMediaPost): Promise<PostResult> {
  try {
    const accessToken = process.env.FACEBOOK_ACCESS_TOKEN
    const pageId = process.env.FACEBOOK_PAGE_ID
    
    if (!accessToken || !pageId) {
      return {
        success: false,
        message: 'Facebook credentials not configured',
        error: 'Facebook credentials not configured. Please set FACEBOOK_ACCESS_TOKEN and FACEBOOK_PAGE_ID environment variables.'
      }
    }

    // Prepare caption with hashtags
    const fullCaption = `${post.caption}\n\n${post.hashtags.map(tag => `#${tag}`).join(' ')}`

    let postData: any = {
      message: fullCaption,
      access_token: accessToken
    }

    let endpoint = `https://graph.facebook.com/v18.0/${pageId}/feed`

    // Handle images
    if (post.image_urls && post.image_urls.length > 0) {
      if (post.image_urls.length === 1) {
        // Single image post
        postData.url = post.image_urls[0]
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`
        postData.caption = fullCaption
        delete postData.message
      } else {
        // Multiple images - create album
        // This requires a more complex flow with Facebook's batch upload
        // For now, we'll post the first image with a note about additional images
        postData.url = post.image_urls[0]
        postData.caption = `${fullCaption}\n\n📸 See more photos in our listing!`
        endpoint = `https://graph.facebook.com/v18.0/${pageId}/photos`
        delete postData.message
      }
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postData)
    })

    const result = await response.json()

    if (response.ok && result.id) {
      return {
        success: true,
        message: 'Successfully posted to Facebook',
        platform_post_id: result.id,
        platform_post_url: `https://facebook.com/${result.id}`
      }
    } else {
      const errorMessage = result.error?.message || 'Unknown Facebook API error'
      return {
        success: false,
        message: `Facebook API error: ${errorMessage}`,
        error: `Facebook API error: ${errorMessage}`
      }
    }

  } catch (error) {
    return {
      success: false,
      message: `Facebook posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: `Facebook posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Instagram posting implementation
async function postToInstagram(post: SocialMediaPost): Promise<PostResult> {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN
    const igUserId = process.env.INSTAGRAM_USER_ID
    
    if (!accessToken || !igUserId) {
      return {
        success: false,
        message: 'Instagram credentials not configured',
        error: 'Instagram credentials not configured. Please set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_USER_ID environment variables.'
      }
    }

    if (!post.image_urls || post.image_urls.length === 0) {
      return {
        success: false,
        message: 'Instagram posts require at least one image',
        error: 'Instagram posts require at least one image'
      }
    }

    // Prepare caption with hashtags
    const fullCaption = `${post.caption}\n\n${post.hashtags.map(tag => `#${tag}`).join(' ')}`

    // Step 1: Create media container
    let containerData: any = {
      caption: fullCaption,
      access_token: accessToken
    }

    if (post.image_urls.length === 1) {
      // Single image post
      containerData.image_url = post.image_urls[0]
    } else {
      // Carousel post - requires creating individual containers first
      // This is a complex multi-step process for Instagram API
      return {
        success: false,
        message: 'Instagram carousel posts not yet implemented',
        error: 'Instagram carousel posts not yet implemented. Please use single images for now.'
      }
    }

    // Create the container
    const containerResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(containerData)
    })

    const containerResult = await containerResponse.json()

    if (!containerResponse.ok || !containerResult.id) {
      return {
        success: false,
        message: `Instagram container creation failed: ${containerResult.error?.message || 'Unknown error'}`,
        error: `Instagram container creation failed: ${containerResult.error?.message || 'Unknown error'}`
      }
    }

    // Step 2: Publish the container
    const publishData = {
      creation_id: containerResult.id,
      access_token: accessToken
    }

    const publishResponse = await fetch(`https://graph.facebook.com/v18.0/${igUserId}/media_publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(publishData)
    })

    const publishResult = await publishResponse.json()

    if (publishResponse.ok && publishResult.id) {
      return {
        success: true,
        message: 'Successfully posted to Instagram',
        platform_post_id: publishResult.id,
        platform_post_url: `https://instagram.com/p/${publishResult.id}`
      }
    } else {
      return {
        success: false,
        message: `Instagram publishing failed: ${publishResult.error?.message || 'Unknown error'}`,
        error: `Instagram publishing failed: ${publishResult.error?.message || 'Unknown error'}`
      }
    }

  } catch (error) {
    return {
      success: false,
      message: `Instagram posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: `Instagram posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Twitter/X posting implementation
async function postToTwitter(post: SocialMediaPost): Promise<PostResult> {
  try {
    const bearerToken = process.env.TWITTER_BEARER_TOKEN
    const apiKey = process.env.TWITTER_API_KEY
    const apiSecret = process.env.TWITTER_API_SECRET
    const accessToken = process.env.TWITTER_ACCESS_TOKEN
    const accessTokenSecret = process.env.TWITTER_ACCESS_TOKEN_SECRET
    
    if (!bearerToken || !apiKey || !apiSecret || !accessToken || !accessTokenSecret) {
      return {
        success: false,
        message: 'Twitter credentials not configured',
        error: 'Twitter credentials not configured. Please set TWITTER_BEARER_TOKEN, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, and TWITTER_ACCESS_TOKEN_SECRET environment variables.'
      }
    }

    // Twitter has a 280 character limit
    let tweetText = post.caption
    const hashtags = post.hashtags.map(tag => `#${tag}`).join(' ')
    
    // Check if caption + hashtags exceed Twitter limit
    if ((tweetText + ' ' + hashtags).length > 280) {
      // Truncate caption to fit
      const availableSpace = 280 - hashtags.length - 3 // 3 for ' ' and '...'
      if (availableSpace > 10) {
        tweetText = tweetText.substring(0, availableSpace) + '...'
      } else {
        tweetText = tweetText.substring(0, 200) + '...' // Fallback
      }
    }
    
    const fullTweet = `${tweetText} ${hashtags}`.trim()

    // For now, we'll implement text-only tweets
    // Image uploading to Twitter requires additional media upload endpoints
    const tweetData = {
      text: fullTweet
    }

    // Twitter API v2 requires OAuth 1.0a for posting
    // This is a simplified implementation - in production, use a library like 'twitter-api-v2'
    return {
      success: false,
      message: 'Twitter posting requires OAuth 1.0a implementation',
      error: 'Twitter posting requires OAuth 1.0a implementation. Please use a Twitter API library like "twitter-api-v2" for production use.'
    }

  } catch (error) {
    return {
      success: false,
      message: `Twitter posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: `Twitter posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// LinkedIn posting implementation
async function postToLinkedIn(post: SocialMediaPost): Promise<PostResult> {
  try {
    const accessToken = process.env.LINKEDIN_ACCESS_TOKEN
    const personId = process.env.LINKEDIN_PERSON_ID // or page ID for company pages
    
    if (!accessToken || !personId) {
      return {
        success: false,
        message: 'LinkedIn credentials not configured',
        error: 'LinkedIn credentials not configured. Please set LINKEDIN_ACCESS_TOKEN and LINKEDIN_PERSON_ID environment variables.'
      }
    }

    // Prepare caption with hashtags
    const fullCaption = `${post.caption}\n\n${post.hashtags.map(tag => `#${tag}`).join(' ')}`

    const shareData = {
      author: `urn:li:person:${personId}`,
      lifecycleState: 'PUBLISHED',
      specificContent: {
        'com.linkedin.ugc.ShareContent': {
          shareCommentary: {
            text: fullCaption
          },
          shareMediaCategory: post.image_urls && post.image_urls.length > 0 ? 'IMAGE' : 'NONE'
        }
      },
      visibility: {
        'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
      }
    }

    // If we have images, we need to upload them first (complex process)
    // For now, we'll post text-only
    if (post.image_urls && post.image_urls.length > 0) {
      return {
        success: false,
        message: 'LinkedIn image posting not yet implemented',
        error: 'LinkedIn image posting not yet implemented. Text-only posts supported.'
      }
    }

    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(shareData)
    })

    const result = await response.json()

    if (response.ok && result.id) {
      return {
        success: true,
        message: 'Successfully posted to LinkedIn',
        platform_post_id: result.id,
        platform_post_url: `https://linkedin.com/feed/update/${result.id}`
      }
    } else {
      return {
        success: false,
        message: `LinkedIn API error: ${result.message || 'Unknown error'}`,
        error: `LinkedIn API error: ${result.message || 'Unknown error'}`
      }
    }

  } catch (error) {
    return {
      success: false,
      message: `LinkedIn posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: `LinkedIn posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// TikTok posting implementation
async function postToTikTok(post: SocialMediaPost): Promise<PostResult> {
  try {
    const accessToken = process.env.TIKTOK_ACCESS_TOKEN
    const userId = process.env.TIKTOK_USER_ID
    
    if (!accessToken || !userId) {
      return {
        success: false,
        message: 'TikTok credentials not configured',
        error: 'TikTok credentials not configured. Please set TIKTOK_ACCESS_TOKEN and TIKTOK_USER_ID environment variables.'
      }
    }

    // TikTok requires video content, not images
    if (post.post_type !== 'video') {
      return {
        success: false,
        message: 'TikTok only supports video content',
        error: 'TikTok only supports video content. Please create video posts for TikTok.'
      }
    }

    // TikTok Business API implementation would go here
    // This is quite complex and requires video upload handling
    return {
      success: false,
      message: 'TikTok posting not yet implemented',
      error: 'TikTok posting not yet implemented. Requires TikTok Business API integration and video handling.'
    }

  } catch (error) {
    return {
      success: false,
      message: `TikTok posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      error: `TikTok posting failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }
}

// Helper function to record analytics events
async function recordAnalyticsEvent(supabase: any, event: {
  post_id: string
  campaign_id: string
  event_type: string
  platform: string
  metadata?: any
}) {
  try {
    await supabase
      .from('social_media_analytics')
      .insert({
        post_id: event.post_id,
        campaign_id: event.campaign_id,
        event_type: event.event_type,
        platform: event.platform,
        event_data: event.metadata || {},
        timestamp: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to record analytics event:', error)
    // Don't fail the main operation if analytics fails
  }
} 
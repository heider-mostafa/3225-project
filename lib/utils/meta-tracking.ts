/**
 * Meta Event Tracking Utilities
 * Provides convenient functions to track Meta conversion events across the OpenBeit platform
 */

import { metaConversions } from '@/lib/services/meta-conversions'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Interface for common tracking parameters
interface BaseTrackingParams {
  userEmail?: string
  userPhone?: string
  ipAddress?: string
  userAgent?: string
  facebookClickId?: string
  facebookBrowserId?: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
}

// Interface for client-side tracking (Next.js request object)
interface RequestContext {
  headers: {
    get(name: string): string | null
  }
}

/**
 * Extract tracking parameters from Next.js request object
 */
export function extractTrackingParams(
  request: RequestContext,
  body?: any
): BaseTrackingParams {
  return {
    ipAddress: request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               undefined,
    userAgent: request.headers.get('user-agent') || undefined,
    facebookClickId: body?.fbclid,
    facebookBrowserId: body?.fbp,
    utmSource: body?.utm_source,
    utmMedium: body?.utm_medium,
    utmCampaign: body?.utm_campaign,
    userEmail: body?.email || body?.visitor_email,
    userPhone: body?.phone || body?.visitor_phone || body?.whatsapp_number
  }
}

/**
 * Track virtual tour engagement with Meta
 */
export async function trackVirtualTourEngagement(params: {
  tourSessionId: string
  propertyId: string
  engagementScore: number
  tourType: 'realsee' | 'virtual_3d' | 'video'
  duration: number
  completed: boolean
  tracking: BaseTrackingParams
}) {
  try {
    const result = await metaConversions.trackTourEngagement({
      userEmail: params.tracking.userEmail,
      propertyId: params.propertyId,
      engagementScore: params.engagementScore,
      tourType: params.tourType,
      duration: params.duration,
      completed: params.completed,
      ipAddress: params.tracking.ipAddress,
      userAgent: params.tracking.userAgent
    })

    if (result.success) {
      // Update tour session with Meta tracking info
      const supabase = await createServerSupabaseClient()
      await supabase
        .from('tour_sessions')
        .update({
          meta_event_sent: true,
          meta_event_id: `tour_${params.tourSessionId}_${Date.now()}`
        })
        .eq('session_id', params.tourSessionId)
    }

    return result
  } catch (error) {
    console.error('Virtual tour Meta tracking failed:', error)
    return { success: false, error: 'Tracking failed' }
  }
}

/**
 * Track property save/bookmark action with Meta
 */
export async function trackPropertySave(params: {
  propertyId: string
  userId?: string
  interestScore?: number
  sourcePage?: string
  tracking: BaseTrackingParams
}) {
  try {
    // Determine event type based on interest score
    let eventName = 'AddToWishlist'
    let eventValue = 25

    if (params.interestScore && params.interestScore > 70) {
      eventName = 'AddToCart' // High interest
      eventValue = 100
    }

    const result = await metaConversions.trackConversion({
      eventName,
      userEmail: params.tracking.userEmail,
      userPhone: params.tracking.userPhone,
      ipAddress: params.tracking.ipAddress,
      userAgent: params.tracking.userAgent,
      facebookClickId: params.tracking.facebookClickId,
      facebookBrowserId: params.tracking.facebookBrowserId,
      customData: {
        content_category: 'property_save',
        content_name: 'Property Saved to Favorites',
        property_id: params.propertyId,
        interest_score: params.interestScore || 0,
        source_page: params.sourcePage,
        value: eventValue
      }
    })

    if (result.success && params.userId) {
      // Update saved property record
      const supabase = await createServerSupabaseClient()
      await supabase
        .from('saved_properties')
        .update({
          meta_event_sent: true,
          meta_event_id: `save_${params.propertyId}_${Date.now()}`,
          interest_score: params.interestScore || 0,
          facebook_click_id: params.tracking.facebookClickId,
          facebook_browser_id: params.tracking.facebookBrowserId,
          source_page: params.sourcePage
        })
        .eq('property_id', params.propertyId)
        .eq('user_id', params.userId)
    }

    return result
  } catch (error) {
    console.error('Property save Meta tracking failed:', error)
    return { success: false, error: 'Tracking failed' }
  }
}

/**
 * Track HeyGen AI agent conversation with Meta
 */
export async function trackHeyGenConversation(params: {
  sessionId: string
  propertyId: string
  agentType: string
  duration: number
  engagementQuality: number
  conversionIndicator: boolean
  questionsAsked: number
  tracking: BaseTrackingParams
}) {
  try {
    // Determine event type based on engagement and conversion indicators
    let eventName = 'ViewContent'
    let eventValue = 15

    if (params.conversionIndicator) {
      eventName = 'CompleteRegistration' // High engagement with conversion signals
      eventValue = 150
    } else if (params.engagementQuality > 70) {
      eventName = 'AddToCart' // High engagement
      eventValue = 75
    }

    const result = await metaConversions.trackConversion({
      eventName,
      userEmail: params.tracking.userEmail,
      userPhone: params.tracking.userPhone,
      ipAddress: params.tracking.ipAddress,
      userAgent: params.tracking.userAgent,
      facebookClickId: params.tracking.facebookClickId,
      facebookBrowserId: params.tracking.facebookBrowserId,
      customData: {
        content_category: 'ai_conversation',
        content_name: `HeyGen ${params.agentType} Conversation`,
        property_id: params.propertyId,
        value: eventValue
      }
    })

    if (result.success) {
      // Update HeyGen session with Meta tracking info
      const supabase = await createServerSupabaseClient()
      await supabase
        .from('heygen_sessions')
        .update({
          meta_event_sent: true,
          meta_event_id: `heygen_${params.sessionId}_${Date.now()}`,
          engagement_quality_score: params.engagementQuality,
          conversion_indicator: params.conversionIndicator,
          facebook_click_id: params.tracking.facebookClickId,
          facebook_browser_id: params.tracking.facebookBrowserId
        })
        .eq('session_id', params.sessionId)
    }

    return result
  } catch (error) {
    console.error('HeyGen conversation Meta tracking failed:', error)
    return { success: false, error: 'Tracking failed' }
  }
}

/**
 * Track rental booking with Meta
 */
export async function trackRentalBooking(params: {
  bookingId: string
  propertyId: string
  checkIn: string
  checkOut: string
  nights: number
  totalAmount: number
  guestCount: number
  bookingSource?: string
  tracking: BaseTrackingParams
}) {
  try {
    const result = await metaConversions.trackRentalBooking({
      userEmail: params.tracking.userEmail!,
      userPhone: params.tracking.userPhone,
      propertyId: params.propertyId,
      checkIn: params.checkIn,
      checkOut: params.checkOut,
      nights: params.nights,
      totalAmount: params.totalAmount,
      guestCount: params.guestCount,
      ipAddress: params.tracking.ipAddress,
      userAgent: params.tracking.userAgent
    })

    if (result.success) {
      // Update rental booking with Meta tracking info
      const supabase = await createServerSupabaseClient()
      await supabase
        .from('rental_bookings')
        .update({
          meta_event_sent: true,
          meta_event_id: `rental_${params.bookingId}_${Date.now()}`,
          facebook_click_id: params.tracking.facebookClickId,
          facebook_browser_id: params.tracking.facebookBrowserId,
          booking_source: params.bookingSource || 'website'
        })
        .eq('id', params.bookingId)
    }

    return result
  } catch (error) {
    console.error('Rental booking Meta tracking failed:', error)
    return { success: false, error: 'Tracking failed' }
  }
}

/**
 * Track property appraisal request with Meta
 */
export async function trackAppraisalRequest(params: {
  appraisalId: string
  propertyType: string
  estimatedValue: number
  appraisalType: 'basic' | 'detailed' | 'premium'
  tracking: BaseTrackingParams
}) {
  try {
    // Calculate event value based on appraisal type
    const valueMultipliers = {
      basic: 0.5,
      detailed: 1.0,
      premium: 2.0
    }

    const eventValue = 200 * valueMultipliers[params.appraisalType]

    const result = await metaConversions.trackConversion({
      eventName: 'Lead',
      userEmail: params.tracking.userEmail,
      userPhone: params.tracking.userPhone,
      ipAddress: params.tracking.ipAddress,
      userAgent: params.tracking.userAgent,
      facebookClickId: params.tracking.facebookClickId,
      facebookBrowserId: params.tracking.facebookBrowserId,
      customData: {
        content_category: 'appraisal_request',
        content_name: `Property Appraisal - ${params.appraisalType}`,
        property_type: params.propertyType,
        appraisal_type: params.appraisalType,
        value: eventValue
      }
    })

    if (result.success) {
      // Update appraisal record with Meta tracking info
      const supabase = await createServerSupabaseClient()
      await supabase
        .from('property_appraisals')
        .update({
          meta_event_sent: true,
          meta_event_id: `appraisal_${params.appraisalId}_${Date.now()}`,
          facebook_click_id: params.tracking.facebookClickId,
          facebook_browser_id: params.tracking.facebookBrowserId,
          appraisal_value_impact: valueMultipliers[params.appraisalType]
        })
        .eq('id', params.appraisalId)
    }

    return result
  } catch (error) {
    console.error('Appraisal request Meta tracking failed:', error)
    return { success: false, error: 'Tracking failed' }
  }
}

/**
 * Track page view with enhanced analytics
 */
export async function trackPageView(params: {
  page: string
  propertyId?: string
  category?: string
  tracking: BaseTrackingParams
}) {
  try {
    // Only track high-value page views to avoid spam
    const highValuePages = [
      'property-details',
      'virtual-tour',
      'contact-broker',
      'mortgage-calculator',
      'appraisal-request'
    ]

    if (!highValuePages.some(page => params.page.includes(page))) {
      return { success: true, skipped: true }
    }

    const result = await metaConversions.trackConversion({
      eventName: 'ViewContent',
      userEmail: params.tracking.userEmail,
      userPhone: params.tracking.userPhone,
      ipAddress: params.tracking.ipAddress,
      userAgent: params.tracking.userAgent,
      facebookClickId: params.tracking.facebookClickId,
      facebookBrowserId: params.tracking.facebookBrowserId,
      customData: {
        content_category: params.category || 'page_view',
        content_name: params.page,
        property_id: params.propertyId,
        value: 5 // Low value for page views
      }
    })

    return result
  } catch (error) {
    console.error('Page view Meta tracking failed:', error)
    return { success: false, error: 'Tracking failed' }
  }
}

/**
 * Get Meta tracking analytics for dashboard
 */
export async function getMetaAnalytics(params: {
  startDate?: string
  endDate?: string
  eventType?: string
}) {
  try {
    const supabase = await createServerSupabaseClient()
    
    let query = supabase
      .from('meta_conversion_events')
      .select('*')
    
    if (params.startDate) {
      query = query.gte('sent_at', params.startDate)
    }
    
    if (params.endDate) {
      query = query.lte('sent_at', params.endDate)
    }
    
    if (params.eventType) {
      query = query.eq('event_name', params.eventType)
    }
    
    const { data, error } = await query.order('sent_at', { ascending: false })
    
    if (error) {
      console.error('Meta analytics query failed:', error)
      return { success: false, error: error.message }
    }
    
    // Calculate summary statistics
    const totalEvents = data.length
    const successfulEvents = data.filter(e => e.success).length
    const totalValue = data.reduce((sum, e) => sum + (e.event_value || 0), 0)
    const averageValue = totalEvents > 0 ? totalValue / totalEvents : 0
    
    // Group by event type
    const eventBreakdown = data.reduce((acc, event) => {
      const type = event.event_name
      if (!acc[type]) {
        acc[type] = { count: 0, value: 0, success_rate: 0 }
      }
      acc[type].count += 1
      acc[type].value += event.event_value || 0
      acc[type].success_rate = acc[type].count > 0 ? 
        data.filter(e => e.event_name === type && e.success).length / acc[type].count : 0
      return acc
    }, {} as Record<string, any>)
    
    return {
      success: true,
      data: {
        summary: {
          total_events: totalEvents,
          successful_events: successfulEvents,
          success_rate: totalEvents > 0 ? successfulEvents / totalEvents : 0,
          total_value: totalValue,
          average_value: averageValue
        },
        event_breakdown: eventBreakdown,
        recent_events: data.slice(0, 20) // Latest 20 events
      }
    }
  } catch (error) {
    console.error('Meta analytics failed:', error)
    return { success: false, error: 'Analytics failed' }
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { extractTrackingParams } from '@/lib/utils/meta-tracking'

/**
 * Start a new tour session
 * Creates a tour session record in the database for tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      session_id,
      property_id,
      tour_type = 'virtual_3d', // 'virtual_3d', 'realsee', 'video'
      user_info
    } = body

    // Extract tracking parameters from request
    const trackingParams = extractTrackingParams(request, body)

    if (!session_id || !property_id) {
      return NextResponse.json(
        { error: 'Session ID and Property ID are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Check if session already exists
    const { data: existingSession } = await supabase
      .from('tour_sessions')
      .select('session_id')
      .eq('session_id', session_id)
      .single()

    if (existingSession) {
      return NextResponse.json({
        success: true,
        message: 'Tour session already exists',
        session: { session_id }
      })
    }

    // Get client IP and user agent
    const ip = request.headers.get('x-forwarded-for') || 
               request.headers.get('x-real-ip') || 
               '127.0.0.1'
    const userAgent = request.headers.get('user-agent') || ''

    // Create new tour session
    const sessionData = {
      session_id,
      property_id,
      tour_type,
      started_at: new Date().toISOString(),
      user_id: user_info?.user_id || null,
      ip_address: ip,
      user_agent: userAgent,
      
      // Initialize tracking arrays
      rooms_visited: [],
      actions_taken: [],
      
      // Initialize scores (will be calculated by database triggers)
      engagement_score: 0,
      lead_quality_score: 0,
      
      // Meta tracking fields
      facebook_click_id: trackingParams.facebookClickId,
      facebook_browser_id: trackingParams.facebookBrowserId,
      utm_source: trackingParams.utmSource,
      utm_medium: trackingParams.utmMedium,
      utm_campaign: trackingParams.utmCampaign,
      
      // Initialize as not completed
      completed: false,
      ended_at: null,
      total_duration_seconds: 0,
      meta_event_sent: false
    }

    const { data: newSession, error } = await supabase
      .from('tour_sessions')
      .insert(sessionData)
      .select()
      .single()

    if (error) {
      console.error('Failed to create tour session:', error)
      return NextResponse.json(
        { error: 'Failed to create tour session: ' + error.message },
        { status: 500 }
      )
    }

    console.log('✅ Tour session created successfully:', {
      session_id,
      property_id,
      tour_type,
      user_id: user_info?.user_id || 'anonymous',
      database_session_id: newSession.session_id
    })

    return NextResponse.json({
      success: true,
      message: 'Tour session started',
      session: {
        session_id: newSession.session_id,
        property_id: newSession.property_id,
        tour_type: newSession.tour_type,
        started_at: newSession.started_at
      }
    })

  } catch (error) {
    console.error('Tour start error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { enhancedTourAnalytics } from '@/lib/services/enhanced-tour-analytics'
import { extractTrackingParams } from '@/lib/utils/meta-tracking'

/**
 * Complete tour session and trigger Meta events
 * Called when user finishes or exits a virtual tour
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.sessionId
    const body = await request.json()
    
    const {
      final_engagement_data,
      user_info,
      completion_reason = 'user_exit' // 'completed', 'user_exit', 'timeout'
    } = body

    // Extract tracking parameters
    const trackingParams = extractTrackingParams(request, body)

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    console.log('🔍 COMPLETION DEBUG: Looking for session:', sessionId)

    // Get current session data
    const { data: existingSession, error: fetchError } = await supabase
      .from('tour_sessions')
      .select('*')
      .eq('session_id', sessionId)
      .single()

    console.log('🔍 COMPLETION DEBUG: Query result:', {
      sessionId,
      found: !!existingSession,
      error: fetchError?.code,
      errorMessage: fetchError?.message
    })

    // If session not found, let's check what sessions exist for this property
    if (!existingSession) {
      const { data: allSessions } = await supabase
        .from('tour_sessions')
        .select('session_id, started_at')
        .order('started_at', { ascending: false })
        .limit(10)
      
      console.log('🔍 COMPLETION DEBUG: Recent sessions in database:', 
        allSessions?.map(s => ({ id: s.session_id, time: s.started_at }))
      )
    }

    if (fetchError || !existingSession) {
      console.error('❌ COMPLETION ERROR: Session not found:', {
        searchedSessionId: sessionId,
        postgrestError: fetchError
      })
      return NextResponse.json(
        { error: 'Tour session not found' },
        { status: 404 }
      )
    }

    // Update session with completion data
    const completionData = {
      ended_at: new Date().toISOString(),
      completed: completion_reason === 'completed',
      total_duration_seconds: final_engagement_data?.total_duration || 
        Math.floor((Date.now() - new Date(existingSession.started_at).getTime()) / 1000),
      rooms_visited: final_engagement_data?.rooms_visited || existingSession.rooms_visited,
      actions_taken: final_engagement_data?.actions_taken || existingSession.actions_taken,
      
      // Update tracking parameters if provided
      facebook_click_id: trackingParams.facebookClickId || existingSession.facebook_click_id,
      facebook_browser_id: trackingParams.facebookBrowserId || existingSession.facebook_browser_id,
      utm_source: trackingParams.utmSource || existingSession.utm_source,
      utm_medium: trackingParams.utmMedium || existingSession.utm_medium,
      utm_campaign: trackingParams.utmCampaign || existingSession.utm_campaign
    }

    // Update the session (this will trigger our database function to calculate engagement scores)
    const { data: updatedSession, error: updateError } = await supabase
      .from('tour_sessions')
      .update(completionData)
      .eq('session_id', sessionId)
      .select(`
        *,
        properties (
          id,
          title,
          price,
          property_type
        )
      `)

    if (updateError || !updatedSession || updatedSession.length === 0) {
      console.error('Failed to update tour session:', updateError)
      console.error('Update result:', { updatedSession, affectedRows: updatedSession?.length })
      
      // Check if it's an RLS issue by trying to select the session again
      const { data: recheckSession } = await supabase
        .from('tour_sessions')
        .select('session_id, completed, ended_at')
        .eq('session_id', sessionId)
        .single()
      
      if (recheckSession) {
        console.error('❌ RLS ISSUE: Can SELECT but cannot UPDATE session:', sessionId)
        return NextResponse.json(
          { error: 'Permission denied - cannot update tour session (RLS policy issue)' },
          { status: 403 }
        )
      } else {
        return NextResponse.json(
          { error: 'Failed to update tour session: ' + (updateError?.message || 'Unknown error') },
          { status: 500 }
        )
      }
    }

    // Use the first (and should be only) updated session
    const finalSession = Array.isArray(updatedSession) ? updatedSession[0] : updatedSession

    // Analyze tour engagement and detect milestones
    const tourData = await enhancedTourAnalytics.analyzeTourEngagement(sessionId)
    
    if (!tourData) {
      return NextResponse.json(
        { error: 'Failed to analyze tour data' },
        { status: 500 }
      )
    }

    // Detect high-value milestones
    const milestones = enhancedTourAnalytics.detectTourMilestones(tourData)

    // Send Meta events based on engagement quality
    let metaResult = { success: true, skipped: true }
    
    try {
      // Send main tour engagement event
      metaResult = await enhancedTourAnalytics.sendTourMetaEvent(tourData, milestones)

      // Send milestone events for high-value interactions
      if (metaResult.success && milestones.length > 0) {
        for (const milestone of milestones.filter(m => m.value_score >= 20)) {
          await enhancedTourAnalytics.trackTourMilestone(
            sessionId,
            milestone,
            tourData.property_id,
            user_info
          )
        }
      }

    } catch (metaError) {
      console.error('Meta tour tracking failed:', metaError)
      // Don't fail the completion if Meta fails
    }

    // Return completion summary
    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionId,
        property: finalSession.properties,
        engagement_score: tourData.engagement_score,
        lead_quality_score: tourData.lead_quality_score,
        completion_reason,
        duration_seconds: finalSession.total_duration_seconds,
        rooms_visited_count: Array.isArray(finalSession.rooms_visited) ? 
          finalSession.rooms_visited.length : 0,
        actions_count: Array.isArray(finalSession.actions_taken) ? 
          finalSession.actions_taken.length : 0
      },
      milestones: milestones.map(m => ({
        type: m.type,
        value_score: m.value_score,
        room_name: m.room_name
      })),
      meta_tracking: {
        event_sent: metaResult.success && !metaResult.skipped,
        engagement_classified: tourData.engagement_score >= 50 ? 'high' : 
                              tourData.engagement_score >= 25 ? 'medium' : 'low'
      }
    })

  } catch (error) {
    console.error('Tour completion error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get tour session status and analytics
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  try {
    const resolvedParams = await params
    const sessionId = resolvedParams.sessionId

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    // Get tour analytics
    const tourData = await enhancedTourAnalytics.analyzeTourEngagement(sessionId)
    
    if (!tourData) {
      return NextResponse.json(
        { error: 'Tour session not found' },
        { status: 404 }
      )
    }

    // Detect current milestones
    const milestones = enhancedTourAnalytics.detectTourMilestones(tourData)

    return NextResponse.json({
      success: true,
      session: {
        session_id: sessionId,
        property_id: tourData.property_id,
        tour_type: tourData.tour_type,
        started_at: tourData.started_at,
        ended_at: tourData.ended_at,
        completed: tourData.completed,
        engagement_score: tourData.engagement_score,
        lead_quality_score: tourData.lead_quality_score,
        duration_seconds: tourData.total_duration_seconds,
        meta_event_sent: tourData.meta_event_sent
      },
      milestones,
      recommendations: {
        should_track_lead: tourData.engagement_score >= 40,
        follow_up_priority: tourData.lead_quality_score >= 30 ? 'high' : 
                           tourData.lead_quality_score >= 15 ? 'medium' : 'low',
        next_action: tourData.engagement_score >= 60 ? 'contact_immediately' :
                    tourData.engagement_score >= 30 ? 'schedule_follow_up' : 'add_to_nurture'
      }
    })

  } catch (error) {
    console.error('Tour status error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
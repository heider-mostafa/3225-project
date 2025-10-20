/**
 * Conversation Event Tracking API
 * Phase 2.3: Real-time conversation event tracking for Meta optimization
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { metaConversationTracker } from '@/lib/services/meta-conversation-tracker'

interface ConversationEventRequest {
  session_id: string
  event_type: string
  event_data: any
  timestamp: number
  conversation_type: 'openai_realtime' | 'heygen_avatar' | 'text_chat' | 'phone_call'
  property_id?: string
  user_info?: {
    email?: string
    phone?: string
    userId?: string
  }
  tracking_params?: {
    fbclid?: string
    fbc?: string
    fbp?: string
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConversationEventRequest = await request.json()
    
    if (!body.session_id || !body.event_type) {
      return NextResponse.json(
        { error: 'Session ID and event type are required' },
        { status: 400 }
      )
    }
    
    console.log(`📊 Tracking conversation event: ${body.event_type} for session ${body.session_id}`)
    
    // Determine if this is a Meta-trackable event
    const metaTrackableEvents = [
      'conversation_started',
      'qualified_response', 
      'viewing_requested',
      'financing_inquiry',
      'budget_discussion',
      'conversation_ended'
    ]
    
    const shouldTrackMeta = metaTrackableEvents.includes(body.event_type)
    
    if (shouldTrackMeta) {
      // Use the Meta conversation tracker for important events
      const eventData = {
        sessionId: body.session_id,
        eventType: mapEventTypeForMeta(body.event_type),
        conversationType: body.conversation_type,
        propertyId: body.property_id,
        userId: body.user_info?.userId,
        userEmail: body.user_info?.email,
        userPhone: body.user_info?.phone,
        facebookClickId: body.tracking_params?.fbclid,
        facebookBrowserId: body.tracking_params?.fbc,
        eventData: {
          original_event_type: body.event_type,
          timestamp: body.timestamp,
          ...body.event_data
        },
        // Extract intent signals from event data
        viewingRequested: body.event_type === 'viewing_requested' || 
                         body.event_data?.intent_type === 'viewing_request',
        financingMentioned: body.event_type === 'financing_inquiry' ||
                           body.event_data?.intent_type === 'financing_inquiry',
        budgetDiscussed: body.event_type === 'budget_discussion' ||
                        body.event_data?.intent_type === 'budget_discussion',
        buyingIntent: determineBuyingIntentFromEvent(body.event_type, body.event_data),
        timelineUrgency: determineTimelineFromEvent(body.event_type, body.event_data)
      }
      
      const result = await metaConversationTracker.trackConversationEvent(eventData)
      
      return NextResponse.json({
        success: true,
        event_tracked: true,
        meta_event_sent: result.metaEventSent || false,
        conversation_event_id: result.conversationEventId,
        insights: result.insights
      })
    } else {
      // For non-Meta events, just store in database for later analysis
      const supabase = await createServerSupabaseClient()
      
      const { data, error } = await supabase
        .from('conversation_events')
        .insert({
          session_id: body.session_id,
          event_type: body.event_type,
          conversation_type: body.conversation_type,
          property_id: body.property_id,
          user_id: body.user_info?.userId,
          user_email: body.user_info?.email,
          user_phone: body.user_info?.phone,
          facebook_click_id: body.tracking_params?.fbclid,
          facebook_browser_id: body.tracking_params?.fbc,
          event_data: {
            timestamp: body.timestamp,
            ...body.event_data
          }
        })
        .select('id')
        .single()
      
      if (error) {
        console.error('Failed to store conversation event:', error)
        return NextResponse.json(
          { error: 'Failed to store conversation event' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        event_tracked: true,
        meta_event_sent: false,
        conversation_event_id: data.id
      })
    }
    
  } catch (error: any) {
    console.error('❌ Conversation event tracking error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to track conversation event',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get('session_id')
    const eventType = searchParams.get('event_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    const supabase = await createServerSupabaseClient()
    
    let query = supabase
      .from('conversation_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
      .limit(limit)
    
    if (eventType) {
      query = query.eq('event_type', eventType)
    }
    
    const { data: events, error } = await query
    
    if (error) {
      console.error('Failed to fetch conversation events:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversation events' },
        { status: 500 }
      )
    }
    
    // Calculate session analytics
    const analytics = calculateSessionAnalytics(events || [])
    
    return NextResponse.json({
      success: true,
      session_id: sessionId,
      events: events || [],
      event_count: events?.length || 0,
      analytics
    })
    
  } catch (error: any) {
    console.error('❌ Get conversation events error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to fetch conversation events',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

/**
 * Map client event types to Meta trackable event types
 */
function mapEventTypeForMeta(eventType: string): 'started' | 'qualified' | 'completed' | 'high_intent' {
  switch (eventType) {
    case 'conversation_started':
      return 'started'
    case 'qualified_response':
    case 'viewing_requested':
    case 'financing_inquiry':
      return 'high_intent'
    case 'conversation_ended':
      return 'completed'
    default:
      return 'qualified'
  }
}

/**
 * Determine buying intent from event data
 */
function determineBuyingIntentFromEvent(eventType: string, eventData: any): 'high' | 'medium' | 'low' | 'unknown' {
  if (eventType === 'viewing_requested') return 'high'
  if (eventType === 'financing_inquiry') return 'high'
  if (eventType === 'budget_discussion') return 'medium'
  if (eventData?.confidence > 0.8) return 'high'
  if (eventData?.confidence > 0.6) return 'medium'
  if (eventData?.confidence > 0.4) return 'low'
  return 'unknown'
}

/**
 * Determine timeline urgency from event data
 */
function determineTimelineFromEvent(eventType: string, eventData: any): 'immediate' | 'soon' | 'exploring' | 'unknown' {
  if (eventData?.intent_type === 'timeline_urgent') return 'immediate'
  if (eventType === 'viewing_requested') return 'soon'
  if (eventType === 'financing_inquiry') return 'soon'
  return 'unknown'
}

/**
 * Calculate session analytics from events
 */
function calculateSessionAnalytics(events: any[]) {
  if (events.length === 0) {
    return {
      total_events: 0,
      session_duration: 0,
      engagement_score: 0,
      intent_signals: [],
      meta_events_sent: 0
    }
  }
  
  const startTime = new Date(events[0].created_at).getTime()
  const endTime = new Date(events[events.length - 1].created_at).getTime()
  const sessionDuration = Math.round((endTime - startTime) / 1000)
  
  const intentSignals = []
  let engagementScore = 0
  let metaEventsSent = 0
  
  for (const event of events) {
    // Count Meta events sent
    if (event.meta_event_sent) metaEventsSent++
    
    // Detect intent signals
    if (event.viewing_requested) intentSignals.push('viewing_requested')
    if (event.financing_mentioned) intentSignals.push('financing_mentioned')
    if (event.budget_discussed) intentSignals.push('budget_discussed')
    
    // Calculate engagement score
    if (event.event_type === 'qualified_response') engagementScore += 15
    if (event.event_type === 'viewing_requested') engagementScore += 25
    if (event.event_type === 'financing_inquiry') engagementScore += 20
    if (event.event_type === 'budget_discussion') engagementScore += 10
  }
  
  // Duration bonus
  if (sessionDuration > 300) engagementScore += 20 // 5+ minutes
  else if (sessionDuration > 180) engagementScore += 10 // 3+ minutes
  
  return {
    total_events: events.length,
    session_duration: sessionDuration,
    engagement_score: Math.min(engagementScore, 100),
    intent_signals: [...new Set(intentSignals)], // Remove duplicates
    meta_events_sent: metaEventsSent,
    first_event: events[0].created_at,
    last_event: events[events.length - 1].created_at
  }
}
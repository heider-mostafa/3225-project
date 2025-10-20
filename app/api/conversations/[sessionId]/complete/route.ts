/**
 * OpenAI Realtime Conversation Completion API
 * Phase 2.3: Track conversation completion and send to Meta
 */

import { NextRequest, NextResponse } from 'next/server'
import { metaConversationTracker } from '@/lib/services/meta-conversation-tracker'
import { conversationAnalyzer } from '@/lib/calls/conversation-analyzer'

interface ConversationCompletionRequest {
  conversationType: 'openai_realtime' | 'heygen_avatar' | 'text_chat' | 'phone_call'
  transcript: string
  duration: number // seconds
  propertyId?: string
  userInfo?: {
    email?: string
    phone?: string
    userId?: string
  }
  trackingParams?: {
    fbclid?: string
    fbc?: string
  }
  additionalData?: {
    leadInfo?: any
    interactionData?: any
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    const body: ConversationCompletionRequest = await request.json()
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    if (!body.transcript || !body.conversationType) {
      return NextResponse.json(
        { error: 'Transcript and conversation type are required' },
        { status: 400 }
      )
    }
    
    console.log(`🎬 Processing conversation completion for session: ${sessionId}`)
    
    // Analyze conversation using existing conversation analyzer
    const analysis = await conversationAnalyzer.analyzeConversation(
      body.transcript,
      body.additionalData?.leadInfo || {}
    )
    
    console.log(`📊 Conversation analysis: Score ${analysis.qualificationScore}/10, Action: ${analysis.nextAction}`)
    
    // Track conversation completion with Meta
    const trackingResult = await metaConversationTracker.trackConversationCompletion({
      sessionId,
      conversationType: body.conversationType,
      analysis,
      duration: body.duration,
      propertyId: body.propertyId,
      userInfo: body.userInfo,
      trackingParams: body.trackingParams
    })
    
    // Get quick insights for immediate feedback
    const quickInsights = await conversationAnalyzer.extractQuickInsights(body.transcript)
    
    console.log(`📈 Meta tracking result: Success=${trackingResult.success}, EventSent=${trackingResult.metaEventSent}`)
    
    return NextResponse.json({
      success: true,
      sessionId,
      analysis: {
        qualificationScore: analysis.qualificationScore,
        nextAction: analysis.nextAction,
        summary: analysis.summary,
        positiveSignals: analysis.positiveSignals,
        redFlags: analysis.redFlags,
        recommendedFollowUp: analysis.recommendedFollowUp
      },
      quickInsights,
      metaTracking: {
        eventSent: trackingResult.metaEventSent,
        success: trackingResult.success
      }
    })
    
  } catch (error: any) {
    console.error('❌ Conversation completion error:', error)
    return NextResponse.json(
      { 
        error: 'Failed to process conversation completion',
        details: error.message 
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }
    
    // Get conversation events for this session from database
    const { createServerSupabaseClient } = await import('@/lib/supabase/server')
    const supabase = await createServerSupabaseClient()
    
    const { data: conversationEvents, error } = await supabase
      .from('conversation_events')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true })
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversation events' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      sessionId,
      events: conversationEvents || [],
      eventCount: conversationEvents?.length || 0
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
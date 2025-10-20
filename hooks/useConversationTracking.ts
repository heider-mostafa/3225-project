/**
 * useConversationTracking Hook
 * Phase 2.3: Client-side conversation tracking for Meta optimization
 */

import { useCallback, useRef } from 'react'

interface ConversationTrackingParams {
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
}

interface ConversationSession {
  sessionId: string
  startTime: number
  conversationType: 'openai_realtime' | 'heygen_avatar' | 'text_chat'
  propertyId?: string
}

export function useConversationTracking(params: ConversationTrackingParams = {}) {
  const sessionRef = useRef<ConversationSession | null>(null)
  const eventsRef = useRef<Array<{
    type: string
    timestamp: number
    data: any
  }>>([])

  /**
   * Start tracking a new conversation session
   */
  const startConversationTracking = useCallback(async (
    conversationType: 'openai_realtime' | 'heygen_avatar' | 'text_chat',
    sessionId?: string
  ) => {
    const session: ConversationSession = {
      sessionId: sessionId || `${conversationType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      startTime: Date.now(),
      conversationType,
      propertyId: params.propertyId
    }
    
    sessionRef.current = session
    eventsRef.current = []
    
    console.log(`🎬 Started conversation tracking: ${session.sessionId}`)
    
    // Track conversation start event
    await trackConversationEvent('conversation_started', {
      session_id: session.sessionId,
      conversation_type: conversationType,
      property_id: params.propertyId,
      start_time: session.startTime
    })
    
    return session.sessionId
  }, [params.propertyId])

  /**
   * Track a conversation event
   */
  const trackConversationEvent = useCallback(async (
    eventType: string, 
    eventData: any = {}
  ) => {
    if (!sessionRef.current) {
      console.warn('No active conversation session for event tracking')
      return
    }

    const event = {
      type: eventType,
      timestamp: Date.now(),
      data: eventData
    }
    
    eventsRef.current.push(event)
    
    // For important events, send to server immediately
    const importantEvents = ['conversation_started', 'qualified_response', 'viewing_requested', 'conversation_ended']
    if (importantEvents.includes(eventType)) {
      try {
        const response = await fetch('/api/conversations/track-event', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            session_id: sessionRef.current.sessionId,
            event_type: eventType,
            event_data: eventData,
            timestamp: event.timestamp,
            conversation_type: sessionRef.current.conversationType,
            property_id: sessionRef.current.propertyId,
            user_info: params.userInfo,
            tracking_params: params.trackingParams
          })
        })
        
        if (!response.ok) {
          console.error('Failed to track conversation event:', eventType)
        }
      } catch (error) {
        console.error('Conversation event tracking error:', error)
      }
    }
  }, [params.userInfo, params.trackingParams])

  /**
   * Complete conversation tracking and send final analysis
   */
  const completeConversationTracking = useCallback(async (
    transcript: string,
    additionalData: any = {}
  ) => {
    if (!sessionRef.current) {
      console.warn('No active conversation session to complete')
      return
    }

    const duration = Math.round((Date.now() - sessionRef.current.startTime) / 1000)
    
    console.log(`📊 Completing conversation tracking: ${sessionRef.current.sessionId} (${duration}s)`)
    
    try {
      const response = await fetch(`/api/conversations/${sessionRef.current.sessionId}/complete`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationType: sessionRef.current.conversationType,
          transcript,
          duration,
          propertyId: sessionRef.current.propertyId,
          userInfo: params.userInfo,
          trackingParams: params.trackingParams,
          additionalData: {
            ...additionalData,
            events: eventsRef.current,
            session_duration: duration
          }
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        console.log(`✅ Conversation analysis complete:`, result.analysis)
        
        // Reset session
        sessionRef.current = null
        eventsRef.current = []
        
        return result
      } else {
        console.error('Failed to complete conversation tracking')
      }
    } catch (error) {
      console.error('Conversation completion error:', error)
    }
  }, [params.userInfo, params.trackingParams])

  /**
   * Track OpenAI Realtime session
   */
  const trackOpenAIRealtimeSession = useCallback(async (propertyId: string) => {
    try {
      const response = await fetch('/api/realtime/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyId,
          userInfo: params.userInfo,
          trackingParams: params.trackingParams
        })
      })
      
      if (response.ok) {
        const result = await response.json()
        
        // Start tracking with the session ID
        await startConversationTracking('openai_realtime', result.session_id)
        
        return result
      } else {
        console.error('Failed to create OpenAI session')
      }
    } catch (error) {
      console.error('OpenAI session creation error:', error)
    }
  }, [params.userInfo, params.trackingParams, startConversationTracking])

  /**
   * Track HeyGen avatar interaction
   */
  const trackHeyGenSession = useCallback(async (
    agentType: string,
    interactionData: any
  ) => {
    const sessionId = await startConversationTracking('heygen_avatar')
    
    // Track specific HeyGen events
    await trackConversationEvent('heygen_agent_selected', {
      agent_type: agentType,
      property_id: params.propertyId
    })
    
    return sessionId
  }, [startConversationTracking, trackConversationEvent, params.propertyId])

  /**
   * Track text chat interaction
   */
  const trackTextChatSession = useCallback(async () => {
    return await startConversationTracking('text_chat')
  }, [startConversationTracking])

  /**
   * Track qualified responses (high intent signals)
   */
  const trackQualifiedResponse = useCallback(async (responseData: {
    intent_type: 'viewing_request' | 'financing_inquiry' | 'budget_discussion' | 'timeline_urgent'
    confidence: number
    response_text: string
  }) => {
    await trackConversationEvent('qualified_response', responseData)
    
    // For high-confidence qualified responses, also send Meta pixel event
    if (responseData.confidence > 0.8) {
      if (typeof window !== 'undefined' && window.fbq) {
        window.fbq('track', 'Lead', {
          content_category: 'qualified_conversation_response',
          value: responseData.confidence * 100,
          currency: 'EGP'
        })
      }
    }
  }, [trackConversationEvent])

  /**
   * Get current session info
   */
  const getCurrentSession = useCallback(() => {
    return sessionRef.current
  }, [])

  /**
   * Get session events
   */
  const getSessionEvents = useCallback(() => {
    return eventsRef.current
  }, [])

  return {
    // Core tracking functions
    startConversationTracking,
    trackConversationEvent,
    completeConversationTracking,
    
    // Specific conversation types
    trackOpenAIRealtimeSession,
    trackHeyGenSession,
    trackTextChatSession,
    
    // Intent tracking
    trackQualifiedResponse,
    
    // Session info
    getCurrentSession,
    getSessionEvents
  }
}

// Helper hook for extracting tracking parameters from URL
export function useTrackingParams() {
  const getTrackingParams = useCallback(() => {
    if (typeof window === 'undefined') return {}
    
    const urlParams = new URLSearchParams(window.location.search)
    const fbclid = urlParams.get('fbclid')
    const fbc = getCookie('_fbc')
    const fbp = getCookie('_fbp')
    
    return {
      fbclid: fbclid || undefined,
      fbc: fbc || undefined,
      fbp: fbp || undefined
    }
  }, [])
  
  return { getTrackingParams }
}

// Helper function to get cookies
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  
  const value = `; ${document.cookie}`
  const parts = value.split(`; ${name}=`)
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null
  }
  return null
}
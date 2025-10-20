/**
 * React Hook for Tour Tracking with Meta Integration
 * Use this in your existing virtual tour components
 */

import { useState, useEffect, useCallback, useRef } from 'react'

interface TourTrackingConfig {
  sessionId: string
  propertyId: string
  tourType: 'virtual_3d' | 'realsee' | 'video'
  userInfo?: {
    email?: string
    phone?: string
  }
  trackingParams?: {
    fbclid?: string
    fbp?: string
    utm_source?: string
    utm_medium?: string
    utm_campaign?: string
  }
}

interface TourAction {
  type: string
  target?: string
  room?: string
  timestamp: Date
  metadata?: any
}

interface RoomVisit {
  room_name: string
  entered_at: Date
  left_at?: Date
  actions_in_room: TourAction[]
}

export function useTourTracking(config: TourTrackingConfig) {
  const [isTracking, setIsTracking] = useState(false)
  const [currentRoom, setCurrentRoom] = useState<string | null>(null)
  const [tourStartTime] = useState(new Date())
  const [actions, setActions] = useState<TourAction[]>([])
  const [roomVisits, setRoomVisits] = useState<RoomVisit[]>([])
  const [engagementScore, setEngagementScore] = useState(0)
  const [isCompleting, setIsCompleting] = useState(false) // Prevent multiple completion attempts
  const [sessionCreatedInDB, setSessionCreatedInDB] = useState(false) // Track if session was actually saved to database
  
  // Generate a unique session ID based on the provided sessionId (which might be tourId/propertyId)
  const [actualSessionId] = useState(() => {
    // Generate a UUID-like string for the actual database session
    const timestamp = Date.now().toString(36)
    const randomStr = Math.random().toString(36).substr(2, 9)
    return `${timestamp}-${randomStr}-${config.sessionId.replace(/[^a-zA-Z0-9]/g, '')}`
  })
  
  // Prevent multiple simultaneous session creations
  const [isCreatingSession, setIsCreatingSession] = useState(false)
  
  // Refs for tracking
  const actionCountRef = useRef(0)
  const roomTimeRef = useRef<Record<string, number>>({})
  const lastActionTimeRef = useRef(Date.now())
  const milestoneTrackedRef = useRef<Set<string>>(new Set())

  /**
   * Start tour tracking
   */
  const startTracking = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isCreatingSession || isTracking) {
      console.log('🎬 Tour tracking already in progress, skipping...', { isCreatingSession, isTracking, sessionId: actualSessionId })
      return
    }
    
    setIsCreatingSession(true)
    
    try {
      console.log('🎬 LIFECYCLE: Starting tour session creation', {
        session_id: actualSessionId,
        property_id: config.propertyId,
        tour_type: config.tourType,
        timestamp: new Date().toISOString()
      })
      
      // Create tour session in database
      const response = await fetch('/api/tours/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: actualSessionId,
          property_id: config.propertyId,
          tour_type: config.tourType,
          user_info: config.userInfo,
          ...config.trackingParams
        })
      })

      console.log('🎬 LIFECYCLE: API response received', { 
        sessionId: actualSessionId, 
        status: response.status, 
        ok: response.ok 
      })
      
      const result = await response.json()
      console.log('🎬 LIFECYCLE: API result parsed', { 
        sessionId: actualSessionId, 
        success: result.success, 
        error: result.error 
      })
      
      if (result.success) {
        setIsTracking(true)
        setSessionCreatedInDB(true) // Mark that session was successfully created in database
        console.log('✅ LIFECYCLE: Session successfully created and tracking started', actualSessionId)
        return true
      } else {
        console.error('❌ LIFECYCLE: Session creation failed in database', { 
          sessionId: actualSessionId, 
          error: result.error 
        })
        setIsTracking(false)
        setSessionCreatedInDB(false)
        return false
      }
    } catch (error) {
      console.error('❌ LIFECYCLE: Network/API error during session creation', { 
        sessionId: actualSessionId, 
        error: error instanceof Error ? error.message : error 
      })
      setIsTracking(false)
      setSessionCreatedInDB(false)
      return false
    } finally {
      setIsCreatingSession(false)
      console.log('🎬 LIFECYCLE: Session creation attempt completed', { 
        sessionId: actualSessionId, 
        finalTrackingState: isTracking 
      })
    }
  }, [config, actualSessionId, isCreatingSession, isTracking])

  /**
   * Stop tour tracking and complete session
   */
  const stopTracking = useCallback(async (completionReason: 'completed' | 'user_exit' | 'timeout' = 'user_exit') => {
    try {
      if (!isTracking) {
        console.log('🎬 Stop tracking called but not currently tracking, skipping...')
        return
      }

      // Prevent multiple completion attempts
      if (isCompleting) {
        console.log('🎬 Tour completion already in progress, skipping...')
        return
      }

      // Additional safety check: verify session was actually created
      console.log('🔍 COMPLETION DEBUG: Verifying session exists before completion...', actualSessionId)

      // Prevent multiple simultaneous completion attempts
      if (isCreatingSession) {
        console.log('🎬 Session still being created, skipping completion...')
        return
      }

      setIsCompleting(true) // Lock completion

      setIsTracking(false)
      
      // Ensure completion_reason is properly scoped and defined
      const completion_reason = completionReason || 'user_exit'
      
      // Debug log to track the issue
      console.log('🎬 Stopping tour tracking with reason:', completion_reason)
      console.log('🎬 Attempting to complete session:', actualSessionId)
      console.log('🎬 Session creation was successful:', !isCreatingSession)
      
      const totalDuration = Math.floor((Date.now() - tourStartTime.getTime()) / 1000)
    
    // Prepare final engagement data
    const finalEngagementData = {
      total_duration: totalDuration,
      rooms_visited: roomVisits.map(visit => ({
        room_name: visit.room_name,
        time_spent: visit.left_at ? 
          Math.floor((visit.left_at.getTime() - visit.entered_at.getTime()) / 1000) : 0,
        actions_count: visit.actions_in_room.length
      })),
      actions_taken: actions.map(action => ({
        type: action.type,
        target: action.target,
        room: action.room,
        timestamp: action.timestamp.toISOString(),
        metadata: action.metadata
      }))
    }

    try {
      // First verify the session exists before attempting completion
      const verifyResponse = await fetch(`/api/tours/${actualSessionId}/complete`, {
        method: 'GET'
      })
      
      if (!verifyResponse.ok) {
        console.error('❌ Session verification failed - session does not exist:', actualSessionId)
        setIsTracking(false)
        return { success: false, error: 'Session not found in database' }
      }

      // Send completion to our API
      const response = await fetch(`/api/tours/${actualSessionId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          final_engagement_data: finalEngagementData,
          user_info: config.userInfo,
          completion_reason,
          ...config.trackingParams
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('✅ Tour completed successfully:', {
          engagement_score: result.session.engagement_score,
          lead_quality_score: result.session.lead_quality_score,
          milestones: result.milestones.length
        })
        
        setEngagementScore(result.session.engagement_score || 0)
        
        return result
      } else {
        console.error('❌ Tour completion failed:', result.error)
      }
    } catch (error) {
      console.error('❌ Tour completion error:', error)
    }
    } catch (stopTrackingError) {
      console.error('❌ Critical error in stopTracking function:', stopTrackingError)
      setIsTracking(false) // Ensure we reset the state even on error
    } finally {
      setIsCompleting(false) // Always unlock completion
    }
  }, [isTracking, config, tourStartTime, actions, roomVisits])

  /**
   * Track user action in tour
   */
  const trackAction = useCallback((actionType: string, target?: string, metadata?: any) => {
    if (!isTracking) return

    const action: TourAction = {
      type: actionType,
      target,
      room: currentRoom || 'unknown',
      timestamp: new Date(),
      metadata
    }

    setActions(prev => [...prev, action])
    actionCountRef.current += 1
    lastActionTimeRef.current = Date.now()

    // Add action to current room visit
    if (currentRoom) {
      setRoomVisits(prev => prev.map(visit => 
        visit.room_name === currentRoom && !visit.left_at ? 
          { ...visit, actions_in_room: [...visit.actions_in_room, action] } : 
          visit
      ))
    }

    // Check for interaction burst milestone
    checkInteractionBurst()

    console.log('📊 Action tracked:', { type: actionType, target, room: currentRoom })
  }, [isTracking, currentRoom])

  /**
   * Track room entry
   */
  const enterRoom = useCallback((roomName: string) => {
    if (!isTracking) return

    // Exit current room if any
    if (currentRoom) {
      exitRoom()
    }

    setCurrentRoom(roomName)
    const now = new Date()
    
    setRoomVisits(prev => [...prev, {
      room_name: roomName,
      entered_at: now,
      actions_in_room: []
    }])

    roomTimeRef.current[roomName] = now.getTime()

    trackAction('room_enter', roomName)
    console.log('🚪 Entered room:', roomName)
  }, [isTracking, currentRoom, trackAction])

  /**
   * Track room exit
   */
  const exitRoom = useCallback(() => {
    if (!currentRoom || !isTracking) return

    const now = new Date()
    const roomStartTime = roomTimeRef.current[currentRoom]
    const timeSpent = roomStartTime ? Math.floor((now.getTime() - roomStartTime) / 1000) : 0

    setRoomVisits(prev => prev.map(visit => 
      visit.room_name === currentRoom && !visit.left_at ? 
        { ...visit, left_at: now } : 
        visit
    ))

    trackAction('room_exit', currentRoom, { time_spent: timeSpent })

    // Check for room focus milestone
    if (timeSpent > 60) { // More than 1 minute
      trackMilestone('room_focus', {
        room_name: currentRoom,
        time_spent: timeSpent
      })
    }

    console.log('🚪 Exited room:', currentRoom, `(${timeSpent}s)`)
    setCurrentRoom(null)
  }, [currentRoom, isTracking, trackAction])

  /**
   * Check for interaction burst patterns
   */
  const checkInteractionBurst = useCallback(() => {
    const recentActions = actions.filter(action => 
      Date.now() - action.timestamp.getTime() < 30000 // Last 30 seconds
    )

    if (recentActions.length >= 5 && !milestoneTrackedRef.current.has('interaction_burst')) {
      milestoneTrackedRef.current.add('interaction_burst')
      trackMilestone('interaction_burst', {
        interaction_count: recentActions.length,
        time_window: '30s'
      })
    }
  }, [actions])

  /**
   * Track tour milestone
   */
  const trackMilestone = useCallback(async (milestoneType: string, milestoneData: any) => {
    try {
      const response = await fetch(`/api/tours/${actualSessionId}/milestone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestone_type: milestoneType,
          milestone_data: milestoneData,
          user_info: config.userInfo,
          property_id: config.propertyId,
          ...config.trackingParams
        })
      })

      const result = await response.json()
      
      if (result.success) {
        console.log('🎯 Milestone tracked:', {
          type: milestoneType,
          value_score: result.milestone.value_score,
          meta_tracked: result.meta_tracking.event_sent
        })
      }
    } catch (error) {
      console.error('❌ Milestone tracking error:', error)
    }
  }, [config, actualSessionId])

  /**
   * Track sharing action
   */
  const trackShare = useCallback((platform: string) => {
    trackAction('share', platform)
    trackMilestone('share_action', { platform })
  }, [trackAction, trackMilestone])

  /**
   * Track zoom/interaction
   */
  const trackInteraction = useCallback((interactionType: string, target?: string) => {
    trackAction(interactionType, target)
  }, [trackAction])

  /**
   * Auto-cleanup on unmount - Only for sessions that were actually started
   */
  useEffect(() => {
    const sessionId = actualSessionId
    const userInfo = config.userInfo
    const trackingParams = config.trackingParams
    
    return () => {
      // ONLY cleanup sessions that were actually started AND successfully saved to database
      if (sessionId && isTracking && sessionCreatedInDB) {
        console.log('🧹 Cleaning up active tour session on unmount:', sessionId)
        fetch(`/api/tours/${sessionId}/complete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            final_engagement_data: { total_duration: 0, rooms_visited: [], actions_taken: [] },
            user_info: userInfo,
            completion_reason: 'component_unmount',
            ...trackingParams
          })
        }).catch(error => {
          console.log('🧹 Cleanup completion failed:', error)
        })
      } else if (sessionId) {
        console.log('🧹 Skipping cleanup for session that was never created in database:', sessionId, { 
          isTracking, 
          sessionCreatedInDB 
        })
      }
    }
  }, [actualSessionId, config.userInfo, config.trackingParams, isTracking, sessionCreatedInDB])

  return {
    // State
    isTracking,
    currentRoom,
    engagementScore,
    actionCount: actionCountRef.current,
    roomVisits,
    
    // Actions
    startTracking,
    stopTracking,
    trackAction,
    enterRoom,
    exitRoom,
    trackShare,
    trackInteraction,
    trackMilestone,
    
    // Computed properties
    totalDuration: Math.floor((Date.now() - tourStartTime.getTime()) / 1000),
    roomsVisitedCount: roomVisits.length,
    actionsCount: actions.length
  }
}

export default useTourTracking
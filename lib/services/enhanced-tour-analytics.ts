/**
 * Enhanced Tour Analytics for Meta Integration
 * Builds on existing tour_sessions table with sophisticated engagement analysis
 */

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { metaConversions } from '@/lib/services/meta-conversions'

export interface TourEngagementData {
  // Existing fields from your tour_sessions table
  session_id: string
  property_id: string
  user_id: string | null
  tour_type: 'virtual_3d' | 'realsee' | 'video'
  started_at: Date
  ended_at: Date | null
  total_duration_seconds: number
  rooms_visited: any // Your existing JSONB field
  actions_taken: any // Your existing JSONB field
  completed: boolean
  user_agent: string | null
  ip_address: string | null
  
  // Enhanced analytics (calculated)
  engagement_score: number // 0-100 from database trigger
  lead_quality_score: number // 0-65 from database trigger
  
  // Meta tracking fields (from database)
  meta_event_sent: boolean
  meta_event_id: string | null
  facebook_click_id: string | null
  facebook_browser_id: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
}

export interface TourMilestone {
  type: 'room_focus' | 'interaction_burst' | 'return_visit' | 'completion' | 'share_action'
  room_name?: string
  interaction_count?: number
  timestamp: Date
  value_score: number // 1-100 impact on lead quality
}

export class EnhancedTourAnalytics {
  
  /**
   * Analyze tour session for high-value engagement patterns
   */
  async analyzeTourEngagement(sessionId: string): Promise<TourEngagementData | null> {
    const supabase = await createServerSupabaseClient()
    
    const { data: session, error } = await supabase
      .from('tour_sessions')
      .select(`
        *,
        properties (
          id,
          title,
          price,
          property_type,
          city
        )
      `)
      .eq('session_id', sessionId)
      .single()
    
    if (error || !session) {
      console.error('Tour session not found:', error)
      return null
    }
    
    return session as TourEngagementData
  }

  /**
   * Detect high-value tour milestones from rooms_visited and actions_taken data
   */
  detectTourMilestones(tourData: TourEngagementData): TourMilestone[] {
    const milestones: TourMilestone[] = []
    
    if (!tourData.rooms_visited || !tourData.actions_taken) {
      return milestones
    }
    
    try {
      const rooms = Array.isArray(tourData.rooms_visited) ? tourData.rooms_visited : []
      const actions = Array.isArray(tourData.actions_taken) ? tourData.actions_taken : []
      
      // Detect room focus patterns (spending significant time in specific rooms)
      const roomTime = this.calculateRoomTime(rooms, actions)
      
      Object.entries(roomTime).forEach(([roomName, timeSpent]) => {
        if (timeSpent > 60) { // More than 1 minute in a room
          const valueScore = this.calculateRoomValueScore(roomName, timeSpent)
          milestones.push({
            type: 'room_focus',
            room_name: roomName,
            timestamp: new Date(),
            value_score: valueScore
          })
        }
      })
      
      // Detect interaction bursts (high activity periods)
      const interactionBursts = this.detectInteractionBursts(actions)
      interactionBursts.forEach(burst => {
        milestones.push({
          type: 'interaction_burst',
          interaction_count: burst.count,
          timestamp: burst.timestamp,
          value_score: Math.min(burst.count * 5, 50) // Up to 50 points for interactions
        })
      })
      
      // Detect completion milestone
      if (tourData.completed) {
        milestones.push({
          type: 'completion',
          timestamp: tourData.ended_at || new Date(),
          value_score: 30 // High value for completion
        })
      }
      
    } catch (error) {
      console.error('Error detecting tour milestones:', error)
    }
    
    return milestones
  }

  /**
   * Calculate time spent in each room based on actions
   */
  private calculateRoomTime(rooms: any[], actions: any[]): Record<string, number> {
    const roomTime: Record<string, number> = {}
    
    // Simple heuristic: if actions include room transitions, calculate time between them
    actions.forEach((action, index) => {
      if (action.type === 'room_enter' || action.room) {
        const roomName = action.room || action.target_room || 'unknown'
        const nextAction = actions[index + 1]
        
        if (nextAction && action.timestamp && nextAction.timestamp) {
          const timeSpent = new Date(nextAction.timestamp).getTime() - new Date(action.timestamp).getTime()
          roomTime[roomName] = (roomTime[roomName] || 0) + Math.floor(timeSpent / 1000)
        }
      }
    })
    
    return roomTime
  }

  /**
   * Calculate value score for specific rooms (bedrooms and kitchens are high value)
   */
  private calculateRoomValueScore(roomName: string, timeSpent: number): number {
    const baseScore = Math.min(timeSpent / 10, 20) // Up to 20 points for time
    
    // Room type multipliers
    const roomMultipliers: Record<string, number> = {
      'bedroom': 1.5,
      'master_bedroom': 2.0,
      'kitchen': 1.8,
      'living_room': 1.2,
      'bathroom': 1.0,
      'balcony': 1.3,
      'terrace': 1.4
    }
    
    const roomType = Object.keys(roomMultipliers).find(type => 
      roomName.toLowerCase().includes(type)
    )
    
    const multiplier = roomType ? roomMultipliers[roomType] : 1.0
    
    return Math.round(baseScore * multiplier)
  }

  /**
   * Detect periods of high interaction activity
   */
  private detectInteractionBursts(actions: any[]): Array<{count: number, timestamp: Date}> {
    const bursts: Array<{count: number, timestamp: Date}> = []
    const timeWindow = 30000 // 30 seconds
    
    for (let i = 0; i < actions.length; i++) {
      const currentAction = actions[i]
      if (!currentAction.timestamp) continue
      
      const currentTime = new Date(currentAction.timestamp).getTime()
      let count = 1
      
      // Count actions within time window
      for (let j = i + 1; j < actions.length; j++) {
        const nextAction = actions[j]
        if (!nextAction.timestamp) continue
        
        const nextTime = new Date(nextAction.timestamp).getTime()
        if (nextTime - currentTime <= timeWindow) {
          count++
        } else {
          break
        }
      }
      
      // If significant activity (5+ actions in 30 seconds), it's a burst
      if (count >= 5) {
        bursts.push({
          count,
          timestamp: new Date(currentAction.timestamp)
        })
        i += count - 1 // Skip the actions we just counted
      }
    }
    
    return bursts
  }

  /**
   * Send tour engagement event to Meta based on quality score
   */
  async sendTourMetaEvent(tourData: TourEngagementData, milestones: TourMilestone[]) {
    if (tourData.meta_event_sent) {
      console.log('Tour Meta event already sent for session:', tourData.session_id)
      return { success: true, skipped: true }
    }

    try {
      // Calculate total milestone value
      const milestoneValue = milestones.reduce((sum, m) => sum + m.value_score, 0)
      const totalScore = tourData.engagement_score + milestoneValue
      
      // Determine event type based on engagement quality
      let eventName = 'ViewContent'
      let eventValue = 10
      
      if (totalScore >= 80 || tourData.completed) {
        eventName = 'AddToCart' // High engagement
        eventValue = 100
      } else if (totalScore >= 50) {
        eventName = 'ViewContent' // Medium engagement
        eventValue = 50
      }

      // Send to Meta
      const result = await metaConversions.trackTourEngagement({
        userEmail: undefined, // Tours can be anonymous
        propertyId: tourData.property_id,
        engagementScore: totalScore,
        tourType: tourData.tour_type,
        duration: tourData.total_duration_seconds,
        completed: tourData.completed,
        ipAddress: tourData.ip_address || undefined,
        userAgent: tourData.user_agent || undefined
      })

      if (result.success) {
        // Update tour session with Meta tracking info
        const supabase = await createServerSupabaseClient()
        await supabase
          .from('tour_sessions')
          .update({
            meta_event_sent: true,
            meta_event_id: `tour_${tourData.session_id}_${Date.now()}`
          })
          .eq('session_id', tourData.session_id)

        console.log('✅ Tour Meta event sent successfully:', {
          session_id: tourData.session_id,
          event_name: eventName,
          total_score: totalScore,
          milestones_count: milestones.length
        })
      }

      return result

    } catch (error) {
      console.error('❌ Tour Meta event failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Track specific tour milestone with Meta
   */
  async trackTourMilestone(
    sessionId: string, 
    milestone: TourMilestone, 
    propertyId: string,
    userInfo?: { email?: string, phone?: string }
  ) {
    try {
      // Map milestone types to Meta events
      const milestoneEvents: Record<string, { event: string, value: number }> = {
        'room_focus': { event: 'Search', value: milestone.value_score },
        'interaction_burst': { event: 'ViewContent', value: milestone.value_score },
        'completion': { event: 'AddToCart', value: milestone.value_score * 2 },
        'return_visit': { event: 'AddToCart', value: milestone.value_score * 1.5 },
        'share_action': { event: 'Share', value: milestone.value_score }
      }

      const eventConfig = milestoneEvents[milestone.type]
      if (!eventConfig) return { success: false, error: 'Unknown milestone type' }

      const result = await metaConversions.trackConversion({
        eventName: eventConfig.event,
        userEmail: userInfo?.email,
        userPhone: userInfo?.phone,
        customData: {
          content_category: 'virtual_tour_milestone',
          content_name: `Tour ${milestone.type}`,
          property_id: propertyId,
          milestone_type: milestone.type,
          milestone_value: milestone.value_score,
          room_name: milestone.room_name,
          value: eventConfig.value
        }
      })

      if (result.success) {
        console.log('✅ Tour milestone tracked:', {
          session_id: sessionId,
          milestone_type: milestone.type,
          value_score: milestone.value_score
        })
      }

      return result

    } catch (error) {
      console.error('❌ Tour milestone tracking failed:', error)
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
    }
  }

  /**
   * Get tour analytics for dashboard
   */
  async getTourAnalyticsSummary(propertyId?: string, dateRange?: { start: string, end: string }) {
    const supabase = await createServerSupabaseClient()
    
    let query = supabase
      .from('tour_sessions')
      .select(`
        *,
        properties (
          title,
          property_type,
          price
        )
      `)
    
    if (propertyId) {
      query = query.eq('property_id', propertyId)
    }
    
    if (dateRange) {
      query = query.gte('started_at', dateRange.start).lte('started_at', dateRange.end)
    }
    
    const { data: sessions, error } = await query.order('started_at', { ascending: false })
    
    if (error) {
      console.error('Tour analytics query failed:', error)
      return { success: false, error: error.message }
    }
    
    // Calculate summary statistics
    const totalSessions = sessions.length
    const completedSessions = sessions.filter(s => s.completed).length
    const averageEngagement = sessions.reduce((sum, s) => sum + (s.engagement_score || 0), 0) / totalSessions
    const metaEventsSent = sessions.filter(s => s.meta_event_sent).length
    
    return {
      success: true,
      data: {
        summary: {
          total_sessions: totalSessions,
          completed_sessions: completedSessions,
          completion_rate: totalSessions > 0 ? completedSessions / totalSessions : 0,
          average_engagement_score: Math.round(averageEngagement),
          meta_events_sent: metaEventsSent,
          meta_tracking_rate: totalSessions > 0 ? metaEventsSent / totalSessions : 0
        },
        recent_sessions: sessions.slice(0, 20) // Latest 20 sessions
      }
    }
  }
}

// Export singleton instance
export const enhancedTourAnalytics = new EnhancedTourAnalytics()
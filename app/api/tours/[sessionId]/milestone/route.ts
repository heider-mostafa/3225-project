import { NextRequest, NextResponse } from 'next/server'
import { enhancedTourAnalytics } from '@/lib/services/enhanced-tour-analytics'
import { extractTrackingParams } from '@/lib/utils/meta-tracking'

/**
 * Track real-time tour milestones during virtual tours
 * Called when significant interactions happen during tours
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
      milestone_type, // 'room_focus', 'interaction_burst', 'completion', 'share_action'
      milestone_data,
      user_info,
      property_id
    } = body

    // Extract tracking parameters
    const trackingParams = extractTrackingParams(request, body)

    if (!sessionId || !milestone_type || !property_id) {
      return NextResponse.json(
        { error: 'Session ID, milestone type, and property ID are required' },
        { status: 400 }
      )
    }

    // Validate milestone type
    const validMilestones = ['room_focus', 'interaction_burst', 'completion', 'share_action', 'return_visit']
    if (!validMilestones.includes(milestone_type)) {
      return NextResponse.json(
        { error: `Invalid milestone type. Must be one of: ${validMilestones.join(', ')}` },
        { status: 400 }
      )
    }

    // Create milestone object
    const milestone = {
      type: milestone_type as any,
      room_name: milestone_data?.room_name,
      interaction_count: milestone_data?.interaction_count,
      timestamp: new Date(),
      value_score: calculateMilestoneValue(milestone_type, milestone_data)
    }

    // Track milestone with Meta (only for high-value milestones)
    let metaResult = { success: true, skipped: true }
    
    if (milestone.value_score >= 15) { // Only track significant milestones
      try {
        metaResult = await enhancedTourAnalytics.trackTourMilestone(
          sessionId,
          milestone,
          property_id,
          user_info
        )
      } catch (error) {
        console.error('Milestone Meta tracking failed:', error)
        // Don't fail the API if Meta fails
      }
    }

    // Log milestone for analytics
    console.log('Tour milestone tracked:', {
      session_id: sessionId,
      milestone_type,
      value_score: milestone.value_score,
      meta_tracked: metaResult.success && !metaResult.skipped
    })

    return NextResponse.json({
      success: true,
      milestone: {
        type: milestone.type,
        value_score: milestone.value_score,
        room_name: milestone.room_name,
        interaction_count: milestone.interaction_count,
        timestamp: milestone.timestamp
      },
      meta_tracking: {
        event_sent: metaResult.success && !metaResult.skipped,
        should_track: milestone.value_score >= 15,
        tracking_reason: milestone.value_score >= 15 ? 'high_value_milestone' : 'low_value_milestone'
      },
      recommendations: {
        follow_up_priority: milestone.value_score >= 30 ? 'high' :
                           milestone.value_score >= 15 ? 'medium' : 'low',
        next_milestone_targets: getNextMilestoneTargets(milestone_type)
      }
    })

  } catch (error) {
    console.error('Tour milestone error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Calculate milestone value score based on type and data
 */
function calculateMilestoneValue(milestoneType: string, data: any): number {
  switch (milestoneType) {
    case 'room_focus':
      // Higher value for bedrooms and kitchens
      const roomName = data?.room_name?.toLowerCase() || ''
      let baseValue = 10
      
      if (roomName.includes('bedroom') || roomName.includes('master')) baseValue = 25
      else if (roomName.includes('kitchen')) baseValue = 20
      else if (roomName.includes('living') || roomName.includes('salon')) baseValue = 15
      else if (roomName.includes('balcony') || roomName.includes('terrace')) baseValue = 18
      
      // Time spent multiplier
      const timeSpent = data?.time_spent || 0
      const timeMultiplier = Math.min(timeSpent / 30, 2) // Max 2x for 30+ seconds
      
      return Math.round(baseValue * timeMultiplier)

    case 'interaction_burst':
      // Value based on interaction intensity
      const interactionCount = data?.interaction_count || 0
      return Math.min(interactionCount * 3, 30) // Max 30 points

    case 'completion':
      return 35 // High value for completing tour

    case 'share_action':
      return 25 // High value for sharing

    case 'return_visit':
      return 40 // Very high value for return visits

    default:
      return 5 // Default low value
  }
}

/**
 * Get suggested next milestone targets based on current milestone
 */
function getNextMilestoneTargets(currentMilestone: string): string[] {
  const targets: Record<string, string[]> = {
    'room_focus': ['interaction_burst', 'share_action', 'completion'],
    'interaction_burst': ['room_focus', 'completion', 'share_action'],
    'completion': ['share_action', 'return_visit'],
    'share_action': ['return_visit', 'completion'],
    'return_visit': ['completion', 'interaction_burst']
  }

  return targets[currentMilestone] || ['completion']
}
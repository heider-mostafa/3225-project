import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const leadData = await request.json()

    // Validate required fields
    if (!leadData.property_id || !leadData.conversation_metrics) {
      return NextResponse.json(
        { error: 'Missing required lead intelligence data' },
        { status: 400 }
      )
    }

    // Get user from database
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, lead_intelligence')
      .eq('email', user.email)
      .single()

    if (userError || !userData) {
      console.error('Error fetching user:', userError)
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Prepare enhanced lead intelligence data
    const currentTime = new Date().toISOString()
    const existingIntelligence = userData.lead_intelligence || {}
    
    // Create property-specific intelligence entry
    const propertyIntelligence = {
      property_id: leadData.property_id,
      last_updated: currentTime,
      conversation_summary: {
        total_sessions: (existingIntelligence[leadData.property_id]?.conversation_summary?.total_sessions || 0) + 1,
        total_questions: leadData.conversation_metrics.totalQuestions,
        total_buying_signals: leadData.conversation_metrics.buyingSignals,
        engagement_score: leadData.conversation_metrics.engagementScore,
        lead_quality: leadData.conversation_metrics.leadQuality,
        lead_score: leadData.conversation_metrics.leadScore,
        qualification: leadData.conversation_metrics.qualification
      },
      behavioral_profile: {
        primary_interests: [...new Set([
          ...(existingIntelligence[leadData.property_id]?.behavioral_profile?.primary_interests || []),
          ...leadData.market_intelligence.primary_interests
        ])],
        decision_timeframe: leadData.market_intelligence.decision_timeframe,
        urgency_level: leadData.market_intelligence.urgency_level,
        language_preference: leadData.latest_interaction.language_preference,
        cultural_context: leadData.latest_interaction.cultural_context,
        preferred_rooms: [...new Set([
          ...(existingIntelligence[leadData.property_id]?.behavioral_profile?.preferred_rooms || []),
          ...leadData.tour_context.rooms_visited
        ])]
      },
      interaction_history: [
        ...(existingIntelligence[leadData.property_id]?.interaction_history || []).slice(-9), // Keep last 9
        {
          timestamp: currentTime,
          session_duration_ms: leadData.tour_context.tour_duration_ms,
          detected_signals: leadData.latest_interaction.detected_signals,
          room_focus: leadData.tour_context.current_room,
          conversation_quality: leadData.conversation_metrics.leadQuality,
          engagement_score: leadData.conversation_metrics.engagementScore
        }
      ],
      sales_intelligence: {
        hot_signals: leadData.latest_interaction.detected_signals.filter((signal: string) => 
          ['price_inquiry', 'timeline_inquiry', 'urgency', 'emotional_connection'].includes(signal)
        ),
        objections: [], // Will be populated based on conversation analysis
        next_action: leadData.conversation_metrics.qualification.action,
        follow_up_priority: leadData.conversation_metrics.qualification.priority,
        conversion_probability: leadData.conversation_metrics.qualification.level === 'hot' ? 0.8 : 
                               leadData.conversation_metrics.qualification.level === 'warm' ? 0.5 : 0.2
      }
    }

    // Update user's lead intelligence
    const updatedIntelligence = {
      ...existingIntelligence,
      [leadData.property_id]: propertyIntelligence,
      last_activity: currentTime,
      overall_engagement: {
        total_properties_viewed: Object.keys({...existingIntelligence, [leadData.property_id]: true}).length,
        highest_lead_score: Math.max(
          leadData.conversation_metrics.leadScore,
          existingIntelligence.overall_engagement?.highest_lead_score || 0
        ),
        most_engaged_property: leadData.conversation_metrics.leadScore > 
          (existingIntelligence.overall_engagement?.highest_lead_score || 0) ? 
          leadData.property_id : existingIntelligence.overall_engagement?.most_engaged_property
      }
    }

    // Save to database
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        lead_intelligence: updatedIntelligence,
        updated_at: currentTime 
      })
      .eq('id', userData.id)

    if (updateError) {
      console.error('Error updating user lead intelligence:', updateError)
      return NextResponse.json(
        { error: 'Failed to save lead intelligence' },
        { status: 500 }
      )
    }

    // Also log this activity for admin analytics
    try {
      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: userData.id,
          activity_type: 'voice_conversation',
          activity_data: {
            property_id: leadData.property_id,
            lead_quality: leadData.conversation_metrics.leadQuality,
            engagement_score: leadData.conversation_metrics.engagementScore,
            buying_signals: leadData.latest_interaction.detected_signals,
            language: leadData.latest_interaction.language_preference
          },
          created_at: currentTime
        })
    } catch (logError) {
      console.warn('Could not log user activity:', logError)
    }

    return NextResponse.json({
      success: true,
      lead_quality: leadData.conversation_metrics.leadQuality,
      engagement_score: leadData.conversation_metrics.engagementScore,
      message: 'Lead intelligence saved successfully'
    })

  } catch (error) {
    console.error('Error in lead intelligence endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')

    // Get user's lead intelligence
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('lead_intelligence')
      .eq('email', user.email)
      .single()

    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    if (propertyId) {
      // Return intelligence for specific property
      const propertyIntelligence = userData.lead_intelligence?.[propertyId]
      return NextResponse.json({
        property_intelligence: propertyIntelligence || null
      })
    } else {
      // Return overall intelligence summary
      return NextResponse.json({
        overall_intelligence: userData.lead_intelligence || {}
      })
    }

  } catch (error) {
    console.error('Error fetching lead intelligence:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
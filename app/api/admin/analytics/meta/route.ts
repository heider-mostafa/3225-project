import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { isServerUserAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check admin authentication
    const isAdmin = await isServerUserAdmin()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'
    
    // Calculate date range
    const endDate = new Date()
    const startDate = new Date()
    
    switch (range) {
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '30d':
        startDate.setDate(startDate.getDate() - 30)
        break
      case '90d':
        startDate.setDate(startDate.getDate() - 90)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
    }

    // ===============================================
    // META EVENT OVERVIEW METRICS
    // ===============================================
    
    const { data: totalEventsData } = await supabase
      .from('meta_tracking_events')
      .select('event_name, event_value, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const totalEvents = totalEventsData?.length || 0
    const totalConversions = totalEventsData?.filter(e => 
      ['Purchase', 'CompleteRegistration', 'Lead', 'Schedule'].includes(e.event_name)
    ).length || 0
    
    const conversionValue = totalEventsData?.reduce((sum, event) => 
      sum + (event.event_value || 0), 0
    ) || 0
    
    const conversationEvents = totalEventsData?.filter(e => 
      e.event_name === 'conversation_completed'
    ).length || 0
    
    const tourEvents = totalEventsData?.filter(e => 
      e.event_name === 'tour_milestone_reached'
    ).length || 0
    
    const rentalEvents = totalEventsData?.filter(e => 
      ['rental_search', 'rental_booking_initiated', 'rental_booking_confirmed'].includes(e.event_name)
    ).length || 0

    // Calculate growth (simple mock for now)
    const eventGrowth = Math.floor(Math.random() * 20) + 5 // 5-25% mock growth

    // ===============================================
    // EVENT METRICS BY TYPE
    // ===============================================
    
    const eventTypeGroups = totalEventsData?.reduce((acc: any, event) => {
      const eventName = event.event_name
      if (!acc[eventName]) {
        acc[eventName] = { count: 0, total_value: 0 }
      }
      acc[eventName].count += 1
      acc[eventName].total_value += event.event_value || 0
      return acc
    }, {}) || {}

    const eventMetricsByType = Object.entries(eventTypeGroups).map(([event_name, data]: [string, any]) => ({
      event_name,
      count: data.count,
      total_value: data.total_value,
      avg_value: data.count > 0 ? data.total_value / data.count : 0
    })).sort((a, b) => b.count - a.count)

    // ===============================================
    // CONVERSATION METRICS
    // ===============================================
    
    const { data: conversationData } = await supabase
      .from('conversation_sessions')
      .select('qualification_score, completion_status, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const totalConversationSessions = conversationData?.length || 0
    const averageQualificationScore = conversationData?.length ? 
      conversationData.reduce((sum, session) => sum + (session.qualification_score || 0), 0) / conversationData.length : 0
    
    const highIntentConversations = conversationData?.filter(session => 
      (session.qualification_score || 0) >= 7
    ).length || 0
    
    const conversationCompletionRate = conversationData?.length ? 
      (conversationData.filter(session => session.completion_status === 'completed').length / conversationData.length) * 100 : 0

    // Qualification score distribution
    const scoreRanges = [
      { range: '0-2', min: 0, max: 2 },
      { range: '3-4', min: 3, max: 4 },
      { range: '5-6', min: 5, max: 6 },
      { range: '7-8', min: 7, max: 8 },
      { range: '9-10', min: 9, max: 10 }
    ]

    const byQualificationScore = scoreRanges.map(scoreRange => {
      const count = conversationData?.filter(session => {
        const score = session.qualification_score || 0
        return score >= scoreRange.min && score <= scoreRange.max
      }).length || 0
      
      return {
        score_range: scoreRange.range,
        count,
        meta_value: count * (scoreRange.min + scoreRange.max) * 25 // Mock value calculation
      }
    })

    // ===============================================
    // TOUR METRICS
    // ===============================================
    
    const { data: tourData } = await supabase
      .from('tour_sessions')
      .select('engagement_score, completion_status, total_duration, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const totalTourSessions = tourData?.length || 0
    const averageTourEngagementScore = tourData?.length ? 
      tourData.reduce((sum, session) => sum + (session.engagement_score || 0), 0) / tourData.length : 0
    
    const tourCompletionRate = tourData?.length ? 
      (tourData.filter(session => session.completion_status === 'completed').length / tourData.length) * 100 : 0
    
    const averageTourDuration = tourData?.length ? 
      tourData.reduce((sum, session) => sum + (session.total_duration || 0), 0) / tourData.length : 0

    // Top milestones (mock data based on common tour milestones)
    const topMilestones = [
      { milestone: 'tour_started', count: Math.floor(totalTourSessions * 1.0), avg_value: 15 },
      { milestone: 'room_focus', count: Math.floor(totalTourSessions * 0.8), avg_value: 25 },
      { milestone: 'interaction_burst', count: Math.floor(totalTourSessions * 0.6), avg_value: 35 },
      { milestone: 'tour_completed', count: Math.floor(totalTourSessions * 0.4), avg_value: 50 }
    ]

    // ===============================================
    // RENTAL METRICS
    // ===============================================
    
    const { data: rentalSearchData } = await supabase
      .from('rental_customer_ltv_profiles')
      .select('total_booking_value, total_bookings, ltv_score, created_at')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())

    const searchEventsCount = rentalEvents // From earlier calculation
    const bookingEventsCount = totalEventsData?.filter(e => 
      e.event_name === 'rental_booking_confirmed'
    ).length || 0
    
    const rentalConversionRate = searchEventsCount > 0 ? 
      (bookingEventsCount / searchEventsCount) * 100 : 0
    
    const averageLTV = rentalSearchData?.length ? 
      rentalSearchData.reduce((sum, profile) => sum + (profile.total_booking_value || 0), 0) / rentalSearchData.length : 0
    
    const highValueCustomers = rentalSearchData?.filter(profile => 
      (profile.ltv_score || 0) >= 8
    ).length || 0

    // ===============================================
    // PERFORMANCE METRICS (MOCK DATA)
    // ===============================================
    
    const mockPerformance = {
      costPerEvent: 2.50,
      roas: 4.2, // Return on Ad Spend
      cpa: 45.00, // Cost per Acquisition
      qualityScore: 8.5
    }

    const averageEventValue = totalEvents > 0 ? conversionValue / totalEvents : 0

    // ===============================================
    // ASSEMBLE RESPONSE
    // ===============================================
    
    const metaAnalytics = {
      overview: {
        totalEvents,
        totalConversions,
        conversionValue,
        conversationEvents,
        tourEvents,
        rentalEvents,
        averageEventValue,
        eventGrowth
      },
      eventMetrics: {
        byType: eventMetricsByType,
        bySource: [
          { source: 'Facebook Ads', events: Math.floor(totalEvents * 0.6), conversions: Math.floor(totalConversions * 0.7), value: Math.floor(conversionValue * 0.8) },
          { source: 'Instagram Ads', events: Math.floor(totalEvents * 0.3), conversions: Math.floor(totalConversions * 0.2), value: Math.floor(conversionValue * 0.15) },
          { source: 'Organic', events: Math.floor(totalEvents * 0.1), conversions: Math.floor(totalConversions * 0.1), value: Math.floor(conversionValue * 0.05) }
        ],
        conversionFunnel: [
          { stage: 'View', count: totalEvents, conversion_rate: 100 },
          { stage: 'Engage', count: Math.floor(totalEvents * 0.4), conversion_rate: 40 },
          { stage: 'Intent', count: Math.floor(totalEvents * 0.15), conversion_rate: 15 },
          { stage: 'Convert', count: totalConversions, conversion_rate: totalEvents > 0 ? (totalConversions / totalEvents) * 100 : 0 }
        ]
      },
      conversationMetrics: {
        totalSessions: totalConversationSessions,
        averageQualificationScore,
        highIntentConversations,
        completionRate: Math.round(conversationCompletionRate),
        byQualificationScore
      },
      tourMetrics: {
        totalSessions: totalTourSessions,
        averageEngagementScore: Math.round(averageTourEngagementScore * 10) / 10,
        completionRate: Math.round(tourCompletionRate),
        averageDuration: Math.round(averageTourDuration),
        topMilestones
      },
      rentalMetrics: {
        searchEvents: searchEventsCount,
        bookingEvents: bookingEventsCount,
        conversionRate: Math.round(rentalConversionRate * 10) / 10,
        averageLTV: Math.round(averageLTV),
        highValueCustomers
      },
      performance: mockPerformance
    }

    return NextResponse.json(metaAnalytics)

  } catch (error) {
    console.error('Meta analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch Meta analytics' }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { enhancedTourAnalytics } from '@/lib/services/enhanced-tour-analytics'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * Get comprehensive tour analytics for dashboard
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const propertyId = searchParams.get('property_id')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const includeMetaAnalytics = searchParams.get('include_meta') === 'true'

    // Date range validation
    const dateRange = startDate && endDate ? {
      start: startDate,
      end: endDate
    } : undefined

    // Get basic tour analytics
    const tourAnalytics = await enhancedTourAnalytics.getTourAnalyticsSummary(
      propertyId || undefined,
      dateRange
    )

    if (!tourAnalytics.success) {
      return NextResponse.json(
        { error: 'Failed to fetch tour analytics' },
        { status: 500 }
      )
    }

    let response = {
      success: true,
      tour_analytics: tourAnalytics.data
    }

    // Add Meta analytics if requested
    if (includeMetaAnalytics) {
      const metaAnalytics = await getMetaTourAnalytics(propertyId, dateRange)
      response = {
        ...response,
        meta_analytics: metaAnalytics
      }
    }

    // Add engagement insights
    const engagementInsights = await getEngagementInsights(propertyId, dateRange)
    response = {
      ...response,
      engagement_insights: engagementInsights
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Tour analytics error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * Get Meta-specific tour analytics
 */
async function getMetaTourAnalytics(propertyId?: string, dateRange?: { start: string, end: string }) {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('meta_conversion_events')
    .select('*')
    .eq('table_name', 'tour_sessions')
  
  if (propertyId) {
    query = query.contains('custom_data', { property_id: propertyId })
  }
  
  if (dateRange) {
    query = query.gte('sent_at', dateRange.start).lte('sent_at', dateRange.end)
  }
  
  const { data: metaEvents, error } = await query.order('sent_at', { ascending: false })
  
  if (error) {
    console.error('Meta tour analytics query failed:', error)
    return { error: 'Failed to fetch Meta analytics' }
  }
  
  // Calculate Meta-specific metrics
  const totalEvents = metaEvents.length
  const successfulEvents = metaEvents.filter(e => e.success).length
  const totalValue = metaEvents.reduce((sum, e) => sum + (e.event_value || 0), 0)
  
  // Group by event type
  const eventBreakdown = metaEvents.reduce((acc, event) => {
    const type = event.event_name
    if (!acc[type]) {
      acc[type] = { count: 0, value: 0 }
    }
    acc[type].count += 1
    acc[type].value += event.event_value || 0
    return acc
  }, {} as Record<string, any>)
  
  return {
    summary: {
      total_meta_events: totalEvents,
      successful_events: successfulEvents,
      success_rate: totalEvents > 0 ? successfulEvents / totalEvents : 0,
      total_value_sent: totalValue,
      average_event_value: totalEvents > 0 ? totalValue / totalEvents : 0
    },
    event_breakdown: eventBreakdown,
    recent_events: metaEvents.slice(0, 10)
  }
}

/**
 * Get engagement insights and patterns
 */
async function getEngagementInsights(propertyId?: string, dateRange?: { start: string, end: string }) {
  const supabase = await createServerSupabaseClient()
  
  let query = supabase
    .from('tour_sessions')
    .select(`
      engagement_score,
      lead_quality_score,
      tour_type,
      total_duration_seconds,
      completed,
      rooms_visited,
      actions_taken,
      properties (
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
  
  const { data: sessions, error } = await query
  
  if (error) {
    console.error('Engagement insights query failed:', error)
    return { error: 'Failed to fetch engagement insights' }
  }
  
  if (sessions.length === 0) {
    return {
      engagement_patterns: {},
      top_performing_properties: [],
      optimization_recommendations: []
    }
  }
  
  // Analyze engagement patterns
  const engagementPatterns = {
    high_engagement: sessions.filter(s => s.engagement_score >= 70).length,
    medium_engagement: sessions.filter(s => s.engagement_score >= 40 && s.engagement_score < 70).length,
    low_engagement: sessions.filter(s => s.engagement_score < 40).length,
    average_duration: sessions.reduce((sum, s) => sum + s.total_duration_seconds, 0) / sessions.length,
    completion_rate: sessions.filter(s => s.completed).length / sessions.length
  }
  
  // Find top performing tour types
  const tourTypePerformance = sessions.reduce((acc, session) => {
    const type = session.tour_type
    if (!acc[type]) {
      acc[type] = { count: 0, total_engagement: 0, completions: 0 }
    }
    acc[type].count += 1
    acc[type].total_engagement += session.engagement_score || 0
    if (session.completed) acc[type].completions += 1
    return acc
  }, {} as Record<string, any>)
  
  Object.keys(tourTypePerformance).forEach(type => {
    const data = tourTypePerformance[type]
    data.average_engagement = data.total_engagement / data.count
    data.completion_rate = data.completions / data.count
  })
  
  // Generate optimization recommendations
  const recommendations = []
  
  if (engagementPatterns.completion_rate < 0.3) {
    recommendations.push({
      type: 'completion_rate',
      priority: 'high',
      message: 'Low tour completion rate detected. Consider optimizing tour length or adding interactive elements.',
      metric_value: engagementPatterns.completion_rate
    })
  }
  
  if (engagementPatterns.average_duration < 120) {
    recommendations.push({
      type: 'engagement_duration',
      priority: 'medium',
      message: 'Tours are quite short. Consider adding more engaging content or improving tour flow.',
      metric_value: engagementPatterns.average_duration
    })
  }
  
  const highValueTourType = Object.entries(tourTypePerformance)
    .sort(([,a], [,b]) => (b as any).average_engagement - (a as any).average_engagement)[0]
  
  if (highValueTourType) {
    recommendations.push({
      type: 'tour_type_optimization',
      priority: 'low',
      message: `${highValueTourType[0]} tours show highest engagement. Consider promoting this tour type.`,
      metric_value: (highValueTourType[1] as any).average_engagement
    })
  }
  
  return {
    engagement_patterns: engagementPatterns,
    tour_type_performance: tourTypePerformance,
    optimization_recommendations: recommendations
  }
}
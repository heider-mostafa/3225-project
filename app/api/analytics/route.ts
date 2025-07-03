import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/analytics - Comprehensive system analytics
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions for analytics access
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d' // 7d, 30d, 90d, 1y
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    const metric = searchParams.get('metric') // specific metric filter

    // Calculate date range
    let dateFilter = ''
    if (startDate && endDate) {
      dateFilter = `created_at.gte.${startDate}.and.created_at.lte.${endDate}`
    } else {
      const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
      const days = daysMap[period as keyof typeof daysMap] || 30
      const fromDate = new Date()
      fromDate.setDate(fromDate.getDate() - days)
      dateFilter = `created_at.gte.${fromDate.toISOString()}`
    }

    // Run parallel queries for comprehensive analytics
    const [
      propertyStats,
      userEngagement,
      inquiryTrends,
      propertyViews,
      topProperties,
      heygenSessions,
      tourMetrics,
      conversionRates,
      geographicData,
      deviceAnalytics
    ] = await Promise.all([
      // Property Statistics
      supabase
        .from('properties')
        .select('status, property_type, price, city, created_at')
        .gte('created_at', dateFilter.split('.gte.')[1]),

      // User Engagement
      supabase
        .from('property_analytics')
        .select('event_type, created_at, property_id')
        .gte('created_at', dateFilter.split('.gte.')[1]),

      // Inquiry Trends
      supabase
        .from('inquiries')
        .select('status, priority, created_at, property_id')
        .gte('created_at', dateFilter.split('.gte.')[1]),

      // Property Views Detail
      supabase
        .from('property_analytics')
        .select(`
          property_id,
          event_data,
          created_at,
          properties (
            title,
            price,
            city,
            property_type
          )
        `)
        .eq('event_type', 'view')
        .gte('created_at', dateFilter.split('.gte.')[1])
        .order('created_at', { ascending: false })
        .limit(100),

      // Top Performing Properties
      supabase.rpc('get_top_properties', { 
        period_days: period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365 
      }),

      // HeyGen Sessions
      supabase
        .from('property_analytics')
        .select('event_data, created_at, property_id')
        .eq('event_type', 'heygen_session_started')
        .gte('created_at', dateFilter.split('.gte.')[1]),

      // Virtual Tour Metrics
      supabase
        .from('property_analytics')
        .select('event_data, created_at, property_id')
        .in('event_type', ['virtual_tour_started', 'virtual_tour_completed'])
        .gte('created_at', dateFilter.split('.gte.')[1]),

      // Conversion Rates (views to inquiries)
      supabase.rpc('calculate_conversion_rates', {
        period_days: period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365
      }),

      // Geographic Distribution
      supabase
        .from('properties')
        .select('city, state, country, status')
        .gte('created_at', dateFilter.split('.gte.')[1]),

      // Device Analytics
      supabase
        .from('property_analytics')
        .select('event_data')
        .eq('event_type', 'view')
        .gte('created_at', dateFilter.split('.gte.')[1])
    ])

    // Process and aggregate data
    const analytics = {
      overview: {
        totalProperties: propertyStats.data?.length || 0,
        activeProperties: propertyStats.data?.filter(p => p.status === 'active').length || 0,
        totalViews: userEngagement.data?.filter(e => e.event_type === 'view').length || 0,
        totalInquiries: inquiryTrends.data?.length || 0,
        conversionRate: conversionRates.data || 0,
        period
      },

      propertyMetrics: {
        byStatus: aggregateByField(propertyStats.data || [], 'status'),
        byType: aggregateByField(propertyStats.data || [], 'property_type'),
        priceRanges: calculatePriceRanges(propertyStats.data || []),
        newListings: propertyStats.data?.length || 0
      },

      userEngagement: {
        totalEvents: userEngagement.data?.length || 0,
        eventsByType: aggregateByField(userEngagement.data || [], 'event_type'),
        dailyActivity: aggregateByDate(userEngagement.data || []),
        topViewedProperties: topProperties.data || []
      },

      inquiryAnalytics: {
        total: inquiryTrends.data?.length || 0,
        byStatus: aggregateByField(inquiryTrends.data || [], 'status'),
        byPriority: aggregateByField(inquiryTrends.data || [], 'priority'),
        dailyInquiries: aggregateByDate(inquiryTrends.data || []),
        responseTime: calculateAverageResponseTime(inquiryTrends.data || [])
      },

      heygenMetrics: {
        totalSessions: heygenSessions.data?.length || 0,
        averageSessionDuration: calculateAverageSessionDuration(heygenSessions.data || []),
        dailySessions: aggregateByDate(heygenSessions.data || [])
      },

      virtualTours: {
        started: (tourMetrics.data as any[])?.filter(t => t.event_type === 'virtual_tour_started').length || 0,
        completed: (tourMetrics.data as any[])?.filter(t => t.event_type === 'virtual_tour_completed').length || 0,
        completionRate: calculateTourCompletionRate(tourMetrics.data || [])
      },

      geographic: {
        byCities: aggregateByField(geographicData.data || [], 'city'),
        byStates: aggregateByField(geographicData.data || [], 'state'),
        topLocations: getTopLocations(geographicData.data || [])
      },

      technical: {
        deviceTypes: extractDeviceTypes(deviceAnalytics.data || []),
        browsers: extractBrowsers(deviceAnalytics.data || []),
        performanceMetrics: {
          averageLoadTime: calculateAverageLoadTime(deviceAnalytics.data || [])
        }
      }
    }

    // Log analytics access
    await logAdminActivity(
      'analytics_accessed',
      'system',
      undefined,
      {
        period,
        startDate,
        endDate,
        metric,
        dataPoints: analytics.overview.totalViews + analytics.overview.totalInquiries
      },
      request
    )

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    )
  }
}

// Helper functions for data aggregation
function aggregateByField(data: any[], field: string) {
  return data.reduce((acc, item) => {
    const value = item[field] || 'unknown'
    acc[value] = (acc[value] || 0) + 1
    return acc
  }, {})
}

function aggregateByDate(data: any[]) {
  return data.reduce((acc, item) => {
    const date = new Date(item.created_at).toISOString().split('T')[0]
    acc[date] = (acc[date] || 0) + 1
    return acc
  }, {})
}

function calculatePriceRanges(properties: any[]) {
  const ranges = {
    'under_500k': 0,
    '500k_1m': 0,
    '1m_2m': 0,
    '2m_5m': 0,
    'over_5m': 0
  }

  properties.forEach(prop => {
    const price = prop.price || 0
    if (price < 500000) ranges.under_500k++
    else if (price < 1000000) ranges['500k_1m']++
    else if (price < 2000000) ranges['1m_2m']++
    else if (price < 5000000) ranges['2m_5m']++
    else ranges.over_5m++
  })

  return ranges
}

function calculateAverageResponseTime(inquiries: any[]) {
  const respondedInquiries = inquiries.filter(i => i.status === 'responded')
  if (respondedInquiries.length === 0) return 0
  
  // Simplified calculation - would need updated_at field for accurate response time
  return 24 // hours (placeholder)
}

function calculateAverageSessionDuration(sessions: any[]) {
  if (sessions.length === 0) return 0
  
  const durations = sessions
    .map(s => s.event_data?.duration || 0)
    .filter(d => d > 0)
  
  return durations.length > 0 
    ? durations.reduce((sum, d) => sum + d, 0) / durations.length 
    : 0
}

function calculateTourCompletionRate(tours: any[]) {
  const started = tours.filter(t => t.event_type === 'virtual_tour_started').length
  const completed = tours.filter(t => t.event_type === 'virtual_tour_completed').length
  
  return started > 0 ? (completed / started) * 100 : 0
}

function getTopLocations(properties: any[]) {
  const cityStats = aggregateByField(properties, 'city')
  return Object.entries(cityStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }))
}

function extractDeviceTypes(analytics: any[]) {
  const devices = analytics.map(a => a.event_data?.device_type || 'unknown')
  return aggregateByField(devices.map(d => ({ device_type: d })), 'device_type')
}

function extractBrowsers(analytics: any[]) {
  const browsers = analytics.map(a => a.event_data?.browser || 'unknown')
  return aggregateByField(browsers.map(b => ({ browser: b })), 'browser')
}

function calculateAverageLoadTime(analytics: any[]) {
  const loadTimes = analytics
    .map(a => a.event_data?.load_time || 0)
    .filter(t => t > 0)
  
  return loadTimes.length > 0 
    ? loadTimes.reduce((sum, t) => sum + t, 0) / loadTimes.length 
    : 0
}

// POST /api/analytics - Export analytics data
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { format, period, metrics } = await request.json()

    if (!format || !['csv', 'json', 'excel'].includes(format)) {
      return NextResponse.json(
        { error: 'Valid format (csv, json, excel) is required' },
        { status: 400 }
      )
    }

    // Generate export data based on format and metrics
    const exportData = await generateExportData(metrics, period)

    // Log export activity
    await logAdminActivity(
      'analytics_exported',
      'system',
      undefined,
      {
        format,
        period,
        metrics,
        recordCount: exportData.length
      },
      request
    )

    return NextResponse.json({
      success: true,
      format,
      data: exportData,
      exportedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error exporting analytics:', error)
    return NextResponse.json(
      { error: 'Failed to export analytics data' },
      { status: 500 }
    )
  }
}

async function generateExportData(metrics: string[], period: string) {
  // Simplified export data generation
  // In production, this would generate actual CSV/Excel files
  return [
    { metric: 'total_views', value: 1234, period },
    { metric: 'total_inquiries', value: 89, period },
    { metric: 'conversion_rate', value: 7.2, period }
  ]
} 
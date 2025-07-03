import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin } from '@/lib/auth/admin'

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const dateRange = searchParams.get('range') || '30d'
    
    const supabase = await createServerSupabaseClient()

    // Calculate date range
    const daysBack = dateRange === '7d' ? 7 : dateRange === '90d' ? 90 : dateRange === '1y' ? 365 : 30
    const startDate = new Date(Date.now() - daysBack * 24 * 60 * 60 * 1000).toISOString()

    // Get all data in parallel
    const [
      propertiesData,
      usersData,
      inquiriesData,
      viewsData,
      analyticsData,
      tourSessionsData,
      heygenSessionsData
    ] = await Promise.all([
      // Properties data
      supabase
        .from('properties')
        .select('*')
        .gte('created_at', startDate),
      
      // Users data (from user_roles table)
      supabase
        .from('user_roles')
        .select('*, created_at:granted_at')
        .gte('granted_at', startDate),
      
      // Inquiries data
      supabase
        .from('inquiries')
        .select('*, properties(title, property_type, city)')
        .gte('created_at', startDate),
      
      // Property views
      supabase
        .from('property_views')
        .select('*, properties(title, property_type)')
        .gte('viewed_at', startDate),
      
      // Property analytics
      supabase
        .from('property_analytics')
        .select('*, properties(title, property_type)')
        .gte('created_at', startDate),
      
      // Tour sessions
      supabase
        .from('tour_sessions')
        .select('*, properties(title, property_type)')
        .gte('started_at', startDate),
      
      // HeyGen sessions
      supabase
        .from('heygen_sessions')
        .select('*, properties(title, property_type)')
        .gte('started_at', startDate)
    ])

    // Calculate growth percentages by comparing with previous period
    const previousStartDate = new Date(Date.now() - (daysBack * 2) * 24 * 60 * 60 * 1000).toISOString()
    const previousEndDate = startDate

    const [
      previousProperties,
      previousUsers,
      previousInquiries,
      previousViews
    ] = await Promise.all([
      supabase.from('properties').select('id', { count: 'exact', head: true })
        .gte('created_at', previousStartDate).lt('created_at', previousEndDate),
      supabase.from('user_roles').select('user_id', { count: 'exact', head: true })
        .gte('granted_at', previousStartDate).lt('granted_at', previousEndDate),
      supabase.from('inquiries').select('id', { count: 'exact', head: true })
        .gte('created_at', previousStartDate).lt('created_at', previousEndDate),
      supabase.from('property_views').select('id', { count: 'exact', head: true })
        .gte('viewed_at', previousStartDate).lt('viewed_at', previousEndDate)
    ])

    // Helper functions
    const calculateGrowth = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0
      return Math.round(((current - previous) / previous) * 100)
    }

    const groupByPropertyType = (data: any[]) => {
      const grouped = data.reduce((acc, item) => {
        const type = item.properties?.property_type || item.property_type || 'Unknown'
        acc[type] = (acc[type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const total = (Object.values(grouped) as number[]).reduce((sum: number, count: number) => sum + count, 0)
      return (Object.entries(grouped) as [string, number][]).map(([type, count]) => ({
        type,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
    }

    const groupByStatus = (data: any[], statusField = 'status') => {
      const grouped = data.reduce((acc, item) => {
        const status = item[statusField] || 'Unknown'
        acc[status] = (acc[status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      const total = (Object.values(grouped) as number[]).reduce((sum: number, count: number) => sum + count, 0)
      return (Object.entries(grouped) as [string, number][]).map(([status, count]) => ({
        status,
        count,
        percentage: total > 0 ? Math.round((count / total) * 100) : 0
      }))
    }

    const groupByLocation = (data: any[]) => {
      const grouped = data.reduce((acc, item) => {
        const city = item.properties?.city || item.city || 'Unknown'
        if (!acc[city]) {
          acc[city] = { count: 0, totalPrice: 0 }
        }
        acc[city].count += 1
        acc[city].totalPrice += item.price || 0
        return acc
      }, {} as Record<string, { count: number; totalPrice: number }>)
      
      return (Object.entries(grouped) as [string, { count: number; totalPrice: number }][]).map(([city, cityData]) => ({
        city,
        count: cityData.count,
        avgPrice: cityData.count > 0 ? Math.round(cityData.totalPrice / cityData.count) : 0
      }))
    }

    const calculateResponseTime = (inquiries: any[]) => {
      const responded = inquiries.filter(i => i.status === 'responded' && i.response_date)
      if (responded.length === 0) return { average: 0, median: 0, fastest: 0, slowest: 0 }
      
      const times = responded.map(i => {
        const created = new Date(i.created_at).getTime()
        const respondedTime = new Date(i.response_date).getTime()
        return (respondedTime - created) / (1000 * 60 * 60) // Convert to hours
      })
      
      times.sort((a, b) => a - b)
      const average = Math.round(times.reduce((sum, time) => sum + time, 0) / times.length)
      const median = Math.round(times[Math.floor(times.length / 2)])
      
      return {
        average,
        median,
        fastest: Math.round(times[0]),
        slowest: Math.round(times[times.length - 1])
      }
    }

    const getTopProperties = (inquiries: any[], views: any[]) => {
      const propertyStats = new Map()
      
      // Count inquiries per property
      inquiries.forEach(inquiry => {
        const propId = inquiry.property_id
        const propTitle = inquiry.properties?.title || 'Unknown Property'
        if (!propertyStats.has(propId)) {
          propertyStats.set(propId, { id: propId, title: propTitle, views: 0, inquiries: 0 })
        }
        propertyStats.get(propId).inquiries += 1
      })
      
      // Count views per property
      views.forEach(view => {
        const propId = view.property_id
        const propTitle = view.properties?.title || 'Unknown Property'
        if (!propertyStats.has(propId)) {
          propertyStats.set(propId, { id: propId, title: propTitle, views: 0, inquiries: 0 })
        }
        propertyStats.get(propId).views += 1
      })
      
      return Array.from(propertyStats.values())
        .map(prop => ({
          ...prop,
          conversionRate: prop.views > 0 ? Math.round((prop.inquiries / prop.views) * 100) : 0
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 5)
    }

    // Build response
    const analytics = {
      overview: {
        totalProperties: propertiesData.data?.length || 0,
        totalUsers: usersData.data?.length || 0,
        totalInquiries: inquiriesData.data?.length || 0,
        totalViews: viewsData.data?.length || 0,
        propertyGrowth: calculateGrowth(propertiesData.data?.length || 0, previousProperties.count || 0),
        userGrowth: calculateGrowth(usersData.data?.length || 0, previousUsers.count || 0),
        inquiryGrowth: calculateGrowth(inquiriesData.data?.length || 0, previousInquiries.count || 0),
        viewGrowth: calculateGrowth(viewsData.data?.length || 0, previousViews.count || 0)
      },
      
      propertyMetrics: {
        byType: groupByPropertyType(propertiesData.data || []),
        byStatus: groupByStatus(propertiesData.data || []),
        byLocation: groupByLocation(propertiesData.data || []),
        priceRanges: [
          { range: 'Under $500K', count: 0, percentage: 0 },
          { range: '$500K - $1M', count: 0, percentage: 0 },
          { range: '$1M - $2M', count: 0, percentage: 0 },
          { range: 'Over $2M', count: 0, percentage: 0 }
        ] // TODO: Calculate from actual price data
      },
      
      userMetrics: {
        registrationsOverTime: [], // TODO: Implement time series
        topCities: [], // TODO: Get from user profiles if available
        activityLevels: [
          { level: 'High', count: 0, percentage: 0 },
          { level: 'Medium', count: 0, percentage: 0 },
          { level: 'Low', count: 0, percentage: 0 }
        ]
      },
      
      inquiryMetrics: {
        byStatus: groupByStatus(inquiriesData.data || []),
        byPropertyType: groupByPropertyType(inquiriesData.data || []),
        responseTime: calculateResponseTime(inquiriesData.data || []),
        conversionRate: (viewsData.data && viewsData.data.length > 0) ? 
          Math.round(((inquiriesData.data?.length || 0) / viewsData.data.length) * 100) : 0
      },
      
      viewMetrics: {
        totalViews: viewsData.data?.length || 0,
        uniqueViews: viewsData.data?.length || 0, // TODO: Calculate unique by IP/session
        averageSessionTime: tourSessionsData.data?.reduce((sum, session) => 
          sum + (session.total_duration_seconds || 0), 0) / (tourSessionsData.data?.length || 1) / 60 || 0,
        topProperties: getTopProperties(inquiriesData.data || [], viewsData.data || []),
        viewsByHour: Array.from({ length: 24 }, (_, hour) => ({
          hour,
          views: (viewsData.data || []).filter(view => 
            new Date(view.viewed_at).getHours() === hour).length
        }))
      }
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 
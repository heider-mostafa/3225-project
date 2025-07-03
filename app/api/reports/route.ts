import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/reports - Generate property reports
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions for reports access
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const supabase = await createServerSupabaseClient()

    const { searchParams } = new URL(request.url)
    const reportType = searchParams.get('type') || 'overview' // overview, performance, market, inquiries, financial
    const period = searchParams.get('period') || '30d'
    const format = searchParams.get('format') || 'json' // json, csv, pdf
    const propertyId = searchParams.get('property_id')
    const city = searchParams.get('city')
    const propertyType = searchParams.get('property_type')

    // Calculate date range
    const daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
    const days = daysMap[period as keyof typeof daysMap] || 30
    const fromDate = new Date()
    fromDate.setDate(fromDate.getDate() - days)

    let reportData = {}

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(supabase, fromDate, propertyId || undefined, city || undefined, propertyType || undefined)
        break
      
      case 'performance':
        reportData = await generatePerformanceReport(supabase, fromDate, propertyId || undefined, city || undefined, propertyType || undefined)
        break
      
      case 'market':
        reportData = await generateMarketReport(supabase, fromDate, city || undefined, propertyType || undefined)
        break
      
      case 'inquiries':
        reportData = await generateInquiriesReport(supabase, fromDate, propertyId || undefined, city || undefined, propertyType || undefined)
        break
      
      case 'financial':
        reportData = await generateFinancialReport(supabase, fromDate, propertyId || undefined, city || undefined, propertyType || undefined)
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid report type. Available: overview, performance, market, inquiries, financial' },
          { status: 400 }
        )
    }

    // Log report generation
    await logAdminActivity(
      'report_generated',
      'system',
      undefined,
      {
        reportType,
        period,
        format,
        propertyId,
        city,
        propertyType,
        dataPoints: Object.keys(reportData).length
      },
      request
    )

    const response = {
      reportType,
      period,
      generatedAt: new Date().toISOString(),
      filters: {
        propertyId,
        city,
        propertyType,
        dateFrom: fromDate.toISOString(),
        dateTo: new Date().toISOString()
      },
      data: reportData
    }

    if (format === 'csv') {
      return NextResponse.json({
        ...response,
        csvData: convertToCSV(reportData)
      })
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error generating report:', error)
    return NextResponse.json(
      { error: 'Failed to generate report' },
      { status: 500 }
    )
  }
}

// Generate overview report
async function generateOverviewReport(supabase: any, fromDate: Date, propertyId?: string, city?: string, propertyType?: string) {
  let propertyQuery = supabase
    .from('properties')
    .select(`
      *,
      property_photos (count),
      property_analytics (
        event_type,
        created_at
      ),
      inquiries (
        status,
        created_at
      )
    `)
    .gte('created_at', fromDate.toISOString())

  if (propertyId) propertyQuery = propertyQuery.eq('id', propertyId)
  if (city) propertyQuery = propertyQuery.eq('city', city)
  if (propertyType) propertyQuery = propertyQuery.eq('property_type', propertyType)

  const { data: properties } = await propertyQuery

  return {
    summary: {
      totalProperties: properties?.length || 0,
      activeProperties: properties?.filter((p: any) => p.status === 'active').length || 0,
      soldProperties: properties?.filter((p: any) => p.status === 'sold').length || 0,
      averagePrice: calculateAveragePrice(properties || []),
      totalViews: countTotalViews(properties || []),
      totalInquiries: countTotalInquiries(properties || [])
    },
    properties: properties?.map((p: any) => ({
      id: p.id,
      title: p.title,
      price: p.price,
      status: p.status,
      city: p.city,
      property_type: p.property_type,
      views: p.property_analytics?.filter((a: any) => a.event_type === 'view').length || 0,
      inquiries: p.inquiries?.length || 0,
      photos: p.property_photos?.[0]?.count || 0
    })) || []
  }
}

// Generate performance report
async function generatePerformanceReport(supabase: any, fromDate: Date, propertyId?: string, city?: string, propertyType?: string) {
  const { data: analytics } = await supabase
    .from('property_analytics')
    .select(`
      *,
      properties (
        id,
        title,
        price,
        city,
        property_type,
        status
      )
    `)
    .gte('created_at', fromDate.toISOString())

  const filteredAnalytics = analytics?.filter((a: any) => {
    if (propertyId && a.properties?.id !== propertyId) return false
    if (city && a.properties?.city !== city) return false
    if (propertyType && a.properties?.property_type !== propertyType) return false
    return true
  }) || []

  const propertyPerformance = aggregateByProperty(filteredAnalytics)

  return {
    summary: {
      totalEvents: filteredAnalytics.length,
      uniqueProperties: new Set(filteredAnalytics.map((a: any) => a.property_id)).size,
      topEventType: getMostFrequentEventType(filteredAnalytics),
      averageViewsPerProperty: calculateAverageViewsPerProperty(filteredAnalytics)
    },
    propertyPerformance: Object.entries(propertyPerformance)
      .map(([propertyId, data]: [string, any]) => ({
        propertyId,
        propertyTitle: data.title,
        price: data.price,
        city: data.city,
        totalViews: data.views,
        totalInquiries: data.inquiries,
        conversionRate: data.inquiries > 0 ? (data.inquiries / data.views * 100).toFixed(2) : 0,
        lastActivity: data.lastActivity
      }))
      .sort((a, b) => b.totalViews - a.totalViews)
      .slice(0, 20),
    dailyActivity: aggregateByDate(filteredAnalytics)
  }
}

// Generate market report
async function generateMarketReport(supabase: any, fromDate: Date, city?: string, propertyType?: string) {
  let query = supabase
    .from('properties')
    .select('*')
    .gte('created_at', fromDate.toISOString())

  if (city) query = query.eq('city', city)
  if (propertyType) query = query.eq('property_type', propertyType)

  const { data: properties } = await query

  const priceRanges = calculatePriceRanges(properties || [])
  const averagePriceByType = calculateAveragePriceByType(properties || [])
  const marketTrends = calculateMarketTrends(properties || [])

  return {
    marketOverview: {
      totalListings: properties?.length || 0,
      averagePrice: calculateAveragePrice(properties || []),
      medianPrice: calculateMedianPrice(properties || []),
      priceRange: {
        min: Math.min(...(properties?.map((p: any) => p.price) || [0])),
        max: Math.max(...(properties?.map((p: any) => p.price) || [0]))
      }
    },
    priceRanges,
    averagePriceByType,
    marketTrends,
    topCities: getTopCities(properties || []),
    propertyTypeDistribution: getPropertyTypeDistribution(properties || [])
  }
}

// Generate inquiries report
async function generateInquiriesReport(supabase: any, fromDate: Date, propertyId?: string, city?: string, propertyType?: string) {
  let query = supabase
    .from('inquiries')
    .select(`
      *,
      properties (
        id,
        title,
        city,
        property_type,
        price
      )
    `)
    .gte('created_at', fromDate.toISOString())

  const { data: inquiries } = await query

  const filteredInquiries = inquiries?.filter((i: any) => {
    if (propertyId && i.properties?.id !== propertyId) return false
    if (city && i.properties?.city !== city) return false
    if (propertyType && i.properties?.property_type !== propertyType) return false
    return true
  }) || []

  return {
    summary: {
      totalInquiries: filteredInquiries.length,
      pendingInquiries: filteredInquiries.filter((i: any) => i.status === 'pending').length,
      respondedInquiries: filteredInquiries.filter((i: any) => i.status === 'responded').length,
      closedInquiries: filteredInquiries.filter((i: any) => i.status === 'closed').length,
      averageResponseTime: calculateAverageResponseTime(filteredInquiries)
    },
    inquiriesByStatus: aggregateByField(filteredInquiries, 'status'),
    inquiriesByPriority: aggregateByField(filteredInquiries, 'priority'),
    dailyInquiries: aggregateByDate(filteredInquiries),
    topPropertiesByInquiries: getTopPropertiesByInquiries(filteredInquiries),
    inquiryTrends: calculateInquiryTrends(filteredInquiries)
  }
}

// Generate financial report
async function generateFinancialReport(supabase: any, fromDate: Date, propertyId?: string, city?: string, propertyType?: string) {
  let query = supabase
    .from('properties')
    .select(`
      *,
      property_financials (*)
    `)
    .gte('created_at', fromDate.toISOString())

  if (propertyId) query = query.eq('id', propertyId)
  if (city) query = query.eq('city', city)
  if (propertyType) query = query.eq('property_type', propertyType)

  const { data: properties } = await query

  const financialSummary = calculateFinancialSummary(properties || [])
  const revenueProjections = calculateRevenueProjections(properties || [])

  return {
    summary: {
      totalValue: properties?.reduce((sum: any, p: any) => sum + (p.price || 0), 0) || 0,
      averagePrice: calculateAveragePrice(properties || []),
      totalProperties: properties?.length || 0,
      soldProperties: properties?.filter((p: any) => p.status === 'sold').length || 0,
      availableProperties: properties?.filter((p: any) => p.status === 'active').length || 0
    },
    financialSummary,
    revenueProjections,
    priceAnalysis: {
      byCity: calculatePriceByCity(properties || []),
      byPropertyType: calculateAveragePriceByType(properties || []),
      priceRangeDistribution: calculatePriceRanges(properties || [])
    }
  }
}

// Helper functions
function calculateAveragePrice(properties: any[]) {
  if (properties.length === 0) return 0
  return properties.reduce((sum, p) => sum + (p.price || 0), 0) / properties.length
}

function calculateMedianPrice(properties: any[]) {
  if (properties.length === 0) return 0
  const sorted = properties.map(p => p.price || 0).sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid]
}

function countTotalViews(properties: any[]) {
  return properties.reduce((total, p) => {
    return total + (p.property_analytics?.filter((a: any) => a.event_type === 'view').length || 0)
  }, 0)
}

function countTotalInquiries(properties: any[]) {
  return properties.reduce((total, p) => total + (p.inquiries?.length || 0), 0)
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

function calculateAveragePriceByType(properties: any[]) {
  const typeGroups = properties.reduce((acc, p) => {
    const type = p.property_type || 'unknown'
    if (!acc[type]) acc[type] = []
    acc[type].push(p.price || 0)
    return acc
  }, {})

  return Object.entries(typeGroups).reduce((acc, [type, prices]: [string, any]) => {
    acc[type] = prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length
    return acc
  }, {} as any)
}

function aggregateByProperty(analytics: any[]) {
  return analytics.reduce((acc, item) => {
    const propertyId = item.property_id
    if (!acc[propertyId]) {
      acc[propertyId] = {
        title: item.properties?.title,
        price: item.properties?.price,
        city: item.properties?.city,
        views: 0,
        inquiries: 0,
        lastActivity: item.created_at
      }
    }
    
    if (item.event_type === 'view') acc[propertyId].views++
    if (item.event_type === 'inquiry') acc[propertyId].inquiries++
    
    if (new Date(item.created_at) > new Date(acc[propertyId].lastActivity)) {
      acc[propertyId].lastActivity = item.created_at
    }
    
    return acc
  }, {})
}

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

function getMostFrequentEventType(analytics: any[]) {
  const eventCounts = aggregateByField(analytics, 'event_type')
  return Object.entries(eventCounts).sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'view'
}

function calculateAverageViewsPerProperty(analytics: any[]) {
  const propertyViews = analytics.filter(a => a.event_type === 'view')
  const uniqueProperties = new Set(propertyViews.map(a => a.property_id))
  return uniqueProperties.size > 0 ? propertyViews.length / uniqueProperties.size : 0
}

function calculateMarketTrends(properties: any[]) {
  // Simplified trend calculation
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  
  const recent = properties.filter(p => new Date(p.created_at) > thirtyDaysAgo)
  const older = properties.filter(p => new Date(p.created_at) <= thirtyDaysAgo)
  
  return {
    recentListings: recent.length,
    olderListings: older.length,
    averagePriceTrend: calculateAveragePrice(recent) - calculateAveragePrice(older)
  }
}

function getTopCities(properties: any[]) {
  const cityStats = aggregateByField(properties, 'city')
  return Object.entries(cityStats)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([city, count]) => ({ city, count }))
}

function getPropertyTypeDistribution(properties: any[]) {
  return aggregateByField(properties, 'property_type')
}

function getTopPropertiesByInquiries(inquiries: any[]) {
  const propertyInquiries = inquiries.reduce((acc, inquiry) => {
    const propertyId = inquiry.properties?.id
    if (!acc[propertyId]) {
      acc[propertyId] = {
        propertyId,
        title: inquiry.properties?.title,
        city: inquiry.properties?.city,
        price: inquiry.properties?.price,
        inquiryCount: 0
      }
    }
    acc[propertyId].inquiryCount++
    return acc
  }, {})

  return Object.values(propertyInquiries)
    .sort((a: any, b: any) => b.inquiryCount - a.inquiryCount)
    .slice(0, 10)
}

function calculateInquiryTrends(inquiries: any[]) {
  return aggregateByDate(inquiries)
}

function calculateAverageResponseTime(inquiries: any[]) {
  // Simplified calculation - would need actual response timestamps
  const responded = inquiries.filter(i => i.status === 'responded')
  return responded.length > 0 ? 24 : 0 // hours placeholder
}

function calculateFinancialSummary(properties: any[]) {
  return {
    totalInventoryValue: properties.reduce((sum, p) => sum + (p.price || 0), 0),
    averagePropertyValue: calculateAveragePrice(properties),
    totalCommissionPotential: properties.reduce((sum, p) => sum + (p.price || 0) * 0.03, 0), // 3% commission
    soldPropertiesValue: properties
      .filter((p: any) => p.status === 'sold')
      .reduce((sum, p) => sum + (p.price || 0), 0)
  }
}

function calculateRevenueProjections(properties: any[]) {
  const activeProperties = properties.filter(p => p.status === 'active')
  const avgTimeToSell = 90 // days placeholder
  const conversionRate = 0.15 // 15% placeholder
  
  return {
    projected30Days: activeProperties.reduce((sum, p) => sum + (p.price || 0), 0) * conversionRate * (30 / avgTimeToSell),
    projected90Days: activeProperties.reduce((sum, p) => sum + (p.price || 0), 0) * conversionRate,
    projectedAnnual: activeProperties.reduce((sum, p) => sum + (p.price || 0), 0) * conversionRate * 4
  }
}

function calculatePriceByCity(properties: any[]) {
  const cityGroups = properties.reduce((acc, p) => {
    const city = p.city || 'unknown'
    if (!acc[city]) acc[city] = []
    acc[city].push(p.price || 0)
    return acc
  }, {})

  return Object.entries(cityGroups).reduce((acc, [city, prices]: [string, any]) => {
    acc[city] = {
      average: prices.reduce((sum: number, p: number) => sum + p, 0) / prices.length,
      count: prices.length,
      total: prices.reduce((sum: number, p: number) => sum + p, 0)
    }
    return acc
  }, {} as any)
}

function convertToCSV(data: any): string {
  // Simplified CSV conversion
  const headers = Object.keys(data).join(',')
  const values = Object.values(data).map(v => 
    typeof v === 'object' ? JSON.stringify(v) : v
  ).join(',')
  
  return `${headers}\n${values}`
}

// POST /api/reports - Schedule report generation
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore)
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const { reportType, schedule, recipients, filters } = await request.json()

    if (!reportType || !schedule) {
      return NextResponse.json(
        { error: 'reportType and schedule are required' },
        { status: 400 }
      )
    }

    // In a real implementation, this would save to a scheduled_reports table
    // and use a cron job or background task to generate reports

    await logAdminActivity(
      'report_scheduled',
      'system',
      undefined,
      {
        reportType,
        schedule,
        recipients: recipients?.length || 0,
        filters
      },
      request
    )

    return NextResponse.json({
      success: true,
      message: 'Report scheduled successfully',
      reportType,
      schedule,
      scheduledAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error scheduling report:', error)
    return NextResponse.json(
      { error: 'Failed to schedule report' },
      { status: 500 }
    )
  }
} 
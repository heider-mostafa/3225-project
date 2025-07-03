import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/broker/dashboard - Get comprehensive broker dashboard data
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get broker ID for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found. Please contact admin.' 
      }, { status: 404 })
    }

    // Calculate date ranges
    const now = new Date()
    const today = now.toISOString().split('T')[0]
    const thisWeekStart = new Date(now.setDate(now.getDate() - now.getDay())).toISOString().split('T')[0]
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]
    const next7Days = new Date()
    next7Days.setDate(next7Days.getDate() + 7)
    const next30Days = new Date()
    next30Days.setDate(next30Days.getDate() + 30)

    // Fetch all data in parallel
    const [
      statsResult,
      upcomingViewingsResult,
      recentViewingsResult,
      availabilityResult,
      blockedTimesResult,
      propertyAssignmentsResult
    ] = await Promise.all([
      // Get broker stats
      getBrokerStats(supabase, broker.id, today, thisWeekStart, thisMonthStart),
      
      // Get upcoming viewings (next 30 days)
      supabase
        .from('property_viewings')
        .select(`
          id,
          property_id,
          user_id,
          visitor_name,
          visitor_email,
          visitor_phone,
          viewing_date,
          viewing_time,
          duration_minutes,
          viewing_type,
          status,
          special_requests,
          notes,
          created_at,
          properties (
            id,
            title,
            address,
            city,
            state,
            property_type,
            price
          )
        `)
        .eq('broker_id', broker.id)
        .gte('viewing_date', today)
        .lte('viewing_date', next30Days.toISOString().split('T')[0])
        .in('status', ['scheduled', 'confirmed'])
        .order('viewing_date', { ascending: true })
        .order('viewing_time', { ascending: true }),

      // Get recent viewings (last 30 days)
      supabase
        .from('property_viewings')
        .select(`
          id,
          property_id,
          visitor_name,
          viewing_date,
          viewing_time,
          status,
          properties (
            id,
            title,
            address,
            price
          )
        `)
        .eq('broker_id', broker.id)
        .gte('viewing_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .lte('viewing_date', today)
        .order('viewing_date', { ascending: false })
        .limit(10),

      // Get availability summary (next 7 days)
      supabase
        .from('broker_availability')
        .select('date, start_time, end_time, current_bookings, max_bookings, is_available')
        .eq('broker_id', broker.id)
        .gte('date', today)
        .lte('date', next7Days.toISOString().split('T')[0])
        .eq('is_available', true)
        .order('date', { ascending: true }),

      // Get blocked times (next 30 days)
      supabase
        .from('broker_blocked_times')
        .select('id, start_datetime, end_datetime, reason, block_type')
        .eq('broker_id', broker.id)
        .gte('start_datetime', now.toISOString())
        .lte('end_datetime', next30Days.toISOString())
        .order('start_datetime', { ascending: true }),

      // Get property assignments
      supabase
        .from('property_brokers')
        .select(`
          id,
          is_primary,
          assignment_type,
          created_at,
          properties (
            id,
            title,
            address,
            city,
            property_type,
            status,
            price
          )
        `)
        .eq('broker_id', broker.id)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
    ])

    // Check for errors
    if (upcomingViewingsResult.error) {
      console.error('Error fetching upcoming viewings:', upcomingViewingsResult.error)
    }
    if (recentViewingsResult.error) {
      console.error('Error fetching recent viewings:', recentViewingsResult.error)
    }
    if (availabilityResult.error) {
      console.error('Error fetching availability:', availabilityResult.error)
    }
    if (blockedTimesResult.error) {
      console.error('Error fetching blocked times:', blockedTimesResult.error)
    }
    if (propertyAssignmentsResult.error) {
      console.error('Error fetching property assignments:', propertyAssignmentsResult.error)
    }

    // Process availability data
    const availabilityData = availabilityResult.data || []
    const availabilitySummary = {
      totalSlots: availabilityData.length,
      availableSlots: availabilityData.filter(slot => slot.current_bookings < slot.max_bookings).length,
      bookedSlots: availabilityData.reduce((sum, slot) => sum + slot.current_bookings, 0),
      daysWithAvailability: new Set(availabilityData.map(slot => slot.date)).size
    }

    return NextResponse.json({
      success: true,
      broker: {
        id: broker.id,
        full_name: broker.full_name,
        email: broker.email,
        phone: broker.phone,
        photo_url: broker.photo_url,
        bio: broker.bio,
        specialties: broker.specialties,
        languages: broker.languages,
        rating: broker.rating,
        total_reviews: broker.total_reviews,
        years_experience: broker.years_experience,
        timezone: broker.timezone
      },
      stats: statsResult,
      upcomingViewings: upcomingViewingsResult.data || [],
      recentViewings: recentViewingsResult.data || [],
      availability: availabilityData,
      availabilitySummary,
      blockedTimes: blockedTimesResult.data || [],
      propertyAssignments: propertyAssignmentsResult.data || []
    })

  } catch (error) {
    console.error('Unexpected error in broker dashboard:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to calculate broker statistics
async function getBrokerStats(
  supabase: any, 
  brokerId: string, 
  today: string, 
  thisWeekStart: string, 
  thisMonthStart: string
) {
  try {
    const [
      totalViewingsResult,
      thisWeekViewingsResult,
      thisMonthViewingsResult,
      totalPropertiesResult,
      averageRatingResult
    ] = await Promise.all([
      // Total viewings
      supabase
        .from('property_viewings')
        .select('id', { count: 'exact', head: true })
        .eq('broker_id', brokerId),

      // This week viewings
      supabase
        .from('property_viewings')
        .select('id', { count: 'exact', head: true })
        .eq('broker_id', brokerId)
        .gte('viewing_date', thisWeekStart),

      // This month viewings
      supabase
        .from('property_viewings')
        .select('id', { count: 'exact', head: true })
        .eq('broker_id', brokerId)
        .gte('viewing_date', thisMonthStart),

      // Total assigned properties
      supabase
        .from('property_brokers')
        .select('id', { count: 'exact', head: true })
        .eq('broker_id', brokerId)
        .eq('is_active', true),

      // Get broker rating
      supabase
        .from('brokers')
        .select('rating, total_reviews')
        .eq('id', brokerId)
        .single()
    ])

    return {
      total_viewings: totalViewingsResult.count || 0,
      viewings_this_week: thisWeekViewingsResult.count || 0,
      viewings_this_month: thisMonthViewingsResult.count || 0,
      total_properties: totalPropertiesResult.count || 0,
      average_rating: averageRatingResult.data?.rating || 0,
      total_reviews: averageRatingResult.data?.total_reviews || 0
    }
  } catch (error) {
    console.error('Error calculating broker stats:', error)
    return {
      total_viewings: 0,
      viewings_this_week: 0,
      viewings_this_month: 0,
      total_properties: 0,
      average_rating: 0,
      total_reviews: 0
    }
  }
} 
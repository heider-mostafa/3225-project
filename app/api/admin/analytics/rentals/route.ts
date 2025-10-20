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
    // RENTAL MARKETPLACE OVERVIEW METRICS
    // ===============================================
    
    const { data: listings } = await supabase
      .from('rental_listings')
      .select('id, is_active, created_at, total_bookings, average_rating, nightly_rate')
      .gte('created_at', startDate.toISOString())

    const { data: allListings } = await supabase
      .from('rental_listings')
      .select('id, is_active, total_bookings, average_rating')

    const { data: bookings } = await supabase
      .from('rental_bookings')
      .select('id, booking_status, total_amount, created_at, guest_user_id')
      .gte('created_at', startDate.toISOString())

    const { data: reviews } = await supabase
      .from('rental_reviews')
      .select('id, overall_rating, created_at')
      .gte('created_at', startDate.toISOString())

    const { data: ltvProfiles } = await supabase
      .from('rental_customer_ltv_profiles')
      .select('customer_id, ltv_score, total_booking_value, created_at')
      .gte('created_at', startDate.toISOString())

    // Calculate overview metrics
    const totalListings = allListings?.length || 0
    const activeListings = allListings?.filter(l => l.is_active).length || 0
    const newListings = listings?.length || 0
    const totalBookings = bookings?.length || 0
    const confirmedBookings = bookings?.filter(b => b.booking_status === 'confirmed').length || 0
    const totalRevenue = bookings?.filter(b => b.booking_status === 'confirmed')
      .reduce((sum, booking) => sum + (booking.total_amount || 0), 0) || 0
    const averageBookingValue = confirmedBookings > 0 ? totalRevenue / confirmedBookings : 0
    const conversionRate = totalBookings > 0 ? (confirmedBookings / totalBookings) * 100 : 0

    // ===============================================
    // BOOKING ANALYTICS
    // ===============================================
    
    const bookingsByStatus = [
      { status: 'pending', count: bookings?.filter(b => b.booking_status === 'pending').length || 0 },
      { status: 'confirmed', count: confirmedBookings },
      { status: 'cancelled', count: bookings?.filter(b => b.booking_status === 'cancelled').length || 0 },
      { status: 'completed', count: bookings?.filter(b => b.booking_status === 'completed').length || 0 }
    ]

    // Monthly revenue trend
    const monthlyRevenue = []
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date()
      monthStart.setMonth(monthStart.getMonth() - i)
      monthStart.setDate(1)
      const monthEnd = new Date()
      monthEnd.setMonth(monthEnd.getMonth() - i + 1)
      monthEnd.setDate(0)

      const monthBookings = bookings?.filter(b => {
        const bookingDate = new Date(b.created_at)
        return bookingDate >= monthStart && bookingDate <= monthEnd && b.booking_status === 'confirmed'
      }) || []

      const monthRevenue = monthBookings.reduce((sum, booking) => sum + (booking.total_amount || 0), 0)

      monthlyRevenue.push({
        month: monthStart.toLocaleString('default', { month: 'short' }),
        revenue: monthRevenue,
        bookings: monthBookings.length
      })
    }

    // ===============================================
    // LISTING ANALYTICS
    // ===============================================
    
    const listingMetrics = {
      byPrice: [
        { range: '$0-$50', count: allListings?.filter(l => (l.nightly_rate || 0) <= 50).length || 0 },
        { range: '$51-$100', count: allListings?.filter(l => (l.nightly_rate || 0) > 50 && (l.nightly_rate || 0) <= 100).length || 0 },
        { range: '$101-$200', count: allListings?.filter(l => (l.nightly_rate || 0) > 100 && (l.nightly_rate || 0) <= 200).length || 0 },
        { range: '$201+', count: allListings?.filter(l => (l.nightly_rate || 0) > 200).length || 0 }
      ],
      byPerformance: [
        { tier: 'High Performers', count: allListings?.filter(l => (l.total_bookings || 0) >= 10 && (l.average_rating || 0) >= 4.5).length || 0 },
        { tier: 'Good Performers', count: allListings?.filter(l => (l.total_bookings || 0) >= 5 && (l.average_rating || 0) >= 4.0 && (l.total_bookings || 0) < 10).length || 0 },
        { tier: 'New Listings', count: allListings?.filter(l => (l.total_bookings || 0) < 5).length || 0 },
        { tier: 'Underperforming', count: allListings?.filter(l => (l.total_bookings || 0) >= 5 && (l.average_rating || 0) < 4.0).length || 0 }
      ]
    }

    // ===============================================
    // CUSTOMER LTV ANALYTICS
    // ===============================================
    
    const ltvMetrics = {
      averageLTV: ltvProfiles?.length ? 
        ltvProfiles.reduce((sum, profile) => sum + (profile.total_booking_value || 0), 0) / ltvProfiles.length : 0,
      highValueCustomers: ltvProfiles?.filter(profile => (profile.ltv_score || 0) >= 8).length || 0,
      customerSegmentation: [
        { segment: 'VIP (9-10)', count: ltvProfiles?.filter(p => (p.ltv_score || 0) >= 9).length || 0 },
        { segment: 'High Value (7-8)', count: ltvProfiles?.filter(p => (p.ltv_score || 0) >= 7 && (p.ltv_score || 0) < 9).length || 0 },
        { segment: 'Medium Value (5-6)', count: ltvProfiles?.filter(p => (p.ltv_score || 0) >= 5 && (p.ltv_score || 0) < 7).length || 0 },
        { segment: 'Low Value (0-4)', count: ltvProfiles?.filter(p => (p.ltv_score || 0) < 5).length || 0 }
      ]
    }

    // ===============================================
    // META TRACKING PERFORMANCE
    // ===============================================
    
    const { data: metaEvents } = await supabase
      .from('meta_tracking_events')
      .select('event_name, event_value, created_at')
      .ilike('event_name', '%rental%')
      .gte('created_at', startDate.toISOString())

    const metaTrackingMetrics = {
      totalRentalEvents: metaEvents?.length || 0,
      searchEvents: metaEvents?.filter(e => e.event_name.includes('search')).length || 0,
      bookingEvents: metaEvents?.filter(e => e.event_name.includes('booking')).length || 0,
      totalMetaValue: metaEvents?.reduce((sum, event) => sum + (event.event_value || 0), 0) || 0
    }

    // ===============================================
    // PERFORMANCE INSIGHTS
    // ===============================================
    
    const insights = {
      topPerformingListings: allListings?.sort((a, b) => (b.total_bookings || 0) - (a.total_bookings || 0)).slice(0, 5) || [],
      averageRating: allListings?.length ? 
        allListings.reduce((sum, listing) => sum + (listing.average_rating || 0), 0) / allListings.length : 0,
      occupancyRate: 78, // Mock calculation - would be based on calendar availability
      repeatCustomerRate: 25 // Mock calculation - would be based on customer booking history
    }

    const analytics = {
      overview: {
        totalListings,
        activeListings,
        newListings,
        totalBookings,
        confirmedBookings,
        totalRevenue,
        averageBookingValue,
        conversionRate
      },
      bookingAnalytics: {
        byStatus: bookingsByStatus,
        monthlyTrend: monthlyRevenue
      },
      listingMetrics,
      ltvMetrics,
      metaTrackingMetrics,
      insights
    }

    return NextResponse.json(analytics)

  } catch (error) {
    console.error('Rental analytics API error:', error)
    return NextResponse.json({ error: 'Failed to fetch rental analytics' }, { status: 500 })
  }
}
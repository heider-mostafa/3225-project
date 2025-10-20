import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Check if user is admin
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single()

    if (roleError || !userRole || userRole.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const rental_id = searchParams.get('rental_id')

    let query = supabase
      .from('rental_bookings')
      .select('booking_status, payment_status, total_amount, created_at, nightly_rate, total_nights')

    if (rental_id) {
      query = query.eq('rental_listing_id', rental_id)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch booking stats' }, { status: 500 })
    }

    if (!bookings) {
      return NextResponse.json({
        total_bookings: 0,
        pending_bookings: 0,
        confirmed_bookings: 0,
        checked_in_bookings: 0,
        completed_bookings: 0,
        cancelled_bookings: 0,
        total_revenue: 0,
        pending_revenue: 0,
        this_month_bookings: 0,
        this_month_revenue: 0,
        average_nightly_rate: 0,
        total_nights_booked: 0,
        occupancy_rate: 0
      })
    }

    const now = new Date()
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const thisMonthBookings = bookings.filter(b => new Date(b.created_at) >= thisMonth)
    
    const stats = {
      total_bookings: bookings.length,
      pending_bookings: bookings.filter(b => b.booking_status === 'pending').length,
      confirmed_bookings: bookings.filter(b => b.booking_status === 'confirmed').length,
      checked_in_bookings: bookings.filter(b => b.booking_status === 'checked_in').length,
      completed_bookings: bookings.filter(b => b.booking_status === 'completed').length,
      cancelled_bookings: bookings.filter(b => b.booking_status === 'cancelled').length,
      
      total_revenue: bookings
        .filter(b => b.payment_status === 'paid' || b.payment_status === 'partial')
        .reduce((sum, b) => sum + b.total_amount, 0),
      
      pending_revenue: bookings
        .filter(b => b.payment_status === 'pending')
        .reduce((sum, b) => sum + b.total_amount, 0),
      
      this_month_bookings: thisMonthBookings.length,
      
      this_month_revenue: thisMonthBookings
        .filter(b => b.payment_status === 'paid' || b.payment_status === 'partial')
        .reduce((sum, b) => sum + b.total_amount, 0),
      
      average_nightly_rate: bookings.length > 0 
        ? bookings.reduce((sum, b) => sum + (b.nightly_rate || 0), 0) / bookings.length 
        : 0,
      
      total_nights_booked: bookings.reduce((sum, b) => sum + (b.total_nights || 0), 0),
      
      // Basic occupancy calculation - would need calendar data for accurate calculation
      occupancy_rate: 0
    }

    // Calculate additional insights
    const completionRate = stats.total_bookings > 0 
      ? (stats.completed_bookings / stats.total_bookings) * 100 
      : 0

    const cancellationRate = stats.total_bookings > 0 
      ? (stats.cancelled_bookings / stats.total_bookings) * 100 
      : 0

    const paymentSuccessRate = stats.total_bookings > 0
      ? (bookings.filter(b => b.payment_status === 'paid').length / stats.total_bookings) * 100
      : 0

    return NextResponse.json({
      ...stats,
      completion_rate: Math.round(completionRate * 10) / 10,
      cancellation_rate: Math.round(cancellationRate * 10) / 10,
      payment_success_rate: Math.round(paymentSuccessRate * 10) / 10
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
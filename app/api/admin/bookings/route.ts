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
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const status = searchParams.get('status')
    const payment_status = searchParams.get('payment_status')
    const rental_id = searchParams.get('rental_id')

    let query = supabase
      .from('rental_bookings')
      .select(`
        *,
        rental_listings!inner (
          id,
          properties!inner (
            title,
            city,
            address
          )
        ),
        guest_profiles:user_profiles!rental_bookings_guest_user_id_fkey (
          full_name,
          profile_photo_url
        )
      `)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('booking_status', status)
    }
    
    if (payment_status && payment_status !== 'all') {
      query = query.eq('payment_status', payment_status)
    }
    
    if (rental_id) {
      query = query.eq('rental_listing_id', rental_id)
    }

    const { data: bookings, error } = await query

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 })
    }

    return NextResponse.json({ bookings: bookings || [] })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { booking_ids, action } = body

    if (!booking_ids || !Array.isArray(booking_ids) || !action) {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    let updateData: any = { updated_at: new Date().toISOString() }

    switch (action) {
      case 'confirm':
        updateData.booking_status = 'confirmed'
        break
      case 'cancel':
        updateData.booking_status = 'cancelled'
        updateData.cancelled_at = new Date().toISOString()
        break
      case 'check_in':
        updateData.booking_status = 'checked_in'
        break
      case 'check_out':
        updateData.booking_status = 'checked_out'
        break
      case 'complete':
        updateData.booking_status = 'completed'
        break
      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const { error } = await supabase
      .from('rental_bookings')
      .update(updateData)
      .in('id', booking_ids)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update bookings' }, { status: 500 })
    }

    return NextResponse.json({ success: true, updated_count: booking_ids.length })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
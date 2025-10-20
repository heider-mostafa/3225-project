import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const { data: booking, error } = await supabase
      .from('rental_bookings')
      .select(`
        *,
        rental_listings!inner (
          id,
          properties!inner (
            title,
            city,
            address,
            property_type,
            bedrooms,
            bathrooms
          )
        ),
        guest_profiles:user_profiles!rental_bookings_guest_user_id_fkey (
          full_name,
          profile_photo_url,
          phone_number
        )
      `)
      .eq('id', params.id)
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 })
    }

    return NextResponse.json({ booking })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const { booking_status, payment_status, cancellation_reason, refund_amount } = body

    let updateData: any = { 
      updated_at: new Date().toISOString() 
    }

    if (booking_status) {
      updateData.booking_status = booking_status
      
      // Set cancelled_at when cancelling
      if (booking_status === 'cancelled') {
        updateData.cancelled_at = new Date().toISOString()
        if (cancellation_reason) {
          updateData.cancellation_reason = cancellation_reason
        }
        if (refund_amount !== undefined) {
          updateData.refund_amount = refund_amount
        }
      }
    }

    if (payment_status) {
      updateData.payment_status = payment_status
    }

    // Validate status transitions
    const validBookingStatuses = ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled', 'completed']
    const validPaymentStatuses = ['pending', 'paid', 'partial', 'refunded', 'failed']

    if (booking_status && !validBookingStatuses.includes(booking_status)) {
      return NextResponse.json({ error: 'Invalid booking status' }, { status: 400 })
    }

    if (payment_status && !validPaymentStatuses.includes(payment_status)) {
      return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('rental_bookings')
      .update(updateData)
      .eq('id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 })
    }

    // Log the status change for audit purposes
    await supabase
      .from('booking_status_logs')
      .insert({
        booking_id: params.id,
        old_status: body.old_status || null,
        new_status: booking_status || payment_status,
        changed_by: user.id,
        reason: cancellation_reason || null,
        created_at: new Date().toISOString()
      })
      .catch(err => console.error('Failed to log status change:', err))

    return NextResponse.json({ booking: data })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
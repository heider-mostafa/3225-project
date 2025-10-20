import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

// Helper function to check if user is admin
async function isAdmin(supabase: any, userId: string) {
  const { data: userRole, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .single()

  return !error && userRole && ['admin', 'super_admin'].includes(userRole.role)
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const bookingId = params.id

    // Get booking details for admin view
    const { data: booking, error: bookingError } = await supabase
      .from('admin_booking_qr_overview')
      .select('*')
      .eq('booking_id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 })
    }

    // Get all QR codes for this booking (including inactive ones for admin view)
    const { data: qrCodes, error: qrError } = await supabase
      .from('booking_qr_codes')
      .select(`
        id,
        qr_image_url,
        qr_type,
        qr_label,
        qr_description,
        valid_from,
        valid_until,
        usage_limit,
        times_used,
        status,
        metadata,
        created_by_admin_id,
        uploaded_by_admin_id,
        created_at,
        updated_at
      `)
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: false })

    if (qrError) {
      console.error('Error fetching QR codes:', qrError)
      return NextResponse.json({ 
        error: 'Failed to fetch QR codes' 
      }, { status: 500 })
    }

    return NextResponse.json({
      booking,
      qrCodes: qrCodes || [],
      count: qrCodes?.length || 0
    })

  } catch (error) {
    console.error('Error in admin QR codes GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const bookingId = params.id
    const body = await request.json()

    // Validate request body
    const {
      qr_image_url,
      qr_type = 'access',
      qr_label,
      qr_description,
      valid_from,
      valid_until,
      usage_limit,
      metadata = {}
    } = body

    if (!qr_image_url || !valid_from || !valid_until) {
      return NextResponse.json({
        error: 'Missing required fields: qr_image_url, valid_from, valid_until'
      }, { status: 400 })
    }

    // Verify booking exists and get rental listing ID
    const { data: booking, error: bookingError } = await supabase
      .from('rental_bookings')
      .select('id, rental_listing_id')
      .eq('id', bookingId)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found' 
      }, { status: 404 })
    }

    // Create QR code record
    const { data: qrCode, error: qrError } = await supabase
      .from('booking_qr_codes')
      .insert({
        booking_id: bookingId,
        rental_listing_id: booking.rental_listing_id,
        qr_image_url,
        qr_type,
        qr_label,
        qr_description,
        valid_from,
        valid_until,
        usage_limit,
        status: 'active',
        metadata,
        created_by_admin_id: user.id,
        uploaded_by_admin_id: user.id
      })
      .select()
      .single()

    if (qrError) {
      console.error('Error creating QR code:', qrError)
      return NextResponse.json({ 
        error: 'Failed to create QR code',
        details: qrError.message 
      }, { status: 500 })
    }

    // Log the QR code creation for audit trail
    console.log(`QR code created by admin ${user.id} for booking ${bookingId}:`, {
      qr_code_id: qrCode.id,
      qr_type,
      valid_from,
      valid_until
    })

    return NextResponse.json({
      qrCode,
      message: 'QR code created successfully'
    }, { status: 201 })

  } catch (error) {
    console.error('Error in admin QR codes POST:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    if (!(await isAdmin(supabase, user.id))) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { qr_code_id, action, ...updateData } = body

    if (!qr_code_id) {
      return NextResponse.json({
        error: 'Missing qr_code_id'
      }, { status: 400 })
    }

    let updateFields = { ...updateData, updated_at: new Date().toISOString() }

    // Handle specific actions
    if (action === 'revoke') {
      updateFields = {
        ...updateFields,
        status: 'revoked',
        revoked_by_admin_id: user.id,
        revoked_at: new Date().toISOString()
      }
    }

    // Update QR code
    const { data: qrCode, error: qrError } = await supabase
      .from('booking_qr_codes')
      .update(updateFields)
      .eq('id', qr_code_id)
      .eq('booking_id', params.id)
      .select()
      .single()

    if (qrError) {
      console.error('Error updating QR code:', qrError)
      return NextResponse.json({ 
        error: 'Failed to update QR code' 
      }, { status: 500 })
    }

    return NextResponse.json({
      qrCode,
      message: 'QR code updated successfully'
    })

  } catch (error) {
    console.error('Error in admin QR codes PUT:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
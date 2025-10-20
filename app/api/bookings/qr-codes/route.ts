import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const bookingId = params.bookingId

    // Verify the booking belongs to the authenticated user
    const { data: booking, error: bookingError } = await supabase
      .from('rental_bookings')
      .select('id, guest_user_id')
      .eq('id', bookingId)
      .eq('guest_user_id', user.id)
      .single()

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Booking not found or unauthorized' 
      }, { status: 404 })
    }

    // Get QR codes for this booking
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
        metadata
      `)
      .eq('booking_id', bookingId)
      .eq('status', 'active')
      .order('qr_type')

    if (qrError) {
      console.error('Error fetching QR codes:', qrError)
      return NextResponse.json({ 
        error: 'Failed to fetch QR codes' 
      }, { status: 500 })
    }

    return NextResponse.json({
      qrCodes: qrCodes || [],
      count: qrCodes?.length || 0
    })

  } catch (error) {
    console.error('Error in /api/rentals/[bookingId]/qr-codes:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
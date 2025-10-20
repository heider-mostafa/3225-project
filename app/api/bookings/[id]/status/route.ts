import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const bookingId = params.id;

    // First check if it's a rental booking
    const { data: rentalBooking, error: rentalError } = await supabase
      .from('rental_bookings')
      .select(`
        id,
        booking_status,
        payment_status,
        guest_user_id,
        total_amount,
        check_in_date,
        check_out_date,
        number_of_guests,
        rental_listings!inner(
          properties!inner(
            title,
            address
          )
        )
      `)
      .eq('id', bookingId)
      .eq('guest_user_id', user.id)
      .single();

    if (rentalBooking && !rentalError) {
      return NextResponse.json({
        success: true,
        booking_type: 'rental',
        booking: rentalBooking,
        payment_status: rentalBooking.payment_status,
        booking_status: rentalBooking.booking_status
      });
    }

    // If not found in rental bookings, check appraiser bookings
    const { data: appraiserBooking, error: appraiserError } = await supabase
      .from('appraiser_bookings')
      .select(`
        id,
        status,
        property_id,
        user_id,
        total_cost,
        scheduled_date,
        properties!inner(
          title,
          address
        )
      `)
      .eq('id', bookingId)
      .eq('user_id', user.id)
      .single();

    if (appraiserBooking && !appraiserError) {
      // Get payment status from appraisal_payments table
      const { data: payment } = await supabase
        .from('appraisal_payments')
        .select('status, payment_date')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      return NextResponse.json({
        success: true,
        booking_type: 'appraiser',
        booking: appraiserBooking,
        payment_status: payment?.status || 'pending',
        booking_status: appraiserBooking.status
      });
    }

    // If booking not found in either table
    return NextResponse.json({ 
      error: 'Booking not found or access denied' 
    }, { status: 404 });

  } catch (error) {
    console.error('Booking status API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
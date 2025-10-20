import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { differenceInDays } from 'date-fns';

export async function POST(
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

    const listingId = params.id;
    const body = await request.json();

    const {
      check_in_date,
      check_out_date,
      number_of_guests,
      guest_phone,
      guest_email,
      special_requests,
      emergency_contact_name,
      emergency_contact_phone
    } = body;

    // Validate required fields
    if (!check_in_date || !check_out_date || !number_of_guests || !guest_phone || !guest_email) {
      return NextResponse.json({ 
        error: 'Missing required booking information' 
      }, { status: 400 });
    }

    // Get rental listing details
    const { data: listing, error: listingError } = await supabase
      .from('rental_listings')
      .select('*')
      .eq('id', listingId)
      .eq('is_active', true)
      .eq('compliance_status', 'approved')
      .single();

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Rental listing not found' }, { status: 404 });
    }

    // Check availability
    const { data: unavailableDates } = await supabase
      .from('rental_calendar')
      .select('date')
      .eq('rental_listing_id', listingId)
      .eq('is_available', false)
      .gte('date', check_in_date)
      .lt('date', check_out_date);

    if (unavailableDates && unavailableDates.length > 0) {
      return NextResponse.json({ 
        error: 'Selected dates are not available',
        unavailable_dates: unavailableDates.map(d => d.date)
      }, { status: 400 });
    }

    // Calculate pricing
    const checkInDate = new Date(check_in_date);
    const checkOutDate = new Date(check_out_date);
    const numberOfNights = differenceInDays(checkOutDate, checkInDate);

    if (numberOfNights < listing.minimum_stay_nights) {
      return NextResponse.json({ 
        error: `Minimum stay is ${listing.minimum_stay_nights} nights` 
      }, { status: 400 });
    }

    if (numberOfNights > listing.maximum_stay_nights) {
      return NextResponse.json({ 
        error: `Maximum stay is ${listing.maximum_stay_nights} nights` 
      }, { status: 400 });
    }

    const nightlyRate = listing.nightly_rate || 0;
    const totalNightsCost = nightlyRate * numberOfNights;
    const cleaningFee = listing.cleaning_fee || 0;
    const securityDeposit = listing.security_deposit || 0;
    const platformFee = totalNightsCost * 0.12; // 12% platform commission
    const totalAmount = totalNightsCost + cleaningFee + platformFee;

    // Create booking record
    const { data: booking, error: bookingError } = await supabase
      .from('rental_bookings')
      .insert({
        rental_listing_id: listingId,
        guest_user_id: user.id,
        check_in_date,
        check_out_date,
        number_of_guests: parseInt(number_of_guests),
        number_of_nights: numberOfNights,
        nightly_rate: nightlyRate,
        total_nights_cost: totalNightsCost,
        cleaning_fee: cleaningFee,
        security_deposit: securityDeposit,
        platform_fee: platformFee,
        total_amount: totalAmount,
        guest_phone,
        guest_email,
        special_requests,
        booking_status: 'pending',
        payment_status: 'pending'
      })
      .select(`
        *,
        rental_listings (
          properties (
            title,
            address,
            city
          )
        )
      `)
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // Create payment with Paymob
    const { default: rentalPaymentService } = await import('@/lib/services/rental-payment-service');
    
    // Extract guest name from email or use defaults
    const guestNameParts = guest_email.split('@')[0].split('.');
    const firstName = guestNameParts[0] || 'Guest';
    const lastName = guestNameParts[1] || 'User';

    const paymentResult = await rentalPaymentService.createRentalPayment({
      booking: {
        ...booking,
        properties: booking.rental_listings?.properties
      },
      guest_details: {
        first_name: firstName,
        last_name: lastName,
        email: guest_email,
        phone_number: guest_phone,
        address: {
          street: booking.rental_listings?.properties?.address || 'N/A',
          city: booking.rental_listings?.properties?.city || 'Cairo',
          state: 'Cairo',
          country: 'Egypt'
        }
      }
    });

    if (!paymentResult.success) {
      // Clean up booking if payment creation failed
      await supabase
        .from('rental_bookings')
        .delete()
        .eq('id', booking.id);

      return NextResponse.json({ 
        error: paymentResult.error || 'Failed to create payment' 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        total_amount: booking.total_amount,
        check_in_date: booking.check_in_date,
        check_out_date: booking.check_out_date,
        number_of_nights: booking.number_of_nights,
        status: booking.booking_status
      },
      payment_url: paymentResult.payment_url,
      iframe_url: paymentResult.iframe_url,
      order_id: paymentResult.order_id
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
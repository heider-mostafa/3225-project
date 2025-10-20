import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notificationService } from '@/lib/services/notification-service';
import { CalendarService } from '@/lib/services/calendar-service';
import { isServerUserAdmin } from '@/lib/auth/admin';

interface BookingRequest {
  appraiser_id: string;
  property_id?: string;
  booking_type: 'appraisal' | 'consultation' | 'inspection';
  client_name: string;
  client_email: string;
  client_phone?: string;
  preferred_date: string;
  preferred_time: string;
  backup_dates?: Array<{
    date: string;
    time: string;
  }>;
  property_details: {
    property_type: string;
    address: string;
    square_meters?: number;
    estimated_value?: number;
    access_instructions?: string;
  };
  service_requirements: {
    urgency: 'standard' | 'urgent' | 'flexible';
    report_delivery: 'standard' | 'rush' | 'same_day';
    additional_services?: string[];
  };
  estimated_duration_hours: number;
  estimated_cost: number;
  special_instructions?: string;
}

interface BookingResponse {
  success: boolean;
  booking_id?: string;
  confirmation_number?: string;
  scheduled_datetime?: string;
  estimated_cost?: number;
  payment_due?: number;
  next_steps?: string[];
  message?: string;
  error?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse<BookingResponse>> {
  try {
    const body: BookingRequest = await request.json();

    // Validate required fields
    const { 
      appraiser_id, 
      booking_type,
      client_name, 
      client_email, 
      preferred_date,
      preferred_time,
      property_details,
      service_requirements,
      estimated_duration_hours,
      estimated_cost
    } = body;

    if (!appraiser_id || !booking_type || !client_name || !client_email || 
        !preferred_date || !preferred_time || !property_details?.address) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: appraiser_id, booking_type, client_name, client_email, preferred_date, preferred_time, property_address' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate date format and ensure it's in the future
    const requestedDate = new Date(`${preferred_date}T${preferred_time}`);
    if (isNaN(requestedDate.getTime()) || requestedDate <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Invalid or past date/time provided' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verify appraiser exists and is active
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select(`
        id, 
        full_name, 
        email, 
        phone, 
        response_time_hours, 
        is_active, 
        public_profile_active,
        pricing_info
      `)
      .eq('id', appraiser_id)
      .eq('is_active', true)
      .eq('public_profile_active', true)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { success: false, error: 'Appraiser not found or not available' },
        { status: 404 }
      );
    }

    // Check appraiser availability for the requested time
    const dayOfWeek = requestedDate.getDay();
    const requestedHour = requestedDate.getHours();

    const { data: availability } = await supabase
      .from('appraiser_availability')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('day_of_week', dayOfWeek)
      .eq('is_available', true)
      .gte('start_time', requestedHour)
      .lte('end_time', requestedHour + estimated_duration_hours);

    if (!availability || availability.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Appraiser is not available at the requested time',
          message: 'Please choose a different time or check available slots' 
        },
        { status: 409 }
      );
    }

    // Check for existing bookings that might conflict
    const { data: existingBookings } = await supabase
      .from('appraiser_bookings')
      .select('scheduled_datetime, estimated_duration_hours')
      .eq('appraiser_id', appraiser_id)
      .eq('status', 'confirmed')
      .gte('scheduled_datetime', requestedDate.toISOString())
      .lt('scheduled_datetime', new Date(requestedDate.getTime() + estimated_duration_hours * 60 * 60 * 1000).toISOString());

    if (existingBookings && existingBookings.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Time slot is already booked',
          message: 'Please choose a different time slot' 
        },
        { status: 409 }
      );
    }

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Generate confirmation number
    const confirmationNumber = `APP-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Calculate costs
    const basePrice = estimated_cost;
    const rushFee = service_requirements.report_delivery === 'rush' ? basePrice * 0.25 : 0;
    const sameDayFee = service_requirements.report_delivery === 'same_day' ? basePrice * 0.5 : 0;
    const urgentFee = service_requirements.urgency === 'urgent' ? basePrice * 0.2 : 0;
    const totalCost = basePrice + rushFee + sameDayFee + urgentFee;
    const depositAmount = totalCost * 0.3; // 30% deposit required

    // Create booking record
    const bookingData = {
      appraiser_id,
      property_id: body.property_id || null,
      client_user_id: user?.id || null,
      confirmation_number: confirmationNumber,
      booking_type,
      client_name,
      client_email,
      client_phone: body.client_phone || null,
      scheduled_datetime: requestedDate.toISOString(),
      backup_dates: body.backup_dates || null,
      estimated_duration_hours,
      property_details,
      service_requirements,
      estimated_cost: totalCost,
      deposit_amount: depositAmount,
      special_instructions: body.special_instructions || null,
      status: 'pending_payment', // Updated status to reflect payment requirement
      payment_status: 'pending',
      created_at: new Date().toISOString(),
      client_ip: request.headers.get('x-forwarded-for') || 'unknown',
      user_agent: request.headers.get('user-agent') || 'unknown'
    };

    const { data: booking, error: bookingError } = await supabase
      .from('appraiser_bookings')
      .insert(bookingData)
      .select('id, confirmation_number, scheduled_datetime, estimated_cost, deposit_amount')
      .single();

    if (bookingError) {
      // If table doesn't exist, create in appraisal_requests as fallback
      if (bookingError.code === '42P01') {
        const { data: fallbackBooking, error: fallbackError } = await supabase
          .from('appraisal_requests')
          .insert({
            appraiser_id,
            client_name,
            client_email,
            client_phone: body.client_phone,
            contact_preference: 'email',
            appraisal_type: booking_type,
            property_type: property_details.property_type,
            property_address: property_details.address,
            property_size: property_details.square_meters?.toString(),
            estimated_value: property_details.estimated_value?.toString(),
            urgency_level: service_requirements.urgency,
            preferred_date: requestedDate.toISOString(),
            message: `Booking request: ${booking_type} scheduled for ${preferred_date} at ${preferred_time}`,
            estimated_cost: totalCost,
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (fallbackError) {
          console.error('Error creating booking:', fallbackError);
          return NextResponse.json(
            { success: false, error: 'Failed to create booking' },
            { status: 500 }
          );
        }

        // Return success with fallback booking
        return NextResponse.json({
          success: true,
          booking_id: fallbackBooking.id,
          confirmation_number: confirmationNumber,
          scheduled_datetime: requestedDate.toISOString(),
          estimated_cost: totalCost,
          payment_due: depositAmount,
          next_steps: [
            'We will contact you within 24 hours to confirm your booking',
            'Payment will be required to secure your appointment',
            'You will receive a confirmation email shortly'
          ],
          message: `Your ${booking_type} has been scheduled with ${appraiser.full_name} for ${preferred_date} at ${preferred_time}. Confirmation number: ${confirmationNumber}`
        });
      }

      console.error('Error creating booking:', bookingError);
      return NextResponse.json(
        { success: false, error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Send booking confirmation notifications
    try {
      await notificationService.notifyBookingConfirmation({
        appraiser_name: appraiser.full_name,
        appraiser_email: appraiser.email,
        appraiser_phone: appraiser.phone,
        client_name,
        client_email,
        client_phone: body.client_phone,
        booking_type,
        confirmation_number: booking.confirmation_number,
        scheduled_datetime: new Date(booking.scheduled_datetime).toLocaleString('en-EG', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        estimated_duration_hours,
        property_address: property_details.address,
        estimated_cost: booking.estimated_cost,
        payment_due: booking.deposit_amount,
        special_instructions: body.special_instructions,
        next_steps: [
          'Check your email for booking confirmation details',
          `Pay the deposit of ${new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP' }).format(booking.deposit_amount)} to secure your booking`,
          'The appraiser will contact you 24 hours before the appointment',
          'Prepare property access and any required documentation'
        ]
      });
    } catch (notificationError) {
      console.error('Failed to send booking notifications:', notificationError);
      // Don't fail the booking if notifications fail
    }

    // Update appraiser booking statistics
    await supabase.rpc('increment_appraiser_booking_count', {
      appraiser_id: appraiser_id
    }).catch(err => console.log('Stats update failed (non-critical):', err));

    return NextResponse.json({
      success: true,
      booking: {
        id: booking.id,
        confirmation_number: booking.confirmation_number,
        scheduled_datetime: booking.scheduled_datetime,
        estimated_cost: booking.estimated_cost,
        deposit_amount: booking.deposit_amount,
        status: 'pending_payment',
        payment_status: 'pending'
      },
      payment_required: true,
      payment_details: {
        amount: depositAmount,
        currency: 'EGP',
        description: `Deposit for ${booking_type} appointment`,
        items: [{
          name: `${booking_type.charAt(0).toUpperCase() + booking_type.slice(1)} Appointment`,
          description: `Deposit payment for ${booking_type} with ${appraiser.full_name}`,
          quantity: 1,
          amount: depositAmount
        }]
      },
      next_steps: [
        'Complete payment to secure your booking',
        'Check your email for booking confirmation details',
        'The appraiser will contact you 24 hours before the appointment',
        'Prepare property access and any required documentation'
      ],
      message: `Your ${booking_type} has been created. Please complete payment to confirm your booking with ${appraiser.full_name}!`
    });

  } catch (error) {
    console.error('Booking API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        message: 'Failed to process your booking. Please try again later.'
      },
      { status: 500 }
    );
  }
}

// Get user's booking history
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin or superadmin to access any appraiser's bookings
    const isAdmin = await isServerUserAdmin();
    const requestedAppraiser = appraiser_id;
    
    // If not admin, check if user can only access their own data
    if (!isAdmin && requestedAppraiser) {
      // For regular users, they should only access their own bookings through client_user_id
      // Admin users can specify appraiser_id to view any appraiser's bookings
    }

    // Try to get from appraiser_bookings table
    let query = supabase
      .from('appraiser_bookings')
      .select(`
        id,
        confirmation_number,
        booking_type,
        scheduled_datetime,
        estimated_cost,
        deposit_amount,
        status,
        payment_status,
        property_details,
        created_at,
        brokers!inner(id, full_name, standardized_headshot_url)
      `);

    // If admin, allow access to any appraiser's bookings
    // If not admin, restrict to user's own bookings
    if (isAdmin && appraiser_id) {
      query = query.eq('appraiser_id', appraiser_id);
    } else if (!isAdmin) {
      query = query.eq('client_user_id', user.id);
    }

    if (status) {
      query = query.eq('status', status);
    }

    query = query
      .order('scheduled_datetime', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data: bookings, error } = await query;

    // If bookings table doesn't exist, fall back to appraisal_requests
    if (error && error.code === '42P01') {
      let fallbackQuery = supabase
        .from('appraisal_requests')
        .select(`
          id,
          appraisal_type,
          property_type,
          property_address,
          estimated_cost,
          status,
          preferred_date,
          created_at,
          brokers!inner(id, full_name)
        `)
        .eq('client_email', user.email)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (appraiser_id) {
        fallbackQuery = fallbackQuery.eq('appraiser_id', appraiser_id);
      }

      const { data: fallbackBookings, error: fallbackError } = await fallbackQuery;

      if (fallbackError) {
        console.error('Failed to fetch booking history:', fallbackError);
        return NextResponse.json(
          { error: 'Failed to fetch booking history' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        bookings: fallbackBookings || [],
        pagination: {
          limit,
          offset,
          total: fallbackBookings?.length || 0
        }
      });
    }

    if (error) {
      console.error('Failed to fetch booking history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch booking history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      bookings: bookings || [],
      pagination: {
        limit,
        offset,
        total: bookings?.length || 0
      }
    });

  } catch (error) {
    console.error('Get bookings API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
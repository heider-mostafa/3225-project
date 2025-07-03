import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createClient } from '@supabase/supabase-js';
import { sendCommonEmail } from '@/lib/email/mailgun';

// Service role client for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;
    const {
      broker_id,
      viewing_date,
      viewing_time,
      duration_minutes = 60,
      visitor_name,
      visitor_email,
      visitor_phone,
      party_size = 1,
      viewing_type = 'in_person',
      special_requests,
      booking_source = 'website',
      metadata = {}
    } = await request.json();

    // Validate required fields
    if (!broker_id || !viewing_date || !viewing_time || !visitor_name || !visitor_email) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Missing required fields: broker_id, viewing_date, viewing_time, visitor_name, visitor_email' 
        },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(visitor_email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    const timeRegex = /^\d{2}:\d{2}$/;
    
    if (!dateRegex.test(viewing_date) || !timeRegex.test(viewing_time)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date or time format' },
        { status: 400 }
      );
    }

    // Check if booking is not in the past
    const viewingDateTime = new Date(`${viewing_date}T${viewing_time}:00`);
    const now = new Date();
    
    if (viewingDateTime <= now) {
      return NextResponse.json(
        { success: false, error: 'Cannot book viewings in the past' },
        { status: 400 }
      );
    }

    // Get user session if available
    const supabase = await createServerSupabaseClient();
    const { data: { session } } = await supabase.auth.getSession();

    // Verify the property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, address, city, price')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { success: false, error: 'Property not found' },
        { status: 404 }
      );
    }

    // Verify the broker is assigned to this property
    const { data: propertyBroker, error: brokerError } = await supabase
      .from('property_brokers')
      .select(`
        id,
        brokers (
          id,
          full_name,
          email,
          phone,
          is_active
        )
      `)
      .eq('property_id', propertyId)
      .eq('broker_id', broker_id)
      .eq('is_active', true)
      .eq('brokers.is_active', true)
      .single();

    if (brokerError || !propertyBroker) {
      return NextResponse.json(
        { success: false, error: 'Broker not found or not assigned to this property' },
        { status: 404 }
      );
    }

    // Check broker availability
    const { data: availability, error: availabilityError } = await supabase
      .from('broker_availability')
      .select('id, max_bookings, current_bookings, start_time, end_time, slot_duration_minutes')
      .eq('broker_id', broker_id)
      .eq('date', viewing_date)
      .eq('is_available', true)
      .lte('start_time', viewing_time)
      .gte('end_time', viewing_time)
      .filter('current_bookings', 'lt', 'max_bookings')
      .single();

    if (availabilityError || !availability) {
      return NextResponse.json(
        { success: false, error: 'Time slot not available' },
        { status: 400 }
      );
    }

    // Check for blocked times
    const startDateTime = `${viewing_date}T${viewing_time}:00Z`;
    const endDateTime = new Date(new Date(startDateTime).getTime() + duration_minutes * 60000).toISOString();

    const { data: blockedTimes } = await supabase
      .from('broker_blocked_times')
      .select('id')
      .eq('broker_id', broker_id)
      .lte('start_datetime', startDateTime)
      .gte('end_datetime', endDateTime);

    if (blockedTimes && blockedTimes.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Time slot is blocked' },
        { status: 400 }
      );
    }

    // Check for existing bookings at the same time
    const { data: existingBookings } = await supabase
      .from('property_viewings')
      .select('id')
      .eq('broker_id', broker_id)
      .eq('viewing_date', viewing_date)
      .eq('viewing_time', viewing_time)
      .eq('status', 'scheduled');

    if (existingBookings && existingBookings.length >= availability.max_bookings) {
      return NextResponse.json(
        { success: false, error: 'Time slot is fully booked' },
        { status: 400 }
      );
    }

    // Calculate end time
    const [hours, minutes] = viewing_time.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes + duration_minutes, 0, 0);
    const endTimeString = endTime.toTimeString().substring(0, 5);

    // Create the viewing booking
    const viewingData = {
      property_id: propertyId,
      broker_id: broker_id,
      user_id: session?.user?.id || null,
      viewing_date,
      viewing_time,
      end_time: endTimeString,
      duration_minutes,
      visitor_name,
      visitor_email,
      visitor_phone,
      party_size,
      viewing_type,
      special_requests,
      status: 'scheduled',
      booking_source,
      metadata: {
        ...metadata,
        property_title: property.title,
        property_address: property.address,
        broker_name: (propertyBroker.brokers as any).full_name,
        booked_at: new Date().toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      }
    };

    const { data: viewing, error: viewingError } = await supabase
      .from('property_viewings')
      .insert(viewingData)
      .select(`
        id,
        confirmation_code,
        viewing_date,
        viewing_time,
        duration_minutes,
        visitor_name,
        visitor_email,
        visitor_phone,
        party_size,
        viewing_type,
        special_requests,
        status,
        created_at
      `)
      .single();

    if (viewingError) {
      console.error('Error creating viewing:', viewingError);
      return NextResponse.json(
        { success: false, error: 'Failed to book viewing' },
        { status: 500 }
      );
    }

    // Send notifications using Mailgun instead of N8N webhook
    try {
      // Send confirmation email to visitor using Mailgun
      const confirmationResult = await sendCommonEmail.viewingConfirmation(
        visitor_email,
        visitor_name,
        property.title,
        viewing_date,
        viewing_time,
        viewing.confirmation_code,
        (propertyBroker.brokers as any).full_name,
        (propertyBroker.brokers as any).phone
      );

      if (!confirmationResult.success) {
        console.error('Viewing confirmation email failed:', confirmationResult.error);
      }

      // Send notification to broker/agent
      const brokerNotificationResult = await sendCommonEmail.agentInquiryNotification(
        (propertyBroker.brokers as any).email,
        (propertyBroker.brokers as any).full_name,
        property.title,
        visitor_name,
        visitor_email,
        visitor_phone || 'Not provided',
        `New viewing booking for ${viewing_date} at ${viewing_time}. Duration: ${duration_minutes} minutes. Party size: ${party_size}. ${special_requests ? `Special requests: ${special_requests}` : ''}`
      );

      if (!brokerNotificationResult.success) {
        console.error('Broker notification email failed:', brokerNotificationResult.error);
      }

      // Legacy N8N webhook for additional processing (optional)
      if (process.env.N8N_WEBHOOK_URL) {
        // Notify broker and admin via N8N (as fallback or additional processing)
        await fetch(`${process.env.N8N_WEBHOOK_URL}/viewing-booked`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            viewing_id: viewing.id,
            confirmation_code: viewing.confirmation_code,
            property: {
              id: propertyId,
              title: property.title,
              address: property.address,
              price: property.price
            },
            broker: {
              name: (propertyBroker.brokers as any).full_name,
              email: (propertyBroker.brokers as any).email,
              phone: (propertyBroker.brokers as any).phone
            },
            visitor: {
              name: visitor_name,
              email: visitor_email,
              phone: visitor_phone,
              party_size
            },
            viewing_details: {
              date: viewing_date,
              time: viewing_time,
              duration_minutes,
              type: viewing_type,
              special_requests
            },
            timestamp: new Date().toISOString()
          })
        });
      }
    } catch (emailError) {
      console.error('Email notification failed:', emailError);
      // Don't fail the booking if email fails - the booking is still valid
    }

    return NextResponse.json({
      success: true,
      viewing: {
        id: viewing.id,
        confirmation_code: viewing.confirmation_code,
        property: {
          title: property.title,
          address: property.address,
          city: property.city
        },
        broker: {
          name: (propertyBroker.brokers as any).full_name,
          email: (propertyBroker.brokers as any).email,
          phone: (propertyBroker.brokers as any).phone
        },
        viewing_date,
        viewing_time,
        duration_minutes,
        visitor_name,
        viewing_type,
        status: 'scheduled'
      },
      message: 'Viewing booked successfully! You will receive a confirmation email shortly.'
    });

  } catch (error) {
    console.error('Unexpected error in book viewing:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
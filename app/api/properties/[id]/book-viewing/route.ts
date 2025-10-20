import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { sendCommonEmail } from '@/lib/email/mailgun';
import { metaConversions } from '@/lib/services/meta-conversions';

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
      metadata = {},
      fbclid,
      fbp,
      utm_source,
      utm_medium,
      utm_campaign
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
    console.log('🔍 Checking availability for:', { broker_id, viewing_date, viewing_time });
    
    // First, let's see what availability slots exist for this broker on this date
    const { data: allSlots, error: allSlotsError } = await supabase
      .from('broker_availability')
      .select('*')
      .eq('broker_id', broker_id)
      .eq('date', viewing_date);
    
    console.log('📅 All availability slots for broker on', viewing_date, ':', allSlots);
    
    // Get all matching availability slots first
    const { data: availabilitySlots, error: availabilityError } = await supabase
      .from('broker_availability')
      .select('id, max_bookings, current_bookings, start_time, end_time, slot_duration_minutes')
      .eq('broker_id', broker_id)
      .eq('date', viewing_date)
      .eq('is_available', true)
      .lte('start_time', viewing_time)
      .gte('end_time', viewing_time);

    // For now, use the first matching slot (we'll check capacity below with actual bookings)
    const availability = availabilitySlots?.[0];

    console.log('🎯 Availability query result:', { availability, availabilityError });

    if (availabilityError || !availability) {
      console.log('❌ No matching availability slot found');
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

    // ENHANCED: Check for broker conflicts across ALL properties they're assigned to
    console.log('🔍 Checking broker conflicts across all properties for broker:', broker_id);
    
    // Calculate end time string for this booking
    const [hours, minutes] = viewing_time.split(':').map(Number);
    const endTime = new Date();
    endTime.setHours(hours, minutes + duration_minutes, 0, 0);
    const endTimeString = endTime.toTimeString().substring(0, 5);
    
    // Calculate booking time windows
    const bookingStartTime = `${viewing_date}T${viewing_time}:00`;
    const bookingEndTime = new Date(new Date(bookingStartTime).getTime() + duration_minutes * 60000)
      .toISOString().substring(0, 16).replace('T', ' ') + ':00';
    
    console.log('⏰ Requested booking window:', { 
      start: bookingStartTime, 
      end: bookingEndTime,
      duration: duration_minutes + ' minutes'
    });
    
    // Check for ANY existing bookings across ALL properties where this broker is assigned
    const { data: allBrokerBookings, error: conflictError } = await supabase
      .from('property_viewings')
      .select(`
        id,
        property_id,
        viewing_date,
        viewing_time,
        end_time,
        duration_minutes,
        properties (
          id,
          title,
          address
        )
      `)
      .eq('broker_id', broker_id)
      .eq('viewing_date', viewing_date)
      .eq('status', 'scheduled');

    if (conflictError) {
      console.error('❌ Error checking broker conflicts:', conflictError);
      return NextResponse.json(
        { success: false, error: 'Failed to check broker availability' },
        { status: 500 }
      );
    }

    console.log('📊 All broker bookings on', viewing_date, ':', allBrokerBookings);

    // Check for time conflicts with existing bookings
    const requestedStart = new Date(`${viewing_date}T${viewing_time}:00`);
    const requestedEnd = new Date(requestedStart.getTime() + duration_minutes * 60000);
    
    const timeConflicts = allBrokerBookings?.filter(booking => {
      const bookingStart = new Date(`${booking.viewing_date}T${booking.viewing_time}:00`);
      const bookingEnd = new Date(`${booking.viewing_date}T${booking.end_time}:00`);
      
      // Check if times overlap (includes buffer time consideration)
      const overlap = requestedStart < bookingEnd && requestedEnd > bookingStart;
      
      if (overlap) {
        console.log('⚠️ Time conflict detected:', {
          conflictingProperty: booking.properties?.title,
          conflictingTime: `${booking.viewing_time} - ${booking.end_time}`,
          requestedTime: `${viewing_time} - ${endTimeString}`
        });
      }
      
      return overlap;
    }) || [];

    // If there are time conflicts, reject the booking
    if (timeConflicts.length > 0) {
      const conflict = timeConflicts[0];
      console.log('❌ Broker double-booking prevented:', {
        broker_id,
        conflictingProperty: conflict.properties?.title,
        conflictingTime: `${conflict.viewing_time} - ${conflict.end_time}`,
        requestedProperty: propertyId,
        requestedTime: `${viewing_time} - ${endTimeString}`
      });
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Broker is not available at this time. They have another viewing scheduled from ${conflict.viewing_time} to ${conflict.end_time} at ${conflict.properties?.title}`,
          conflictDetails: {
            conflictingProperty: conflict.properties?.title,
            conflictingAddress: conflict.properties?.address,
            conflictingTime: `${conflict.viewing_time} - ${conflict.end_time}`
          }
        },
        { status: 409 } // 409 Conflict status code
      );
    }

    // Check availability slot capacity (existing logic)
    const samePropertyBookings = allBrokerBookings?.filter(booking => 
      booking.property_id === propertyId && 
      booking.viewing_time === viewing_time
    ) || [];

    console.log('📊 Same property bookings for', viewing_time, ':', samePropertyBookings);
    console.log('🎯 Max bookings allowed per slot:', availability.max_bookings);

    if (samePropertyBookings.length >= availability.max_bookings) {
      console.log('❌ Time slot fully booked for this property:', samePropertyBookings.length, 'bookings, max:', availability.max_bookings);
      return NextResponse.json(
        { success: false, error: 'Time slot is fully booked for this property' },
        { status: 400 }
      );
    }
    
    console.log('✅ Time slot available for booking');

    // Calculate lead quality score based on viewing characteristics
    const calculateLeadQuality = (): number => {
      let score = 30; // Base score for booking a viewing
      
      if (viewing_type === 'in_person') score += 15; // Higher intent
      if (party_size >= 2) score += 10; // Family/couple viewing
      if (visitor_phone) score += 5; // Provided contact info
      if (special_requests) score += 5; // Engaged user
      if (property.price > 5000000) score += 10; // Luxury property
      
      return Math.min(score, 65); // Cap at 65 (your scoring system)
    };

    const leadQualityScore = calculateLeadQuality();
    const conversionProbability = Math.min(leadQualityScore * 1.4, 100); // Convert to probability

    // Create the viewing booking with Meta tracking fields
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
      lead_quality_score: leadQualityScore,
      conversion_probability: conversionProbability,
      facebook_click_id: fbclid || null,
      facebook_browser_id: fbp || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
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

    console.log('💾 About to insert into property_viewings table');
    console.log('📝 Insert data:', JSON.stringify(viewingData, null, 2));
    
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
      console.error('❌ DETAILED ERROR:', {
        code: viewingError.code,
        message: viewingError.message,
        details: viewingError.details,
        hint: viewingError.hint
      });
      console.error('🔍 Failed data:', JSON.stringify(viewingData, null, 2));
      
      // Check if this is the constraint violation we're seeing
      if (viewingError.message?.includes('broker_availability_check1')) {
        console.error('🚨 CONSTRAINT VIOLATION: This suggests a database trigger is trying to update broker_availability');
        console.error('🔍 Current availability slot:', JSON.stringify(availability, null, 2));
      }
      
      return NextResponse.json(
        { success: false, error: 'Failed to book viewing' },
        { status: 500 }
      );
    }
    
    console.log('✅ Property viewing inserted successfully!');

    // Send Meta Conversion Event (Highest Intent Event - Property Viewing Booking)
    try {
      const metaResult = await metaConversions.trackPropertyViewing({
        userEmail: visitor_email,
        userPhone: visitor_phone || undefined,
        propertyId: propertyId,
        propertyValue: property.price || 0,
        viewingType: viewing_type,
        partySize: party_size,
        leadQualityScore: leadQualityScore,
        brokerId: broker_id,
        ipAddress: request.headers.get('x-forwarded-for') || undefined,
        userAgent: request.headers.get('user-agent') || undefined
      });

      if (metaResult.success) {
        // Update viewing record with Meta event success
        await supabase
          .from('property_viewings')
          .update({ 
            meta_event_sent: true,
            meta_event_id: `viewing_${viewing.id}_${Date.now()}`
          })
          .eq('id', viewing.id);

        console.log('✅ Meta property viewing event sent successfully');
      } else {
        console.error('❌ Meta property viewing event failed:', metaResult.error);
      }
    } catch (metaError) {
      console.error('❌ Meta conversion error:', metaError);
      // Don't fail the booking if Meta fails - booking is still valid
    }

    // Note: We don't update current_bookings counter since we're tracking individual time slots
    // The actual booking count is determined by querying property_viewings for specific times
    console.log('✅ Booking created successfully, skipping counter update');

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
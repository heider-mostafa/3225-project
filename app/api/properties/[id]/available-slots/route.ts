import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const propertyId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const supabase = await createServerSupabaseClient();
    const date = searchParams.get('date');
    const brokerId = searchParams.get('broker_id');

    if (!date) {
      return NextResponse.json(
        { success: false, error: 'Date parameter is required' },
        { status: 400 }
      );
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Check if date is not in the past
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return NextResponse.json(
        { success: false, error: 'Cannot book slots in the past' },
        { status: 400 }
      );
    }

    // Build query for brokers assigned to this property
    const { data: propertyBrokers, error: brokersError } = await supabase
      .from('property_brokers')
      .select(`
        broker_id,
        is_primary
      `)
      .eq('property_id', propertyId)
      .eq('is_active', true);

    if (brokersError) {
      console.error('Error fetching property brokers:', brokersError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch brokers' },
        { status: 500 }
      );
    }

    if (!propertyBrokers || propertyBrokers.length === 0) {
      return NextResponse.json({
        success: true,
        slots: []
      });
    }

    // Get broker details
    const brokerIds = propertyBrokers.map(pb => pb.broker_id);
    
    let brokerQuery = supabase
      .from('brokers')
      .select(`
        id,
        full_name,
        email,
        phone,
        photo_url,
        bio,
        specialties,
        languages,
        rating,
        total_reviews,
        years_experience,
        timezone
      `)
      .in('id', brokerIds)
      .eq('is_active', true);

    if (brokerId) {
      brokerQuery = brokerQuery.eq('id', brokerId);
    }

    const { data: brokers, error: brokerDetailsError } = await brokerQuery;

    if (brokerDetailsError) {
      console.error('Error fetching broker details:', brokerDetailsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch broker details' },
        { status: 500 }
      );
    }

    if (!brokers || brokers.length === 0) {
      return NextResponse.json({
        success: true,
        slots: []
      });
    }

    // Get availability for all brokers on the specified date
    const finalBrokerIds = brokers.map(b => b.id);
    console.log('🔍 Fetching availability for brokers:', finalBrokerIds, 'on date:', date);
    
    // Query broker availability with proper filtering
    const { data: availability, error: availabilityError } = await supabase
      .from('broker_availability')
      .select(`
        id,
        broker_id,
        start_time,
        end_time,
        max_bookings,
        current_bookings,
        slot_duration_minutes,
        break_between_slots,
        booking_type,
        notes
      `)
      .eq('date', date)
      .in('broker_id', finalBrokerIds)
      .eq('is_available', true)
      .order('broker_id')
      .order('start_time');

    console.log('📅 Raw availability data:', availability);
    console.log('❌ Availability error:', availabilityError);

    if (availabilityError) {
      console.error('Error fetching availability:', availabilityError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch availability' },
        { status: 500 }
      );
    }

    // Don't filter out slots here - we'll handle availability per time slot
    const availableSlots = availability || [];

    // Check for blocked times
    const startOfDay = `${date}T00:00:00Z`;
    const endOfDay = `${date}T23:59:59Z`;

    const { data: blockedTimes } = await supabase
      .from('broker_blocked_times')
      .select('broker_id, start_datetime, end_datetime')
      .in('broker_id', finalBrokerIds)
      .gte('start_datetime', startOfDay)
      .lte('end_datetime', endOfDay);

    // Get existing bookings for all brokers across ALL their properties on this date
    console.log('🔍 Checking existing bookings for cross-property conflicts...');
    const { data: existingBookings, error: bookingsError } = await supabase
      .from('property_viewings')
      .select(`
        broker_id,
        viewing_time,
        end_time,
        duration_minutes,
        property_id,
        properties (
          id,
          title
        )
      `)
      .eq('viewing_date', date)
      .in('broker_id', finalBrokerIds)
      .eq('status', 'scheduled');

    if (bookingsError) {
      console.error('Error fetching existing bookings:', bookingsError);
      return NextResponse.json(
        { success: false, error: 'Failed to check existing bookings' },
        { status: 500 }
      );
    }

    console.log('📊 Existing bookings for conflict check:', existingBookings);

    // Process availability into time slots
    const slotsResponse = brokers.map(broker => {
      const propertyBroker = propertyBrokers.find(pb => pb.broker_id === broker.id);
      const brokerAvailability = availableSlots.filter(a => a.broker_id === broker.id);
      const brokerBlockedTimes = blockedTimes?.filter(bt => bt.broker_id === broker.id) || [];
      const brokerBookings = existingBookings?.filter(booking => booking.broker_id === broker.id) || [];

      const timeSlots = brokerAvailability.map(avail => {
        // Check if this time slot is blocked
        const slotStart = new Date(`${date}T${avail.start_time}`);
        const slotEnd = new Date(`${date}T${avail.end_time}`);
        
        const isBlocked = brokerBlockedTimes.some(bt => {
          const blockStart = new Date(bt.start_datetime);
          const blockEnd = new Date(bt.end_datetime);
          return (
            (slotStart >= blockStart && slotStart < blockEnd) ||
            (slotEnd > blockStart && slotEnd <= blockEnd) ||
            (slotStart <= blockStart && slotEnd >= blockEnd)
          );
        });

        if (isBlocked) {
          return null;
        }

        // Generate individual time slots based on duration
        const slots = [];
        const duration = avail.slot_duration_minutes || 60;
        const breakTime = avail.break_between_slots || 15;
        
        let currentTime = new Date(`${date}T${avail.start_time}`);
        const endTime = new Date(`${date}T${avail.end_time}`);

        while (currentTime < endTime) {
          const slotEndTime = new Date(currentTime.getTime() + duration * 60000);
          
          if (slotEndTime <= endTime) {
            const timeString = currentTime.toTimeString().substring(0, 5); // HH:MM format
            
            // Check for conflicts with existing bookings across ALL properties
            const hasConflict = brokerBookings.some(booking => {
              const bookingStart = new Date(`${date}T${booking.viewing_time}:00`);
              const bookingEnd = new Date(`${date}T${booking.end_time}:00`);
              
              // Check if this time slot overlaps with any existing booking
              const overlap = currentTime < bookingEnd && slotEndTime > bookingStart;
              
              if (overlap && booking.property_id !== propertyId) {
                console.log('⚠️ Cross-property conflict detected:', {
                  broker: broker.full_name,
                  conflictTime: timeString,
                  conflictingProperty: booking.properties?.title,
                  conflictingBooking: `${booking.viewing_time} - ${booking.end_time}`
                });
              }
              
              return overlap;
            });
            
            // Count current bookings for this specific time slot on this property
            const currentPropertyBookings = brokerBookings.filter(booking => 
              booking.property_id === propertyId && booking.viewing_time === timeString
            ).length;
            
            // Determine availability
            const isAvailable = !hasConflict && currentPropertyBookings < (avail.max_bookings || 1);
            
            // Create conflict details for UI display
            const conflictDetails = hasConflict ? brokerBookings.find(booking => {
              const bookingStart = new Date(`${date}T${booking.viewing_time}:00`);
              const bookingEnd = new Date(`${date}T${booking.end_time}:00`);
              return currentTime < bookingEnd && slotEndTime > bookingStart;
            }) : null;
            
            slots.push({
              time: timeString,
              available: isAvailable,
              maxBookings: avail.max_bookings || 1,
              currentBookings: currentPropertyBookings,
              broker_id: avail.broker_id,
              availability_id: avail.id,
              duration_minutes: duration,
              booking_type: avail.booking_type,
              notes: avail.notes,
              // Enhanced conflict information
              hasConflict: hasConflict,
              conflictReason: hasConflict ? 'broker_busy_other_property' : null,
              conflictDetails: conflictDetails ? {
                conflictingProperty: conflictDetails.properties?.title,
                conflictingTime: `${conflictDetails.viewing_time} - ${conflictDetails.end_time}`,
                propertyId: conflictDetails.property_id
              } : null
            });
          }

          // Move to next slot (duration + break time)
          currentTime = new Date(currentTime.getTime() + (duration + breakTime) * 60000);
        }

        return slots;
      }).filter(Boolean).flat();

      return {
        broker_id: broker.id,
        broker: broker,
        is_primary: propertyBroker?.is_primary || false,
        timeSlots: timeSlots || []
      };
    });

    console.log('🎯 Final slots response:', JSON.stringify(slotsResponse, null, 2));

    return NextResponse.json({
      success: true,
      date,
      slots: slotsResponse
    });

  } catch (error) {
    console.error('Unexpected error in get available slots:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
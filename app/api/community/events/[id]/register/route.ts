import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const eventId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      guest_count,
      special_requirements,
      emergency_contact
    } = body;

    // Get event details
    const { data: event, error: fetchError } = await supabase
      .from('community_events')
      .select(`
        id,
        compound_id,
        title,
        event_status,
        start_datetime,
        end_datetime,
        max_participants,
        registration_required,
        registration_deadline,
        entry_fee,
        age_restriction,
        compounds (
          id,
          name
        )
      `)
      .eq('id', eventId)
      .single();

    if (fetchError || !event) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Check if event allows registration
    if (!event.registration_required) {
      return NextResponse.json({ 
        error: 'This event does not require registration' 
      }, { status: 400 });
    }

    if (event.event_status !== 'published') {
      return NextResponse.json({ 
        error: 'This event is not available for registration' 
      }, { status: 400 });
    }

    // Check if registration is still open
    const now = new Date();
    const startTime = new Date(event.start_datetime);
    const deadlineTime = event.registration_deadline ? new Date(event.registration_deadline) : startTime;

    if (now >= deadlineTime) {
      return NextResponse.json({ 
        error: 'Registration deadline has passed' 
      }, { status: 400 });
    }

    if (now >= startTime) {
      return NextResponse.json({ 
        error: 'Event has already started' 
      }, { status: 400 });
    }

    // Get user's resident record
    const { data: resident } = await supabase
      .from('compound_residents')
      .select(`
        id,
        user_id,
        community_units (
          compound_id,
          unit_number,
          building_name
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('community_units.compound_id', event.compound_id)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'You must be a resident of this compound to register for events' 
      }, { status: 403 });
    }

    // Check if user is already registered
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select('id, registration_status')
      .eq('event_id', eventId)
      .eq('resident_id', resident.id)
      .single();

    if (existingRegistration) {
      const status = existingRegistration.registration_status;
      let message = 'You are already registered for this event';
      
      if (status === 'pending') {
        message = 'Your registration is pending approval';
      } else if (status === 'cancelled') {
        message = 'Your previous registration was cancelled. Please contact event organizer to re-register.';
      }
      
      return NextResponse.json({ 
        error: message,
        registration_status: status
      }, { status: 409 });
    }

    // Check if event is full
    if (event.max_participants) {
      const { count: currentRegistrations } = await supabase
        .from('event_registrations')
        .select('id', { count: 'exact' })
        .eq('event_id', eventId)
        .eq('registration_status', 'confirmed');

      const totalGuests = (guest_count || 0) + 1; // +1 for the registrant
      
      if ((currentRegistrations || 0) + totalGuests > event.max_participants) {
        return NextResponse.json({ 
          error: `Event is full. Maximum ${event.max_participants} participants allowed.`,
          available_spots: event.max_participants - (currentRegistrations || 0)
        }, { status: 400 });
      }
    }

    // Validate guest count
    const guestCount = guest_count ? parseInt(guest_count) : 0;
    if (isNaN(guestCount) || guestCount < 0) {
      return NextResponse.json({ 
        error: 'Invalid guest count' 
      }, { status: 400 });
    }

    // Create registration
    const { data: registration, error: registrationError } = await supabase
      .from('event_registrations')
      .insert({
        event_id: eventId,
        resident_id: resident.id,
        guest_count: guestCount,
        total_attendees: guestCount + 1,
        special_requirements,
        emergency_contact,
        registration_status: 'confirmed', // Most events auto-confirm
        registered_at: new Date().toISOString()
      })
      .select(`
        id,
        event_id,
        resident_id,
        guest_count,
        total_attendees,
        special_requirements,
        emergency_contact,
        registration_status,
        registered_at,
        created_at,
        community_events (
          title,
          start_datetime,
          location
        ),
        compound_residents (
          community_units (
            unit_number,
            building_name
          ),
          user_profiles (
            full_name,
            phone,
            email
          )
        )
      `)
      .single();

    if (registrationError) {
      console.error('Registration creation error:', registrationError);
      return NextResponse.json({ error: 'Failed to register for event' }, { status: 500 });
    }

    // TODO: Send confirmation email/SMS to resident
    // TODO: Send notification to event organizer
    // TODO: Add calendar event to user's calendar

    const totalCost = event.entry_fee * (guestCount + 1);

    return NextResponse.json({
      success: true,
      registration,
      event_details: {
        title: event.title,
        start_datetime: event.start_datetime,
        location: event.location
      },
      payment_required: totalCost > 0,
      total_cost: totalCost,
      message: `Successfully registered for "${event.title}". ${guestCount > 0 ? `Registered for ${guestCount + 1} attendees.` : ''}`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const eventId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get user's resident record
    const { data: resident } = await supabase
      .from('compound_residents')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'Resident record not found' 
      }, { status: 403 });
    }

    // Get existing registration
    const { data: existingRegistration } = await supabase
      .from('event_registrations')
      .select(`
        id,
        registration_status,
        registered_at,
        community_events (
          title,
          start_datetime,
          registration_deadline
        )
      `)
      .eq('event_id', eventId)
      .eq('resident_id', resident.id)
      .single();

    if (!existingRegistration) {
      return NextResponse.json({ 
        error: 'Registration not found' 
      }, { status: 404 });
    }

    if (existingRegistration.registration_status === 'cancelled') {
      return NextResponse.json({ 
        error: 'Registration is already cancelled' 
      }, { status: 400 });
    }

    // Check cancellation policy (can't cancel after event starts)
    const now = new Date();
    const eventStart = new Date(existingRegistration.community_events.start_datetime);
    
    if (now >= eventStart) {
      return NextResponse.json({ 
        error: 'Cannot cancel registration after event has started' 
      }, { status: 400 });
    }

    // Check if within cancellation window (e.g., 24 hours before event)
    const cancellationDeadline = new Date(eventStart.getTime() - (24 * 60 * 60 * 1000)); // 24 hours before
    const isLastMinute = now > cancellationDeadline;

    // Cancel registration
    const { data: cancelledRegistration, error: cancelError } = await supabase
      .from('event_registrations')
      .update({
        registration_status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        cancellation_reason: isLastMinute ? 'Last minute cancellation' : 'User cancellation'
      })
      .eq('id', existingRegistration.id)
      .select(`
        id,
        registration_status,
        cancelled_at,
        community_events (
          title,
          start_datetime
        )
      `)
      .single();

    if (cancelError) {
      console.error('Registration cancellation error:', cancelError);
      return NextResponse.json({ error: 'Failed to cancel registration' }, { status: 500 });
    }

    // TODO: Send cancellation confirmation
    // TODO: Update event capacity
    // TODO: Notify event organizer
    // TODO: Process refund if applicable

    return NextResponse.json({
      success: true,
      registration: cancelledRegistration,
      message: `Registration for "${existingRegistration.community_events.title}" has been cancelled`,
      late_cancellation: isLastMinute
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
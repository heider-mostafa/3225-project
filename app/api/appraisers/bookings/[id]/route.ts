import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notificationService } from '@/lib/services/notification-service';
import { CalendarService } from '@/lib/services/calendar-service';

interface BookingActionRequest {
  action: 'confirm' | 'cancel' | 'complete' | 'reschedule';
  notes?: string;
  new_datetime?: string;
  cancellation_reason?: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const bookingId = params.id;
    const body: BookingActionRequest = await request.json();
    const { action, notes, new_datetime, cancellation_reason } = body;

    if (!bookingId || !action) {
      return NextResponse.json(
        { success: false, error: 'Booking ID and action are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user to verify they're the appraiser for this booking
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get booking details first
    let booking;
    let bookingError;

    // Try appraiser_bookings table first
    const { data: appraiserBooking, error: appraiserBookingError } = await supabase
      .from('appraiser_bookings')
      .select(`
        *,
        brokers!inner(id, full_name, email, phone, user_id)
      `)
      .eq('id', bookingId)
      .single();

    if (appraiserBookingError && appraiserBookingError.code === '42P01') {
      // Fall back to appraisal_requests if appraiser_bookings doesn't exist
      const { data: fallbackBooking, error: fallbackError } = await supabase
        .from('appraisal_requests')
        .select(`
          *,
          brokers!inner(id, full_name, email, phone, user_id)
        `)
        .eq('id', bookingId)
        .single();
      
      booking = fallbackBooking;
      bookingError = fallbackError;
    } else {
      booking = appraiserBooking;
      bookingError = appraiserBookingError;
    }

    if (bookingError || !booking) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    // Verify the user is authorized to modify this booking
    const appraiserUserId = booking.brokers?.user_id;
    if (!appraiserUserId || appraiserUserId !== user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to modify this booking' },
        { status: 403 }
      );
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    };
    let newStatus = booking.status;

    switch (action) {
      case 'confirm':
        if (booking.status !== 'pending_confirmation') {
          return NextResponse.json(
            { success: false, error: 'Booking cannot be confirmed in its current state' },
            { status: 400 }
          );
        }
        newStatus = 'confirmed';
        updateData = {
          ...updateData,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          appraiser_notes: notes
        };
        break;

      case 'cancel':
        if (['completed', 'cancelled'].includes(booking.status)) {
          return NextResponse.json(
            { success: false, error: 'Cannot cancel a completed or already cancelled booking' },
            { status: 400 }
          );
        }
        newStatus = 'cancelled';
        updateData = {
          ...updateData,
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancellation_reason: cancellation_reason || 'Cancelled by appraiser',
          appraiser_notes: notes
        };
        break;

      case 'complete':
        if (booking.status !== 'confirmed' && booking.status !== 'in_progress') {
          return NextResponse.json(
            { success: false, error: 'Only confirmed or in-progress bookings can be completed' },
            { status: 400 }
          );
        }
        newStatus = 'completed';
        updateData = {
          ...updateData,
          status: 'completed',
          completed_at: new Date().toISOString(),
          appraiser_notes: notes
        };
        break;

      case 'reschedule':
        if (!new_datetime) {
          return NextResponse.json(
            { success: false, error: 'New datetime is required for rescheduling' },
            { status: 400 }
          );
        }
        updateData = {
          ...updateData,
          scheduled_datetime: new Date(new_datetime).toISOString(),
          status: 'confirmed', // Reset to confirmed after reschedule
          rescheduled_at: new Date().toISOString(),
          appraiser_notes: notes
        };
        newStatus = 'confirmed';
        break;

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }

    // Update the booking
    let updateResponse;
    if (booking.brokers) {
      // Update in appraiser_bookings
      updateResponse = await supabase
        .from('appraiser_bookings')
        .update(updateData)
        .eq('id', bookingId)
        .select()
        .single();
    } else {
      // Update in appraisal_requests (fallback)
      updateResponse = await supabase
        .from('appraisal_requests')
        .update({
          status: newStatus === 'confirmed' ? 'pending' : newStatus,
          updated_at: updateData.updated_at
        })
        .eq('id', bookingId)
        .select()
        .single();
    }

    if (updateResponse.error) {
      console.error('Failed to update booking:', updateResponse.error);
      return NextResponse.json(
        { success: false, error: 'Failed to update booking' },
        { status: 500 }
      );
    }

    // Send notifications to client
    try {
      const clientEmail = booking.client_email;
      const clientPhone = booking.client_phone;
      const appraiserName = booking.brokers?.full_name || 'Your Appraiser';
      
      let emailSubject = '';
      let emailMessage = '';
      let smsMessage = '';

      switch (action) {
        case 'confirm':
          emailSubject = `Booking Confirmed - ${booking.confirmation_number}`;
          emailMessage = `Good news! Your ${booking.booking_type} appointment with ${appraiserName} has been confirmed for ${new Date(booking.scheduled_datetime).toLocaleString('en-EG')}.`;
          smsMessage = `Booking confirmed! Your ${booking.booking_type} with ${appraiserName} is set for ${new Date(booking.scheduled_datetime).toLocaleDateString('en-EG')}. Confirmation: ${booking.confirmation_number}`;
          break;

        case 'cancel':
          emailSubject = `Booking Cancelled - ${booking.confirmation_number}`;
          emailMessage = `We regret to inform you that your ${booking.booking_type} appointment scheduled for ${new Date(booking.scheduled_datetime).toLocaleString('en-EG')} has been cancelled. Reason: ${cancellation_reason || 'Unavailable'}`;
          smsMessage = `Your ${booking.booking_type} appointment for ${new Date(booking.scheduled_datetime).toLocaleDateString('en-EG')} has been cancelled. We apologize for any inconvenience.`;
          break;

        case 'complete':
          emailSubject = `Service Completed - ${booking.confirmation_number}`;
          emailMessage = `Your ${booking.booking_type} service has been completed. Thank you for choosing our services!`;
          smsMessage = `Your ${booking.booking_type} service is complete. Thank you!`;
          break;

        case 'reschedule':
          emailSubject = `Booking Rescheduled - ${booking.confirmation_number}`;
          emailMessage = `Your ${booking.booking_type} appointment has been rescheduled to ${new Date(new_datetime!).toLocaleString('en-EG')}.`;
          smsMessage = `Your ${booking.booking_type} has been rescheduled to ${new Date(new_datetime!).toLocaleDateString('en-EG')}. Confirmation: ${booking.confirmation_number}`;
          break;
      }

      // Send email notification
      if (clientEmail) {
        await notificationService.sendEmail({
          to: clientEmail,
          subject: emailSubject,
          template: 'booking_update',
          variables: {
            client_name: booking.client_name,
            appraiser_name: appraiserName,
            booking_type: booking.booking_type,
            action,
            scheduled_datetime: booking.scheduled_datetime,
            new_datetime,
            confirmation_number: booking.confirmation_number,
            message: emailMessage,
            notes
          }
        });
      }

      // Send SMS notification if phone is available
      if (clientPhone) {
        await notificationService.sendSMS({
          to: clientPhone,
          template: 'booking_update',
          message: smsMessage,
          variables: {
            action,
            booking_type: booking.booking_type,
            confirmation_number: booking.confirmation_number
          }
        });
      }
    } catch (notificationError) {
      console.error('Failed to send booking notifications:', notificationError);
      // Don't fail the booking update if notifications fail
    }

    // Send calendar invitations for confirmed and rescheduled bookings
    if (action === 'confirm' || action === 'reschedule') {
      try {
        const appraiserEmail = booking.brokers?.email || booking.appraiser_email;
        
        if (appraiserEmail && booking.client_email) {
          const bookingDetails = {
            id: booking.id,
            appraiser_name: booking.brokers?.full_name || 'Appraiser',
            appraiser_email: appraiserEmail,
            client_name: booking.client_name,
            client_email: booking.client_email,
            property_address: booking.property_address,
            booking_type: booking.booking_type,
            preferred_date: action === 'reschedule' ? new Date(new_datetime!).toISOString().split('T')[0] : new Date(booking.scheduled_datetime).toISOString().split('T')[0],
            preferred_time: action === 'reschedule' ? new Date(new_datetime!).toTimeString().slice(0, 5) : new Date(booking.scheduled_datetime).toTimeString().slice(0, 5),
            duration_hours: 2, // Default duration
            special_requirements: booking.requirements,
            confirmation_number: booking.confirmation_number
          };

          // Send calendar invitation
          await CalendarService.sendCalendarInvitation(bookingDetails, notificationService);
        }
      } catch (calendarError) {
        console.error('Failed to send calendar invitation:', calendarError);
        // Don't fail the booking update if calendar fails
      }
    }

    return NextResponse.json({
      success: true,
      booking: updateResponse.data,
      message: `Booking ${action}ed successfully`
    });

  } catch (error) {
    console.error('Booking action error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
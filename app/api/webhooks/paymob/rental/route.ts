import { NextRequest, NextResponse } from 'next/server';
import { paymobService } from '@/lib/services/paymob-service';
import rentalPaymentService from '@/lib/services/rental-payment-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-paymob-signature') || '';
    const webhookData = await request.json();

    console.log('Rental payment webhook received:', {
      transaction_id: webhookData.id,
      order_id: webhookData.order?.id,
      merchant_order_id: webhookData.order?.merchant_order_id,
      success: webhookData.success,
      amount: webhookData.amount_cents
    });

    // Check if Paymob service is available
    if (!paymobService) {
      console.error('Paymob service not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Verify webhook signature using Paymob service
    const isValid = await paymobService.handleWebhook(webhookData, signature);
    if (!isValid) {
      console.error('Invalid webhook signature for rental payment');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    // Get booking details using merchant order ID
    const supabase = createClient();
    const { data: booking, error: bookingError } = await supabase
      .from('rental_bookings')
      .select('id, rental_listing_id, guest_user_id, total_amount')
      .eq('id', webhookData.order.merchant_order_id)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found for merchant order ID:', webhookData.order.merchant_order_id);
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Check if rental payment service is available
    if (!rentalPaymentService) {
      console.error('Rental payment service not configured');
      return NextResponse.json({ error: 'Payment service not configured' }, { status: 500 });
    }

    // Process payment confirmation
    const confirmResult = await rentalPaymentService.confirmRentalPayment(
      booking.id,
      webhookData.id.toString(),
      webhookData
    );

    if (!confirmResult.success) {
      console.error('Failed to confirm rental payment:', confirmResult.error);
      return NextResponse.json({ error: 'Payment confirmation failed' }, { status: 500 });
    }

    // Send notifications based on payment status
    if (webhookData.success) {
      // Payment successful - send confirmation emails/SMS
      console.log('Rental payment successful, sending confirmations...');
      
      // Get full booking details for notifications
      const { data: fullBooking } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          rental_listings!inner(
            properties!inner(title, address)
          )
        `)
        .eq('id', booking.id)
        .single();

      if (fullBooking) {
        const { notificationService } = await import('@/lib/services/notification-service');
        
        await notificationService.notifyRentalBookingConfirmed({
          guest_name: fullBooking.guest_email?.split('@')[0] || 'Guest',
          guest_email: fullBooking.guest_email,
          guest_phone: fullBooking.guest_phone,
          property_title: fullBooking.rental_listings.properties.title,
          property_address: fullBooking.rental_listings.properties.address,
          check_in_date: fullBooking.check_in_date,
          check_out_date: fullBooking.check_out_date,
          number_of_guests: fullBooking.number_of_guests,
          total_amount: fullBooking.total_amount,
          booking_id: fullBooking.id
        });
      }
      
    } else {
      // Payment failed - notify guest
      console.log('Rental payment failed, notifying guest...');
      
      // Get booking details for failed payment notification
      const { data: fullBooking } = await supabase
        .from('rental_bookings')
        .select(`
          *,
          rental_listings!inner(
            properties!inner(title)
          )
        `)
        .eq('id', booking.id)
        .single();

      if (fullBooking) {
        const { notificationService } = await import('@/lib/services/notification-service');
        
        await notificationService.notifyRentalPaymentFailed({
          guest_name: fullBooking.guest_email?.split('@')[0] || 'Guest',
          guest_email: fullBooking.guest_email,
          guest_phone: fullBooking.guest_phone,
          property_title: fullBooking.rental_listings.properties.title,
          check_in_date: fullBooking.check_in_date,
          check_out_date: fullBooking.check_out_date,
          total_amount: fullBooking.total_amount,
          booking_id: fullBooking.id
        });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Rental payment webhook error:', error);
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}

// Handle preflight OPTIONS request for CORS
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, x-paymob-signature',
    },
  });
}
import { paymobService } from './paymob-service';
import { createClient } from '@/utils/supabase/client';

interface RentalBooking {
  id: string;
  rental_listing_id: string;
  guest_user_id: string;
  check_in_date: string;
  check_out_date: string;
  number_of_guests: number;
  number_of_nights: number;
  nightly_rate: number;
  total_nights_cost: number;
  cleaning_fee: number;
  security_deposit: number;
  platform_fee: number;
  total_amount: number;
  guest_phone: string;
  guest_email: string;
  booking_status: string;
  payment_status: string;
  properties?: {
    title: string;
    address: string;
    city: string;
  };
}

interface RentalPaymentData {
  booking: RentalBooking;
  guest_details: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    address?: {
      street: string;
      city: string;
      state: string;
      country: string;
      postal_code?: string;
    };
  };
}

interface PaymentResponse {
  success: boolean;
  payment_url?: string;
  iframe_url?: string;
  payment_key?: string;
  order_id?: string;
  error?: string;
}

export class RentalPaymentService {
  private supabase: ReturnType<typeof createClient>;
  
  constructor() {
    this.supabase = createClient();
  }

  /**
   * Create a rental payment using Paymob's new Intention API
   */
  async createRentalPayment(paymentData: RentalPaymentData): Promise<PaymentResponse> {
    try {
      const { booking, guest_details } = paymentData;

      // Prepare payment intention data for Paymob
      const intentionData = {
        amount: booking.total_amount,
        currency: 'EGP' as const,
        payment_methods: ['card', 'wallet', 'bank_transfer', 'bnpl'],
        items: this.buildPaymentItems(booking),
        billing_data: {
          first_name: guest_details.first_name,
          last_name: guest_details.last_name,
          email: guest_details.email,
          phone_number: guest_details.phone_number,
          country: 'EG' as const,
          state: guest_details.address?.state || 'Cairo',
          city: guest_details.address?.city || booking.properties?.city || 'Cairo',
          street: guest_details.address?.street || booking.properties?.address || 'N/A',
          building: '',
          floor: '',
          apartment: '',
          postal_code: guest_details.address?.postal_code || '11511'
        },
        customer: {
          first_name: guest_details.first_name,
          last_name: guest_details.last_name,
          email: guest_details.email,
          phone_number: guest_details.phone_number
        },
        extras: {
          ee: Math.round(booking.platform_fee) // Extra fees (platform commission)
        }
      };

      // Create payment intention with Paymob
      const paymobResponse = await paymobService.createPaymentIntention(intentionData);

      // Create payment record in database
      await this.createPaymentRecord(booking, paymobResponse.id);

      return {
        success: true,
        payment_url: paymobResponse.payment_url,
        iframe_url: paymobResponse.iframe_url,
        order_id: paymobResponse.id
      };

    } catch (error: any) {
      console.error('Rental payment creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create rental payment'
      };
    }
  }

  /**
   * Create a rental payment using legacy Paymob API (fallback)
   */
  async createRentalPaymentLegacy(paymentData: RentalPaymentData): Promise<PaymentResponse> {
    try {
      const { booking, guest_details } = paymentData;

      // Step 1: Create Paymob order
      const orderData = {
        amount_cents: Math.round(booking.total_amount * 100), // Convert to piasters
        currency: 'EGP' as const,
        merchant_order_id: booking.id,
        items: this.buildLegacyPaymentItems(booking),
        delivery_needed: false
      };

      const orderResponse = await paymobService.createOrder(orderData);

      // Step 2: Create payment key
      const paymentData_legacy = {
        amount_cents: Math.round(booking.total_amount * 100),
        expiration: 3600, // 1 hour
        order_id: orderResponse.id,
        billing_data: {
          apartment: '',
          email: guest_details.email,
          floor: '',
          first_name: guest_details.first_name,
          street: guest_details.address?.street || booking.properties?.address || 'N/A',
          building: '',
          phone_number: guest_details.phone_number,
          shipping_method: "NA" as const,
          postal_code: guest_details.address?.postal_code || '11511',
          city: guest_details.address?.city || booking.properties?.city || 'Cairo',
          country: "EG" as const,
          last_name: guest_details.last_name,
          state: guest_details.address?.state || 'Cairo'
        },
        currency: "EGP" as const,
        integration_id: parseInt(process.env.PAYMOB_CARD_INTEGRATION_ID || '0'),
        lock_order_when_paid: true
      };

      const paymentKey = await paymobService.createPaymentKey(paymentData_legacy);

      // Step 3: Create payment record
      await this.createPaymentRecord(booking, orderResponse.id);

      // Step 4: Generate URLs
      const paymentUrl = paymobService.getRedirectUrl(paymentKey);
      const iframeUrl = paymobService.getIframeUrl(paymentKey);

      return {
        success: true,
        payment_url: paymentUrl,
        iframe_url: iframeUrl,
        payment_key: paymentKey,
        order_id: orderResponse.id
      };

    } catch (error: any) {
      console.error('Legacy rental payment creation error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create rental payment'
      };
    }
  }

  /**
   * Build payment items for Paymob Intention API
   */
  private buildPaymentItems(booking: RentalBooking) {
    const items = [];

    // Accommodation cost
    if (booking.total_nights_cost > 0) {
      items.push({
        name: `${booking.number_of_nights} nights accommodation`,
        amount: booking.total_nights_cost,
        description: `${booking.properties?.title || 'Rental Property'} - ${booking.check_in_date} to ${booking.check_out_date}`,
        quantity: 1
      });
    }

    // Cleaning fee
    if (booking.cleaning_fee > 0) {
      items.push({
        name: 'Cleaning Fee',
        amount: booking.cleaning_fee,
        description: 'Professional cleaning service',
        quantity: 1
      });
    }

    // Security deposit (if applicable)
    if (booking.security_deposit > 0) {
      items.push({
        name: 'Security Deposit',
        amount: booking.security_deposit,
        description: 'Refundable security deposit',
        quantity: 1
      });
    }

    // Platform service fee
    if (booking.platform_fee > 0) {
      items.push({
        name: 'Service Fee',
        amount: booking.platform_fee,
        description: 'OpenBeit platform service fee',
        quantity: 1
      });
    }

    return items;
  }

  /**
   * Build payment items for legacy Paymob API
   */
  private buildLegacyPaymentItems(booking: RentalBooking) {
    const items = [];

    // Accommodation cost
    if (booking.total_nights_cost > 0) {
      items.push({
        name: `${booking.number_of_nights} nights accommodation`,
        amount_cents: Math.round(booking.total_nights_cost * 100),
        description: `${booking.properties?.title || 'Rental Property'}`,
        quantity: 1
      });
    }

    // Cleaning fee
    if (booking.cleaning_fee > 0) {
      items.push({
        name: 'Cleaning Fee',
        amount_cents: Math.round(booking.cleaning_fee * 100),
        description: 'Professional cleaning service',
        quantity: 1
      });
    }

    // Platform service fee
    if (booking.platform_fee > 0) {
      items.push({
        name: 'Service Fee',
        amount_cents: Math.round(booking.platform_fee * 100),
        description: 'OpenBeit service fee',
        quantity: 1
      });
    }

    return items;
  }

  /**
   * Create payment record in database
   */
  private async createPaymentRecord(booking: RentalBooking, paymobOrderId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('rental_payments')
        .insert({
          booking_id: booking.id,
          paymob_order_id: paymobOrderId,
          amount: booking.total_amount,
          currency: 'EGP',
          status: 'pending',
          payment_method: null,
          metadata: {
            booking_details: {
              check_in: booking.check_in_date,
              check_out: booking.check_out_date,
              guests: booking.number_of_guests,
              nights: booking.number_of_nights
            },
            pricing_breakdown: {
              accommodation: booking.total_nights_cost,
              cleaning_fee: booking.cleaning_fee,
              platform_fee: booking.platform_fee,
              total: booking.total_amount
            }
          }
        });

      if (error) {
        console.error('Failed to create payment record:', error);
        throw new Error('Database error: Failed to create payment record');
      }
    } catch (error) {
      console.error('Payment record creation error:', error);
      throw error;
    }
  }

  /**
   * Handle payment confirmation from webhook
   */
  async confirmRentalPayment(
    bookingId: string,
    paymobTransactionId: string,
    webhookData: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const isSuccessful = webhookData.success === true;
      const paymentStatus = isSuccessful ? 'paid' : 'failed';
      const bookingStatus = isSuccessful ? 'confirmed' : 'pending';

      // Update booking status
      const { error: bookingError } = await this.supabase
        .from('rental_bookings')
        .update({
          payment_status: paymentStatus,
          booking_status: bookingStatus,
          paymob_transaction_id: paymobTransactionId,
          paid_amount: isSuccessful ? webhookData.amount_cents / 100 : 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (bookingError) {
        throw new Error('Failed to update booking status');
      }

      // Update payment record
      const { error: paymentError } = await this.supabase
        .from('rental_payments')
        .update({
          status: paymentStatus,
          paymob_transaction_id: paymobTransactionId,
          payment_method: webhookData.source_data?.type || 'unknown',
          paid_at: isSuccessful ? new Date().toISOString() : null,
          metadata: {
            webhook_data: webhookData,
            processed_at: new Date().toISOString()
          }
        })
        .eq('booking_id', bookingId);

      if (paymentError) {
        console.error('Failed to update payment record:', paymentError);
      }

      // If payment successful, update calendar availability
      if (isSuccessful) {
        await this.updateCalendarAvailability(bookingId);
      }

      return { success: true };

    } catch (error: any) {
      console.error('Payment confirmation error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Update calendar availability after successful booking
   */
  private async updateCalendarAvailability(bookingId: string): Promise<void> {
    try {
      // Get booking details
      const { data: booking, error: bookingError } = await this.supabase
        .from('rental_bookings')
        .select('rental_listing_id, check_in_date, check_out_date')
        .eq('id', bookingId)
        .single();

      if (bookingError || !booking) {
        console.error('Failed to get booking details:', bookingError);
        return;
      }

      // Generate date range
      const checkInDate = new Date(booking.check_in_date);
      const checkOutDate = new Date(booking.check_out_date);
      const dates = [];

      for (let date = new Date(checkInDate); date < checkOutDate; date.setDate(date.getDate() + 1)) {
        dates.push({
          rental_listing_id: booking.rental_listing_id,
          date: date.toISOString().split('T')[0],
          is_available: false,
          booking_id: bookingId
        });
      }

      // Update calendar
      const { error: calendarError } = await this.supabase
        .from('rental_calendar')
        .upsert(dates, { onConflict: 'rental_listing_id,date' });

      if (calendarError) {
        console.error('Failed to update calendar:', calendarError);
      }
    } catch (error) {
      console.error('Calendar update error:', error);
    }
  }

  /**
   * Process refund for cancelled booking
   */
  async processRentalRefund(
    bookingId: string,
    refundAmount: number,
    reason: string = 'Booking cancellation'
  ): Promise<{ success: boolean; refund_id?: string; error?: string }> {
    try {
      // Get payment details
      const { data: payment, error: paymentError } = await this.supabase
        .from('rental_payments')
        .select('paymob_transaction_id, amount, status')
        .eq('booking_id', bookingId)
        .eq('status', 'paid')
        .single();

      if (paymentError || !payment) {
        return { success: false, error: 'Payment not found or not eligible for refund' };
      }

      // Process refund through Paymob
      const refundResponse = await paymobService.processRefund(
        payment.paymob_transaction_id,
        refundAmount,
        reason
      );

      // Update booking status
      const { error: updateError } = await this.supabase
        .from('rental_bookings')
        .update({
          booking_status: 'cancelled',
          refund_amount: refundAmount,
          refund_reason: reason,
          refunded_at: new Date().toISOString()
        })
        .eq('id', bookingId);

      if (updateError) {
        console.error('Failed to update booking after refund:', updateError);
      }

      // Free up calendar dates
      await this.freeCalendarDates(bookingId);

      return {
        success: true,
        refund_id: refundResponse.id || refundResponse.transaction_id
      };

    } catch (error: any) {
      console.error('Refund processing error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Free up calendar dates for cancelled booking
   */
  private async freeCalendarDates(bookingId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('rental_calendar')
        .update({ is_available: true, booking_id: null })
        .eq('booking_id', bookingId);

      if (error) {
        console.error('Failed to free calendar dates:', error);
      }
    } catch (error) {
      console.error('Calendar date freeing error:', error);
    }
  }

  /**
   * Get payment status for a booking
   */
  async getPaymentStatus(bookingId: string): Promise<{
    success: boolean;
    payment?: any;
    error?: string;
  }> {
    try {
      const { data: payment, error } = await this.supabase
        .from('rental_payments')
        .select('*')
        .eq('booking_id', bookingId)
        .single();

      if (error) {
        return { success: false, error: 'Payment record not found' };
      }

      return { success: true, payment };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

// Export singleton instance only if environment variables are available
export default process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ? new RentalPaymentService()
  : null;
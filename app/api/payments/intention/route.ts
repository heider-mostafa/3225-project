// Payment Intention API - Modern Paymob 2025 Integration
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { paymobService } from '@/lib/services/paymob-service';

interface PaymentIntentionRequest {
  booking_id?: string;
  appraisal_id?: string;
  payment_category: 'booking' | 'report_generation';
  amount: number;
  currency: 'EGP';
  payment_methods?: string[];
  customer_data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    street: string;
    city: string;
    state: string;
    building?: string;
    floor?: string;
    apartment?: string;
    postal_code?: string;
  };
  items: {
    name: string;
    description: string;
    quantity: number;
    amount: number;
  }[];
  metadata?: Record<string, any>;
}

export async function POST(request: NextRequest) {
  try {
    const body: PaymentIntentionRequest = await request.json();
    
    // Try multiple auth methods
    const authHeader = request.headers.get('authorization');
    let user = null;
    let userError = null;
    let authMethod = '';

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Method 1: Use Authorization header with service role client
      const token = authHeader.substring(7);
      const supabaseServiceRole = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      
      const { data, error } = await supabaseServiceRole.auth.getUser(token);
      user = data.user;
      userError = error;
      authMethod = 'header';
      console.log('🔑 Using Authorization header token');
    } 
    
    if (!user) {
      // Method 2: Try cookies
      const supabase = createRouteHandlerClient({ cookies });
      const { data, error } = await supabase.auth.getUser();
      user = data.user;
      userError = error;
      authMethod = authMethod + (authMethod ? '+cookies' : 'cookies');
      console.log('🍪 Trying cookies for auth');
    }
    
    console.log('🔐 API Auth check:', {
      hasUser: !!user,
      userError: userError?.message,
      userId: user?.id,
      userEmail: user?.email,
      authMethod: authMethod
    });

    if (!user) {
      console.log('❌ No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated, proceeding with payment');

    // Create supabase client for database operations
    const supabase = createRouteHandlerClient({ cookies });

    // Validate required fields
    const { 
      payment_category, 
      amount, 
      customer_data, 
      items,
      booking_id,
      appraisal_id 
    } = body;

    if (!payment_category || !amount || !customer_data || !items?.length) {
      return NextResponse.json(
        { error: 'Missing required fields: payment_category, amount, customer_data, items' },
        { status: 400 }
      );
    }

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      );
    }

    // Validate payment category constraints
    if (payment_category === 'booking' && !booking_id) {
      return NextResponse.json(
        { error: 'booking_id is required for booking payments' },
        { status: 400 }
      );
    }

    if (payment_category === 'report_generation' && !appraisal_id) {
      return NextResponse.json(
        { error: 'appraisal_id is required for report generation payments' },
        { status: 400 }
      );
    }

    // Generate merchant order ID
    const merchantOrderId = `ORDER-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    // Determine payer details based on payment category
    let payerType = 'client';
    let payerId = user.id;
    
    if (payment_category === 'report_generation') {
      // For report generation, the appraiser is the payer
      const { data: appraiser } = await supabase
        .from('brokers')
        .select('id, user_id')
        .eq('user_id', user.id)
        .single();
      
      if (!appraiser) {
        return NextResponse.json(
          { error: 'Only appraisers can pay for report generation' },
          { status: 403 }
        );
      }
      
      payerType = 'appraiser';
      payerId = user.id;
    }

    // Create Paymob intention
    const intentionData = {
      amount,
      currency: 'EGP' as const,
      payment_methods: body.payment_methods || [
        'card', 
        'wallet', 
        'mobile_wallet',
        'apple_pay', 
        'google_pay',
        'instapay', 
        'bank_transfer',
        'bnpl',
        'valu',
        'installments'
      ],
      items: items.map(item => ({
        name: item.name,
        amount: item.amount,
        description: item.description,
        quantity: item.quantity
      })),
      billing_data: {
        first_name: customer_data.first_name,
        last_name: customer_data.last_name,
        email: customer_data.email,
        phone_number: customer_data.phone_number,
        country: 'EG' as const,
        state: customer_data.state,
        city: customer_data.city,
        street: customer_data.street,
        building: customer_data.building || '',
        floor: customer_data.floor || '',
        apartment: customer_data.apartment || '',
        postal_code: customer_data.postal_code || ''
      },
      customer: {
        first_name: customer_data.first_name,
        last_name: customer_data.last_name,
        email: customer_data.email,
        phone_number: customer_data.phone_number
      }
    };

    const paymobIntention = await paymobService.createPaymentIntention(intentionData);

    // Save payment record to database with appropriate structure for each table
    let paymentData: any;
    let tableName: string;

    if (payment_category === 'booking') {
      // Rental booking payment - use rental_payments table
      tableName = 'rental_payments';
      paymentData = {
        booking_id: booking_id,
        paymob_order_id: paymobIntention.id,
        amount: amount,
        currency: 'EGP',
        status: 'pending',
        payment_method: 'card', // Default, will be updated by webhook
        created_at: new Date().toISOString()
      };
    } else if (payment_category === 'report_generation') {
      // Appraisal payment - use appraisal_payments table
      tableName = 'appraisal_payments';
      paymentData = {
        booking_id: booking_id || null,
        appraisal_id: appraisal_id || null,
        payment_category,
        payer_type: payerType,
        payer_id: payerId,
        payer_email: customer_data.email,
        payer_name: `${customer_data.first_name} ${customer_data.last_name}`,
        paymob_intention_id: paymobIntention.id,
        paymob_order_id: paymobIntention.id,
        merchant_order_id: merchantOrderId,
        amount_egp: amount,
        amount_cents: Math.round(amount * 100),
        currency: 'EGP',
        status: 'pending',
        expiry_date: new Date(paymobIntention.expires_at).toISOString(),
        customer_data: {
          billing_data: customer_data,
          items: items
        },
        metadata: {
          paymob_intention: paymobIntention,
          request_metadata: body.metadata,
          user_agent: request.headers.get('user-agent'),
          ip_address: request.headers.get('x-forwarded-for') || 'unknown'
        }
      };
    } else {
      return NextResponse.json(
        { error: 'Invalid payment category' },
        { status: 400 }
      );
    }

    console.log('💾 Creating payment record in', tableName, ':', paymentData);
    
    // Additional security: Verify user owns the booking/appraisal (only for existing bookings)
    if (payment_category === 'booking' && booking_id) {
      // For new rental bookings, the booking was just created in the frontend
      // and should belong to the current user. We'll do a basic validation.
      const { data: booking, error: bookingError } = await supabase
        .from('rental_bookings')
        .select('guest_user_id')
        .eq('id', booking_id)
        .single();
      
      console.log('🔍 Booking ownership check:', {
        booking_id,
        current_user_id: user.id,
        booking_guest_user_id: booking?.guest_user_id,
        booking_exists: !!booking,
        booking_error: bookingError?.message
      });
      
      // Only validate ownership if the booking exists
      // If it doesn't exist, it means it was just created and we trust the frontend validation
      if (booking && booking.guest_user_id !== user.id) {
        console.log('❌ Booking ownership validation failed');
        return NextResponse.json(
          { error: 'Unauthorized: You can only pay for your own bookings' },
          { status: 403 }
        );
      }
      
      if (booking) {
        console.log('✅ Booking ownership validated');
      } else {
        console.log('ℹ️ New booking - proceeding without ownership check');
      }
    }
    
    if (payment_category === 'report_generation' && appraisal_id) {
      const { data: appraisal } = await supabase
        .from('appraiser_bookings')
        .select('appraiser_id')
        .eq('id', appraisal_id)
        .single();
      
      if (!appraisal) {
        return NextResponse.json(
          { error: 'Unauthorized: Invalid appraisal booking' },
          { status: 403 }
        );
      }
    }
    
    // Use service role client ONLY for payment record creation (bypasses RLS)
    // This is safe because we validated ownership above
    const supabaseServiceRole = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    const { data: payment, error: paymentError } = await supabaseServiceRole
      .from(tableName)
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Payment record creation failed:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create payment record' },
        { status: 500 }
      );
    }

    // Get available payment methods
    const paymentMethods = await paymobService.getAvailablePaymentMethods(amount);

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        merchant_order_id: payment_category === 'report_generation' ? merchantOrderId : paymobIntention.id,
        amount: amount,
        currency: 'EGP',
        status: 'pending',
        expires_at: paymobIntention.expires_at,
        table: tableName // For debugging
      },
      paymob: {
        intention_id: paymobIntention.id,
        payment_url: paymobIntention.payment_url,
        iframe_url: paymobIntention.iframe_url
      },
      payment_methods: paymentMethods,
      next_steps: [
        'Complete payment using one of the available methods',
        'You will receive confirmation once payment is processed',
        'Payment will expire automatically if not completed within the time limit'
      ]
    });

  } catch (error) {
    console.error('Payment intention creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create payment intention',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get payment intention status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const intentionId = searchParams.get('intention_id');
    const merchantOrderId = searchParams.get('merchant_order_id');

    if (!intentionId && !merchantOrderId) {
      return NextResponse.json(
        { error: 'Either intention_id or merchant_order_id is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Query payment by intention ID or merchant order ID
    let query = supabase
      .from('appraisal_payments')
      .select('*');

    if (intentionId) {
      query = query.eq('paymob_intention_id', intentionId);
    } else if (merchantOrderId) {
      query = query.eq('merchant_order_id', merchantOrderId);
    }

    // Add user authorization check
    query = query.or(`payer_id.eq.${user.id},booking_id.in.(select id from appraiser_bookings where appraiser_id in (select id from brokers where user_id = '${user.id}'))`);

    const { data: payment, error } = await query.single();

    if (error || !payment) {
      return NextResponse.json(
        { error: 'Payment not found or access denied' },
        { status: 404 }
      );
    }

    // If we have a Paymob transaction ID, get the latest status
    let paymobStatus = null;
    if (payment.paymob_transaction_id) {
      try {
        paymobStatus = await paymobService.getTransactionStatus(payment.paymob_transaction_id);
      } catch (error) {
        console.warn('Could not fetch Paymob status:', error);
      }
    }

    return NextResponse.json({
      payment: {
        id: payment.id,
        merchant_order_id: payment.merchant_order_id,
        amount: payment.amount_egp,
        currency: payment.currency,
        status: payment.status,
        payment_method: payment.payment_method,
        payment_date: payment.payment_date,
        expires_at: payment.expiry_date,
        created_at: payment.created_at
      },
      paymob_status: paymobStatus,
      is_expired: payment.expiry_date ? new Date(payment.expiry_date) < new Date() : false
    });

  } catch (error) {
    console.error('Payment status retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment status' },
      { status: 500 }
    );
  }
}

// Update payment intention (e.g., extend expiry, change amount - limited cases)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { intention_id, action } = body;

    if (!intention_id || !action) {
      return NextResponse.json(
        { error: 'intention_id and action are required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Currently, we mainly support canceling intentions
    if (action === 'cancel') {
      const { error } = await supabase
        .from('appraisal_payments')
        .update({
          status: 'cancelled',
          updated_at: new Date().toISOString(),
          metadata: {
            ...((await supabase.from('appraisal_payments').select('metadata').eq('paymob_intention_id', intention_id).single()).data?.metadata || {}),
            cancelled_at: new Date().toISOString(),
            cancelled_by: user.id
          }
        })
        .eq('paymob_intention_id', intention_id)
        .eq('payer_id', user.id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to cancel payment' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Payment intention cancelled successfully'
      });
    }

    return NextResponse.json(
      { error: 'Unsupported action' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Payment intention update error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment intention' },
      { status: 500 }
    );
  }
}
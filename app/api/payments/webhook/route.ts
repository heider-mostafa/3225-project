// Paymob Webhook Handler with Enhanced Security
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { paymobService } from '@/lib/services/paymob-service';

// Initialize Supabase with service role key for webhook processing
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('x-paymob-signature') || '';
    
    let webhookData;
    try {
      webhookData = JSON.parse(body);
    } catch (error) {
      console.error('Invalid JSON in webhook body');
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Log webhook receipt
    console.log(`Received Paymob webhook: ${webhookData.type || 'unknown'} for transaction ${webhookData.id}`);

    // Store webhook in logs table first
    const { data: logEntry, error: logError } = await supabase
      .from('paymob_webhook_logs')
      .insert({
        paymob_transaction_id: webhookData.id?.toString(),
        paymob_order_id: webhookData.order?.id?.toString(),
        webhook_type: webhookData.type || 'transaction',
        event_type: webhookData.success ? 'payment.success' : 'payment.failed',
        raw_data: webhookData,
        signature_verified: false,
        processed: false,
        processing_attempts: 0
      })
      .select()
      .single();

    if (logError) {
      console.error('Failed to log webhook:', logError);
    }

    // Process webhook with signature verification
    let processed = false;
    try {
      processed = await paymobService.handleWebhook(webhookData, signature);
    } catch (error) {
      console.error('Webhook processing error:', error);
      
      // Update log with error
      if (logEntry) {
        await supabase
          .from('paymob_webhook_logs')
          .update({
            processing_attempts: 1,
            last_processing_error: error instanceof Error ? error.message : 'Unknown error',
            processed: false
          })
          .eq('id', logEntry.id);
      }
      
      return NextResponse.json(
        { error: 'Webhook processing failed' },
        { status: 500 }
      );
    }

    // Update log with processing result
    if (logEntry) {
      await supabase
        .from('paymob_webhook_logs')
        .update({
          signature_verified: true,
          processed,
          processing_attempts: 1,
          processed_at: new Date().toISOString()
        })
        .eq('id', logEntry.id);
    }

    if (!processed) {
      console.error('Webhook processing returned false');
      return NextResponse.json(
        { error: 'Failed to process webhook' },
        { status: 400 }
      );
    }

    // Additional processing based on webhook type
    await processWebhookActions(webhookData);

    console.log(`Webhook processed successfully for transaction ${webhookData.id}`);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json(
      { 
        error: 'Internal webhook processing error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Process additional actions based on webhook data
async function processWebhookActions(webhookData: any) {
  try {
    const transactionId = webhookData.id?.toString();
    const merchantOrderId = webhookData.order?.merchant_order_id;
    const isSuccessful = webhookData.success;

    if (!merchantOrderId) {
      console.warn('No merchant order ID in webhook data');
      return;
    }

    // Get payment record
    const { data: payment, error } = await supabase
      .from('appraisal_payments')
      .select(`
        *,
        appraiser_bookings:booking_id(id, appraiser_id, client_email, client_name),
        property_appraisals:appraisal_id(id, appraiser_id)
      `)
      .eq('merchant_order_id', merchantOrderId)
      .single();

    if (error || !payment) {
      console.error('Payment not found for webhook:', error);
      return;
    }

    if (isSuccessful && payment.status !== 'paid') {
      // Payment successful - trigger completion actions
      await handleSuccessfulPayment(payment);
    } else if (!isSuccessful && payment.status === 'pending') {
      // Payment failed - handle failure
      await handleFailedPayment(payment);
    }

  } catch (error) {
    console.error('Webhook action processing error:', error);
  }
}

// Handle successful payment completion
async function handleSuccessfulPayment(payment: any) {
  try {
    console.log(`Processing successful payment for ${payment.payment_category}: ${payment.id}`);

    if (payment.payment_category === 'booking') {
      // Update booking status to confirmed if it was pending payment
      if (payment.appraiser_bookings) {
        await supabase
          .from('appraiser_bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.booking_id);

        // Send confirmation notifications
        await sendBookingConfirmationNotification(payment);
      }
    } else if (payment.payment_category === 'report_generation') {
      // For report generation payments, trigger report generation process
      if (payment.property_appraisals) {
        await triggerReportGeneration(payment);
      }
    }

    // Update payment history summary for customer
    await updateCustomerPaymentHistory(payment);

  } catch (error) {
    console.error('Successful payment handling error:', error);
  }
}

// Handle failed payment
async function handleFailedPayment(payment: any) {
  try {
    console.log(`Processing failed payment for ${payment.payment_category}: ${payment.id}`);

    if (payment.payment_category === 'booking') {
      // Update booking status
      if (payment.appraiser_bookings) {
        await supabase
          .from('appraiser_bookings')
          .update({
            payment_status: 'failed',
            status: 'payment_failed',
            updated_at: new Date().toISOString()
          })
          .eq('id', payment.booking_id);

        // Send payment failure notification
        await sendPaymentFailureNotification(payment);
      }
    } else if (payment.payment_category === 'report_generation') {
      // For report generation, mark transaction as failed
      await supabase
        .from('report_generation_transactions')
        .update({
          generation_status: 'failed',
          error_message: 'Payment failed',
          updated_at: new Date().toISOString()
        })
        .eq('payment_id', payment.id);
    }

  } catch (error) {
    console.error('Failed payment handling error:', error);
  }
}

// Send booking confirmation notification
async function sendBookingConfirmationNotification(payment: any) {
  try {
    const { notificationService } = require('@/lib/services/notification-service');
    
    console.log(`Sending booking confirmation for payment ${payment.id}`);
    
    // Send notification using the notification service
    await notificationService.notifyBookingPaymentConfirmation(payment);
  } catch (error) {
    console.error('Booking confirmation notification error:', error);
  }
}

// Send payment failure notification
async function sendPaymentFailureNotification(payment: any) {
  try {
    const { notificationService } = require('@/lib/services/notification-service');
    
    console.log(`Sending payment failure notification for payment ${payment.id}`);
    
    // Send notification using the notification service
    await notificationService.notifyPaymentFailure(payment);
  } catch (error) {
    console.error('Payment failure notification error:', error);
  }
}

// Trigger report generation after successful payment
async function triggerReportGeneration(payment: any) {
  try {
    console.log(`Triggering report generation for payment ${payment.id}`);

    // Update report generation transaction
    await supabase
      .from('report_generation_transactions')
      .update({
        generation_status: 'processing',
        updated_at: new Date().toISOString()
      })
      .eq('payment_id', payment.id);

    // Here you would trigger the actual report generation process
    // This could be a queue job, background task, etc.
    // await reportGenerationQueue.add('generate-report', {
    //   appraisal_id: payment.appraisal_id,
    //   payment_id: payment.id
    // });

  } catch (error) {
    console.error('Report generation trigger error:', error);
  }
}

// Update customer payment history
async function updateCustomerPaymentHistory(payment: any) {
  try {
    const { data: profile } = await supabase
      .from('customer_payment_profiles')
      .select('*')
      .eq('customer_email', payment.payer_email)
      .single();

    const currentHistory = profile?.payment_history_summary || {};
    const newHistory = {
      ...currentHistory,
      total_payments: (currentHistory.total_payments || 0) + 1,
      total_amount: (currentHistory.total_amount || 0) + payment.amount_egp,
      last_payment_date: new Date().toISOString(),
      payment_methods_used: [
        ...(currentHistory.payment_methods_used || []),
        payment.payment_method
      ].filter((value, index, self) => self.indexOf(value) === index)
    };

    await supabase
      .from('customer_payment_profiles')
      .upsert({
        customer_email: payment.payer_email,
        payment_history_summary: newHistory,
        updated_at: new Date().toISOString()
      }, { onConflict: 'customer_email' });

  } catch (error) {
    console.error('Customer history update error:', error);
  }
}

// GET method for webhook verification (some providers use this)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return new Response(challenge);
  }
  
  return NextResponse.json({ 
    status: 'Webhook endpoint active',
    timestamp: new Date().toISOString()
  });
}
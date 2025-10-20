// Payment Status Check API
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('payment_id');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabaseClient();

    // Get current user for security
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get payment record and related transaction
    const { data: payment, error: paymentError } = await supabase
      .from('appraisal_payments')
      .select(`
        id,
        status,
        paymob_status,
        amount_egp,
        currency,
        payment_date,
        payer_id,
        payment_category,
        metadata,
        appraisal_id
      `)
      .eq('id', paymentId)
      .eq('payer_id', user.id) // Security: only allow user to check their own payments
      .single();

    if (paymentError || !payment) {
      return NextResponse.json(
        { error: 'Payment not found or access denied' },
        { status: 404 }
      );
    }

    // Check if this is a report generation payment
    let reportStatus = null;
    if (payment.payment_category === 'report_generation' && payment.appraisal_id) {
      const { data: transaction } = await supabase
        .from('report_generation_transactions')
        .select('generation_status, report_url, error_message')
        .eq('payment_id', paymentId)
        .single();

      if (transaction) {
        reportStatus = {
          generation_status: transaction.generation_status,
          report_url: transaction.report_url,
          error_message: transaction.error_message,
          ready_for_download: transaction.generation_status === 'completed' && transaction.report_url
        };
      }
    }

    // Determine overall status
    let overallStatus = 'pending';
    if (payment.status === 'paid' || payment.paymob_status === 'paid') {
      if (payment.payment_category === 'report_generation') {
        if (reportStatus?.generation_status === 'completed') {
          overallStatus = 'completed';
        } else if (reportStatus?.generation_status === 'failed') {
          overallStatus = 'failed';
        } else {
          overallStatus = 'processing';
        }
      } else {
        overallStatus = 'completed';
      }
    } else if (payment.status === 'failed' || payment.paymob_status === 'failed') {
      overallStatus = 'failed';
    }

    return NextResponse.json({
      success: true,
      payment_id: payment.id,
      status: overallStatus,
      payment_status: payment.status,
      paymob_status: payment.paymob_status,
      amount: payment.amount_egp,
      currency: payment.currency,
      payment_date: payment.payment_date,
      category: payment.payment_category,
      report: reportStatus
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to check payment status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
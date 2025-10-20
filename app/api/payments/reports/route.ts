// Report Generation Payment API
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { paymobService } from '@/lib/services/paymob-service';

interface ReportPaymentRequest {
  appraisal_id: string;
  report_type: 'standard' | 'detailed' | 'comprehensive';
  rush_delivery: boolean;
  additional_services: string[];
  use_free_quota?: boolean;
}

// POST: Create payment for report generation
export async function POST(request: NextRequest) {
  try {
    const body: ReportPaymentRequest = await request.json();
    
    console.log('🔐 Payment API - Request Debug:', {
      hasBody: !!body,
      appraisalId: body.appraisal_id,
      simplified: request.headers.get('x-simplified-mode'),
      userAgent: request.headers.get('user-agent')
    });

    const supabase = await createServerSupabaseClient();

    // Get current user
    console.log('🔍 Payment API - Getting user session...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    console.log('🔍 Payment API - Auth result:', {
      hasUser: !!user,
      userEmail: user?.email,
      authError: authError?.message,
      authErrorCode: authError?.status
    });
    
    if (!user) {
      console.log('❌ Payment API - No authenticated user found');
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Validate required fields
    const { appraisal_id, report_type, rush_delivery, additional_services, use_free_quota } = body;

    if (!appraisal_id || !report_type) {
      return NextResponse.json(
        { error: 'Missing required fields: appraisal_id, report_type' },
        { status: 400 }
      );
    }

    // Try to get appraiser details (for appraiser-generated reports)
    const { data: appraiser } = await supabase
      .from('brokers')
      .select('id, full_name, email, appraiser_tier, phone')
      .eq('user_id', user.id)
      .eq('role', 'appraiser')
      .single();

    // Get user profile data for billing (needed for market intelligence purchases)
    const { data: userProfile } = await supabase
      .from('user_profiles')
      .select('full_name, phone')
      .eq('user_id', user.id)
      .single();

    console.log('👤 User profile data:', userProfile);
    console.log('👤 Appraiser data:', appraiser);

    // Get appraisal details
    const { data: appraisal, error: appraisalError } = await supabase
      .from('property_appraisals')
      .select('id, appraiser_id, property_id, status')
      .eq('id', appraisal_id)
      .single();

    if (appraisalError || !appraisal) {
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      );
    }

    // For market intelligence purchases, allow any authenticated user
    // For appraiser-generated reports, check ownership
    if (appraiser && appraisal.appraiser_id !== appraiser.id) {
      return NextResponse.json(
        { error: 'Access denied to this appraisal' },
        { status: 403 }
      );
    }


    if (appraisal.status !== 'completed') {
      return NextResponse.json(
        { error: 'Can only generate reports for completed appraisals' },
        { status: 400 }
      );
    }

    // Check if report generation is already in progress or completed
    // Only for appraiser-generated reports (not market intelligence purchases)
    if (appraiser) {
      const { data: existingTransaction } = await supabase
        .from('report_generation_transactions')
        .select('*')
        .eq('appraisal_id', appraisal_id)
        .eq('appraiser_id', appraiser.id) // Only check for same appraiser
        .in('generation_status', ['pending', 'processing', 'completed'])
        .single();

      if (existingTransaction) {
        return NextResponse.json(
          { error: 'Report generation already in progress or completed for this appraisal' },
          { status: 409 }
        );
      }
    }
    // For market intelligence purchases (no appraiser), allow multiple downloads

    // Calculate fees using database function
    const appraiserTier = appraiser?.appraiser_tier || 'basic';
    console.log('💰 Fee calculation params:', {
      p_report_type: report_type,
      p_appraiser_tier: appraiserTier,
      p_rush_delivery: rush_delivery,
      p_additional_services: additional_services
    });
    
    const { data: feeCalculationResult, error: feeError } = await supabase
      .rpc('calculate_report_fees', {
        p_report_type: report_type,
        p_appraiser_tier: appraiserTier,
        p_rush_delivery: rush_delivery,
        p_additional_services: additional_services
      });

    let feeCalculation = feeCalculationResult;

    if (feeError || !feeCalculation || feeCalculation.total_fee === null) {
      console.error('Fee calculation error:', feeError);
      console.log('📋 Using fallback pricing structure');
      
      // Fallback pricing structure
      const fallbackPricing = {
        standard: { base_fee: 50, rush_multiplier: 1.5 },
        detailed: { base_fee: 100, rush_multiplier: 1.5 },
        comprehensive: { base_fee: 200, rush_multiplier: 1.5 }
      };
      
      const baseFee = fallbackPricing[report_type as keyof typeof fallbackPricing]?.base_fee || 50;
      const rushFee = rush_delivery ? Math.round(baseFee * 0.5) : 0;
      const totalFee = baseFee + rushFee;
      
      feeCalculation = {
        base_fee: baseFee,
        rush_fee: rushFee,
        service_fees: 0,
        total_fee: totalFee,
        currency: 'EGP'
      };
      
      console.log('💰 Using fallback pricing:', feeCalculation);
    }

    console.log('💰 Fee calculation result:', feeCalculation);
    const totalFee = feeCalculation.total_fee;
    console.log('💰 Total fee for payment:', totalFee, 'EGP');

    // Check if using free monthly quota
    if (use_free_quota) {
      // Check monthly quota availability
      const quotaLimits = {
        basic: 2,
        premium: 10,
        enterprise: 50
      };
      
      const monthlyLimit = quotaLimits[appraiser?.appraiser_tier as keyof typeof quotaLimits] || quotaLimits.basic;
      
      // Get usage for current month
      const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
      const startOfMonth = `${currentMonth}-01T00:00:00.000Z`;
      const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

      const { data: monthlyUsage } = await supabase
        .from('report_generation_transactions')
        .select('id')
        .eq('appraiser_id', appraiser?.id)
        .eq('generation_method', 'free_quota')
        .gte('created_at', startOfMonth)
        .lt('created_at', endOfMonth);

      const usedThisMonth = monthlyUsage?.length || 0;
      const remainingQuota = Math.max(0, monthlyLimit - usedThisMonth);

      if (remainingQuota < 1) {
        return NextResponse.json(
          { 
            error: 'Monthly quota exhausted',
            quota_used: usedThisMonth,
            quota_limit: monthlyLimit,
            pricing: feeCalculation,
            message: 'Your monthly free quota is exhausted. Payment required for additional reports.'
          },
          { status: 402 }
        );
      }

      // Use free quota
      return await processReportWithQuota(
        supabase, 
        appraisal, 
        appraiser, 
        report_type, 
        rush_delivery, 
        additional_services
      );

    } else {
      // Create payment intention
      return await createReportPaymentIntention(
        supabase,
        appraisal,
        appraiser,
        user,
        userProfile,
        report_type,
        rush_delivery,
        additional_services,
        feeCalculation
      );
    }

  } catch (error) {
    console.error('Report payment creation error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create report payment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// GET: Get report generation pricing
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('report_type') || 'standard';
    const appraiserTier = searchParams.get('appraiser_tier') || 'basic';
    const rushDelivery = searchParams.get('rush_delivery') === 'true';
    const additionalServices = searchParams.get('additional_services')?.split(',') || [];

    const supabase = await createServerSupabaseClient();

    // Calculate fees
    const { data: feeCalculation, error } = await supabase
      .rpc('calculate_report_fees', {
        p_report_type: reportType,
        p_appraiser_tier: appraiserTier,
        p_rush_delivery: rushDelivery,
        p_additional_services: additionalServices
      });

    if (error) {
      console.error('Fee calculation error:', error);
      return NextResponse.json(
        { error: 'Failed to calculate fees' },
        { status: 500 }
      );
    }

    // Get available services
    const { data: pricingData } = await supabase
      .from('report_generation_pricing')
      .select('additional_services')
      .eq('report_type', reportType)
      .eq('appraiser_tier', appraiserTier)
      .eq('is_active', true)
      .single();

    return NextResponse.json({
      report_type: reportType,
      appraiser_tier: appraiserTier,
      pricing: feeCalculation,
      available_services: pricingData?.additional_services || {},
      rush_delivery_multiplier: 1.5
    });

  } catch (error) {
    console.error('Pricing retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve pricing' },
      { status: 500 }
    );
  }
}

// Process report generation using free monthly quota
async function processReportWithQuota(
  supabase: any,
  appraisal: any,
  appraiser: any,
  reportType: string,
  rushDelivery: boolean,
  additionalServices: string[]
) {
  try {
    // Create report generation transaction
    const transactionData = {
      appraisal_id: appraisal.id,
      appraiser_id: appraiser?.id || null,
      report_type: reportType,
      generation_method: 'free_quota',
      base_fee_egp: 0,
      rush_fee_egp: 0,
      additional_services_fee_egp: 0,
      total_fee_egp: 0,
      credits_used: 0,
      additional_services: additionalServices,
      generation_status: 'pending'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('report_generation_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      throw new Error('Failed to create report transaction');
    }

    // Start report generation process
    await startReportGeneration(transaction.id);

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      method: 'free_quota',
      message: 'Report generation started using your monthly quota',
      status: 'processing'
    });

  } catch (error) {
    console.error('Quota processing error:', error);
    throw error;
  }
}

// Create payment intention for report
async function createReportPaymentIntention(
  supabase: any,
  appraisal: any,
  appraiser: any,
  user: any,
  userProfile: any,
  reportType: string,
  rushDelivery: boolean,
  additionalServices: string[],
  feeCalculation: any
) {
  try {
    const totalAmount = feeCalculation.total_fee;
    console.log('💰 Payment creation - fee calculation:', feeCalculation);
    console.log('💰 Payment creation - total amount:', totalAmount);

    // Create report generation transaction (pending payment)
    const transactionData = {
      appraisal_id: appraisal.id,
      appraiser_id: appraiser?.id || null,
      report_type: reportType,
      generation_method: 'paid',
      base_fee_egp: feeCalculation.base_fee,
      rush_fee_egp: feeCalculation.rush_fee,
      additional_services_fee_egp: feeCalculation.service_fees,
      total_fee_egp: totalAmount,
      credits_used: 0,
      additional_services: additionalServices,
      generation_status: 'pending'
    };

    const { data: transaction, error: transactionError } = await supabase
      .from('report_generation_transactions')
      .insert(transactionData)
      .select()
      .single();

    if (transactionError) {
      throw new Error('Failed to create report transaction');
    }

    // Create Paymob payment intention
    const intentionData = {
      amount: totalAmount,
      currency: 'EGP' as const,
      payment_methods: ['card', 'wallet', 'instapay'],
      items: [{
        name: `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Appraisal Report`,
        description: `Professional property appraisal report generation${rushDelivery ? ' (Rush Delivery)' : ''}`,
        quantity: 1,
        amount: totalAmount
      }],
      billing_data: {
        first_name: appraiser?.full_name?.split(' ')[0] || userProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Customer',
        last_name: appraiser?.full_name?.split(' ').slice(1).join(' ') || userProfile?.full_name?.split(' ').slice(1).join(' ') || 'User',
        email: appraiser?.email || user.email || '',
        phone_number: appraiser?.phone || userProfile?.phone || '01000000000',
        country: 'EG' as const,
        state: 'Cairo',
        city: 'Cairo',
        street: 'N/A'
      },
      customer: {
        first_name: appraiser?.full_name?.split(' ')[0] || userProfile?.full_name?.split(' ')[0] || user.email?.split('@')[0] || 'Customer',
        last_name: appraiser?.full_name?.split(' ').slice(1).join(' ') || userProfile?.full_name?.split(' ').slice(1).join(' ') || 'User',
        email: appraiser?.email || user.email || '',
        phone_number: appraiser?.phone || userProfile?.phone || '01000000000'
      }
    };

    console.log('💰 Sending to Paymob - intention data:', JSON.stringify(intentionData, null, 2));
    const paymobIntention = await paymobService.createPaymentIntention(intentionData);

    // Create payment record
    const merchantOrderId = `REPORT-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const paymentData = {
      appraisal_id: appraisal.id,
      payment_category: 'report_generation',
      payer_type: appraiser ? 'appraiser' : 'customer',
      payer_id: user.id,
      payer_email: appraiser?.email || user.email || '',
      payer_name: appraiser?.full_name || user.email?.split('@')[0] || 'Customer',
      paymob_intention_id: paymobIntention.id,
      paymob_order_id: paymobIntention.id,
      merchant_order_id: merchantOrderId,
      amount_egp: totalAmount,
      amount_cents: Math.round(totalAmount * 100),
      currency: 'EGP',
      status: 'pending',
      expiry_date: new Date(paymobIntention.expires_at).toISOString(),
      customer_data: {
        billing_data: intentionData.billing_data,
        items: intentionData.items
      },
      metadata: {
        transaction_id: transaction.id,
        report_type: reportType,
        rush_delivery: rushDelivery,
        additional_services: additionalServices
      }
    };

    console.log('💳 Creating payment record with data:', paymentData);
    
    // Try to create payment record with detailed error handling
    const { data: paymentResult, error: paymentError } = await supabase
      .from('appraisal_payments')
      .insert(paymentData)
      .select()
      .single();

    let payment = paymentResult;

    if (paymentError) {
      console.error('💥 Payment record creation failed:', paymentError);
      console.error('💥 Full error details:', JSON.stringify(paymentError, null, 2));
      
      // If RLS policy fails, try to create a simplified record
      if (paymentError.code === '42501') {
        console.log('🔄 Attempting simplified payment record creation...');
        const simplifiedPaymentData = {
          payer_id: user.id,
          amount_egp: totalAmount,
          currency: 'EGP',
          status: 'pending',
          payment_category: 'report_generation',
          merchant_order_id: merchantOrderId,
          paymob_intention_id: paymobIntention.id
        };
        
        const { data: simplePayment, error: simpleError } = await supabase
          .from('appraisal_payments')
          .insert(simplifiedPaymentData)
          .select()
          .single();
          
        if (simpleError) {
          console.error('💥 Simplified payment creation also failed:', simpleError);
          throw new Error(`Payment creation failed: ${simpleError.message}`);
        }
        
        console.log('✅ Simplified payment record created');
        payment = simplePayment;
      } else {
        throw new Error(`Failed to create payment record: ${paymentError.message}`);
      }
    }

    // Update transaction with payment ID
    await supabase
      .from('report_generation_transactions')
      .update({ payment_id: payment.id })
      .eq('id', transaction.id);

    return NextResponse.json({
      success: true,
      transaction_id: transaction.id,
      payment: {
        id: payment.id,
        merchant_order_id: merchantOrderId,
        amount: totalAmount,
        currency: 'EGP',
        expires_at: paymobIntention.expires_at
      },
      paymob: {
        intention_id: paymobIntention.id,
        payment_url: paymobIntention.payment_url,
        iframe_url: paymobIntention.iframe_url
      },
      pricing: feeCalculation,
      message: 'Payment created for report generation'
    });

  } catch (error) {
    console.error('Payment intention creation error:', error);
    throw error;
  }
}

// Start report generation process
async function startReportGeneration(transactionId: string) {
  // This would trigger the actual report generation
  // Could be a background job, queue, or direct API call
  console.log(`Starting report generation for transaction ${transactionId}`);
  
  // For now, we'll just log it
  // In a real implementation, this would:
  // 1. Queue a background job
  // 2. Call the report generation service
  // 3. Update the transaction status
}
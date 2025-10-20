// Appraiser Credits Management API
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { paymobService } from '@/lib/services/paymob-service';

// GET: Get appraiser credit balance and history
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Get appraiser details
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, full_name, appraiser_tier')
      .eq('user_id', user.id)
      .eq('role', 'appraiser')
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Only appraisers can access credits' },
        { status: 403 }
      );
    }

    // Get current credits
    const { data: credits, error: creditsError } = await supabase
      .from('appraiser_report_credits')
      .select('*')
      .eq('appraiser_id', appraiser.id)
      .order('created_at', { ascending: false });

    if (creditsError) {
      console.error('Credits fetch error:', creditsError);
      return NextResponse.json(
        { error: 'Failed to fetch credits' },
        { status: 500 }
      );
    }

    // Calculate totals
    const activeCredits = credits?.filter(credit => 
      credit.credits_available > 0 && 
      (!credit.expires_at || new Date(credit.expires_at) > new Date())
    ) || [];

    const totalAvailable = activeCredits.reduce((sum, credit) => sum + credit.credits_available, 0);
    const totalUsed = credits?.reduce((sum, credit) => sum + credit.credits_used, 0) || 0;

    // Get monthly quota info
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const monthlyQuota = credits?.find(credit => 
      credit.credit_type === 'monthly_quota' && 
      credit.created_at.startsWith(currentMonth)
    );

    // Get usage history for current month
    const { data: usageHistory } = await supabase
      .from('report_generation_transactions')
      .select(`
        id,
        report_type,
        generation_method,
        credits_used,
        created_at,
        generation_status
      `)
      .eq('appraiser_id', appraiser.id)
      .gte('created_at', `${currentMonth}-01`)
      .order('created_at', { ascending: false });

    // Calculate credit packages pricing
    const creditPackages = getCreditPackages(appraiser.appraiser_tier);

    return NextResponse.json({
      appraiser: {
        id: appraiser.id,
        name: appraiser.full_name,
        tier: appraiser.appraiser_tier
      },
      credits: {
        available: totalAvailable,
        used_total: totalUsed,
        monthly_quota: monthlyQuota ? {
          total: monthlyQuota.credits_total,
          used: monthlyQuota.credits_used,
          available: monthlyQuota.credits_available,
          expires_at: monthlyQuota.expires_at
        } : null,
        purchased_credits: activeCredits.filter(c => c.credit_type === 'purchased_credits'),
        bonus_credits: activeCredits.filter(c => c.credit_type === 'bonus_credits')
      },
      usage_history: usageHistory || [],
      credit_packages: creditPackages,
      next_quota_date: getNextQuotaDate()
    });

  } catch (error) {
    console.error('Credits retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve credits' },
      { status: 500 }
    );
  }
}

// POST: Purchase report generation credits
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { package_id, payment_method } = body;

    if (!package_id) {
      return NextResponse.json(
        { error: 'package_id is required' },
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

    // Get appraiser details
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, full_name, email, phone, appraiser_tier')
      .eq('user_id', user.id)
      .eq('role', 'appraiser')
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Only appraisers can purchase credits' },
        { status: 403 }
      );
    }

    // Get package details
    const creditPackages = getCreditPackages(appraiser.appraiser_tier);
    const selectedPackage = creditPackages.find(pkg => pkg.id === package_id);

    if (!selectedPackage) {
      return NextResponse.json(
        { error: 'Invalid package ID' },
        { status: 400 }
      );
    }

    // Create Paymob payment intention for credit purchase
    const intentionData = {
      amount: selectedPackage.price_egp,
      currency: 'EGP' as const,
      payment_methods: ['card', 'wallet', 'instapay'],
      items: [{
        name: selectedPackage.name,
        description: `${selectedPackage.credits} report generation credits`,
        quantity: 1,
        amount: selectedPackage.price_egp
      }],
      billing_data: {
        first_name: appraiser.full_name.split(' ')[0] || 'Appraiser',
        last_name: appraiser.full_name.split(' ').slice(1).join(' ') || '',
        email: appraiser.email,
        phone_number: appraiser.phone || '',
        country: 'EG' as const,
        state: 'Cairo',
        city: 'Cairo',
        street: 'N/A'
      },
      customer: {
        first_name: appraiser.full_name.split(' ')[0] || 'Appraiser',
        last_name: appraiser.full_name.split(' ').slice(1).join(' ') || '',
        email: appraiser.email,
        phone_number: appraiser.phone || ''
      }
    };

    const paymobIntention = await paymobService.createPaymentIntention(intentionData);

    // Create payment record
    const merchantOrderId = `CREDITS-${Date.now()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const paymentData = {
      payment_category: 'report_generation',
      payer_type: 'appraiser',
      payer_id: user.id,
      payer_email: appraiser.email,
      payer_name: appraiser.full_name,
      paymob_intention_id: paymobIntention.id,
      paymob_order_id: paymobIntention.id,
      merchant_order_id: merchantOrderId,
      amount_egp: selectedPackage.price_egp,
      amount_cents: Math.round(selectedPackage.price_egp * 100),
      currency: 'EGP',
      status: 'pending',
      expiry_date: new Date(paymobIntention.expires_at).toISOString(),
      customer_data: {
        billing_data: intentionData.billing_data,
        items: intentionData.items
      },
      metadata: {
        credit_package: selectedPackage,
        appraiser_id: appraiser.id,
        purchase_type: 'credit_package'
      }
    };

    const { data: payment, error: paymentError } = await supabase
      .from('appraisal_payments')
      .insert(paymentData)
      .select()
      .single();

    if (paymentError) {
      console.error('Credit payment creation error:', paymentError);
      return NextResponse.json(
        { error: 'Failed to create credit purchase payment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        merchant_order_id: merchantOrderId,
        amount: selectedPackage.price_egp,
        currency: 'EGP',
        expires_at: paymobIntention.expires_at
      },
      paymob: {
        intention_id: paymobIntention.id,
        payment_url: paymobIntention.payment_url,
        iframe_url: paymobIntention.iframe_url
      },
      package: selectedPackage,
      message: `Payment created for ${selectedPackage.name}`
    });

  } catch (error) {
    console.error('Credit purchase error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create credit purchase',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PATCH: Use credits for report generation (called internally)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { appraiser_id, credits_to_use, transaction_id } = body;

    if (!appraiser_id || !credits_to_use || !transaction_id) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Get current user and verify authorization
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Verify appraiser ownership
    const { data: appraiser } = await supabase
      .from('brokers')
      .select('id, user_id')
      .eq('id', appraiser_id)
      .eq('user_id', user.id)
      .single();

    if (!appraiser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }

    // Get available credits (oldest first)
    const { data: credits } = await supabase
      .from('appraiser_report_credits')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .gt('credits_available', 0)
      .or('expires_at.is.null,expires_at.gte.now()')
      .order('expires_at', { ascending: true, nullsLast: true });

    const totalAvailable = credits?.reduce((sum, credit) => sum + credit.credits_available, 0) || 0;

    if (totalAvailable < credits_to_use) {
      return NextResponse.json(
        { 
          error: 'Insufficient credits',
          available: totalAvailable,
          requested: credits_to_use
        },
        { status: 402 }
      );
    }

    // Deduct credits (FIFO - First In, First Out)
    let remainingToDeduct = credits_to_use;
    const updatedCredits = [];

    for (const credit of credits || []) {
      if (remainingToDeduct <= 0) break;

      const toDeduct = Math.min(remainingToDeduct, credit.credits_available);
      
      const { data: updatedCredit, error } = await supabase
        .from('appraiser_report_credits')
        .update({
          credits_used: credit.credits_used + toDeduct,
          credits_available: credit.credits_available - toDeduct,
          updated_at: new Date().toISOString()
        })
        .eq('id', credit.id)
        .select()
        .single();

      if (error) {
        console.error('Credit deduction error:', error);
        return NextResponse.json(
          { error: 'Failed to deduct credits' },
          { status: 500 }
        );
      }

      updatedCredits.push(updatedCredit);
      remainingToDeduct -= toDeduct;
    }

    return NextResponse.json({
      success: true,
      credits_deducted: credits_to_use,
      credits_remaining: totalAvailable - credits_to_use,
      transaction_id,
      updated_credits: updatedCredits
    });

  } catch (error) {
    console.error('Credit usage error:', error);
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}

// Helper function to get credit packages based on appraiser tier
function getCreditPackages(tier: string) {
  const basePackages = [
    {
      id: 'starter_10',
      name: 'Starter Pack',
      credits: 10,
      price_egp: 400,
      price_per_credit: 40,
      savings: 0,
      popular: false
    },
    {
      id: 'professional_25',
      name: 'Professional Pack',
      credits: 25,
      price_egp: 875,
      price_per_credit: 35,
      savings: 375,
      popular: true
    },
    {
      id: 'enterprise_50',
      name: 'Enterprise Pack',
      credits: 50,
      price_egp: 1500,
      price_per_credit: 30,
      savings: 1000,
      popular: false
    },
    {
      id: 'bulk_100',
      name: 'Bulk Pack',
      credits: 100,
      price_egp: 2500,
      price_per_credit: 25,
      savings: 2500,
      popular: false
    }
  ];

  // Apply tier-based discounts
  const tierDiscounts = {
    basic: 0,
    premium: 0.1, // 10% discount
    enterprise: 0.2 // 20% discount
  };

  const discount = tierDiscounts[tier as keyof typeof tierDiscounts] || 0;

  return basePackages.map(pkg => ({
    ...pkg,
    original_price: pkg.price_egp,
    price_egp: Math.round(pkg.price_egp * (1 - discount)),
    discount_percentage: discount * 100,
    tier_benefit: discount > 0
  }));
}

// Helper function to get next quota assignment date
function getNextQuotaDate(): string {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return nextMonth.toISOString();
}
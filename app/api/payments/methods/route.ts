// Payment Methods API - Get available methods and manage preferences
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { paymobService } from '@/lib/services/paymob-service';

// GET: Get available payment methods for a specific amount
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = parseFloat(searchParams.get('amount') || '0');
    const currency = searchParams.get('currency') || 'EGP';
    const category = searchParams.get('category'); // 'booking' or 'report_generation'

    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Valid amount is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Check cache first
    const { data: cachedMethods } = await supabase
      .from('payment_method_cache')
      .select('*')
      .lte('amount_range_min', amount)
      .gte('amount_range_max', amount)
      .gt('expires_at', new Date().toISOString())
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    let paymentMethods;
    let installmentOptions = [];

    if (cachedMethods) {
      paymentMethods = cachedMethods.available_methods;
      installmentOptions = cachedMethods.installment_options || [];
    } else {
      // Fetch from Paymob API
      paymentMethods = await paymobService.getAvailablePaymentMethods(amount, currency);
      installmentOptions = await paymobService.getInstallmentOptions(amount);

      // Cache the results for 1 hour
      await supabase
        .from('payment_method_cache')
        .insert({
          amount_range_min: Math.floor(amount / 100) * 100,
          amount_range_max: Math.ceil(amount / 100) * 100 + 99,
          available_methods: paymentMethods,
          installment_options: installmentOptions,
          expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
        });
    }

    // Filter methods based on category if needed
    if (category === 'report_generation') {
      // For report generation, prefer faster methods
      paymentMethods = paymentMethods.filter(method => 
        ['card', 'wallet', 'instapay'].includes(method.type)
      );
    }

    return NextResponse.json({
      amount,
      currency,
      payment_methods: paymentMethods,
      installment_options: installmentOptions,
      recommendations: getPaymentRecommendations(amount, paymentMethods)
    });

  } catch (error) {
    console.error('Payment methods retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve payment methods' },
      { status: 500 }
    );
  }
}

// POST: Set preferred payment method for customer
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { preferred_method, billing_data } = body;

    if (!preferred_method) {
      return NextResponse.json(
        { error: 'preferred_method is required' },
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

    // Update or create customer payment profile
    const profileData = {
      customer_email: user.email!,
      customer_phone: billing_data?.phone_number,
      preferred_payment_method: preferred_method,
      billing_data: billing_data || null,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('customer_payment_profiles')
      .upsert(profileData, { onConflict: 'customer_email' })
      .select()
      .single();

    if (error) {
      console.error('Payment preference save error:', error);
      return NextResponse.json(
        { error: 'Failed to save payment preference' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: {
        preferred_method,
        billing_data_saved: !!billing_data,
        updated_at: data.updated_at
      }
    });

  } catch (error) {
    console.error('Payment preference error:', error);
    return NextResponse.json(
      { error: 'Failed to set payment preference' },
      { status: 500 }
    );
  }
}

// Helper function to provide payment recommendations
function getPaymentRecommendations(amount: number, methods: any[]) {
  const recommendations = [];

  // Find the most economical method
  const economical = methods.reduce((prev, current) => {
    const prevTotalFee = prev.fees.percentage * amount / 100 + prev.fees.fixed;
    const currentTotalFee = current.fees.percentage * amount / 100 + current.fees.fixed;
    return currentTotalFee < prevTotalFee ? current : prev;
  });

  if (economical) {
    recommendations.push({
      type: 'economical',
      method: economical,
      reason: 'Lowest fees',
      total_fee: economical.fees.percentage * amount / 100 + economical.fees.fixed
    });
  }

  // Find the fastest method
  const fastest = methods.find(method => method.processing_time === 'Instant');
  if (fastest && fastest.id !== economical?.id) {
    recommendations.push({
      type: 'fastest',
      method: fastest,
      reason: 'Instant processing',
      total_fee: fastest.fees.percentage * amount / 100 + fastest.fees.fixed
    });
  }

  // Recommend InstaPay for larger amounts
  const instaPay = methods.find(method => method.id === 'instapay');
  if (instaPay && amount >= 1000) {
    recommendations.push({
      type: 'recommended',
      method: instaPay,
      reason: 'Best for large amounts - lowest fees and instant',
      total_fee: instaPay.fees.percentage * amount / 100 + instaPay.fees.fixed
    });
  }

  // Recommend BNPL for eligible amounts
  const bnpl = methods.find(method => method.type === 'bnpl' && amount >= method.minimum_amount);
  if (bnpl && amount >= 500) {
    recommendations.push({
      type: 'flexible',
      method: bnpl,
      reason: 'Buy now, pay later option available',
      total_fee: bnpl.fees.percentage * amount / 100 + bnpl.fees.fixed
    });
  }

  return recommendations;
}
// Appraiser Monthly Quota API
import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET: Get appraiser's monthly quota status
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
        { error: 'Only appraisers can access quota information' },
        { status: 403 }
      );
    }

    // Get monthly quota based on tier
    const quotaLimits = {
      basic: 2,
      premium: 10,
      enterprise: 50
    };

    const monthlyLimit = quotaLimits[appraiser.appraiser_tier as keyof typeof quotaLimits] || quotaLimits.basic;

    // Get usage for current month
    const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
    const startOfMonth = `${currentMonth}-01T00:00:00.000Z`;
    const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString();

    const { data: monthlyUsage, error: usageError } = await supabase
      .from('report_generation_transactions')
      .select('id, created_at, generation_method')
      .eq('appraiser_id', appraiser.id)
      .eq('generation_method', 'free_quota')
      .gte('created_at', startOfMonth)
      .lt('created_at', endOfMonth);

    if (usageError) {
      console.error('Failed to fetch monthly usage:', usageError);
      // Continue with 0 usage if query fails
    }

    const usedThisMonth = monthlyUsage?.length || 0;
    const remainingQuota = Math.max(0, monthlyLimit - usedThisMonth);

    // Calculate next reset date
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1, 1);
    nextMonth.setHours(0, 0, 0, 0);

    return NextResponse.json({
      appraiser: {
        id: appraiser.id,
        name: appraiser.full_name,
        tier: appraiser.appraiser_tier
      },
      monthly_quota: {
        total: monthlyLimit,
        used: usedThisMonth,
        available: remainingQuota,
        expires_at: nextMonth.toISOString()
      },
      can_use_free: remainingQuota > 0,
      usage_history: monthlyUsage || [],
      next_reset: nextMonth.toISOString()
    });

  } catch (error) {
    console.error('Quota retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve quota information' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createServiceSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServiceSupabaseClient();
    const { searchParams } = new URL(request.url);
    const authHeader = request.headers.get('authorization');
    
    // Get user from auth header if present, or use public access
    let userId = null;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id;
    }

    // If no user from auth header, try to get from request context
    if (!userId) {
      // In Next.js 13+, we need to handle auth differently for API routes
      // For now, we'll check if there's a user_id in search params (for testing)
      // In production, you'd implement proper auth middleware
      const userEmail = searchParams.get('user_email');
      if (userEmail) {
        // Find user by email to get their appraisals
        const { data: profiles } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('email', userEmail)
          .limit(1);
        
        if (profiles && profiles.length > 0) {
          userId = profiles[0].user_id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ 
        success: false, 
        error: 'User not authenticated' 
      }, { status: 401 });
    }

    // Get user profile to find their email
    const { data: profile } = await supabase.auth.getUser();
    let userEmail = null;
    if (profile.user) {
      userEmail = profile.user.email;
    } else {
      // Fallback: get email from profiles table
      const { data: profileData } = await supabase
        .from('profiles')
        .select('email')
        .eq('user_id', userId)
        .single();
      userEmail = profileData?.email;
    }

    if (!userEmail) {
      return NextResponse.json({ 
        success: false, 
        error: 'User email not found' 
      }, { status: 400 });
    }

    // Query appraisals where client_name matches user email or name
    const { data: appraisals, error } = await supabase
      .from('property_appraisals')
      .select(`
        id,
        client_name,
        appraiser_id,
        appraisal_date,
        market_value_estimate,
        confidence_level,
        status,
        appraisal_reference_number,
        form_data,
        reports_generated,
        created_at,
        brokers:appraiser_id (
          id,
          full_name,
          email
        )
      `)
      .or(`client_name.ilike.%${userEmail}%,form_data->>client_email.eq.${userEmail}`)
      .in('status', ['completed', 'approved'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching client appraisals:', error);
      return NextResponse.json({ 
        success: false, 
        error: 'Failed to fetch appraisals' 
      }, { status: 500 });
    }

    // Process appraisals to extract relevant info
    const processedAppraisals = appraisals?.map(appraisal => ({
      id: appraisal.id,
      client_name: appraisal.client_name,
      appraiser_id: appraisal.appraiser_id,
      appraisal_date: appraisal.appraisal_date,
      market_value_estimate: appraisal.market_value_estimate,
      confidence_level: appraisal.confidence_level,
      status: appraisal.status,
      appraisal_reference_number: appraisal.appraisal_reference_number,
      property_address: appraisal.form_data?.property_address_english || appraisal.form_data?.property_address_arabic,
      property_type: appraisal.form_data?.property_type,
      reports_generated: appraisal.reports_generated,
      created_at: appraisal.created_at,
      brokers: appraisal.brokers
    })) || [];

    return NextResponse.json({
      success: true,
      appraisals: processedAppraisals,
      count: processedAppraisals.length
    });

  } catch (error) {
    console.error('Unexpected error in user appraisals API:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error' 
    }, { status: 500 });
  }
}
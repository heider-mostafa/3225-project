import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appraiser_id = params.id;

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Get appraiser basic info
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select(`
        id,
        full_name,
        profile_headline,
        profile_summary,
        professional_headshot_url,
        valify_status,
        average_rating,
        total_reviews,
        years_of_experience,
        response_time_hours,
        service_areas,
        certifications,
        social_media_links,
        public_profile_active,
        appraiser_license_number,
        languages,
        pricing_info,
        profile_views_count,
        created_at,
        updated_at
      `)
      .eq('id', appraiser_id)
      .eq('public_profile_active', true)
      .eq('is_active', true)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    // Get property statistics
    const { data: propertyStatistics } = await supabase
      .from('appraiser_property_statistics')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('properties_appraised', { ascending: false });

    // Get portfolio items
    console.log(`🔍 PORTFOLIO API DEBUG - Fetching portfolio for appraiser: ${appraiser_id}`);
    
    // First try with is_public filter
    let { data: portfolioItems, error: portfolioError } = await supabase
      .from('appraiser_portfolio')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('is_public', true)
      .order('is_featured', { ascending: false })
      .order('completion_date', { ascending: false });
      
    // If error, try without is_public filter (column might not exist)
    if (portfolioError) {
      console.log('🔍 PORTFOLIO API DEBUG - is_public filter failed, trying without it');
      const result = await supabase
        .from('appraiser_portfolio')
        .select('*')
        .eq('appraiser_id', appraiser_id)
        .order('completion_date', { ascending: false });
      portfolioItems = result.data;
      portfolioError = result.error;
    }
    
    console.log(`🔍 PORTFOLIO API DEBUG - Portfolio query result:`, {
      count: portfolioItems?.length || 0,
      error: portfolioError,
      sample_item: portfolioItems?.[0]
    });
    
    if (portfolioError) {
      console.error('🔍 PORTFOLIO API DEBUG - Portfolio fetch error:', portfolioError);
    }

    // Get reviews
    const { data: reviews } = await supabase
      .from('appraiser_reviews')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('is_verified', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false });

    // Get certifications
    const { data: certifications } = await supabase
      .from('appraiser_certifications')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('is_active', true)
      .eq('verification_status', 'verified')
      .order('issue_date', { ascending: false });

    // Get services
    const { data: services } = await supabase
      .from('appraiser_services')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('is_active', true)
      .order('display_order');

    // Get availability
    const { data: availability } = await supabase
      .from('appraiser_availability')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('day_of_week');

    // Calculate rating breakdown
    const ratingBreakdown = reviews ? [1, 2, 3, 4, 5].map(rating => {
      const count = reviews.filter(review => review.rating === rating).length;
      const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
      return { rating, count, percentage };
    }) : [];

    // Recent reviews count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentReviewsCount = reviews ? reviews.filter(
      review => new Date(review.created_at) >= thirtyDaysAgo
    ).length : 0;

    // Calculate total appraisals directly from actual completed/approved appraisals
    // This ensures consistency with portfolio sync logic
    const { data: completedAppraisals } = await supabase
      .from('property_appraisals')
      .select('id')
      .eq('appraiser_id', appraiser_id)
      .in('status', ['completed', 'approved']);

    const totalAppraisals = completedAppraisals?.length || 0;

    // Determine availability status
    const today = new Date().getDay();
    const todaySchedule = availability?.find(slot => slot.day_of_week === today);
    const isAvailableToday = todaySchedule?.is_available || false;

    // Mock booking preferences (in production, get from database)
    const bookingPreferences = {
      emergency_available: false,
      booking_advance_days: 3,
      contact_preferences: {
        phone: true,
        email: true,
        whatsapp: true
      }
    };

    // Log profile view (don't track for the appraiser themselves)
    const { data: { user } } = await supabase.auth.getUser();
    const isOwnProfile = user && appraiser.user_id === user.id;
    
    if (!isOwnProfile) {
      // Increment view count
      await supabase
        .from('brokers')
        .update({ 
          profile_views_count: (appraiser.profile_views_count || 0) + 1 
        })
        .eq('id', appraiser_id);

      // Log detailed view analytics
      await supabase
        .from('appraiser_profile_views')
        .insert({
          appraiser_id,
          viewer_user_id: user?.id,
          viewer_ip: request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown',
          view_source: 'direct_profile',
          referrer_url: request.headers.get('referer'),
          user_agent: request.headers.get('user-agent')
        });
    }

    // Compile the complete profile
    const completeProfile = {
      appraiser: {
        ...appraiser,
        total_appraisals: totalAppraisals,
        is_available_today: isAvailableToday,
        ...bookingPreferences
      },
      property_statistics: propertyStatistics || [],
      portfolio_items: portfolioItems || [],
      reviews: reviews || [],
      rating_breakdown: ratingBreakdown,
      recent_reviews_count: recentReviewsCount,
      certifications: certifications || [],
      services: services || [],
      availability_schedule: availability || [],
      timezone: 'Africa/Cairo' // Egypt timezone
    };

    return NextResponse.json(completeProfile);

  } catch (error) {
    console.error('Get appraiser profile error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Update profile view count
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appraiser_id = params.id;
    const body = await request.json();
    const { action } = body;

    if (action !== 'view') {
      return NextResponse.json(
        { error: 'Invalid action' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Log the view
    await supabase
      .from('appraiser_profile_views')
      .insert({
        appraiser_id,
        viewer_ip: request.headers.get('x-forwarded-for') || 'unknown',
        view_source: body.source || 'direct',
        referrer_url: request.headers.get('referer'),
        user_agent: request.headers.get('user-agent')
      });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Log view error:', error);
    return NextResponse.json(
      { error: 'Failed to log view' },
      { status: 500 }
    );
  }
}
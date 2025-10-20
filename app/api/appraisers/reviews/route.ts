import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isServerUserAdmin } from '@/lib/auth/admin';

// GET /api/appraisers/reviews - Get reviews with filtering
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');
    const rating = searchParams.get('rating');
    const verified_only = searchParams.get('verified_only') === 'true';
    const featured_only = searchParams.get('featured_only') === 'true';
    const sort_by = searchParams.get('sort_by') || 'recent';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('appraiser_reviews')
      .select(`
        id,
        appraiser_id,
        client_name,
        rating,
        review_text,
        review_title,
        property_type,
        property_value,
        is_verified,
        is_featured,
        helpful_votes,
        response_from_appraiser,
        response_date,
        created_at,
        updated_at
      `)
      .eq('is_verified', true); // Only show verified reviews to public

    // Apply filters
    if (appraiser_id) {
      query = query.eq('appraiser_id', appraiser_id);
    }

    if (rating) {
      query = query.eq('rating', parseInt(rating));
    }

    if (verified_only) {
      query = query.eq('is_verified', true);
    }

    if (featured_only) {
      query = query.eq('is_featured', true);
    }

    // Apply sorting
    switch (sort_by) {
      case 'rating_high':
        query = query.order('rating', { ascending: false });
        break;
      case 'rating_low':
        query = query.order('rating', { ascending: true });
        break;
      case 'helpful':
        query = query.order('helpful_votes', { ascending: false });
        break;
      case 'featured':
        query = query.order('is_featured', { ascending: false });
        break;
      default: // 'recent'
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: reviews, error } = await query;

    if (error) {
      console.error('Error fetching reviews:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch reviews' 
      }, { status: 500 });
    }

    // Get rating breakdown if appraiser_id is provided
    let rating_breakdown = null;
    if (appraiser_id) {
      const { data: breakdown } = await supabase
        .from('appraiser_reviews')
        .select('rating')
        .eq('appraiser_id', appraiser_id)
        .eq('is_verified', true);

      if (breakdown) {
        const ratingCounts = breakdown.reduce((acc, review) => {
          acc[review.rating] = (acc[review.rating] || 0) + 1;
          return acc;
        }, {} as Record<number, number>);

        const total = breakdown.length;
        rating_breakdown = [1, 2, 3, 4, 5].map(rating => ({
          rating,
          count: ratingCounts[rating] || 0,
          percentage: total > 0 ? ((ratingCounts[rating] || 0) / total) * 100 : 0
        }));
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        reviews: reviews || [],
        rating_breakdown,
        total_count: reviews?.length || 0
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appraisers/reviews - Create new review
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      appraiser_id,
      client_name,
      client_email,
      client_phone,
      rating,
      review_text,
      review_title,
      property_type,
      property_value,
      appraisal_id
    } = body;

    // Validate required fields
    if (!appraiser_id || !client_name || !client_email || !rating || !review_text) {
      return NextResponse.json({
        error: 'Appraiser ID, client name, email, rating, and review text are required'
      }, { status: 400 });
    }

    // Validate rating range
    if (rating < 1 || rating > 5) {
      return NextResponse.json({
        error: 'Rating must be between 1 and 5'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check if appraiser exists
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, full_name')
      .eq('id', appraiser_id)
      .eq('is_active', true)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json({
        error: 'Appraiser not found'
      }, { status: 404 });
    }

    // Check for duplicate reviews (same email + appraiser)
    const { data: existingReview } = await supabase
      .from('appraiser_reviews')
      .select('id')
      .eq('appraiser_id', appraiser_id)
      .eq('client_email', client_email)
      .single();

    if (existingReview) {
      return NextResponse.json({
        error: 'You have already reviewed this appraiser'
      }, { status: 409 });
    }

    // Create review
    const reviewData = {
      appraiser_id,
      client_name,
      client_email,
      client_phone,
      rating,
      review_text,
      review_title,
      property_type,
      property_value,
      appraisal_id,
      is_verified: false, // Requires admin verification
      is_featured: false,
      helpful_votes: 0
    };

    const { data: newReview, error: insertError } = await supabase
      .from('appraiser_reviews')
      .insert(reviewData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating review:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create review: ' + insertError.message 
      }, { status: 500 });
    }

    // Update appraiser statistics (recalculate average rating)
    const { data: allReviews } = await supabase
      .from('appraiser_reviews')
      .select('rating')
      .eq('appraiser_id', appraiser_id)
      .eq('is_verified', true);

    if (allReviews && allReviews.length > 0) {
      const averageRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      
      await supabase
        .from('brokers')
        .update({
          average_rating: Math.round(averageRating * 100) / 100,
          total_reviews: allReviews.length
        })
        .eq('id', appraiser_id);
    }

    return NextResponse.json({
      success: true,
      message: 'Review submitted successfully. It will be visible after admin verification.',
      data: newReview
    });

  } catch (error) {
    console.error('Unexpected error in POST review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/appraisers/reviews - Update review (for appraiser responses or admin actions)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      review_id,
      response_from_appraiser,
      is_verified,
      is_featured,
      helpful_votes
    } = body;

    if (!review_id) {
      return NextResponse.json({
        error: 'Review ID is required'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get review details
    const { data: review, error: reviewError } = await supabase
      .from('appraiser_reviews')
      .select('appraiser_id, client_email')
      .eq('id', review_id)
      .single();

    if (reviewError || !review) {
      return NextResponse.json({
        error: 'Review not found'
      }, { status: 404 });
    }

    // Check permissions
    const isAdmin = await isServerUserAdmin();
    let canUpdate = false;
    
    if (isAdmin) {
      // Admin can update any field
      canUpdate = true;
    } else if (response_from_appraiser) {
      // Check if user is the appraiser
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', review.appraiser_id)
        .single();
      
      canUpdate = !!broker;
    } else if (helpful_votes !== undefined) {
      // Anyone can update helpful votes (in production, implement rate limiting)
      canUpdate = true;
    }

    if (!canUpdate) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Build update data
    const updateData: any = {};
    
    if (response_from_appraiser !== undefined) {
      updateData.response_from_appraiser = response_from_appraiser;
      updateData.response_date = new Date().toISOString();
    }
    
    if (isAdmin) {
      if (is_verified !== undefined) updateData.is_verified = is_verified;
      if (is_featured !== undefined) updateData.is_featured = is_featured;
    }
    
    if (helpful_votes !== undefined) {
      updateData.helpful_votes = helpful_votes;
    }

    updateData.updated_at = new Date().toISOString();

    const { data: updatedReview, error: updateError } = await supabase
      .from('appraiser_reviews')
      .update(updateData)
      .eq('id', review_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating review:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update review: ' + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Review updated successfully',
      data: updatedReview
    });

  } catch (error) {
    console.error('Unexpected error in PUT review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
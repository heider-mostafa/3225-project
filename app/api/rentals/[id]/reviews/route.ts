import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const listingId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const { data: reviews, error, count } = await supabase
      .from('rental_reviews')
      .select(`
        *,
        reviewer:reviewer_user_id (
          id,
          full_name
        ),
        booking:booking_id (
          check_in_date,
          check_out_date
        )
      `, { count: 'exact' })
      .eq('rental_listing_id', listingId)
      .eq('is_public', true)
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (error) {
      console.error('Reviews fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
    }

    // Calculate review statistics
    const totalReviews = count || 0;
    let stats = {
      total_reviews: totalReviews,
      average_rating: 0,
      rating_breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      category_averages: {
        cleanliness: 0,
        accuracy: 0,
        location: 0,
        value: 0
      }
    };

    if (reviews && reviews.length > 0) {
      const averageRating = reviews.reduce((sum, review) => sum + review.overall_rating, 0) / reviews.length;
      stats.average_rating = Math.round(averageRating * 100) / 100;

      // Rating breakdown
      reviews.forEach(review => {
        stats.rating_breakdown[review.overall_rating] += 1;
      });

      // Category averages (only include reviews with category ratings)
      const reviewsWithCategories = reviews.filter(r => r.cleanliness_rating);
      if (reviewsWithCategories.length > 0) {
        stats.category_averages.cleanliness = reviewsWithCategories.reduce((sum, r) => sum + (r.cleanliness_rating || 0), 0) / reviewsWithCategories.length;
        stats.category_averages.accuracy = reviewsWithCategories.reduce((sum, r) => sum + (r.accuracy_rating || 0), 0) / reviewsWithCategories.length;
        stats.category_averages.location = reviewsWithCategories.reduce((sum, r) => sum + (r.location_rating || 0), 0) / reviewsWithCategories.length;
        stats.category_averages.value = reviewsWithCategories.reduce((sum, r) => sum + (r.value_rating || 0), 0) / reviewsWithCategories.length;
      }
    }

    return NextResponse.json({
      success: true,
      reviews,
      stats,
      pagination: {
        page,
        limit,
        total: totalReviews,
        pages: Math.ceil(totalReviews / limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listingId = params.id;
    const body = await request.json();

    const {
      booking_id,
      overall_rating,
      cleanliness_rating,
      accuracy_rating,
      location_rating,
      value_rating,
      review_text,
      review_language
    } = body;

    // Validate required fields
    if (!booking_id || !overall_rating || overall_rating < 1 || overall_rating > 5) {
      return NextResponse.json({ 
        error: 'Booking ID and valid overall rating (1-5) are required' 
      }, { status: 400 });
    }

    // Verify the booking exists and belongs to the user
    const { data: booking, error: bookingError } = await supabase
      .from('rental_bookings')
      .select('*')
      .eq('id', booking_id)
      .eq('rental_listing_id', listingId)
      .eq('guest_user_id', user.id)
      .eq('booking_status', 'completed')
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ 
        error: 'Valid completed booking required to leave a review' 
      }, { status: 400 });
    }

    // Check if review already exists
    const { data: existingReview } = await supabase
      .from('rental_reviews')
      .select('id')
      .eq('booking_id', booking_id)
      .single();

    if (existingReview) {
      return NextResponse.json({ 
        error: 'Review already exists for this booking' 
      }, { status: 400 });
    }

    // Create the review
    const { data: review, error: reviewError } = await supabase
      .from('rental_reviews')
      .insert({
        rental_listing_id: listingId,
        booking_id,
        reviewer_user_id: user.id,
        overall_rating,
        cleanliness_rating,
        accuracy_rating,
        location_rating,
        value_rating,
        review_text,
        review_language: review_language || 'ar',
        is_verified: true,
        moderation_status: 'approved' // Auto-approve reviews from verified bookings
      })
      .select()
      .single();

    if (reviewError) {
      console.error('Review creation error:', reviewError);
      return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      review
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
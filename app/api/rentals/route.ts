import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { rentalLTVOptimizer } from '@/lib/services/rental-ltv-optimizer';

export async function GET(request: NextRequest) {
  console.log('🏠 RENTALS API START - GET request');
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    console.log('🔍 Search params:', Object.fromEntries(searchParams));

    // Extract search parameters
    const location = searchParams.get('location');
    const checkIn = searchParams.get('check_in_date');
    const checkOut = searchParams.get('check_out_date');
    const guests = searchParams.get('guests');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const propertyType = searchParams.get('property_type');
    const rentalType = searchParams.get('rental_type');
    const amenities = searchParams.get('amenities');
    const sortBy = searchParams.get('sort_by') || 'rating';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    
    // Meta tracking parameters
    const userId = searchParams.get('user_id');
    const userEmail = searchParams.get('user_email');
    const userPhone = searchParams.get('user_phone');
    const fbclid = searchParams.get('fbclid');
    const fbc = searchParams.get('fbc');

    let query = supabase
      .from('rental_listings')
      .select(`
        id,
        property_id,
        owner_user_id,
        rental_type,
        nightly_rate,
        monthly_rate,
        yearly_rate,
        minimum_stay_nights,
        maximum_stay_nights,
        check_in_time,
        check_out_time,
        house_rules,
        cancellation_policy,
        instant_book,
        developer_qr_code,
        tourism_permit_number,
        compliance_status,
        cleaning_fee,
        security_deposit,
        extra_guest_fee,
        is_active,
        featured,
        total_bookings,
        average_rating,
        advance_notice_days,
        booking_window_days,
        max_guests,
        allow_extra_guests,
        require_verification,
        require_profile_photo,
        allow_business_travelers,
        weekend_pricing,
        virtual_tour_url,
        video_tour_url,
        media_urls,
        available_from,
        available_until,
        default_available_days,
        custom_amenities,
        availability_calendar,
        created_at,
        updated_at,
        properties (
          id,
          title,
          description,
          bedrooms,
          bathrooms,
          square_meters,
          address,
          city,
          property_type,
          amenities,
          compound,
          furnished,
          has_pool,
          has_garden,
          has_security,
          has_parking,
          property_photos (
            id,
            url,
            thumbnail_url,
            alt_text,
            caption,
            category,
            order_index,
            is_primary
          )
        ),
        rental_amenities (*)
      `, { count: 'exact' })
      .eq('is_active', true)
      .eq('compliance_status', 'approved');

    // Apply filters
    if (location) {
      query = query.ilike('properties.city', `%${location}%`);
    }

    if (rentalType && rentalType !== 'both') {
      query = query.in('rental_type', [rentalType, 'both']);
    }

    if (minPrice) {
      query = query.gte('nightly_rate', parseInt(minPrice));
    }

    if (maxPrice) {
      query = query.lte('nightly_rate', parseInt(maxPrice));
    }

    if (propertyType) {
      const types = propertyType.split(',');
      query = query.in('properties.property_type', types);
    }

    // Check availability if dates provided
    if (checkIn && checkOut) {
      const { data: unavailableListings } = await supabase
        .from('rental_calendar')
        .select('rental_listing_id')
        .eq('is_available', false)
        .gte('date', checkIn)
        .lte('date', checkOut);

      const unavailableIds = unavailableListings?.map(item => item.rental_listing_id) || [];
      if (unavailableIds.length > 0) {
        query = query.not('id', 'in', `(${unavailableIds.join(',')})`);
      }
    }

    // Apply sorting
    switch (sortBy) {
      case 'price_low':
        query = query.order('nightly_rate', { ascending: true });
        break;
      case 'price_high':
        query = query.order('nightly_rate', { ascending: false });
        break;
      case 'rating':
        query = query.order('average_rating', { ascending: false });
        break;
      case 'newest':
        query = query.order('created_at', { ascending: false });
        break;
      default:
        query = query.order('featured', { ascending: false })
          .order('average_rating', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    console.log('🗄️ Executing query...');
    const { data: listings, error, count } = await query;
    
    console.log('📊 Query result:', { 
      listingsCount: listings?.length || 0, 
      totalCount: count, 
      error: error?.message 
    });

    if (error) {
      console.error('❌ Database error details:', error);
      return NextResponse.json({ error: 'Failed to fetch rental listings' }, { status: 500 });
    }

    // Track rental search event for Meta (non-blocking)
    if (userId && (location || checkIn || checkOut)) {
      try {
        await rentalLTVOptimizer.trackRentalBookingEvent({
          eventType: 'search_started',
          customerId: userId,
          searchFilters: {
            location,
            check_in_date: checkIn,
            check_out_date: checkOut,
            guests: guests ? parseInt(guests) : undefined,
            price_range: { min: minPrice ? parseInt(minPrice) : undefined, max: maxPrice ? parseInt(maxPrice) : undefined },
            property_type: propertyType,
            rental_type: rentalType,
            amenities
          },
          userInfo: { email: userEmail, phone: userPhone },
          trackingParams: { fbclid, fbc }
        });
        console.log('📊 Meta rental search tracking completed');
      } catch (trackingError) {
        console.error('⚠️ Meta tracking error (non-blocking):', trackingError);
      }
    }

    const response = {
      success: true,
      listings,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    };
    
    console.log('✅ Returning successful response:', {
      success: response.success,
      listingsCount: response.listings?.length || 0,
      pagination: response.pagination
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 RENTALS API CATCH ERROR:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const {
      property_id,
      rental_type,
      nightly_rate,
      monthly_rate,
      yearly_rate,
      minimum_stay_nights,
      maximum_stay_nights,
      check_in_time,
      check_out_time,
      house_rules,
      cancellation_policy,
      instant_book,
      cleaning_fee,
      security_deposit,
      extra_guest_fee,
      developer_qr_code,
      tourism_permit_number,
      amenities
    } = body;

    // Validate required fields
    if (!property_id || !rental_type) {
      return NextResponse.json({ 
        error: 'Property ID and rental type are required' 
      }, { status: 400 });
    }

    // Create rental listing
    const { data: listing, error: listingError } = await supabase
      .from('rental_listings')
      .insert({
        property_id,
        owner_user_id: user.id,
        rental_type,
        nightly_rate,
        monthly_rate,
        yearly_rate,
        minimum_stay_nights: minimum_stay_nights || 1,
        maximum_stay_nights: maximum_stay_nights || 365,
        check_in_time: check_in_time || '15:00',
        check_out_time: check_out_time || '11:00',
        house_rules,
        cancellation_policy: cancellation_policy || 'moderate',
        instant_book: instant_book || false,
        cleaning_fee: cleaning_fee || 0,
        security_deposit: security_deposit || 0,
        extra_guest_fee: extra_guest_fee || 0,
        developer_qr_code,
        tourism_permit_number,
        compliance_status: 'pending'
      })
      .select()
      .single();

    if (listingError) {
      console.error('Listing creation error:', listingError);
      return NextResponse.json({ error: 'Failed to create rental listing' }, { status: 500 });
    }

    // Create amenities record if provided
    if (amenities && listing) {
      const { error: amenitiesError } = await supabase
        .from('rental_amenities')
        .insert({
          rental_listing_id: listing.id,
          ...amenities
        });

      if (amenitiesError) {
        console.error('Amenities creation error:', amenitiesError);
      }
    }

    return NextResponse.json({
      success: true,
      listing
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
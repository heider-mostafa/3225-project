import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const rental_id = params.id;

    console.log('🔍 Public rental API - fetching comprehensive data for:', rental_id);

    // Get comprehensive rental data with full property details
    const { data: rental, error } = await supabase
      .from('rental_listings')
      .select(`
        *,
        properties (
          *,
          property_photos (
            id,
            url,
            thumbnail_url,
            alt_text,
            caption,
            category,
            order_index,
            is_primary
          ),
          property_videos (
            id,
            url,
            thumbnail_url,
            title,
            description,
            duration,
            order_index
          ),
          property_documents (
            id,
            url,
            filename,
            document_type,
            file_size,
            mime_type
          )
        ),
        rental_reviews (
          id,
          overall_rating,
          cleanliness_rating,
          accuracy_rating,
          location_rating,
          value_rating,
          review_text,
          review_language,
          created_at,
          reviewer_user_id
        )
      `)
      .eq('id', rental_id)
      .eq('is_active', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Rental listing not found' }, { status: 404 });
      }
      console.error('❌ Rental fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch rental listing' }, { status: 500 });
    }

    // Fetch all additional data in parallel for comprehensive response
    const [amenitiesData, calendarData, qrIntegrations, externalSync] = await Promise.all([
      // Get amenities
      supabase
        .from('rental_amenities')
        .select('*')
        .eq('rental_listing_id', rental_id),
      
      // Get availability calendar (next 90 days)
      supabase
        .from('rental_calendar')
        .select('*')
        .eq('rental_listing_id', rental_id)
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date'),
      
      // Get QR integrations (public data only)
      supabase
        .from('developer_qr_integrations')
        .select('developer_name, qr_code_type, integration_status')
        .eq('rental_listing_id', rental_id)
        .eq('integration_status', 'active'),
      
      // Get external platform sync status (public info only)
      supabase
        .from('external_platform_sync')
        .select('platform_name, external_listing_url, sync_status')
        .eq('rental_listing_id', rental_id)
        .eq('sync_status', 'success')
    ]);

    // Log what we fetched
    console.log('📊 Comprehensive public rental data fetched:', {
      rental_id: rental.id,
      amenities_count: amenitiesData.data?.length || 0,
      calendar_entries: calendarData.data?.length || 0,
      qr_integrations: qrIntegrations.data?.length || 0,
      external_platforms: externalSync.data?.length || 0,
      photos_count: rental.properties?.property_photos?.length || 0,
      videos_count: rental.properties?.property_videos?.length || 0,
      documents_count: rental.properties?.property_documents?.length || 0
    });

    // Handle potential RLS errors gracefully
    if (amenitiesData.error) {
      console.warn('⚠️ Amenities fetch error (RLS?):', amenitiesData.error.message);
    }
    if (calendarData.error) {
      console.warn('⚠️ Calendar fetch error (RLS?):', calendarData.error.message);
    }
    if (qrIntegrations.error) {
      console.warn('⚠️ QR integrations fetch error (RLS?):', qrIntegrations.error.message);
    }
    if (externalSync.error) {
      console.warn('⚠️ External sync fetch error (RLS?):', externalSync.error.message);
    }

    // Assemble comprehensive rental data (matching admin API structure)
    const comprehensiveRental = {
      ...rental,
      
      // Amenities data
      rental_amenities: amenitiesData.data || [],
      
      // Calendar and availability
      calendar: {
        upcoming_availability: calendarData.data || [],
        total_available_days: calendarData.data?.filter(day => day.is_available).length || 0
      },
      
      // Integrations (public data only)
      integrations: {
        qr_codes: qrIntegrations.data || [],
        external_platforms: externalSync.data || []
      },
      
      // Media summary
      media_summary: {
        photos_count: rental.properties?.property_photos?.length || 0,
        videos_count: rental.properties?.property_videos?.length || 0,
        documents_count: rental.properties?.property_documents?.length || 0
      },
      
      // Reviews summary (already included in main query)
      reviews_summary: {
        total_reviews: rental.rental_reviews?.length || 0,
        average_rating: rental.average_rating || 0,
        recent_reviews: rental.rental_reviews || []
      }
    };

    console.log('✅ Returning comprehensive public rental data');

    return NextResponse.json({
      success: true,
      listing: comprehensiveRental
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listingId = params.id;
    const body = await request.json();

    // Check ownership
    const { data: existingListing, error: ownershipError } = await supabase
      .from('rental_listings')
      .select('owner_user_id')
      .eq('id', listingId)
      .single();

    if (ownershipError || existingListing?.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update listing
    const { data: listing, error } = await supabase
      .from('rental_listings')
      .update({
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: 'Failed to update rental listing' }, { status: 500 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const listingId = params.id;

    // Check ownership
    const { data: existingListing, error: ownershipError } = await supabase
      .from('rental_listings')
      .select('owner_user_id')
      .eq('id', listingId)
      .single();

    if (ownershipError || existingListing?.owner_user_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('rental_listings')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId);

    if (error) {
      console.error('Delete error:', error);
      return NextResponse.json({ error: 'Failed to delete rental listing' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Rental listing deleted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
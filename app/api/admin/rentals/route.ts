import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  console.log('🏢 ADMIN RENTALS API START - GET request');
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth check:', { userId: user?.id, hasUser: !!user, authError: authError?.message });
    
    if (authError || !user) {
      console.log('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    console.log('🔐 Checking admin permissions for user:', user.id);
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single();

    console.log('👑 User role check:', { userRole, roleError: roleError?.message });

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      console.log('❌ Admin access denied - insufficient permissions');
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Get query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const search = searchParams.get('search');
    
    console.log('📊 Query parameters:', { page, limit, status, type, search });
    
    const offset = (page - 1) * limit;

    // Build comprehensive query
    let query = supabase
      .from('rental_listings')
      .select(`
        *,
        rental_amenities (
          has_wifi,
          has_ac,
          has_kitchen,
          has_washing_machine,
          has_tv,
          has_balcony,
          has_swimming_pool,
          has_gym,
          has_security_guard,
          additional_amenities
        ),
        properties (
          *,
          property_photos (
            id,
            url,
            thumbnail_url,
            category,
            order_index
          ),
          property_videos (
            id,
            url,
            thumbnail_url,
            title
          ),
          property_documents (
            id,
            filename,
            document_type
          )
        ),
        rental_bookings (
          id,
          booking_status,
          total_amount,
          check_in_date,
          check_out_date,
          created_at
        ),
        rental_reviews (
          id,
          overall_rating,
          created_at
        )
      `)
      .order('created_at', { ascending: false });

    // Apply filters
    if (status && status !== 'all') {
      query = query.eq('compliance_status', status);
    }
    
    if (type && type !== 'all') {
      query = query.eq('rental_type', type);
    }

    if (search) {
      query = query.or(`properties.title.ilike.%${search}%,properties.city.ilike.%${search}%`);
    }

    // Execute query with pagination
    console.log('🗄️ Executing admin query with pagination:', { offset, limit });
    const { data: listings, error, count } = await query
      .range(offset, offset + limit - 1)
      .limit(limit);

    console.log('📊 Admin query result:', { 
      listingsCount: listings?.length || 0, 
      totalCount: count, 
      error: error?.message 
    });

    if (error) {
      console.error('❌ Admin database error details:', error);
      return NextResponse.json({ error: 'Failed to fetch rental listings' }, { status: 500 });
    }

    // Calculate pagination info
    const totalPages = Math.ceil((count || 0) / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const response = {
      listings: listings || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    };
    
    console.log('✅ Admin returning successful response:', {
      listingsCount: response.listings?.length || 0,
      pagination: response.pagination
    });

    return NextResponse.json(response);

  } catch (error) {
    console.error('💥 ADMIN RENTALS API CATCH ERROR:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Create new rental listing with complete data
export async function POST(request: NextRequest) {
  console.log('🏢 ADMIN RENTALS API - Creating new rental');
  try {
    const body = await request.json();
    console.log('📋 Create rental data:', body);

    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Auth check:', { userId: user?.id, hasUser: !!user, authError: authError?.message });
    
    if (authError || !user) {
      console.log('❌ Authentication failed');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    console.log('🔐 Checking admin permissions for user:', user.id);
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single();

    console.log('👑 User role check:', { userRole, roleError: roleError?.message });

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      console.log('❌ Admin access denied - insufficient permissions');
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Use SERVICE_ROLE client to bypass RLS for creation
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract components from body
    const { 
      amenities, 
      photos, 
      videos, 
      documents,
      initial_calendar,
      property_updates,
      qr_integrations,
      external_sync,
      ...rentalData 
    } = body;

    // 1. Create main rental listing
    console.log('🏠 Creating main rental listing...');
    const { data: newRental, error: rentalError } = await supabaseAdmin
      .from('rental_listings')
      .insert({
        ...rentalData,
        owner_user_id: user.id, // Set current admin as owner for admin-created rentals
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (rentalError || !newRental) {
      console.error('❌ Rental creation error:', rentalError);
      return NextResponse.json(
        { error: 'Failed to create rental listing', details: rentalError?.message },
        { status: 500 }
      );
    }

    const rental_id = newRental.id;
    console.log('✅ Created rental with ID:', rental_id);

    // 2. Create amenities if provided
    if (amenities && Object.keys(amenities).length > 0) {
      console.log('🛋️ Creating rental amenities...');
      const { error: amenitiesError } = await supabaseAdmin
        .from('rental_amenities')
        .insert({
          rental_listing_id: rental_id,
          ...amenities
        });

      if (amenitiesError) {
        console.error('❌ Amenities creation error:', amenitiesError);
        // Continue with creation but log error
      }
    }

    // 3. Add media to associated property if provided
    if (rentalData.property_id && (photos || videos || documents)) {
      console.log('📸 Adding media to property...');

      // Add photos
      if (photos && Array.isArray(photos)) {
        for (const photo of photos) {
          if (photo.url) {
            await supabaseAdmin
              .from('property_photos')
              .insert({
                property_id: rentalData.property_id,
                ...photo
              });
          }
        }
      }

      // Add videos
      if (videos && Array.isArray(videos)) {
        for (const video of videos) {
          if (video.url) {
            await supabaseAdmin
              .from('property_videos')
              .insert({
                property_id: rentalData.property_id,
                ...video
              });
          }
        }
      }

      // Add documents
      if (documents && Array.isArray(documents)) {
        for (const doc of documents) {
          if (doc.url) {
            await supabaseAdmin
              .from('property_documents')
              .insert({
                property_id: rentalData.property_id,
                ...doc
              });
          }
        }
      }

      // Update main property data if provided
      if (property_updates && Object.keys(property_updates).length > 0) {
        console.log('🏢 Updating property data...');
        await supabaseAdmin
          .from('properties')
          .update({
            ...property_updates,
            available_for_rent: true, // Mark property as available for rent
            updated_at: new Date().toISOString()
          })
          .eq('id', rentalData.property_id);
      } else {
        // Just mark as available for rent
        await supabaseAdmin
          .from('properties')
          .update({
            available_for_rent: true,
            updated_at: new Date().toISOString()
          })
          .eq('id', rentalData.property_id);
      }
    }

    // 4. Initialize calendar if provided
    if (initial_calendar && Array.isArray(initial_calendar)) {
      console.log('📅 Setting up initial calendar...');
      const calendarInserts = initial_calendar.map(calendarItem => ({
        rental_listing_id: rental_id,
        ...calendarItem
      }));
      
      await supabaseAdmin
        .from('rental_calendar')
        .insert(calendarInserts);
    }

    // 5. Set up QR integrations if provided
    if (qr_integrations && Object.keys(qr_integrations).length > 0) {
      console.log('🔗 Setting up QR integrations...');
      await supabaseAdmin
        .from('developer_qr_integrations')
        .insert({
          rental_listing_id: rental_id,
          ...qr_integrations
        });
    }

    // 6. Set up external platform sync if provided
    if (external_sync && Array.isArray(external_sync)) {
      console.log('🔄 Setting up external platform sync...');
      const syncInserts = external_sync.map(platform => ({
        rental_listing_id: rental_id,
        ...platform
      }));
      
      await supabaseAdmin
        .from('external_platform_sync')
        .insert(syncInserts);
    }

    console.log('✅ Complete rental system created successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Complete rental system created successfully',
      rental: newRental,
      created_components: {
        rental_listing: true,
        amenities: !!amenities,
        media: !!(photos || videos || documents),
        property_updates: !!property_updates,
        calendar: !!initial_calendar,
        qr_integrations: !!qr_integrations,
        external_sync: !!external_sync
      }
    }, { status: 201 });

  } catch (error) {
    console.error('💥 ADMIN RENTALS CREATE ERROR:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : 'Unknown'
    });
    return NextResponse.json({ 
      error: 'Internal server error', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}


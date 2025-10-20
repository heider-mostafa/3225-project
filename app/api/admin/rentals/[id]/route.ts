import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// Update complete rental listing with all associated data
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rental_id = params.id;
    const body = await request.json();
    
    console.log('📝 Updating complete rental system:', rental_id);
    console.log('📋 Update data:', body);

    // Use SERVICE_ROLE client to bypass RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Extract all components from the body
    const { 
      amenities, 
      photos, 
      videos, 
      documents,
      calendar_updates,
      property_updates,
      qr_integrations,
      external_sync,
      ...rentalData 
    } = body;

    // 1. Update main rental listing
    if (Object.keys(rentalData).length > 0) {
      console.log('🏠 Updating rental listing data');
      const { error: rentalError } = await supabaseAdmin
        .from('rental_listings')
        .update({
          ...rentalData,
          updated_at: new Date().toISOString()
        })
        .eq('id', rental_id);

      if (rentalError) {
        console.error('❌ Rental update error:', rentalError);
        return NextResponse.json(
          { error: 'Failed to update rental listing', details: rentalError.message },
          { status: 500 }
        );
      }
    }

    // 2. Update rental amenities
    if (amenities && Object.keys(amenities).length > 0) {
      console.log('🛋️ Updating rental amenities');
      
      const { data: existingAmenities, error: fetchError } = await supabaseAdmin
        .from('rental_amenities')
        .select('*')
        .eq('rental_listing_id', rental_id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('❌ Amenities fetch error:', fetchError);
        return NextResponse.json(
          { error: 'Failed to fetch amenities', details: fetchError.message },
          { status: 500 }
        );
      }

      if (existingAmenities) {
        const { error: amenitiesError } = await supabaseAdmin
          .from('rental_amenities')
          .update({
            ...amenities,
            updated_at: new Date().toISOString()
          })
          .eq('rental_listing_id', rental_id);

        if (amenitiesError) {
          console.error('❌ Amenities update error:', amenitiesError);
          return NextResponse.json(
            { error: 'Failed to update amenities', details: amenitiesError.message },
            { status: 500 }
          );
        }
      } else {
        const { error: amenitiesError } = await supabaseAdmin
          .from('rental_amenities')
          .insert({
            rental_listing_id: rental_id,
            ...amenities
          });

        if (amenitiesError) {
          console.error('❌ Amenities insert error:', amenitiesError);
          return NextResponse.json(
            { error: 'Failed to create amenities', details: amenitiesError.message },
            { status: 500 }
          );
        }
      }
    }

    // 3. Update property media (photos, videos, documents) if associated property exists
    if (rentalData.property_id || photos || videos || documents) {
      // Get the property_id from existing rental if not provided
      let property_id = rentalData.property_id;
      if (!property_id) {
        const { data: rental } = await supabaseAdmin
          .from('rental_listings')
          .select('property_id')
          .eq('id', rental_id)
          .single();
        property_id = rental?.property_id;
      }

      if (property_id) {
        // Update photos
        if (photos && Array.isArray(photos)) {
          console.log('📸 Updating property photos');
          for (const photo of photos) {
            if (photo.id) {
              // Update existing photo
              await supabaseAdmin
                .from('property_photos')
                .update(photo)
                .eq('id', photo.id);
            } else if (photo.url) {
              // Insert new photo
              await supabaseAdmin
                .from('property_photos')
                .insert({
                  property_id,
                  ...photo
                });
            }
          }
        }

        // Update videos
        if (videos && Array.isArray(videos)) {
          console.log('🎥 Updating property videos');
          for (const video of videos) {
            if (video.id) {
              await supabaseAdmin
                .from('property_videos')
                .update(video)
                .eq('id', video.id);
            } else if (video.url) {
              await supabaseAdmin
                .from('property_videos')
                .insert({
                  property_id,
                  ...video
                });
            }
          }
        }

        // Update documents
        if (documents && Array.isArray(documents)) {
          console.log('📄 Updating property documents');
          for (const doc of documents) {
            if (doc.id) {
              await supabaseAdmin
                .from('property_documents')
                .update(doc)
                .eq('id', doc.id);
            } else if (doc.url) {
              await supabaseAdmin
                .from('property_documents')
                .insert({
                  property_id,
                  ...doc
                });
            }
          }
        }

        // Update main property data if provided
        if (property_updates && Object.keys(property_updates).length > 0) {
          console.log('🏢 Updating main property data and syncing with rentals');
          const { error: propertyUpdateError } = await supabaseAdmin
            .from('properties')
            .update({
              ...property_updates,
              updated_at: new Date().toISOString()
            })
            .eq('id', property_id);

          if (!propertyUpdateError) {
            // If property was updated successfully, sync with other rental listings for same property
            const syncableFields = ['bedrooms', 'bathrooms', 'square_meters', 'virtual_tour_url'];
            const hasPropertySync = syncableFields.some(field => property_updates[field] !== undefined);
            
            if (hasPropertySync) {
              console.log('🔄 Syncing property changes to other rental listings...');
              
              // Update other rental listings for this property (excluding current one)
              await supabaseAdmin
                .from('rental_listings')
                .update({ 
                  updated_at: new Date().toISOString(),
                  sync_notes: `Property sync from rental ${rental_id}: ${Object.keys(property_updates).filter(key => syncableFields.includes(key)).join(', ')}`
                })
                .eq('property_id', property_id)
                .neq('id', rental_id)
                .eq('is_active', true);
              
              console.log('✅ Other rental listings synced with property changes');
            }
          }
        }
      }
    }

    // 4. Update rental calendar availability
    if (calendar_updates && Array.isArray(calendar_updates)) {
      console.log('📅 Updating rental calendar');
      for (const calendarItem of calendar_updates) {
        if (calendarItem.date) {
          await supabaseAdmin
            .from('rental_calendar')
            .upsert({
              rental_listing_id: rental_id,
              ...calendarItem,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'rental_listing_id,date'
            });
        }
      }
    }

    // 5. Update QR code integrations
    if (qr_integrations && Object.keys(qr_integrations).length > 0) {
      console.log('🔲 Updating QR integrations');
      await supabaseAdmin
        .from('developer_qr_integrations')
        .upsert({
          rental_listing_id: rental_id,
          ...qr_integrations,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'rental_listing_id'
        });
    }

    // 6. Update external platform sync settings
    if (external_sync && Array.isArray(external_sync)) {
      console.log('🔄 Updating external platform sync');
      for (const platform of external_sync) {
        if (platform.platform_name) {
          await supabaseAdmin
            .from('external_platform_sync')
            .upsert({
              rental_listing_id: rental_id,
              ...platform,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'rental_listing_id,platform_name'
            });
        }
      }
    }

    console.log('✅ Complete rental system updated successfully');
    return NextResponse.json({
      success: true,
      message: 'Rental system updated successfully',
      updated_components: {
        rental_listing: !!rentalData && Object.keys(rentalData).length > 0,
        amenities: !!amenities,
        media: !!(photos || videos || documents),
        property: !!property_updates,
        calendar: !!calendar_updates,
        qr_integrations: !!qr_integrations,
        external_sync: !!external_sync
      }
    });

  } catch (error) {
    console.error('❌ Complete rental system update error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

// Get complete rental details with all associated data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rental_id = params.id;
    
    console.log('🔍 Fetching rental with SERVICE_ROLE client for:', rental_id);
    
    // Use SERVICE_ROLE client to bypass RLS for admin operations
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get comprehensive rental data
    const { data: rental, error } = await supabaseAdmin
      .from('rental_listings')
      .select(`
        *,
        rental_amenities (*),
        properties (
          *,
          property_photos (
            id,
            url,
            thumbnail_url,
            alt_text,
            caption,
            category,
            order_index
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
        )
      `)
      .eq('id', rental_id)
      .single();

    if (error) {
      console.error('❌ Rental fetch error:', error);
      return NextResponse.json(
        { error: 'Rental not found' },
        { status: 404 }
      );
    }

    // Get additional rental-specific data using SERVICE_ROLE client
    const [calendarData, qrIntegrations, externalSync, bookings, reviews] = await Promise.all([
      // Get upcoming availability (next 90 days)
      supabaseAdmin
        .from('rental_calendar')
        .select('*')
        .eq('rental_listing_id', rental_id)
        .gte('date', new Date().toISOString().split('T')[0])
        .lte('date', new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date'),
      
      // Get QR integrations
      supabaseAdmin
        .from('developer_qr_integrations')
        .select('*')
        .eq('rental_listing_id', rental_id),
      
      // Get external platform sync status
      supabaseAdmin
        .from('external_platform_sync')
        .select('*')
        .eq('rental_listing_id', rental_id),
      
      // Get recent bookings (last 10)
      supabaseAdmin
        .from('rental_bookings')
        .select(`
          id,
          check_in_date,
          check_out_date,
          booking_status,
          total_amount,
          number_of_guests,
          created_at
        `)
        .eq('rental_listing_id', rental_id)
        .order('created_at', { ascending: false })
        .limit(10),
      
      // Get reviews summary
      supabaseAdmin
        .from('rental_reviews')
        .select(`
          id,
          overall_rating,
          review_text,
          created_at,
          reviewer_user_id
        `)
        .eq('rental_listing_id', rental_id)
        .eq('is_public', true)
        .eq('moderation_status', 'approved')
        .order('created_at', { ascending: false })
        .limit(5)
    ]);

    console.log('📊 Fetched additional data with SERVICE_ROLE:', {
      calendar_count: calendarData.data?.length || 0,
      qr_integrations: qrIntegrations.data?.length || 0,
      external_sync: externalSync.data?.length || 0,
      bookings: bookings.data?.length || 0,
      reviews: reviews.data?.length || 0
    });

    // Assemble comprehensive rental data
    const rentalData = {
      ...rental,
      calendar: {
        upcoming_availability: calendarData.data || [],
        total_available_days: calendarData.data?.filter(day => day.is_available).length || 0
      },
      integrations: {
        qr_codes: qrIntegrations.data || [],
        external_platforms: externalSync.data || []
      },
      bookings: {
        recent: bookings.data || [],
        total_count: rental.total_bookings || 0
      },
      reviews: {
        recent: reviews.data || [],
        average_rating: rental.average_rating || 0,
        total_reviews: reviews.data?.length || 0
      },
      media_summary: {
        photos_count: rental.properties?.property_photos?.length || 0,
        videos_count: rental.properties?.property_videos?.length || 0,
        documents_count: rental.properties?.property_documents?.length || 0
      }
    };

    return NextResponse.json({ 
      rental: rentalData,
      success: true 
    });

  } catch (error) {
    console.error('❌ Get complete rental error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Delete complete rental listing and all associated data
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rental_id = params.id;

    console.log('🗑️ Deleting complete rental system for:', rental_id);

    // Use SERVICE_ROLE client to bypass RLS
    const supabaseAdmin = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get rental info before deletion for cleanup
    const { data: rental } = await supabaseAdmin
      .from('rental_listings')
      .select('property_id')
      .eq('id', rental_id)
      .single();

    // Delete all related data in proper order (foreign key constraints)
    console.log('🧹 Cleaning up related rental data...');
    
    // Delete reviews first (references bookings)
    await supabaseAdmin
      .from('rental_reviews')
      .delete()
      .eq('rental_listing_id', rental_id);
    
    // Get booking IDs for payment deletion
    const { data: bookingIds } = await supabaseAdmin
      .from('rental_bookings')
      .select('id')
      .eq('rental_listing_id', rental_id);
    
    // Delete payments (references bookings)
    if (bookingIds && bookingIds.length > 0) {
      await supabaseAdmin
        .from('rental_payments')
        .delete()
        .in('booking_id', bookingIds.map((b: { id: string }) => b.id));
    }
    
    // Delete bookings
    await supabaseAdmin
      .from('rental_bookings')
      .delete()
      .eq('rental_listing_id', rental_id);
    
    // Delete calendar entries
    await supabaseAdmin
      .from('rental_calendar')
      .delete()
      .eq('rental_listing_id', rental_id);
    
    // Delete amenities
    await supabaseAdmin
      .from('rental_amenities')
      .delete()
      .eq('rental_listing_id', rental_id);
    
    // Delete QR integrations
    await supabaseAdmin
      .from('developer_qr_integrations')
      .delete()
      .eq('rental_listing_id', rental_id);
    
    // Delete external platform sync
    await supabaseAdmin
      .from('external_platform_sync')
      .delete()
      .eq('rental_listing_id', rental_id);

    // Finally delete the main rental listing
    console.log('🏠 Deleting main rental listing...');
    const { error } = await supabaseAdmin
      .from('rental_listings')
      .delete()
      .eq('id', rental_id);

    if (error) {
      console.error('❌ Rental delete error:', error);
      return NextResponse.json(
        { error: 'Failed to delete rental listing', details: error.message },
        { status: 500 }
      );
    }

    // Optional: Mark the property as no longer available for rent
    // (Only if this was the only rental listing for this property)
    if (rental?.property_id) {
      const { data: otherRentals } = await supabaseAdmin
        .from('rental_listings')
        .select('id')
        .eq('property_id', rental.property_id)
        .limit(1);
      
      if (!otherRentals || otherRentals.length === 0) {
        console.log('🏢 Updating property rental availability...');
        await supabaseAdmin
          .from('properties')
          .update({ 
            available_for_rent: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', rental.property_id);
      }
    }

    console.log('✅ Complete rental system deleted successfully');
    return NextResponse.json({
      success: true,
      message: 'Complete rental system deleted successfully',
      deleted_components: [
        'rental_listing',
        'amenities', 
        'calendar_entries',
        'bookings',
        'reviews',
        'payments',
        'qr_integrations',
        'external_sync'
      ]
    });

  } catch (error) {
    console.error('❌ Delete complete rental system error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
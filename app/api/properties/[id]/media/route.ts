import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// Get all media for a property
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property_id = params.id;
    
    const supabase = createRouteHandlerClient({ cookies });

    // Get all media types for the property
    const [photosData, videosData, documentsData] = await Promise.all([
      // Get photos
      supabase
        .from('property_photos')
        .select(`
          id,
          url,
          thumbnail_url,
          alt_text,
          caption,
          category,
          order_index,
          is_primary,
          filename,
          file_size,
          mime_type
        `)
        .eq('property_id', property_id)
        .order('order_index'),
      
      // Get videos  
      supabase
        .from('property_videos')
        .select(`
          id,
          url,
          thumbnail_url,
          title,
          description,
          duration,
          order_index,
          filename,
          file_size,
          mime_type
        `)
        .eq('property_id', property_id)
        .order('order_index'),
      
      // Get documents
      supabase
        .from('property_documents')
        .select(`
          id,
          url,
          filename,
          document_type,
          file_size,
          mime_type
        `)
        .eq('property_id', property_id)
    ]);

    // Check for errors
    if (photosData.error) {
      console.error('Photos fetch error:', photosData.error);
    }
    if (videosData.error) {
      console.error('Videos fetch error:', videosData.error);
    }
    if (documentsData.error) {
      console.error('Documents fetch error:', documentsData.error);
    }

    return NextResponse.json({
      success: true,
      photos: photosData.data || [],
      videos: (videosData.data || []).map(video => ({
        ...video,
        type: 'video'
      })),
      documents: (documentsData.data || []).map(doc => ({
        ...doc,
        type: 'document',
        category: doc.document_type
      })),
      media_summary: {
        photos_count: photosData.data?.length || 0,
        videos_count: videosData.data?.length || 0,
        documents_count: documentsData.data?.length || 0,
        total_count: (photosData.data?.length || 0) + (videosData.data?.length || 0) + (documentsData.data?.length || 0)
      }
    });

  } catch (error) {
    console.error('❌ Get property media error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Update property media and sync with rental listings
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const property_id = params.id;
    const body = await request.json();
    
    console.log('📸 Updating property media and syncing with rentals:', property_id);
    
    // Use SERVICE_ROLE client for media operations
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { photos, videos, documents, virtual_tour_url } = body;
    
    // Update photos if provided
    if (photos && Array.isArray(photos)) {
      console.log('📷 Updating property photos...');
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

    // Update videos if provided
    if (videos && Array.isArray(videos)) {
      console.log('🎥 Updating property videos...');
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

    // Update documents if provided
    if (documents && Array.isArray(documents)) {
      console.log('📄 Updating property documents...');
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

    // Update virtual tour URL if provided
    if (virtual_tour_url !== undefined) {
      console.log('🎮 Updating virtual tour URL...');
      await supabaseAdmin
        .from('properties')
        .update({ 
          virtual_tour_url,
          updated_at: new Date().toISOString()
        })
        .eq('id', property_id);
    }

    // Sync media changes with rental listings
    console.log('🔄 Syncing media changes to rental listings...');
    
    const { data: rentalListings, error: rentalError } = await supabaseAdmin
      .from('rental_listings')
      .select('id')
      .eq('property_id', property_id)
      .eq('is_active', true);

    if (!rentalError && rentalListings && rentalListings.length > 0) {
      console.log(`📋 Found ${rentalListings.length} rental listings to sync media`);
      
      // Update rental listings to indicate media sync
      for (const rental of rentalListings) {
        await supabaseAdmin
          .from('rental_listings')
          .update({ 
            updated_at: new Date().toISOString(),
            sync_notes: `Media sync: photos(${photos?.length || 0}), videos(${videos?.length || 0}), documents(${documents?.length || 0}), virtual_tour(${virtual_tour_url ? 'updated' : 'unchanged'})`
          })
          .eq('id', rental.id);
      }
      
      console.log('✅ Rental listings media sync completed');
    }

    return NextResponse.json({
      success: true,
      message: 'Property media updated and synced with rental listings',
      updated_components: {
        photos: !!photos,
        videos: !!videos,
        documents: !!documents,
        virtual_tour: virtual_tour_url !== undefined,
        rentals_synced: rentalListings?.length || 0
      }
    });

  } catch (error) {
    console.error('❌ Update property media error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
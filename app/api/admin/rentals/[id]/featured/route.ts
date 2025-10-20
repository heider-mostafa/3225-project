import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const listingId = params.id;
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .is('revoked_at', null)
      .single();

    if (!userRole || !['admin', 'super_admin'].includes(userRole.role)) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { featured } = body;

    // Validate featured flag
    if (typeof featured !== 'boolean') {
      return NextResponse.json({ 
        error: 'Invalid featured value. Must be true or false.' 
      }, { status: 400 });
    }

    // Check if listing exists and is approved
    const { data: existingListing, error: fetchError } = await supabase
      .from('rental_listings')
      .select('id, owner_user_id, compliance_status, featured, is_active')
      .eq('id', listingId)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Rental listing not found' }, { status: 404 });
    }

    // Only approved and active listings can be featured
    if (featured && (existingListing.compliance_status !== 'approved' || !existingListing.is_active)) {
      return NextResponse.json({ 
        error: 'Only approved and active listings can be featured' 
      }, { status: 400 });
    }

    // Check featured listing limits (optional business rule)
    if (featured) {
      const { count: featuredCount } = await supabase
        .from('rental_listings')
        .select('id', { count: 'exact', head: true })
        .eq('featured', true);

      // Limit to 20 featured listings (configurable)
      const MAX_FEATURED_LISTINGS = 20;
      if (featuredCount && featuredCount >= MAX_FEATURED_LISTINGS) {
        return NextResponse.json({ 
          error: `Maximum of ${MAX_FEATURED_LISTINGS} featured listings allowed. Please unfeature another listing first.` 
        }, { status: 400 });
      }
    }

    // Update featured status
    const updateData = {
      featured,
      featured_at: featured ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    const { data: updatedListing, error: updateError } = await supabase
      .from('rental_listings')
      .update(updateData)
      .eq('id', listingId)
      .select(`
        *,
        properties (
          title,
          city
        )
      `)
      .single();

    if (updateError) {
      console.error('Error updating rental listing featured status:', updateError);
      return NextResponse.json({ error: 'Failed to update featured status' }, { status: 500 });
    }

    // Log the admin action
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_user_id: user.id,
        action: 'rental_featured_update',
        resource_type: 'rental_listing',
        resource_id: listingId,
        details: {
          old_featured: existingListing.featured,
          new_featured: featured,
          listing_id: listingId,
          listing_title: updatedListing.properties?.title
        }
      })
      .catch(logError => {
        console.warn('Failed to log admin activity:', logError);
        // Don't fail the main operation if logging fails
      });

    // Send notification to owner (optional)
    if (featured !== existingListing.featured) {
      console.log(`Rental listing ${listingId} ${featured ? 'featured' : 'unfeatured'} - notification would be sent to owner`);
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: `Listing ${featured ? 'featured' : 'unfeatured'} successfully`
    });

  } catch (error) {
    console.error('Admin rental featured update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
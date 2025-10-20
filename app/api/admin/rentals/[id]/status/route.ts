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
    const { compliance_status } = body;

    // Validate compliance status
    const validStatuses = ['pending', 'approved', 'rejected', 'expired'];
    if (!compliance_status || !validStatuses.includes(compliance_status)) {
      return NextResponse.json({ 
        error: 'Invalid compliance status. Must be one of: ' + validStatuses.join(', ') 
      }, { status: 400 });
    }

    // Check if listing exists
    const { data: existingListing, error: fetchError } = await supabase
      .from('rental_listings')
      .select('id, owner_user_id, compliance_status')
      .eq('id', listingId)
      .single();

    if (fetchError || !existingListing) {
      return NextResponse.json({ error: 'Rental listing not found' }, { status: 404 });
    }

    // Update compliance status
    const updateData: any = {
      compliance_status,
      updated_at: new Date().toISOString()
    };

    // If approving, also activate the listing
    if (compliance_status === 'approved') {
      updateData.is_active = true;
    }

    // If rejecting, deactivate the listing
    if (compliance_status === 'rejected') {
      updateData.is_active = false;
    }

    const { data: updatedListing, error: updateError } = await supabase
      .from('rental_listings')
      .update(updateData)
      .eq('id', listingId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating rental listing status:', updateError);
      return NextResponse.json({ error: 'Failed to update listing status' }, { status: 500 });
    }

    // Log the admin action
    await supabase
      .from('admin_activity_logs')
      .insert({
        admin_user_id: user.id,
        action: 'rental_status_update',
        resource_type: 'rental_listing',
        resource_id: listingId,
        details: {
          old_status: existingListing.compliance_status,
          new_status: compliance_status,
          listing_id: listingId
        }
      })
      .catch(logError => {
        console.warn('Failed to log admin activity:', logError);
        // Don't fail the main operation if logging fails
      });

    // Send notification to owner (optional - would need notification system)
    if (compliance_status === 'approved' || compliance_status === 'rejected') {
      // TODO: Send email notification to owner
      console.log(`Rental listing ${listingId} ${compliance_status} - notification would be sent to owner`);
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: `Listing ${compliance_status} successfully`
    });

  } catch (error) {
    console.error('Admin rental status update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
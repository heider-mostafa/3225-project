import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const listingId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get listing details
    const { data: listing, error } = await supabase
      .from('community_marketplace')
      .select(`
        id,
        compound_id,
        seller_resident_id,
        title,
        description,
        category,
        listing_type,
        price,
        currency,
        condition_item,
        is_available,
        is_negotiable,
        delivery_method,
        contact_preference,
        image_urls,
        tags,
        view_count,
        created_at,
        updated_at,
        compounds (
          id,
          name,
          address,
          developer_id,
          compound_manager_user_id
        ),
        compound_residents (
          id,
          user_id,
          community_units (
            id,
            unit_number,
            building_name,
            compound_id
          ),
          user_profiles (
            id,
            full_name,
            phone,
            email,
            profile_photo_url
          )
        )
      `)
      .eq('id', listingId)
      .single();

    if (error || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check user access permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const hasCompoundAccess = hasAdminAccess || 
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === listing.compounds.developer_id) ||
        (role.role === 'compound_manager' && listing.compounds.compound_manager_user_id === user.id) ||
        (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === listing.compound_id)
      );

    if (!hasCompoundAccess) {
      return NextResponse.json({ error: 'Access denied to this listing' }, { status: 403 });
    }

    // Check if listing is available
    if (!listing.is_available && !hasAdminAccess) {
      // Allow seller to see their own unavailable listings
      const { data: userResident } = await supabase
        .from('compound_residents')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (!userResident || userResident.id !== listing.seller_resident_id) {
        return NextResponse.json({ error: 'Listing is not available' }, { status: 404 });
      }
    }

    // Increment view count (but not for the seller's own viewing)
    const { data: userResident } = await supabase
      .from('compound_residents')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const isOwnListing = userResident && userResident.id === listing.seller_resident_id;

    if (!isOwnListing) {
      const { error: updateError } = await supabase
        .from('community_marketplace')
        .update({ view_count: listing.view_count + 1 })
        .eq('id', listingId);

      if (!updateError) {
        listing.view_count += 1;
      }
    }

    // Prepare seller contact information based on privacy settings
    let sellerContact: any = {
      unit_info: `${listing.compound_residents.community_units.building_name} - Unit ${listing.compound_residents.community_units.unit_number}`,
      contact_name: listing.compound_residents.user_profiles.full_name,
      contact_available: false
    };

    // Show contact info if:
    // 1. User is admin/manager
    // 2. User is the seller
    // 3. Contact preference allows it
    const showContactInfo = hasAdminAccess || isOwnListing || 
      ['phone', 'both'].includes(listing.contact_preference);

    if (showContactInfo && !isOwnListing) {
      sellerContact = {
        ...sellerContact,
        contact_available: true,
        phone: listing.compound_residents.user_profiles.phone,
        email: listing.compound_residents.user_profiles.email,
        contact_preference: listing.contact_preference
      };
    }

    // Calculate time ago
    const createdDate = new Date(listing.created_at);
    const now = new Date();
    const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
    
    let timeAgo = '';
    if (diffHours < 1) timeAgo = 'Just now';
    else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
    else if (diffHours < 168) timeAgo = `${Math.floor(diffHours / 24)}d ago`;
    else timeAgo = createdDate.toLocaleDateString();

    // Get similar listings in the same compound and category
    const { data: similarListings } = await supabase
      .from('community_marketplace')
      .select(`
        id,
        title,
        price,
        currency,
        listing_type,
        image_urls,
        created_at
      `)
      .eq('compound_id', listing.compound_id)
      .eq('category', listing.category)
      .eq('is_available', true)
      .neq('id', listingId)
      .order('created_at', { ascending: false })
      .limit(5);

    const responseData = {
      success: true,
      listing: {
        ...listing,
        time_ago: timeAgo,
        is_own_listing: isOwnListing,
        seller_contact: sellerContact
      },
      similar_listings: similarListings || []
    };

    // Remove sensitive seller info for non-authorized viewers
    if (!hasAdminAccess && !isOwnListing) {
      delete responseData.listing.compound_residents.user_profiles.email;
      if (listing.contact_preference === 'app_message') {
        delete responseData.listing.compound_residents.user_profiles.phone;
      }
    }

    return NextResponse.json(responseData);

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
    const listingId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get existing listing to verify ownership
    const { data: existingListing } = await supabase
      .from('community_marketplace')
      .select(`
        id,
        seller_resident_id,
        compound_id,
        compounds (
          developer_id,
          compound_manager_user_id
        )
      `)
      .eq('id', listingId)
      .single();

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check permissions
    const { data: userResident } = await supabase
      .from('compound_residents')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isOwner = userResident && userResident.id === existingListing.seller_resident_id;
    const isManager = userRoles?.some((role: UserRole) => 
      (role.role === 'developer' && role.developer_id === existingListing.compounds.developer_id) ||
      (role.role === 'compound_manager' && existingListing.compounds.compound_manager_user_id === user.id)
    );

    if (!hasAdminAccess && !isOwner && !isManager) {
      return NextResponse.json({ 
        error: 'You can only update your own listings' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      title,
      description,
      category,
      listing_type,
      price,
      currency,
      condition_item,
      is_available,
      is_negotiable,
      delivery_method,
      contact_preference,
      image_urls,
      tags
    } = body;

    // Build update object with only provided fields
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (listing_type !== undefined) updateData.listing_type = listing_type;
    if (price !== undefined) updateData.price = price ? parseFloat(price) : 0;
    if (currency !== undefined) updateData.currency = currency;
    if (condition_item !== undefined) updateData.condition_item = condition_item;
    if (is_negotiable !== undefined) updateData.is_negotiable = is_negotiable;
    if (delivery_method !== undefined) updateData.delivery_method = delivery_method;
    if (contact_preference !== undefined) updateData.contact_preference = contact_preference;
    if (image_urls !== undefined) updateData.image_urls = image_urls;
    if (tags !== undefined) updateData.tags = tags;
    
    // Only managers and admins can change availability
    if (is_available !== undefined && (hasAdminAccess || isManager || isOwner)) {
      updateData.is_available = is_available;
    }

    // Validate category if provided
    if (updateData.category) {
      const validCategories = [
        'electronics', 'furniture', 'clothing', 'books', 'toys', 'sports', 
        'appliances', 'vehicles', 'services', 'real_estate', 'other'
      ];
      
      if (!validCategories.includes(updateData.category)) {
        return NextResponse.json({ 
          error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate listing type if provided
    if (updateData.listing_type) {
      const validListingTypes = ['sale', 'rent', 'free', 'wanted', 'service'];
      
      if (!validListingTypes.includes(updateData.listing_type)) {
        return NextResponse.json({ 
          error: `Invalid listing type. Must be one of: ${validListingTypes.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Update listing
    const { data: updatedListing, error: updateError } = await supabase
      .from('community_marketplace')
      .update(updateData)
      .eq('id', listingId)
      .select(`
        id,
        compound_id,
        seller_resident_id,
        title,
        description,
        category,
        listing_type,
        price,
        currency,
        condition_item,
        is_available,
        is_negotiable,
        delivery_method,
        contact_preference,
        image_urls,
        tags,
        view_count,
        created_at,
        updated_at,
        compounds (
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Listing update error:', updateError);
      return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: 'Listing updated successfully'
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
    const listingId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get existing listing to verify ownership
    const { data: existingListing } = await supabase
      .from('community_marketplace')
      .select(`
        id,
        title,
        seller_resident_id,
        compounds (
          developer_id,
          compound_manager_user_id
        )
      `)
      .eq('id', listingId)
      .single();

    if (!existingListing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Check permissions
    const { data: userResident } = await supabase
      .from('compound_residents')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isOwner = userResident && userResident.id === existingListing.seller_resident_id;
    const isManager = userRoles?.some((role: UserRole) => 
      (role.role === 'developer' && role.developer_id === existingListing.compounds.developer_id) ||
      (role.role === 'compound_manager' && existingListing.compounds.compound_manager_user_id === user.id)
    );

    if (!hasAdminAccess && !isOwner && !isManager) {
      return NextResponse.json({ 
        error: 'You can only delete your own listings' 
      }, { status: 403 });
    }

    // Soft delete by setting is_available = false
    const { data: deletedListing, error: deleteError } = await supabase
      .from('community_marketplace')
      .update({ 
        is_available: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .select('id, title')
      .single();

    if (deleteError) {
      console.error('Listing deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Listing "${existingListing.title}" has been removed from the marketplace`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
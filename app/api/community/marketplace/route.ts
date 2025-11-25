import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get compound_id filter
    const compoundId = searchParams.get('compound_id');
    
    // Check user permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isResident = userRoles?.some((role: UserRole) => 
      ['resident_owner', 'resident_tenant'].includes(role.role)
    );

    // Get user's compound access if resident
    const { data: userResident } = isResident ? await supabase
      .from('compound_residents')
      .select('id, compound_id:community_units(compound_id)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single() : { data: null };

    if (!compoundId && !hasAdminAccess) {
      // For residents, default to their compound
      if (isResident && userResident?.compound_id) {
        // Use resident's compound
      } else {
        return NextResponse.json({ 
          error: 'compound_id is required' 
        }, { status: 400 });
      }
    }

    // Verify access to compound
    if (compoundId) {
      const { data: compound } = await supabase
        .from('compounds')
        .select('developer_id, compound_manager_user_id')
        .eq('id', compoundId)
        .single();

      if (!compound) {
        return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
      }

      if (!hasAdminAccess) {
        const canAccess = userRoles?.some((role: UserRole) => 
          (role.role === 'developer' && role.developer_id === compound.developer_id) ||
          (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id) ||
          (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === compoundId)
        );

        if (!canAccess) {
          return NextResponse.json({ 
            error: 'Access denied to this compound' 
          }, { status: 403 });
        }
      }
    }

    let query = supabase
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
          address
        ),
        compound_residents (
          id,
          community_units (
            unit_number,
            building_name
          ),
          user_profiles (
            id,
            full_name,
            profile_photo_url
          )
        )
      `, { count: 'exact' });

    // Apply compound filter
    if (compoundId) {
      query = query.eq('compound_id', compoundId);
    } else if (isResident && userResident?.compound_id) {
      query = query.eq('compound_id', userResident.compound_id);
    }

    // Only show available items to regular users
    if (!hasAdminAccess) {
      query = query.eq('is_available', true);
    }

    // Apply filters
    const category = searchParams.get('category');
    const listingType = searchParams.get('listing_type');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const condition = searchParams.get('condition');
    const isNegotiable = searchParams.get('is_negotiable');
    const deliveryMethod = searchParams.get('delivery_method');
    const search = searchParams.get('search');
    const sellerId = searchParams.get('seller_id');

    if (category) {
      query = query.eq('category', category);
    }

    if (listingType) {
      query = query.eq('listing_type', listingType);
    }

    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }

    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }

    if (condition) {
      query = query.eq('condition_item', condition);
    }

    if (isNegotiable !== null) {
      query = query.eq('is_negotiable', isNegotiable === 'true');
    }

    if (deliveryMethod) {
      query = query.contains('delivery_method', [deliveryMethod]);
    }

    if (sellerId) {
      query = query.eq('seller_resident_id', sellerId);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? { ascending: true } : { ascending: false };

    switch (sortBy) {
      case 'price':
        query = query.order('price', sortOrder);
        break;
      case 'title':
        query = query.order('title', sortOrder);
        break;
      case 'category':
        query = query.order('category', sortOrder);
        break;
      case 'view_count':
        query = query.order('view_count', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('created_at', { ascending: false });
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: listings, error, count } = await query;

    if (error) {
      console.error('Marketplace fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch marketplace listings' }, { status: 500 });
    }

    // Process listings to add additional information
    const processedListings = (listings || []).map((listing: any) => {
      // Hide seller personal info unless it's user's own listing or they're admin
      const isOwnListing = userResident && listing.seller_resident_id === userResident.id;
      const showSellerInfo = hasAdminAccess || isOwnListing;

      if (!showSellerInfo) {
        // Only show unit info for contact purposes
        listing.compound_residents = {
          ...listing.compound_residents,
          user_profiles: {
            id: listing.compound_residents.user_profiles.id,
            full_name: listing.compound_residents.user_profiles.full_name.charAt(0) + '***', // Partial anonymization
            profile_photo_url: null
          }
        };
      }

      // Add relative time
      const createdDate = new Date(listing.created_at);
      const now = new Date();
      const diffHours = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60));
      
      let timeAgo = '';
      if (diffHours < 1) timeAgo = 'Just now';
      else if (diffHours < 24) timeAgo = `${diffHours}h ago`;
      else if (diffHours < 168) timeAgo = `${Math.floor(diffHours / 24)}d ago`;
      else timeAgo = createdDate.toLocaleDateString();

      return {
        ...listing,
        time_ago: timeAgo,
        is_own_listing: isOwnListing
      };
    });

    return NextResponse.json({
      success: true,
      listings: processedListings,
      pagination: {
        page,
        limit,
        total: count,
        pages: Math.ceil((count || 0) / limit)
      }
    });

  } catch (error) {
    console.error('API error:', error);
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
      compound_id,
      title,
      description,
      category,
      listing_type,
      price,
      currency,
      condition_item,
      is_negotiable,
      delivery_method,
      contact_preference,
      image_urls,
      tags
    } = body;

    // Validate required fields
    if (!title || !description || !category || !listing_type || (!price && listing_type !== 'free')) {
      return NextResponse.json({ 
        error: 'title, description, category, listing_type, and price (if not free) are required' 
      }, { status: 400 });
    }

    // Get user's resident record
    const { data: resident } = await supabase
      .from('compound_residents')
      .select(`
        id,
        user_id,
        community_units (
          compound_id,
          unit_number,
          building_name
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'You must be a registered resident to create marketplace listings' 
      }, { status: 403 });
    }

    // Use user's compound if not specified
    const finalCompoundId = compound_id || resident.community_units.compound_id;

    // Validate category
    const validCategories = [
      'electronics', 'furniture', 'clothing', 'books', 'toys', 'sports', 
      'appliances', 'vehicles', 'services', 'real_estate', 'other'
    ];
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      }, { status: 400 });
    }

    // Validate listing type
    const validListingTypes = ['sale', 'rent', 'free', 'wanted', 'service'];
    
    if (!validListingTypes.includes(listing_type)) {
      return NextResponse.json({ 
        error: `Invalid listing type. Must be one of: ${validListingTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate condition
    const validConditions = ['new', 'excellent', 'good', 'fair', 'poor', 'not_applicable'];
    
    if (condition_item && !validConditions.includes(condition_item)) {
      return NextResponse.json({ 
        error: `Invalid condition. Must be one of: ${validConditions.join(', ')}` 
      }, { status: 400 });
    }

    // Validate delivery methods
    const validDeliveryMethods = ['pickup', 'delivery', 'meeting', 'shipping'];
    const deliveryMethods = Array.isArray(delivery_method) ? delivery_method : ['pickup'];
    
    const invalidMethods = deliveryMethods.filter((method: string) => !validDeliveryMethods.includes(method));
    if (invalidMethods.length > 0) {
      return NextResponse.json({ 
        error: `Invalid delivery methods: ${invalidMethods.join(', ')}` 
      }, { status: 400 });
    }

    // Validate contact preference
    const validContactPreferences = ['phone', 'app_message', 'both'];
    const contactPref = contact_preference || 'both';
    
    if (!validContactPreferences.includes(contactPref)) {
      return NextResponse.json({ 
        error: `Invalid contact preference. Must be one of: ${validContactPreferences.join(', ')}` 
      }, { status: 400 });
    }

    // Validate price
    let finalPrice = 0;
    if (listing_type !== 'free' && listing_type !== 'wanted') {
      finalPrice = parseFloat(price);
      if (isNaN(finalPrice) || finalPrice < 0) {
        return NextResponse.json({ 
          error: 'Price must be a positive number' 
        }, { status: 400 });
      }
    }

    // Create marketplace listing
    const { data: listing, error: listingError } = await supabase
      .from('community_marketplace')
      .insert({
        compound_id: finalCompoundId,
        seller_resident_id: resident.id,
        title,
        description,
        category,
        listing_type,
        price: finalPrice,
        currency: currency || 'EGP',
        condition_item: condition_item || 'not_applicable',
        is_available: true,
        is_negotiable: is_negotiable !== false, // Default to true
        delivery_method: deliveryMethods,
        contact_preference: contactPref,
        image_urls: image_urls || [],
        tags: tags || [],
        view_count: 0
      })
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
        ),
        compound_residents (
          community_units (
            unit_number,
            building_name
          ),
          user_profiles (
            full_name
          )
        )
      `)
      .single();

    if (listingError) {
      console.error('Listing creation error:', listingError);
      return NextResponse.json({ error: 'Failed to create marketplace listing' }, { status: 500 });
    }

    // TODO: Send notification to compound residents about new listing
    // TODO: Auto-moderate listing content
    // TODO: Schedule listing expiration reminder

    return NextResponse.json({
      success: true,
      listing,
      message: 'Marketplace listing created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
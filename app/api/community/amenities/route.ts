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

    // Get compound_id filter - required for non-admin users
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

    if (!compoundId && !hasAdminAccess) {
      return NextResponse.json({ 
        error: 'compound_id is required' 
      }, { status: 400 });
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
      .from('compound_amenities')
      .select(`
        id,
        compound_id,
        name,
        category,
        description,
        location,
        capacity,
        booking_required,
        advance_booking_days,
        max_booking_duration_hours,
        operating_hours,
        pricing,
        rules,
        image_urls,
        is_active,
        requires_approval,
        created_at,
        updated_at,
        compounds (
          id,
          name,
          address
        )
      `, { count: 'exact' });

    // Apply compound filter
    if (compoundId) {
      query = query.eq('compound_id', compoundId);
    }

    // Apply filters
    const category = searchParams.get('category');
    const bookingRequired = searchParams.get('booking_required');
    const isActive = searchParams.get('is_active');

    if (category) {
      query = query.eq('category', category);
    }

    if (bookingRequired !== null) {
      query = query.eq('booking_required', bookingRequired === 'true');
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    } else {
      // Default to only active amenities for residents
      const isResident = userRoles?.some((role: UserRole) => 
        ['resident_owner', 'resident_tenant'].includes(role.role)
      );
      if (isResident) {
        query = query.eq('is_active', true);
      }
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'name';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? { ascending: false } : { ascending: true };

    switch (sortBy) {
      case 'name':
        query = query.order('name', sortOrder);
        break;
      case 'category':
        query = query.order('category', sortOrder);
        break;
      case 'capacity':
        query = query.order('capacity', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('name', { ascending: true });
    }

    // Execute query
    const { data: amenities, error, count } = await query;

    if (error) {
      console.error('Amenities fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch amenities' }, { status: 500 });
    }

    // For each amenity, get current availability if booking is required
    const amenitiesWithAvailability = await Promise.all(
      (amenities || []).map(async (amenity: any) => {
        if (!amenity.booking_required) {
          return { ...amenity, availability: null };
        }

        // Get today's bookings for this amenity
        const today = new Date().toISOString().split('T')[0];
        const { data: todayBookings } = await supabase
          .from('amenity_bookings')
          .select('booking_date, start_time, end_time, status')
          .eq('amenity_id', amenity.id)
          .eq('booking_date', today)
          .in('status', ['confirmed', 'pending']);

        return {
          ...amenity,
          availability: {
            today_bookings: todayBookings || [],
            is_available_now: (todayBookings || []).length === 0 // Simplified check
          }
        };
      })
    );

    return NextResponse.json({
      success: true,
      amenities: amenitiesWithAvailability,
      total: count
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
      name,
      category,
      description,
      location,
      capacity,
      booking_required,
      advance_booking_days,
      max_booking_duration_hours,
      operating_hours,
      pricing,
      rules,
      image_urls,
      requires_approval
    } = body;

    // Validate required fields
    if (!compound_id || !name || !category) {
      return NextResponse.json({ 
        error: 'compound_id, name, and category are required' 
      }, { status: 400 });
    }

    // Check user permissions
    const { data: compound } = await supabase
      .from('compounds')
      .select('developer_id, compound_manager_user_id')
      .eq('id', compound_id)
      .single();

    if (!compound) {
      return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
    }

    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const canAddAmenity = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === compound.developer_id) ||
        (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id)
      );

    if (!canAddAmenity) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to add amenities to this compound' 
      }, { status: 403 });
    }

    // Validate category
    const validCategories = [
      'sports', 'recreation', 'wellness', 'business', 'social', 'outdoor', 'kids', 'other'
    ];
    
    if (!validCategories.includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      }, { status: 400 });
    }

    // Create amenity
    const { data: amenity, error: amenityError } = await supabase
      .from('compound_amenities')
      .insert({
        compound_id,
        name,
        category,
        description,
        location,
        capacity: capacity ? parseInt(capacity) : null,
        booking_required: booking_required || false,
        advance_booking_days: advance_booking_days ? parseInt(advance_booking_days) : 1,
        max_booking_duration_hours: max_booking_duration_hours ? parseInt(max_booking_duration_hours) : 2,
        operating_hours: operating_hours || { start: '06:00', end: '22:00' },
        pricing: pricing || { type: 'free' },
        rules: rules || [],
        image_urls: image_urls || [],
        requires_approval: requires_approval || false,
        is_active: true
      })
      .select(`
        id,
        compound_id,
        name,
        category,
        description,
        location,
        capacity,
        booking_required,
        advance_booking_days,
        max_booking_duration_hours,
        operating_hours,
        pricing,
        rules,
        image_urls,
        is_active,
        requires_approval,
        created_at,
        updated_at,
        compounds (
          id,
          name
        )
      `)
      .single();

    if (amenityError) {
      console.error('Amenity creation error:', amenityError);
      return NextResponse.json({ error: 'Failed to create amenity' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      amenity
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
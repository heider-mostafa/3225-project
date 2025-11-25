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

    // Get filters
    const amenityId = searchParams.get('amenity_id');
    const compoundId = searchParams.get('compound_id');
    const residentId = searchParams.get('resident_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');

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

    // Get user's resident record if they are a resident
    const { data: userResident } = isResident ? await supabase
      .from('compound_residents')
      .select('id, compound_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single() : { data: null };

    let query = supabase
      .from('amenity_bookings')
      .select(`
        id,
        amenity_id,
        resident_id,
        booking_date,
        start_time,
        end_time,
        duration_hours,
        guest_count,
        special_requests,
        status,
        approval_notes,
        approved_by_user_id,
        approved_at,
        cancelled_at,
        cancellation_reason,
        created_at,
        updated_at,
        compound_amenities (
          id,
          name,
          category,
          compound_id,
          compounds (
            id,
            name,
            address
          )
        ),
        compound_residents (
          id,
          user_id,
          community_units (
            id,
            unit_number,
            building_name
          ),
          user_profiles (
            id,
            full_name,
            email,
            phone
          )
        )
      `, { count: 'exact' });

    // Apply access control
    if (!hasAdminAccess) {
      if (isResident && userResident) {
        // Residents can only see bookings in their compound
        query = query.eq('compound_amenities.compound_id', userResident.compound_id);
      } else {
        // Check compound manager access
        const isCompoundManager = userRoles?.some((role: UserRole) => role.role === 'compound_manager');
        if (isCompoundManager) {
          // Get compounds managed by this user
          const { data: managedCompounds } = await supabase
            .from('compounds')
            .select('id')
            .eq('compound_manager_user_id', user.id);
          
          const compoundIds = managedCompounds?.map((c: any) => c.id) || [];
          if (compoundIds.length > 0) {
            query = query.in('compound_amenities.compound_id', compoundIds);
          } else {
            return NextResponse.json({ bookings: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
          }
        } else {
          return NextResponse.json({ 
            error: 'Access denied' 
          }, { status: 403 });
        }
      }
    }

    // Apply filters
    if (amenityId) {
      query = query.eq('amenity_id', amenityId);
    }

    if (compoundId) {
      query = query.eq('compound_amenities.compound_id', compoundId);
    }

    if (residentId) {
      query = query.eq('resident_id', residentId);
    } else if (isResident && userResident && !hasAdminAccess) {
      // Regular residents can only see their own bookings unless they're viewing public data
      const viewType = searchParams.get('view_type');
      if (viewType !== 'public') {
        query = query.eq('resident_id', userResident.id);
      }
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.eq('booking_date', date);
    } else {
      // Apply date range
      if (startDate) {
        query = query.gte('booking_date', startDate);
      }
      if (endDate) {
        query = query.lte('booking_date', endDate);
      } else {
        // Default: show bookings from today onwards
        const today = new Date().toISOString().split('T')[0];
        query = query.gte('booking_date', today);
      }
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'booking_date';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? { ascending: false } : { ascending: true };

    if (sortBy === 'booking_date') {
      query = query.order('booking_date', sortOrder)
        .order('start_time', { ascending: true });
    } else if (sortBy === 'created_at') {
      query = query.order('created_at', sortOrder);
    } else if (sortBy === 'status') {
      query = query.order('status', sortOrder);
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: bookings, error, count } = await query;

    if (error) {
      console.error('Bookings fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      bookings: bookings || [],
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
      amenity_id,
      booking_date,
      start_time,
      end_time,
      guest_count,
      special_requests
    } = body;

    // Validate required fields
    if (!amenity_id || !booking_date || !start_time || !end_time) {
      return NextResponse.json({ 
        error: 'amenity_id, booking_date, start_time, and end_time are required' 
      }, { status: 400 });
    }

    // Get amenity info and check if it requires booking
    const { data: amenity } = await supabase
      .from('compound_amenities')
      .select(`
        id,
        name,
        compound_id,
        booking_required,
        capacity,
        advance_booking_days,
        max_booking_duration_hours,
        operating_hours,
        requires_approval,
        is_active,
        compounds (
          id,
          name
        )
      `)
      .eq('id', amenity_id)
      .single();

    if (!amenity) {
      return NextResponse.json({ error: 'Amenity not found' }, { status: 404 });
    }

    if (!amenity.is_active) {
      return NextResponse.json({ error: 'Amenity is not available for booking' }, { status: 400 });
    }

    if (!amenity.booking_required) {
      return NextResponse.json({ error: 'This amenity does not require booking' }, { status: 400 });
    }

    // Get user's resident record
    const { data: resident } = await supabase
      .from('compound_residents')
      .select(`
        id,
        compound_id,
        user_id,
        resident_type,
        is_active,
        community_units (
          id,
          compound_id
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('community_units.compound_id', amenity.compound_id)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'You must be a resident of this compound to book amenities' 
      }, { status: 403 });
    }

    // Validate booking date (check advance booking limit)
    const bookingDateObj = new Date(booking_date);
    const today = new Date();
    const maxAdvanceDate = new Date();
    maxAdvanceDate.setDate(today.getDate() + (amenity.advance_booking_days || 30));

    if (bookingDateObj < today) {
      return NextResponse.json({ 
        error: 'Cannot book amenities for past dates' 
      }, { status: 400 });
    }

    if (bookingDateObj > maxAdvanceDate) {
      return NextResponse.json({ 
        error: `Cannot book more than ${amenity.advance_booking_days || 30} days in advance` 
      }, { status: 400 });
    }

    // Calculate duration and validate
    const startTimeObj = new Date(`${booking_date} ${start_time}`);
    const endTimeObj = new Date(`${booking_date} ${end_time}`);
    const durationHours = (endTimeObj.getTime() - startTimeObj.getTime()) / (1000 * 60 * 60);

    if (durationHours <= 0) {
      return NextResponse.json({ 
        error: 'End time must be after start time' 
      }, { status: 400 });
    }

    if (amenity.max_booking_duration_hours && durationHours > amenity.max_booking_duration_hours) {
      return NextResponse.json({ 
        error: `Maximum booking duration is ${amenity.max_booking_duration_hours} hours` 
      }, { status: 400 });
    }

    // Check for conflicting bookings
    const { data: conflictingBookings } = await supabase
      .from('amenity_bookings')
      .select('id')
      .eq('amenity_id', amenity_id)
      .eq('booking_date', booking_date)
      .in('status', ['confirmed', 'pending'])
      .or(`start_time.lte.${end_time},end_time.gte.${start_time}`);

    if (conflictingBookings && conflictingBookings.length > 0) {
      return NextResponse.json({ 
        error: 'Time slot is not available. Please choose a different time.' 
      }, { status: 409 });
    }

    // Create booking
    const initialStatus = amenity.requires_approval ? 'pending' : 'confirmed';

    const { data: booking, error: bookingError } = await supabase
      .from('amenity_bookings')
      .insert({
        amenity_id,
        resident_id: resident.id,
        booking_date,
        start_time,
        end_time,
        duration_hours: durationHours,
        guest_count: guest_count || 1,
        special_requests,
        status: initialStatus
      })
      .select(`
        id,
        amenity_id,
        resident_id,
        booking_date,
        start_time,
        end_time,
        duration_hours,
        guest_count,
        special_requests,
        status,
        created_at,
        updated_at,
        compound_amenities (
          id,
          name,
          category
        ),
        compound_residents (
          id,
          user_profiles (
            full_name
          )
        )
      `)
      .single();

    if (bookingError) {
      console.error('Booking creation error:', bookingError);
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
    }

    // TODO: Send notification to compound manager if approval is required
    // TODO: Send confirmation notification to resident

    return NextResponse.json({
      success: true,
      booking,
      message: initialStatus === 'pending' 
        ? 'Booking submitted for approval' 
        : 'Booking confirmed successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
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
      .select('compound_id:community_units(compound_id)')
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
      .from('community_events')
      .select(`
        id,
        compound_id,
        title,
        description,
        event_type,
        category,
        event_status,
        start_datetime,
        end_datetime,
        location,
        max_participants,
        registration_required,
        registration_deadline,
        entry_fee,
        age_restriction,
        image_urls,
        contact_info,
        created_by_user_id,
        created_at,
        updated_at,
        compounds (
          id,
          name,
          address
        ),
        user_profiles!community_events_created_by_user_id_fkey (
          id,
          full_name,
          profile_photo_url
        )
      `, { count: 'exact' });

    // Apply compound filter
    if (compoundId) {
      query = query.eq('compound_id', compoundId);
    } else if (isResident && userResident?.compound_id) {
      query = query.eq('compound_id', userResident.compound_id);
    }

    // For residents, only show published events
    if (isResident && !hasAdminAccess) {
      query = query.eq('event_status', 'published');
    }

    // Apply filters
    const eventType = searchParams.get('event_type');
    const category = searchParams.get('category');
    const eventStatus = searchParams.get('event_status');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');
    const registrationRequired = searchParams.get('registration_required');
    const upcoming = searchParams.get('upcoming'); // true/false

    if (eventType) {
      query = query.eq('event_type', eventType);
    }

    if (category) {
      query = query.eq('category', category);
    }

    if (eventStatus && !isResident) {
      query = query.eq('event_status', eventStatus);
    }

    if (upcoming === 'true') {
      const now = new Date().toISOString();
      query = query.gte('start_datetime', now);
    }

    if (dateFrom) {
      query = query.gte('start_datetime', dateFrom);
    }

    if (dateTo) {
      query = query.lte('end_datetime', dateTo);
    }

    if (registrationRequired !== null) {
      query = query.eq('registration_required', registrationRequired === 'true');
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'start_datetime';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? { ascending: false } : { ascending: true };

    switch (sortBy) {
      case 'start_datetime':
        query = query.order('start_datetime', sortOrder);
        break;
      case 'title':
        query = query.order('title', sortOrder);
        break;
      case 'category':
        query = query.order('category', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('start_datetime', { ascending: true });
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: events, error, count } = await query;

    if (error) {
      console.error('Events fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // Get registration counts for each event
    const eventsWithRegistrations = await Promise.all(
      (events || []).map(async (event: any) => {
        if (!event.registration_required) {
          return { ...event, registration_count: null, user_registered: false };
        }

        const { count: registrationCount } = await supabase
          .from('event_registrations')
          .select('id', { count: 'exact' })
          .eq('event_id', event.id)
          .eq('registration_status', 'confirmed');

        // Check if current user is registered (if resident)
        let userRegistered = false;
        if (isResident && userResident) {
          const { data: userRegistration } = await supabase
            .from('event_registrations')
            .select('id')
            .eq('event_id', event.id)
            .eq('resident_id', userResident.id)
            .eq('registration_status', 'confirmed')
            .single();

          userRegistered = !!userRegistration;
        }

        return {
          ...event,
          registration_count: registrationCount,
          user_registered: userRegistered,
          is_full: event.max_participants ? (registrationCount || 0) >= event.max_participants : false
        };
      })
    );

    return NextResponse.json({
      success: true,
      events: eventsWithRegistrations,
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
      event_type,
      category,
      start_datetime,
      end_datetime,
      location,
      max_participants,
      registration_required,
      registration_deadline,
      entry_fee,
      age_restriction,
      image_urls,
      contact_info
    } = body;

    // Validate required fields
    if (!compound_id || !title || !start_datetime || !end_datetime) {
      return NextResponse.json({ 
        error: 'compound_id, title, start_datetime, and end_datetime are required' 
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

    const canCreateEvent = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === compound.developer_id) ||
        (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id) ||
        (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === compound_id)
      );

    if (!canCreateEvent) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to create events for this compound' 
      }, { status: 403 });
    }

    // Validate event type
    const validTypes = ['social', 'educational', 'sports', 'cultural', 'maintenance', 'meeting', 'celebration', 'other'];
    
    if (event_type && !validTypes.includes(event_type)) {
      return NextResponse.json({ 
        error: `Invalid event type. Must be one of: ${validTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate category
    const validCategories = ['family', 'adults_only', 'kids', 'seniors', 'all_ages', 'residents_only', 'open_community'];
    
    if (category && !validCategories.includes(category)) {
      return NextResponse.json({ 
        error: `Invalid category. Must be one of: ${validCategories.join(', ')}` 
      }, { status: 400 });
    }

    // Validate datetime
    const startDate = new Date(start_datetime);
    const endDate = new Date(end_datetime);
    const now = new Date();

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid datetime format' 
      }, { status: 400 });
    }

    if (startDate <= now) {
      return NextResponse.json({ 
        error: 'Event start time must be in the future' 
      }, { status: 400 });
    }

    if (endDate <= startDate) {
      return NextResponse.json({ 
        error: 'Event end time must be after start time' 
      }, { status: 400 });
    }

    // Validate registration deadline if provided
    let regDeadline = null;
    if (registration_deadline) {
      regDeadline = new Date(registration_deadline);
      if (isNaN(regDeadline.getTime()) || regDeadline >= startDate) {
        return NextResponse.json({ 
          error: 'Registration deadline must be before event start time' 
        }, { status: 400 });
      }
    }

    // Determine initial status (residents create as draft, managers/developers as published)
    const isManager = userRoles?.some((role: UserRole) => 
      ['compound_manager', 'developer', 'admin', 'super_admin'].includes(role.role)
    );

    const initialStatus = isManager ? 'published' : 'draft';

    // Create event
    const { data: event, error: eventError } = await supabase
      .from('community_events')
      .insert({
        compound_id,
        title,
        description,
        event_type: event_type || 'social',
        category: category || 'all_ages',
        event_status: initialStatus,
        start_datetime,
        end_datetime,
        location,
        max_participants: max_participants ? parseInt(max_participants) : null,
        registration_required: registration_required || false,
        registration_deadline: regDeadline?.toISOString(),
        entry_fee: entry_fee ? parseFloat(entry_fee) : 0,
        age_restriction,
        image_urls: image_urls || [],
        contact_info,
        created_by_user_id: user.id
      })
      .select(`
        id,
        compound_id,
        title,
        description,
        event_type,
        category,
        event_status,
        start_datetime,
        end_datetime,
        location,
        max_participants,
        registration_required,
        registration_deadline,
        entry_fee,
        age_restriction,
        image_urls,
        contact_info,
        created_by_user_id,
        created_at,
        updated_at,
        compounds (
          id,
          name
        ),
        user_profiles!community_events_created_by_user_id_fkey (
          full_name
        )
      `)
      .single();

    if (eventError) {
      console.error('Event creation error:', eventError);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    // TODO: Send notifications to residents if event is published
    // TODO: Auto-register creator if registration is required and they are a resident

    return NextResponse.json({
      success: true,
      event,
      message: initialStatus === 'published' 
        ? 'Event created and published successfully' 
        : 'Event created as draft. Pending approval for publication.'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
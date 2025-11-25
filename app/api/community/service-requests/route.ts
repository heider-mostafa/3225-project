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

    // Check user permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isCompoundManager = userRoles?.some((role: UserRole) => role.role === 'compound_manager');
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
      .from('community_service_requests')
      .select(`
        id,
        resident_id,
        unit_id,
        service_type,
        title,
        description,
        priority,
        status,
        scheduled_date,
        completed_at,
        estimated_cost,
        actual_cost,
        provider_notes,
        resident_rating,
        resident_feedback,
        images,
        created_at,
        updated_at,
        compound_residents (
          id,
          user_id,
          community_units (
            id,
            unit_number,
            building_name,
            compound_id,
            compounds (
              id,
              name,
              address
            )
          ),
          user_profiles (
            id,
            full_name,
            phone,
            email
          )
        )
      `, { count: 'exact' });

    // Apply access control
    if (hasAdminAccess) {
      // Admins can see all requests
    } else if (isCompoundManager) {
      // Compound managers can see requests for their compounds
      const { data: managedCompounds } = await supabase
        .from('compounds')
        .select('id')
        .eq('compound_manager_user_id', user.id);
      
      const compoundIds = managedCompounds?.map((c: any) => c.id) || [];
      if (compoundIds.length > 0) {
        query = query.in('compound_residents.community_units.compound_id', compoundIds);
      } else {
        return NextResponse.json({ 
          service_requests: [], 
          pagination: { page: 1, limit: 20, total: 0, pages: 0 } 
        });
      }
    } else if (isResident && userResident) {
      // Residents can only see their own requests
      query = query.eq('resident_id', userResident.id);
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Apply filters
    const compoundId = searchParams.get('compound_id');
    const serviceType = searchParams.get('service_type');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const dateFrom = searchParams.get('date_from');
    const dateTo = searchParams.get('date_to');

    if (compoundId) {
      query = query.eq('compound_residents.community_units.compound_id', compoundId);
    }

    if (serviceType) {
      query = query.eq('service_type', serviceType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (priority) {
      query = query.eq('priority', priority);
    }

    if (dateFrom) {
      query = query.gte('created_at', dateFrom);
    }

    if (dateTo) {
      query = query.lte('created_at', `${dateTo} 23:59:59`);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'created_at';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? { ascending: true } : { ascending: false };

    if (sortBy === 'priority') {
      // Sort by priority: emergency, high, medium, low
      query = query.order('priority', { ascending: false });
    } else if (sortBy === 'status') {
      query = query.order('status', sortOrder);
    } else if (sortBy === 'scheduled_date') {
      query = query.order('scheduled_date', sortOrder);
    } else {
      query = query.order('created_at', sortOrder);
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: serviceRequests, error, count } = await query;

    if (error) {
      console.error('Service requests fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch service requests' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      service_requests: serviceRequests || [],
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
      service_type,
      title,
      description,
      priority,
      preferred_date,
      preferred_time,
      images
    } = body;

    // Validate required fields
    if (!service_type || !title || !description) {
      return NextResponse.json({ 
        error: 'service_type, title, and description are required' 
      }, { status: 400 });
    }

    // Get user's resident record
    const { data: resident } = await supabase
      .from('compound_residents')
      .select(`
        id,
        user_id,
        community_units (
          id,
          compound_id,
          unit_number,
          building_name,
          compounds (
            id,
            name
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'You must be a registered resident to submit service requests' 
      }, { status: 403 });
    }

    // Validate service type
    const validServiceTypes = [
      'maintenance', 'plumbing', 'electrical', 'hvac', 'cleaning', 
      'gardening', 'security', 'moving', 'pest_control', 'appliance_repair', 'other'
    ];

    if (!validServiceTypes.includes(service_type)) {
      return NextResponse.json({ 
        error: `Invalid service type. Must be one of: ${validServiceTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate priority
    const validPriorities = ['low', 'medium', 'high', 'emergency'];
    const requestPriority = priority || 'medium';

    if (!validPriorities.includes(requestPriority)) {
      return NextResponse.json({ 
        error: `Invalid priority. Must be one of: ${validPriorities.join(', ')}` 
      }, { status: 400 });
    }

    // Create service request
    const { data: serviceRequest, error: requestError } = await supabase
      .from('community_service_requests')
      .insert({
        resident_id: resident.id,
        unit_id: resident.community_units?.id,
        service_type,
        title,
        description,
        priority: requestPriority,
        status: 'pending',
        preferred_datetime: preferred_date && preferred_time 
          ? `${preferred_date} ${preferred_time}` 
          : null,
        images: images || []
      })
      .select(`
        id,
        resident_id,
        unit_id,
        service_type,
        title,
        description,
        priority,
        status,
        preferred_datetime,
        images,
        created_at,
        updated_at,
        compound_residents (
          id,
          community_units (
            id,
            unit_number,
            building_name,
            compounds (
              id,
              name
            )
          ),
          user_profiles (
            full_name,
            phone
          )
        )
      `)
      .single();

    if (requestError) {
      console.error('Service request creation error:', requestError);
      return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 });
    }

    // TODO: Send notification to compound manager
    // TODO: If high/emergency priority, send immediate alerts
    // TODO: Integrate with existing service provider matching system

    // For emergency requests, try to auto-assign based on service type
    if (requestPriority === 'emergency') {
      // TODO: Implement emergency service provider assignment
      // This would integrate with your existing service provider system
    }

    return NextResponse.json({
      success: true,
      service_request: serviceRequest,
      message: requestPriority === 'emergency' 
        ? 'Emergency service request submitted. You will be contacted shortly.' 
        : 'Service request submitted successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
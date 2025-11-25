import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';
import { randomBytes } from 'crypto';

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

    const isSecurityGuard = userRoles?.some((role: UserRole) => role.role === 'security_guard');
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
      .from('visitor_passes')
      .select(`
        id,
        resident_id,
        visitor_name,
        visitor_phone,
        visitor_id_number,
        visit_purpose,
        expected_arrival,
        expected_departure,
        actual_arrival,
        actual_departure,
        pass_code,
        qr_code,
        status,
        notes,
        approved_by_user_id,
        checked_in_by_user_id,
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
            phone
          )
        )
      `, { count: 'exact' });

    // Apply access control
    if (hasAdminAccess) {
      // Admins can see all passes
    } else if (isSecurityGuard || isCompoundManager) {
      // Security guards and managers can see passes for their compounds
      const { data: accessibleCompounds } = await supabase
        .from('compounds')
        .select('id')
        .or(`compound_manager_user_id.eq.${user.id},id.in.(${userRoles?.filter((r: UserRole) => r.role === 'security_guard').map((r: UserRole) => r.compound_id).join(',')})`);
      
      const compoundIds = accessibleCompounds?.map((c: any) => c.id) || [];
      if (compoundIds.length > 0) {
        query = query.eq('compound_residents.community_units.compound_id', compoundIds[0]);
      } else {
        return NextResponse.json({ visitor_passes: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
      }
    } else if (isResident && userResident) {
      // Residents can only see their own visitor passes
      query = query.eq('resident_id', userResident.id);
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Apply filters
    const compoundId = searchParams.get('compound_id');
    const status = searchParams.get('status');
    const date = searchParams.get('date');
    const visitorName = searchParams.get('visitor_name');

    if (compoundId) {
      query = query.eq('compound_residents.community_units.compound_id', compoundId);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (date) {
      query = query.gte('expected_arrival', `${date} 00:00:00`)
        .lte('expected_arrival', `${date} 23:59:59`);
    }

    if (visitorName) {
      query = query.ilike('visitor_name', `%${visitorName}%`);
    }

    // Default: show passes for today and future
    const viewType = searchParams.get('view_type');
    if (viewType === 'today') {
      const today = new Date().toISOString().split('T')[0];
      query = query.gte('expected_arrival', `${today} 00:00:00`)
        .lte('expected_arrival', `${today} 23:59:59`);
    } else if (viewType !== 'all') {
      const now = new Date().toISOString();
      query = query.gte('expected_arrival', now);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'expected_arrival';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? { ascending: false } : { ascending: true };

    query = query.order(sortBy, sortOrder);

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: visitorPasses, error, count } = await query;

    if (error) {
      console.error('Visitor passes fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch visitor passes' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      visitor_passes: visitorPasses || [],
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
      visitor_name,
      visitor_phone,
      visitor_id_number,
      visit_purpose,
      expected_arrival,
      expected_departure,
      notes
    } = body;

    // Validate required fields
    if (!visitor_name || !visitor_phone || !expected_arrival) {
      return NextResponse.json({ 
        error: 'visitor_name, visitor_phone, and expected_arrival are required' 
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
            name,
            security_level
          )
        )
      `)
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();

    if (!resident) {
      return NextResponse.json({ 
        error: 'You must be a registered resident to create visitor passes' 
      }, { status: 403 });
    }

    // Validate arrival time (must be in the future)
    const arrivalTime = new Date(expected_arrival);
    const now = new Date();
    
    if (arrivalTime <= now) {
      return NextResponse.json({ 
        error: 'Expected arrival must be in the future' 
      }, { status: 400 });
    }

    // Validate departure time if provided
    if (expected_departure) {
      const departureTime = new Date(expected_departure);
      if (departureTime <= arrivalTime) {
        return NextResponse.json({ 
          error: 'Expected departure must be after expected arrival' 
        }, { status: 400 });
      }
    }

    // Generate unique pass code and QR code
    const passCode = randomBytes(4).toString('hex').toUpperCase();
    const qrData = {
      pass_id: null, // Will be set after creation
      resident_id: resident.id,
      visitor_name,
      visitor_phone,
      pass_code: passCode,
      compound_id: resident.community_units?.compound_id,
      unit_number: resident.community_units?.unit_number,
      expected_arrival,
      created_at: new Date().toISOString()
    };

    // Determine initial status based on compound security level
    const securityLevel = resident.community_units?.compounds?.security_level || 'medium';
    const initialStatus = securityLevel === 'high' ? 'pending_approval' : 'active';

    // Create visitor pass
    const { data: visitorPass, error: passError } = await supabase
      .from('visitor_passes')
      .insert({
        resident_id: resident.id,
        visitor_name,
        visitor_phone,
        visitor_id_number,
        visit_purpose: visit_purpose || 'Personal visit',
        expected_arrival,
        expected_departure,
        pass_code: passCode,
        qr_code: JSON.stringify(qrData),
        status: initialStatus,
        notes
      })
      .select(`
        id,
        resident_id,
        visitor_name,
        visitor_phone,
        visitor_id_number,
        visit_purpose,
        expected_arrival,
        expected_departure,
        pass_code,
        qr_code,
        status,
        notes,
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

    if (passError) {
      console.error('Visitor pass creation error:', passError);
      return NextResponse.json({ error: 'Failed to create visitor pass' }, { status: 500 });
    }

    // Update QR code with the actual pass ID
    qrData.pass_id = visitorPass.id;
    const { error: qrUpdateError } = await supabase
      .from('visitor_passes')
      .update({ qr_code: JSON.stringify(qrData) })
      .eq('id', visitorPass.id);

    if (qrUpdateError) {
      console.error('QR code update error:', qrUpdateError);
    }

    // TODO: Send notification to visitor with pass details
    // TODO: If high security, send notification to compound manager for approval

    return NextResponse.json({
      success: true,
      visitor_pass: {
        ...visitorPass,
        qr_code: JSON.stringify(qrData)
      },
      message: initialStatus === 'pending_approval' 
        ? 'Visitor pass created and sent for approval' 
        : 'Visitor pass created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
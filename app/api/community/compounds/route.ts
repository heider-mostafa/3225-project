import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole, ValidUserRole } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check user role and permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isDeveloper = userRoles?.some((role: UserRole) => role.role === 'developer');
    const isCompoundManager = userRoles?.some((role: UserRole) => role.role === 'compound_manager');
    const isResident = userRoles?.some((role: UserRole) => 
      ['resident_owner', 'resident_tenant'].includes(role.role)
    );

    let query = supabase
      .from('compounds')
      .select(`
        id,
        developer_id,
        name,
        address,
        city,
        district,
        location_lat,
        location_lng,
        total_units,
        total_area_sqm,
        handover_year,
        compound_type,
        compound_manager_user_id,
        management_company,
        emergency_phone,
        operating_hours_start,
        operating_hours_end,
        security_level,
        is_active,
        branding_config,
        created_at,
        updated_at,
        community_developers (
          id,
          company_name,
          logo_url,
          contact_person_name,
          contact_phone,
          contact_email
        )
      `);

    // Apply access control based on user role
    if (hasAdminAccess) {
      // Admins see all compounds
      query = query.eq('is_active', true);
    } else if (isDeveloper) {
      // Developers see only their compounds
      const developerIds = userRoles
        .filter((role: UserRole) => role.role === 'developer')
        .map((role: UserRole) => role.developer_id)
        .filter(Boolean);
      
      if (developerIds.length === 0) {
        return NextResponse.json({ compounds: [] });
      }
      
      query = query.in('developer_id', developerIds);
    } else if (isCompoundManager) {
      // Managers see only compounds they manage
      query = query.eq('compound_manager_user_id', user.id);
    } else if (isResident) {
      // Residents see only their compounds
      const compoundIds = userRoles
        .filter((role: UserRole) => ['resident_owner', 'resident_tenant'].includes(role.role))
        .map((role: UserRole) => role.compound_id)
        .filter(Boolean);
      
      if (compoundIds.length === 0) {
        return NextResponse.json({ compounds: [] });
      }
      
      query = query.in('id', compoundIds);
    } else {
      // No community access
      return NextResponse.json({ compounds: [] });
    }

    // Apply filters
    const developer_id = searchParams.get('developer_id');
    const city = searchParams.get('city');
    const compound_type = searchParams.get('compound_type');

    if (developer_id) {
      query = query.eq('developer_id', developer_id);
    }

    if (city) {
      query = query.ilike('city', `%${city}%`);
    }

    if (compound_type) {
      query = query.eq('compound_type', compound_type);
    }

    // Execute query
    const { data: compounds, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Compounds fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch compounds' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      compounds: compounds || []
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

    // Check if user has developer or admin role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isDeveloper = userRoles?.some((role: UserRole) => role.role === 'developer');

    if (!hasAdminAccess && !isDeveloper) {
      return NextResponse.json({ 
        error: 'Insufficient permissions. Only developers and admins can create compounds.' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      developer_id,
      name,
      address,
      city,
      district,
      location_lat,
      location_lng,
      total_units,
      total_area_sqm,
      handover_year,
      compound_type,
      compound_manager_user_id,
      management_company,
      emergency_phone,
      operating_hours_start,
      operating_hours_end,
      security_level,
      branding_config
    } = body;

    // Validate required fields
    if (!developer_id || !name || !address || !city || !total_units) {
      return NextResponse.json({ 
        error: 'Required fields: developer_id, name, address, city, total_units' 
      }, { status: 400 });
    }

    // If user is developer (not admin), ensure they can only create compounds for their organization
    if (isDeveloper && !hasAdminAccess) {
      const userDeveloperIds = userRoles
        .filter((role: UserRole) => role.role === 'developer')
        .map((role: UserRole) => role.developer_id);
      
      if (!userDeveloperIds.includes(developer_id)) {
        return NextResponse.json({ 
          error: 'You can only create compounds for your own organization' 
        }, { status: 403 });
      }
    }

    // Create compound
    const { data: compound, error: compoundError } = await supabase
      .from('compounds')
      .insert({
        developer_id,
        name,
        address,
        city,
        district,
        location_lat: location_lat ? parseFloat(location_lat) : null,
        location_lng: location_lng ? parseFloat(location_lng) : null,
        total_units: parseInt(total_units),
        total_area_sqm: total_area_sqm ? parseFloat(total_area_sqm) : null,
        handover_year: handover_year ? parseInt(handover_year) : null,
        compound_type: compound_type || 'residential',
        compound_manager_user_id,
        management_company,
        emergency_phone,
        operating_hours_start: operating_hours_start || '06:00',
        operating_hours_end: operating_hours_end || '22:00',
        security_level: security_level || 'medium',
        branding_config: branding_config || {},
        is_active: true
      })
      .select()
      .single();

    if (compoundError) {
      console.error('Compound creation error:', compoundError);
      return NextResponse.json({ error: 'Failed to create compound' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      compound
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
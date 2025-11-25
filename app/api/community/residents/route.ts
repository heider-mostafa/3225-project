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

    // Get compound_id filter
    const compoundId = searchParams.get('compound_id');

    if (!compoundId && !hasAdminAccess) {
      return NextResponse.json({ 
        error: 'compound_id is required for non-admin users' 
      }, { status: 400 });
    }

    // Verify access to compound
    if (compoundId && !hasAdminAccess) {
      // Check if user has access to this compound
      const { data: compound } = await supabase
        .from('compounds')
        .select('developer_id, compound_manager_user_id')
        .eq('id', compoundId)
        .single();

      if (!compound) {
        return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
      }

      const canAccess = userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === compound.developer_id) ||
        (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id) ||
        (role.role === 'security_guard' && role.compound_id === compoundId) ||
        (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === compoundId)
      );

      if (!canAccess) {
        return NextResponse.json({ 
          error: 'Access denied to this compound' 
        }, { status: 403 });
      }
    }

    let query = supabase
      .from('compound_residents')
      .select(`
        id,
        user_id,
        unit_id,
        full_name_english,
        full_name_arabic,
        national_id,
        primary_phone,
        resident_type,
        move_in_date,
        move_out_date,
        emergency_contact_name,
        emergency_contact_phone,
        verification_status,
        is_active,
        created_at,
        updated_at,
        community_units (
          id,
          compound_id,
          unit_number,
          building_name,
          floor_number,
          unit_type,
          bedrooms,
          bathrooms,
          area_sqm,
          compounds (
            id,
            name,
            address,
            city
          )
        )
      `);

    // Apply compound filter
    if (compoundId) {
      query = query.eq('community_units.compound_id', compoundId);
    } else if (hasAdminAccess) {
      // Admins can see all residents, but let's still filter by user's accessible compounds
      const accessibleCompounds = userRoles
        ?.map((role: UserRole) => role.compound_id)
        .filter(Boolean);
      
      if (accessibleCompounds && accessibleCompounds.length > 0) {
        query = query.in('community_units.compound_id', accessibleCompounds);
      }
    }

    // Apply additional filters
    const residentType = searchParams.get('resident_type');
    const isActive = searchParams.get('is_active');
    const unitNumber = searchParams.get('unit_number');

    if (residentType) {
      query = query.eq('resident_type', residentType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    if (unitNumber) {
      query = query.ilike('community_units.unit_number', `%${unitNumber}%`);
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: residents, error, count } = await query
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Residents fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch residents' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      residents: residents || [],
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
      user_id,
      unit_id,
      resident_type,
      move_in_date,
      move_out_date,
      emergency_contact_name,
      emergency_contact_phone,
      vehicle_info
    } = body;

    // Validate required fields
    if (!user_id || !unit_id || !resident_type) {
      return NextResponse.json({ 
        error: 'user_id, unit_id, and resident_type are required' 
      }, { status: 400 });
    }

    // Get unit and compound info to verify permissions
    const { data: unit } = await supabase
      .from('community_units')
      .select(`
        id,
        compound_id,
        compounds (
          developer_id,
          compound_manager_user_id
        )
      `)
      .eq('id', unit_id)
      .single();

    if (!unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
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

    const canAddResident = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === unit.compounds.developer_id) ||
        (role.role === 'compound_manager' && unit.compounds.compound_manager_user_id === user.id)
      );

    if (!canAddResident) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to add residents to this compound' 
      }, { status: 403 });
    }

    // Check if user is already a resident in this unit
    const { data: existingResident } = await supabase
      .from('compound_residents')
      .select('id')
      .eq('user_id', user_id)
      .eq('unit_id', unit_id)
      .eq('is_active', true)
      .single();

    if (existingResident) {
      return NextResponse.json({ 
        error: 'User is already a resident in this unit' 
      }, { status: 409 });
    }

    // Create resident record
    const { data: resident, error: residentError } = await supabase
      .from('compound_residents')
      .insert({
        user_id,
        unit_id,
        resident_type,
        move_in_date: move_in_date || new Date().toISOString().split('T')[0],
        move_out_date,
        emergency_contact_name,
        emergency_contact_phone,
        is_active: true
      })
      .select(`
        id,
        user_id,
        unit_id,
        full_name_english,
        full_name_arabic,
        primary_phone,
        resident_type,
        move_in_date,
        move_out_date,
        emergency_contact_name,
        emergency_contact_phone,
        verification_status,
        is_active,
        created_at,
        updated_at,
        community_units (
          id,
          unit_number,
          building_name,
          compounds (
            id,
            name
          )
        )
      `)
      .single();

    if (residentError) {
      console.error('Resident creation error:', residentError);
      return NextResponse.json({ error: 'Failed to create resident record' }, { status: 500 });
    }

    // Create user role if it doesn't exist
    const roleType = resident_type === 'owner' ? 'resident_owner' : 'resident_tenant';
    
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({
        user_id,
        role: roleType,
        compound_id: unit.compound_id,
        is_active: true,
        assigned_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,role,compound_id',
        ignoreDuplicates: true
      });

    if (roleError) {
      console.error('User role creation error:', roleError);
    }

    // Add vehicle info if provided
    if (vehicle_info && Array.isArray(vehicle_info)) {
      const vehicleInserts = vehicle_info.map((vehicle: any) => ({
        resident_id: resident.id,
        license_plate: vehicle.license_plate,
        make: vehicle.make,
        model: vehicle.model,
        color: vehicle.color,
        vehicle_type: vehicle.vehicle_type || 'car',
        is_active: true
      }));

      const { error: vehicleError } = await supabase
        .from('resident_vehicles')
        .insert(vehicleInserts);

      if (vehicleError) {
        console.error('Vehicle creation error:', vehicleError);
      }
    }

    return NextResponse.json({
      success: true,
      resident
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
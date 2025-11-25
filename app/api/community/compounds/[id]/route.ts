import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const compoundId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get compound with related data
    const { data: compound, error } = await supabase
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
        notification_settings,
        created_at,
        updated_at,
        community_developers (
          id,
          company_name,
          logo_url,
          contact_person_name,
          contact_phone,
          contact_email
        ),
        community_units (
          id,
          unit_number,
          building_name,
          floor_number,
          unit_type,
          bedrooms,
          bathrooms,
          area_sqm,
          owner_user_id,
          tenant_user_id,
          is_active
        ),
        compound_amenities (
          id,
          name,
          category,
          description,
          capacity,
          booking_required,
          advance_booking_days,
          operating_hours,
          pricing,
          is_active
        )
      `)
      .eq('id', compoundId)
      .single();

    if (error) {
      console.error('Compound fetch error:', error);
      return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
    }

    // Check user access to this compound
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
        (role.role === 'developer' && role.developer_id === compound.developer_id) ||
        (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id) ||
        (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === compoundId)
      );

    if (!hasCompoundAccess) {
      return NextResponse.json({ error: 'Access denied to this compound' }, { status: 403 });
    }

    // Get additional statistics for managers and developers
    const isManagerOrDeveloper = hasAdminAccess || userRoles?.some((role: UserRole) => 
      ['developer', 'compound_manager'].includes(role.role)
    );

    let stats = {};
    if (isManagerOrDeveloper) {
      // Get resident count
      const { count: residentCount } = await supabase
        .from('compound_residents')
        .select('id', { count: 'exact' })
        .eq('compound_id', compoundId)
        .eq('is_active', true);

      // Get active amenity bookings
      const { count: activeBookings } = await supabase
        .from('amenity_bookings')
        .select('id', { count: 'exact' })
        .in('amenity_id', 
          (compound.compound_amenities || []).map((a: any) => a.id)
        )
        .eq('status', 'confirmed')
        .gte('booking_date', new Date().toISOString().split('T')[0]);

      // Get pending service requests
      const { count: pendingRequests } = await supabase
        .from('community_service_requests')
        .select('id', { count: 'exact' })
        .eq('compound_id', compoundId)
        .eq('status', 'pending');

      stats = {
        resident_count: residentCount,
        active_bookings: activeBookings,
        pending_requests: pendingRequests,
        occupancy_rate: compound.total_units > 0 
          ? ((residentCount || 0) / compound.total_units * 100).toFixed(1)
          : '0'
      };
    }

    return NextResponse.json({
      success: true,
      compound,
      stats
    });

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
    const compoundId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has permission to update this compound
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const { data: existingCompound } = await supabase
      .from('compounds')
      .select('developer_id, compound_manager_user_id')
      .eq('id', compoundId)
      .single();

    if (!existingCompound) {
      return NextResponse.json({ error: 'Compound not found' }, { status: 404 });
    }

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const canUpdate = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === existingCompound.developer_id) ||
        (role.role === 'compound_manager' && existingCompound.compound_manager_user_id === user.id)
      );

    if (!canUpdate) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to update this compound' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
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
      branding_config,
      notification_settings,
      is_active
    } = body;

    // Build update object with only provided fields
    const updateData: any = { updated_at: new Date().toISOString() };
    
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;
    if (location_lat !== undefined) updateData.location_lat = location_lat ? parseFloat(location_lat) : null;
    if (location_lng !== undefined) updateData.location_lng = location_lng ? parseFloat(location_lng) : null;
    if (total_units !== undefined) updateData.total_units = parseInt(total_units);
    if (total_area_sqm !== undefined) updateData.total_area_sqm = total_area_sqm ? parseFloat(total_area_sqm) : null;
    if (handover_year !== undefined) updateData.handover_year = handover_year ? parseInt(handover_year) : null;
    if (compound_type !== undefined) updateData.compound_type = compound_type;
    if (compound_manager_user_id !== undefined) updateData.compound_manager_user_id = compound_manager_user_id;
    if (management_company !== undefined) updateData.management_company = management_company;
    if (emergency_phone !== undefined) updateData.emergency_phone = emergency_phone;
    if (operating_hours_start !== undefined) updateData.operating_hours_start = operating_hours_start;
    if (operating_hours_end !== undefined) updateData.operating_hours_end = operating_hours_end;
    if (security_level !== undefined) updateData.security_level = security_level;
    if (branding_config !== undefined) updateData.branding_config = branding_config;
    if (notification_settings !== undefined) updateData.notification_settings = notification_settings;
    if (is_active !== undefined && hasAdminAccess) updateData.is_active = is_active;

    // Update compound
    const { data: compound, error } = await supabase
      .from('compounds')
      .update(updateData)
      .eq('id', compoundId)
      .select()
      .single();

    if (error) {
      console.error('Compound update error:', error);
      return NextResponse.json({ error: 'Failed to update compound' }, { status: 500 });
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const compoundId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only super admins can delete compounds (soft delete by setting is_active = false)
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isSuperAdmin = userRoles?.some((role: UserRole) => role.role === 'super_admin');

    if (!isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Only super administrators can delete compounds' 
      }, { status: 403 });
    }

    // Soft delete (set is_active = false)
    const { data: compound, error } = await supabase
      .from('compounds')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', compoundId)
      .select()
      .single();

    if (error) {
      console.error('Compound deletion error:', error);
      return NextResponse.json({ error: 'Failed to delete compound' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Compound deactivated successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
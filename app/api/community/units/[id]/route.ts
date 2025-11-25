import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const unitId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get unit details with all related data
    const { data: unit, error } = await supabase
      .from('community_units')
      .select(`
        id,
        compound_id,
        property_id,
        unit_number,
        building_name,
        floor_number,
        unit_type,
        bedrooms,
        bathrooms,
        area_sqm,
        orientation,
        owner_user_id,
        tenant_user_id,
        purchase_price,
        current_market_value,
        rental_rate,
        maintenance_fee,
        parking_spaces,
        balcony_area,
        storage_area,
        furnished,
        move_in_ready,
        last_renovated,
        amenities,
        restrictions,
        is_active,
        created_at,
        updated_at,
        compounds (
          id,
          name,
          address,
          city,
          developer_id,
          compound_manager_user_id
        ),
        properties (
          id,
          title,
          description,
          property_type,
          property_photos (
            id,
            url,
            thumbnail_url,
            alt_text,
            is_primary,
            order_index
          )
        ),
        compound_residents (
          id,
          user_id,
          resident_type,
          move_in_date,
          move_out_date,
          emergency_contact_name,
          emergency_contact_phone,
          is_active,
          user_profiles (
            id,
            full_name,
            email,
            phone,
            profile_photo_url
          ),
          resident_vehicles (
            id,
            license_plate,
            make,
            model,
            color,
            vehicle_type,
            is_active
          )
        )
      `)
      .eq('id', unitId)
      .single();

    if (error || !unit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
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

    const hasUnitAccess = hasAdminAccess || 
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === unit.compounds.developer_id) ||
        (role.role === 'compound_manager' && unit.compounds.compound_manager_user_id === user.id) ||
        (role.role === 'security_guard' && role.compound_id === unit.compound_id) ||
        (['resident_owner', 'resident_tenant'].includes(role.role) && role.compound_id === unit.compound_id)
      ) ||
      unit.owner_user_id === user.id ||
      unit.tenant_user_id === user.id ||
      unit.compound_residents?.some((resident: any) => resident.user_id === user.id);

    if (!hasUnitAccess) {
      return NextResponse.json({ error: 'Access denied to this unit' }, { status: 403 });
    }

    // Get additional unit statistics for managers/developers
    const showDetailedStats = hasAdminAccess || userRoles?.some((role: UserRole) => 
      ['developer', 'compound_manager'].includes(role.role)
    );

    let unitStats = {};
    if (showDetailedStats) {
      // Get fee history
      const { data: feeHistory, count: feesCount } = await supabase
        .from('community_fees')
        .select('id, fee_type, amount, status, due_date, paid_at', { count: 'exact' })
        .eq('unit_id', unitId)
        .order('due_date', { ascending: false })
        .limit(10);

      // Get service requests
      const { data: serviceRequests, count: requestsCount } = await supabase
        .from('community_service_requests')
        .select('id, service_type, title, status, priority, created_at', { count: 'exact' })
        .eq('unit_id', unitId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Get visitor passes
      const { data: visitorPasses, count: passesCount } = await supabase
        .from('visitor_passes')
        .select('id, visitor_name, status, expected_arrival', { count: 'exact' })
        .in('resident_id', unit.compound_residents?.map((r: any) => r.id) || [])
        .order('expected_arrival', { ascending: false })
        .limit(10);

      // Calculate totals
      const totalFees = feeHistory?.reduce((sum: number, fee: any) => 
        fee.status === 'outstanding' || fee.status === 'overdue' ? sum + fee.amount : sum, 0
      ) || 0;

      const paidFees = feeHistory?.reduce((sum: number, fee: any) => 
        fee.status === 'paid' ? sum + fee.amount : sum, 0
      ) || 0;

      unitStats = {
        fee_summary: {
          total_outstanding: totalFees,
          total_paid: paidFees,
          recent_fees: feeHistory?.slice(0, 5) || [],
          total_fees_count: feesCount
        },
        service_summary: {
          pending_requests: serviceRequests?.filter((r: any) => r.status === 'pending').length || 0,
          recent_requests: serviceRequests?.slice(0, 5) || [],
          total_requests_count: requestsCount
        },
        visitor_summary: {
          active_passes: visitorPasses?.filter((p: any) => p.status === 'active').length || 0,
          recent_visitors: visitorPasses?.slice(0, 5) || [],
          total_passes_count: passesCount
        }
      };
    }

    return NextResponse.json({
      success: true,
      unit,
      stats: unitStats
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
    const unitId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get existing unit to verify permissions
    const { data: existingUnit } = await supabase
      .from('community_units')
      .select(`
        id,
        compound_id,
        unit_number,
        owner_user_id,
        compounds (
          developer_id,
          compound_manager_user_id
        )
      `)
      .eq('id', unitId)
      .single();

    if (!existingUnit) {
      return NextResponse.json({ error: 'Unit not found' }, { status: 404 });
    }

    // Check permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const canUpdateUnit = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === existingUnit.compounds.developer_id) ||
        (role.role === 'compound_manager' && existingUnit.compounds.compound_manager_user_id === user.id)
      ) ||
      existingUnit.owner_user_id === user.id; // Owners can update some fields

    if (!canUpdateUnit) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to update this unit' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      unit_number,
      building_name,
      floor_number,
      unit_type,
      bedrooms,
      bathrooms,
      area_sqm,
      orientation,
      owner_user_id,
      tenant_user_id,
      purchase_price,
      current_market_value,
      rental_rate,
      maintenance_fee,
      parking_spaces,
      balcony_area,
      storage_area,
      furnished,
      move_in_ready,
      last_renovated,
      amenities,
      restrictions,
      is_active
    } = body;

    // If user is owner (not admin/manager), restrict what they can update
    const isOwner = existingUnit.owner_user_id === user.id && !hasAdminAccess && !userRoles?.some((role: UserRole) => ['developer', 'compound_manager'].includes(role.role));
    
    // Build update object based on permissions
    const updateData: any = { updated_at: new Date().toISOString() };

    // Fields all users with access can update
    if (furnished !== undefined) updateData.furnished = furnished;
    if (amenities !== undefined) updateData.amenities = amenities;
    if (last_renovated !== undefined) updateData.last_renovated = last_renovated;
    
    // Fields only admins/managers/developers can update
    if (!isOwner) {
      if (unit_number !== undefined) updateData.unit_number = unit_number;
      if (building_name !== undefined) updateData.building_name = building_name;
      if (floor_number !== undefined) updateData.floor_number = floor_number ? parseInt(floor_number) : null;
      if (unit_type !== undefined) updateData.unit_type = unit_type;
      if (bedrooms !== undefined) updateData.bedrooms = bedrooms ? parseInt(bedrooms) : null;
      if (bathrooms !== undefined) updateData.bathrooms = bathrooms ? parseInt(bathrooms) : null;
      if (area_sqm !== undefined) updateData.area_sqm = area_sqm ? parseFloat(area_sqm) : null;
      if (orientation !== undefined) updateData.orientation = orientation;
      if (owner_user_id !== undefined) updateData.owner_user_id = owner_user_id;
      if (tenant_user_id !== undefined) updateData.tenant_user_id = tenant_user_id;
      if (purchase_price !== undefined) updateData.purchase_price = purchase_price ? parseFloat(purchase_price) : null;
      if (current_market_value !== undefined) updateData.current_market_value = current_market_value ? parseFloat(current_market_value) : null;
      if (rental_rate !== undefined) updateData.rental_rate = rental_rate ? parseFloat(rental_rate) : null;
      if (maintenance_fee !== undefined) updateData.maintenance_fee = maintenance_fee ? parseFloat(maintenance_fee) : null;
      if (parking_spaces !== undefined) updateData.parking_spaces = parking_spaces ? parseInt(parking_spaces) : 0;
      if (balcony_area !== undefined) updateData.balcony_area = balcony_area ? parseFloat(balcony_area) : null;
      if (storage_area !== undefined) updateData.storage_area = storage_area ? parseFloat(storage_area) : null;
      if (move_in_ready !== undefined) updateData.move_in_ready = move_in_ready;
      if (restrictions !== undefined) updateData.restrictions = restrictions;
      
      // Only admins can change is_active status
      if (is_active !== undefined && hasAdminAccess) {
        updateData.is_active = is_active;
      }
    }

    // Check for unit number conflicts if updating
    if (updateData.unit_number && updateData.unit_number !== existingUnit.unit_number) {
      const { data: conflictingUnit } = await supabase
        .from('community_units')
        .select('id')
        .eq('compound_id', existingUnit.compound_id)
        .eq('unit_number', updateData.unit_number)
        .neq('id', unitId)
        .single();

      if (conflictingUnit) {
        return NextResponse.json({ 
          error: `Unit ${updateData.unit_number} already exists in this compound` 
        }, { status: 409 });
      }
    }

    // Validate unit type if provided
    if (updateData.unit_type) {
      const validUnitTypes = ['apartment', 'villa', 'townhouse', 'penthouse'];
      if (!validUnitTypes.includes(updateData.unit_type)) {
        return NextResponse.json({ 
          error: `Invalid unit type. Must be one of: ${validUnitTypes.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate orientation if provided
    if (updateData.orientation) {
      const validOrientations = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
      if (!validOrientations.includes(updateData.orientation)) {
        return NextResponse.json({ 
          error: `Invalid orientation. Must be one of: ${validOrientations.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Update unit
    const { data: updatedUnit, error: updateError } = await supabase
      .from('community_units')
      .update(updateData)
      .eq('id', unitId)
      .select(`
        id,
        compound_id,
        unit_number,
        building_name,
        floor_number,
        unit_type,
        bedrooms,
        bathrooms,
        area_sqm,
        orientation,
        owner_user_id,
        tenant_user_id,
        purchase_price,
        current_market_value,
        rental_rate,
        maintenance_fee,
        parking_spaces,
        balcony_area,
        storage_area,
        furnished,
        move_in_ready,
        last_renovated,
        amenities,
        restrictions,
        is_active,
        created_at,
        updated_at,
        compounds (
          id,
          name
        )
      `)
      .single();

    if (updateError) {
      console.error('Unit update error:', updateError);
      return NextResponse.json({ error: 'Failed to update unit' }, { status: 500 });
    }

    // Handle owner/tenant changes if admin/manager made changes
    if (!isOwner) {
      // TODO: Handle resident record updates when owner/tenant changes
      // This would involve updating compound_residents table and user_roles
    }

    return NextResponse.json({
      success: true,
      unit: updatedUnit,
      message: 'Unit updated successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
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
          (role.role === 'security_guard' && role.compound_id === compoundId) ||
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
          city
        ),
        properties (
          id,
          title,
          description,
          property_photos (
            id,
            url,
            thumbnail_url,
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
          is_active,
          user_profiles (
            id,
            full_name,
            email,
            phone
          )
        )
      `, { count: 'exact' });

    // Apply compound filter
    if (compoundId) {
      query = query.eq('compound_id', compoundId);
    }

    // Apply filters
    const building = searchParams.get('building');
    const floor = searchParams.get('floor');
    const unitType = searchParams.get('unit_type');
    const bedrooms = searchParams.get('bedrooms');
    const bathrooms = searchParams.get('bathrooms');
    const occupied = searchParams.get('occupied');
    const furnished = searchParams.get('furnished');
    const isActive = searchParams.get('is_active');
    const unitNumber = searchParams.get('unit_number');

    if (building) {
      query = query.ilike('building_name', `%${building}%`);
    }

    if (floor) {
      query = query.eq('floor_number', parseInt(floor));
    }

    if (unitType) {
      query = query.eq('unit_type', unitType);
    }

    if (bedrooms) {
      query = query.eq('bedrooms', parseInt(bedrooms));
    }

    if (bathrooms) {
      query = query.eq('bathrooms', parseInt(bathrooms));
    }

    if (unitNumber) {
      query = query.ilike('unit_number', `%${unitNumber}%`);
    }

    if (furnished !== null) {
      query = query.eq('furnished', furnished === 'true');
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    } else {
      // Default to only active units for residents
      const isResident = userRoles?.some((role: UserRole) => 
        ['resident_owner', 'resident_tenant'].includes(role.role)
      );
      if (isResident) {
        query = query.eq('is_active', true);
      }
    }

    // Handle occupancy filter
    if (occupied === 'true') {
      query = query.not('compound_residents', 'is', null);
    } else if (occupied === 'false') {
      query = query.is('compound_residents', null);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'unit_number';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? { ascending: false } : { ascending: true };

    switch (sortBy) {
      case 'unit_number':
        query = query.order('unit_number', sortOrder);
        break;
      case 'building_name':
        query = query.order('building_name', sortOrder)
          .order('unit_number', { ascending: true });
        break;
      case 'floor_number':
        query = query.order('floor_number', sortOrder)
          .order('unit_number', { ascending: true });
        break;
      case 'area_sqm':
        query = query.order('area_sqm', sortOrder);
        break;
      case 'bedrooms':
        query = query.order('bedrooms', sortOrder);
        break;
      case 'rental_rate':
        query = query.order('rental_rate', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('unit_number', { ascending: true });
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: units, error, count } = await query;

    if (error) {
      console.error('Units fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch units' }, { status: 500 });
    }

    // Calculate occupancy statistics for managers/developers
    const showStats = hasAdminAccess || userRoles?.some((role: UserRole) => 
      ['developer', 'compound_manager'].includes(role.role)
    );

    let stats = {};
    if (showStats && units && units.length > 0) {
      const totalUnits = count || 0;
      const occupiedUnits = units.filter((unit: any) => 
        unit.compound_residents && unit.compound_residents.length > 0
      ).length;
      
      const ownedUnits = units.filter((unit: any) => unit.owner_user_id).length;
      const rentedUnits = units.filter((unit: any) => 
        unit.compound_residents?.some((r: any) => r.resident_type === 'tenant')
      ).length;

      stats = {
        total_units: totalUnits,
        occupied_units: occupiedUnits,
        vacant_units: totalUnits - occupiedUnits,
        owned_units: ownedUnits,
        rented_units: rentedUnits,
        occupancy_rate: totalUnits > 0 
          ? ((occupiedUnits / totalUnits) * 100).toFixed(1)
          : '0'
      };
    }

    return NextResponse.json({
      success: true,
      units: units || [],
      stats,
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
      restrictions
    } = body;

    // Validate required fields
    if (!compound_id || !unit_number) {
      return NextResponse.json({ 
        error: 'compound_id and unit_number are required' 
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

    const canAddUnit = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === compound.developer_id) ||
        (role.role === 'compound_manager' && compound.compound_manager_user_id === user.id)
      );

    if (!canAddUnit) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to add units to this compound' 
      }, { status: 403 });
    }

    // Check for duplicate unit number in the same compound
    const { data: existingUnit } = await supabase
      .from('community_units')
      .select('id')
      .eq('compound_id', compound_id)
      .eq('unit_number', unit_number)
      .single();

    if (existingUnit) {
      return NextResponse.json({ 
        error: `Unit ${unit_number} already exists in this compound` 
      }, { status: 409 });
    }

    // Validate unit type
    const validUnitTypes = ['apartment', 'villa', 'townhouse', 'penthouse'];
    if (unit_type && !validUnitTypes.includes(unit_type)) {
      return NextResponse.json({ 
        error: `Invalid unit type. Must be one of: ${validUnitTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate orientation
    const validOrientations = ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest'];
    if (orientation && !validOrientations.includes(orientation)) {
      return NextResponse.json({ 
        error: `Invalid orientation. Must be one of: ${validOrientations.join(', ')}` 
      }, { status: 400 });
    }

    // Create unit
    const { data: unit, error: unitError } = await supabase
      .from('community_units')
      .insert({
        compound_id,
        property_id,
        unit_number,
        building_name,
        floor_number: floor_number ? parseInt(floor_number) : null,
        unit_type,
        bedrooms: bedrooms ? parseInt(bedrooms) : null,
        bathrooms: bathrooms ? parseInt(bathrooms) : null,
        area_sqm: area_sqm ? parseFloat(area_sqm) : null,
        orientation,
        owner_user_id,
        tenant_user_id,
        purchase_price: purchase_price ? parseFloat(purchase_price) : null,
        current_market_value: current_market_value ? parseFloat(current_market_value) : null,
        rental_rate: rental_rate ? parseFloat(rental_rate) : null,
        maintenance_fee: maintenance_fee ? parseFloat(maintenance_fee) : null,
        parking_spaces: parking_spaces ? parseInt(parking_spaces) : 0,
        balcony_area: balcony_area ? parseFloat(balcony_area) : null,
        storage_area: storage_area ? parseFloat(storage_area) : null,
        furnished: furnished || false,
        move_in_ready: move_in_ready !== false, // Default to true
        last_renovated,
        amenities: amenities || [],
        restrictions: restrictions || [],
        is_active: true
      })
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
        amenities,
        restrictions,
        is_active,
        created_at,
        updated_at,
        compounds (
          id,
          name,
          address
        )
      `)
      .single();

    if (unitError) {
      console.error('Unit creation error:', unitError);
      return NextResponse.json({ error: 'Failed to create unit' }, { status: 500 });
    }

    // If owner_user_id is provided, create resident record and user role
    if (owner_user_id) {
      const { error: residentError } = await supabase
        .from('compound_residents')
        .insert({
          user_id: owner_user_id,
          unit_id: unit.id,
          resident_type: 'owner',
          move_in_date: new Date().toISOString().split('T')[0],
          is_active: true
        });

      if (residentError) {
        console.error('Owner resident creation error:', residentError);
      }

      // Create user role
      const { error: roleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: owner_user_id,
          role: 'resident_owner',
          compound_id: compound_id,
          is_active: true,
          assigned_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,role,compound_id',
          ignoreDuplicates: true
        });

      if (roleError) {
        console.error('Owner role creation error:', roleError);
      }
    }

    // If tenant_user_id is provided, create tenant resident record
    if (tenant_user_id && tenant_user_id !== owner_user_id) {
      const { error: tenantResidentError } = await supabase
        .from('compound_residents')
        .insert({
          user_id: tenant_user_id,
          unit_id: unit.id,
          resident_type: 'tenant',
          move_in_date: new Date().toISOString().split('T')[0],
          is_active: true
        });

      if (tenantResidentError) {
        console.error('Tenant resident creation error:', tenantResidentError);
      }

      // Create tenant role
      const { error: tenantRoleError } = await supabase
        .from('user_roles')
        .upsert({
          user_id: tenant_user_id,
          role: 'resident_tenant',
          compound_id: compound_id,
          is_active: true,
          assigned_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,role,compound_id',
          ignoreDuplicates: true
        });

      if (tenantRoleError) {
        console.error('Tenant role creation error:', tenantRoleError);
      }
    }

    return NextResponse.json({
      success: true,
      unit,
      message: 'Unit created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isServerUserAdmin } from '@/lib/auth/admin';

// GET /api/appraisers/services - Get services
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');
    const active_only = searchParams.get('active_only') === 'true';
    const property_type = searchParams.get('property_type');

    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('appraiser_services')
      .select(`
        id,
        appraiser_id,
        service_name,
        service_description,
        property_types,
        price_range,
        typical_timeframe_days,
        included_features,
        additional_fees,
        is_active,
        display_order,
        created_at,
        updated_at
      `);

    // Apply filters
    if (appraiser_id) {
      query = query.eq('appraiser_id', appraiser_id);
    }

    if (active_only) {
      query = query.eq('is_active', true);
    }

    if (property_type) {
      query = query.contains('property_types', [property_type]);
    }

    // Order by display order, then by name
    query = query.order('display_order', { ascending: true })
                 .order('service_name', { ascending: true });

    const { data: services, error } = await query;

    if (error) {
      console.error('Error fetching services:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch services' 
      }, { status: 500 });
    }

    // If specific appraiser, also get summary stats
    let summary = null;
    if (appraiser_id) {
      const total = services?.length || 0;
      const active = services?.filter(s => s.is_active).length || 0;
      const propertyTypes = [...new Set(
        services?.flatMap(s => s.property_types || []) || []
      )];
      const priceRanges = services?.map(s => s.price_range).filter(Boolean) || [];
      const avgTimeframe = services?.reduce((sum, s) => sum + (s.typical_timeframe_days || 0), 0) / (services?.length || 1);

      summary = {
        total,
        active,
        property_types_covered: propertyTypes,
        average_timeframe_days: Math.round(avgTimeframe),
        price_ranges: priceRanges
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        services: services || [],
        summary
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET services:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appraisers/services - Create new service
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      appraiser_id,
      service_name,
      service_description,
      property_types = [],
      price_range,
      typical_timeframe_days,
      included_features = [],
      additional_fees = {},
      display_order = 0
    } = body;

    // Validate required fields
    if (!service_name || !service_description) {
      return NextResponse.json({
        error: 'Service name and description are required'
      }, { status: 400 });
    }

    // Validate price range format
    if (price_range && (!price_range.min || !price_range.max || !price_range.currency)) {
      return NextResponse.json({
        error: 'Price range must include min, max, and currency fields'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine target appraiser ID
    let targetAppraiserId: string;
    const isAdmin = await isServerUserAdmin();

    if (isAdmin && appraiser_id) {
      // Admin can manage any appraiser
      targetAppraiserId = appraiser_id;
      
      // Verify appraiser exists
      const { data: appraiser, error: appraiserError } = await supabase
        .from('brokers')
        .select('id, full_name')
        .eq('id', targetAppraiserId)
        .eq('is_active', true)
        .single();

      if (appraiserError || !appraiser) {
        return NextResponse.json({
          error: 'Appraiser not found'
        }, { status: 404 });
      }
    } else {
      // Regular user - must be the appraiser owner
      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (brokerError || !broker) {
        return NextResponse.json({
          error: 'Appraiser profile not found. Only the appraiser can manage services.'
        }, { status: 404 });
      }

      targetAppraiserId = broker.id;
    }

    // Check for duplicate service name
    const { data: existingService } = await supabase
      .from('appraiser_services')
      .select('id')
      .eq('appraiser_id', targetAppraiserId)
      .eq('service_name', service_name)
      .eq('is_active', true)
      .single();

    if (existingService) {
      return NextResponse.json({
        error: 'A service with this name already exists'
      }, { status: 409 });
    }

    // Create service
    const serviceData = {
      appraiser_id: targetAppraiserId,
      service_name,
      service_description,
      property_types,
      price_range,
      typical_timeframe_days,
      included_features,
      additional_fees,
      display_order,
      is_active: true
    };

    const { data: newService, error: insertError } = await supabase
      .from('appraiser_services')
      .insert(serviceData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating service:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create service: ' + insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service created successfully',
      data: newService
    });

  } catch (error) {
    console.error('Unexpected error in POST service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/appraisers/services - Update service
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      service_id,
      service_name,
      service_description,
      property_types,
      price_range,
      typical_timeframe_days,
      included_features,
      additional_fees,
      display_order,
      is_active
    } = body;

    if (!service_id) {
      return NextResponse.json({
        error: 'Service ID is required'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('appraiser_services')
      .select('appraiser_id')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({
        error: 'Service not found'
      }, { status: 404 });
    }

    // Check permissions
    const isAdmin = await isServerUserAdmin();
    let canUpdate = false;
    
    if (isAdmin) {
      canUpdate = true;
    } else {
      // Check if user is the appraiser owner
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', service.appraiser_id)
        .single();
      
      canUpdate = !!broker;
    }

    if (!canUpdate) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (service_name !== undefined) updateData.service_name = service_name;
    if (service_description !== undefined) updateData.service_description = service_description;
    if (property_types !== undefined) updateData.property_types = property_types;
    if (price_range !== undefined) updateData.price_range = price_range;
    if (typical_timeframe_days !== undefined) updateData.typical_timeframe_days = typical_timeframe_days;
    if (included_features !== undefined) updateData.included_features = included_features;
    if (additional_fees !== undefined) updateData.additional_fees = additional_fees;
    if (display_order !== undefined) updateData.display_order = display_order;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: updatedService, error: updateError } = await supabase
      .from('appraiser_services')
      .update(updateData)
      .eq('id', service_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating service:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update service: ' + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service updated successfully',
      data: updatedService
    });

  } catch (error) {
    console.error('Unexpected error in PUT service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/appraisers/services - Soft delete service
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service_id = searchParams.get('service_id');

    if (!service_id) {
      return NextResponse.json({
        error: 'Service ID is required'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get service details
    const { data: service, error: serviceError } = await supabase
      .from('appraiser_services')
      .select('appraiser_id')
      .eq('id', service_id)
      .single();

    if (serviceError || !service) {
      return NextResponse.json({
        error: 'Service not found'
      }, { status: 404 });
    }

    // Check permissions
    const isAdmin = await isServerUserAdmin();
    let canDelete = false;
    
    if (isAdmin) {
      canDelete = true;
    } else {
      // Check if user is the appraiser owner
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', service.appraiser_id)
        .single();
      
      canDelete = !!broker;
    }

    if (!canDelete) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Soft delete (mark as inactive)
    const { error: deleteError } = await supabase
      .from('appraiser_services')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', service_id);

    if (deleteError) {
      console.error('Error deleting service:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete service: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Service deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE service:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
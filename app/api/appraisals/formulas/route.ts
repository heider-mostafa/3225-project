import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get all active calculation formulas
    const { data: formulas, error } = await supabase
      .from('appraisal_calculation_formulas')
      .select('*')
      .eq('is_active', true)
      .order('formula_type', { ascending: true })
      .order('property_type', { ascending: true });

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch calculation formulas' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: formulas,
      count: formulas?.length || 0
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (roleError) {
      return NextResponse.json(
        { error: 'Failed to check user permissions' },
        { status: 500 }
      );
    }

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = [
      'formula_name', 
      'formula_type', 
      'property_type', 
      'area_type', 
      'base_rate'
    ];
    
    const missingFields = requiredFields.filter(field => !body[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          missing_fields: missingFields 
        },
        { status: 400 }
      );
    }

    // Validate formula_type
    const validFormulaTypes = ['depreciation', 'market_adjustment', 'location_factor'];
    if (!validFormulaTypes.includes(body.formula_type)) {
      return NextResponse.json(
        { 
          error: 'Invalid formula_type',
          valid_types: validFormulaTypes
        },
        { status: 400 }
      );
    }

    // Validate area_type
    const validAreaTypes = ['urban', 'suburban', 'rural'];
    if (!validAreaTypes.includes(body.area_type)) {
      return NextResponse.json(
        { 
          error: 'Invalid area_type',
          valid_types: validAreaTypes
        },
        { status: 400 }
      );
    }

    // Insert new formula
    const { data: newFormula, error: insertError } = await supabase
      .from('appraisal_calculation_formulas')
      .insert({
        formula_name: body.formula_name,
        formula_type: body.formula_type,
        property_type: body.property_type,
        area_type: body.area_type,
        base_rate: body.base_rate,
        age_factor: body.age_factor || body.base_rate,
        condition_multipliers: body.condition_multipliers || {},
        location_adjustments: body.location_adjustments || {},
        effective_from: body.effective_from || new Date().toISOString().split('T')[0],
        effective_until: body.effective_until,
        is_active: body.is_active !== undefined ? body.is_active : true
      })
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create formula' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: newFormula,
      message: 'Formula created successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (roleError) {
      return NextResponse.json(
        { error: 'Failed to check user permissions' },
        { status: 500 }
      );
    }

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Parse request body
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Formula ID is required for updates' },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: any = {};
    const updatableFields = [
      'formula_name', 
      'base_rate', 
      'age_factor', 
      'condition_multipliers', 
      'location_adjustments',
      'effective_from',
      'effective_until',
      'is_active'
    ];

    updatableFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update formula
    const { data: updatedFormula, error: updateError } = await supabase
      .from('appraisal_calculation_formulas')
      .update(updateData)
      .eq('id', body.id)
      .select()
      .single();

    if (updateError) {
      console.error('Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update formula' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedFormula,
      message: 'Formula updated successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication and admin permissions
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRoles, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    if (roleError) {
      return NextResponse.json(
        { error: 'Failed to check user permissions' },
        { status: 500 }
      );
    }

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );

    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Access denied. Admin role required.' },
        { status: 403 }
      );
    }

    // Get formula ID from URL
    const url = new URL(request.url);
    const formulaId = url.searchParams.get('id');

    if (!formulaId) {
      return NextResponse.json(
        { error: 'Formula ID is required' },
        { status: 400 }
      );
    }

    // Instead of hard delete, set is_active to false
    const { data: deletedFormula, error: deleteError } = await supabase
      .from('appraisal_calculation_formulas')
      .update({ is_active: false })
      .eq('id', formulaId)
      .select()
      .single();

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete formula' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Formula deactivated successfully'
    });

  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
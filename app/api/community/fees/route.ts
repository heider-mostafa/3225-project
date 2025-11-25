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
    const isDeveloper = userRoles?.some((role: UserRole) => role.role === 'developer');
    const isResident = userRoles?.some((role: UserRole) => 
      ['resident_owner', 'resident_tenant'].includes(role.role)
    );

    // Get user's resident record if they are a resident
    const { data: userResident } = isResident ? await supabase
      .from('compound_residents')
      .select('id, unit_id, community_units(compound_id)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single() : { data: null };

    let query = supabase
      .from('community_fees')
      .select(`
        id,
        unit_id,
        fee_type,
        description,
        amount,
        currency,
        due_date,
        status,
        paid_amount,
        paid_at,
        payment_method,
        payment_reference,
        late_fee_amount,
        discount_amount,
        notes,
        created_at,
        updated_at,
        community_units (
          id,
          unit_number,
          building_name,
          compound_id,
          compounds (
            id,
            name,
            address,
            city
          ),
          compound_residents!inner (
            id,
            user_id,
            resident_type,
            user_profiles (
              id,
              full_name,
              email,
              phone
            )
          )
        )
      `, { count: 'exact' });

    // Apply access control
    if (hasAdminAccess) {
      // Admins can see all fees
    } else if (isDeveloper) {
      // Developers can see fees for their compounds
      const developerIds = userRoles
        .filter((role: UserRole) => role.role === 'developer')
        .map((role: UserRole) => role.developer_id)
        .filter(Boolean);
      
      if (developerIds.length > 0) {
        const { data: developerCompounds } = await supabase
          .from('compounds')
          .select('id')
          .in('developer_id', developerIds);
        
        const compoundIds = developerCompounds?.map((c: any) => c.id) || [];
        if (compoundIds.length > 0) {
          query = query.in('community_units.compound_id', compoundIds);
        } else {
          return NextResponse.json({ fees: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
        }
      }
    } else if (isCompoundManager) {
      // Compound managers can see fees for their compounds
      const { data: managedCompounds } = await supabase
        .from('compounds')
        .select('id')
        .eq('compound_manager_user_id', user.id);
      
      const compoundIds = managedCompounds?.map((c: any) => c.id) || [];
      if (compoundIds.length > 0) {
        query = query.in('community_units.compound_id', compoundIds);
      } else {
        return NextResponse.json({ fees: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } });
      }
    } else if (isResident && userResident) {
      // Residents can only see their own unit's fees
      query = query.eq('unit_id', userResident.unit_id);
    } else {
      return NextResponse.json({ error: 'Access denied' }, { status: 403 });
    }

    // Apply filters
    const compoundId = searchParams.get('compound_id');
    const unitId = searchParams.get('unit_id');
    const feeType = searchParams.get('fee_type');
    const status = searchParams.get('status');
    const dueDateFrom = searchParams.get('due_date_from');
    const dueDateTo = searchParams.get('due_date_to');
    const yearMonth = searchParams.get('year_month'); // Format: YYYY-MM

    if (compoundId) {
      query = query.eq('community_units.compound_id', compoundId);
    }

    if (unitId) {
      query = query.eq('unit_id', unitId);
    }

    if (feeType) {
      query = query.eq('fee_type', feeType);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (dueDateFrom) {
      query = query.gte('due_date', dueDateFrom);
    }

    if (dueDateTo) {
      query = query.lte('due_date', dueDateTo);
    }

    if (yearMonth) {
      // Filter by specific month (e.g., "2025-01" for January 2025)
      const startDate = `${yearMonth}-01`;
      const endDate = new Date(yearMonth + '-01');
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0); // Last day of the month
      
      query = query.gte('due_date', startDate)
        .lte('due_date', endDate.toISOString().split('T')[0]);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'due_date';
    const sortOrder = searchParams.get('sort_order') === 'asc' ? { ascending: true } : { ascending: false };

    switch (sortBy) {
      case 'due_date':
        query = query.order('due_date', sortOrder);
        break;
      case 'amount':
        query = query.order('amount', sortOrder);
        break;
      case 'status':
        query = query.order('status', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('due_date', { ascending: false });
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: fees, error, count } = await query;

    if (error) {
      console.error('Community fees fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch community fees' }, { status: 500 });
    }

    // Calculate summary statistics for managers/developers
    const showSummary = hasAdminAccess || isCompoundManager || isDeveloper;
    let summary = {};

    if (showSummary && fees && fees.length > 0) {
      const totalOutstanding = fees
        .filter((fee: any) => fee.status === 'outstanding')
        .reduce((sum: number, fee: any) => sum + (fee.amount - fee.paid_amount), 0);

      const totalPaid = fees
        .filter((fee: any) => fee.status === 'paid')
        .reduce((sum: number, fee: any) => sum + fee.amount, 0);

      const totalOverdue = fees
        .filter((fee: any) => fee.status === 'overdue')
        .reduce((sum: number, fee: any) => sum + (fee.amount - fee.paid_amount), 0);

      summary = {
        total_outstanding: totalOutstanding,
        total_paid: totalPaid,
        total_overdue: totalOverdue,
        payment_rate: totalPaid + totalOutstanding > 0 
          ? (totalPaid / (totalPaid + totalOutstanding) * 100).toFixed(1)
          : '0'
      };
    }

    return NextResponse.json({
      success: true,
      fees: fees || [],
      summary,
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
      unit_id,
      fee_type,
      description,
      amount,
      currency,
      due_date,
      recurring_schedule,
      notes
    } = body;

    // Validate required fields
    if (!unit_id || !fee_type || !amount || !due_date) {
      return NextResponse.json({ 
        error: 'unit_id, fee_type, amount, and due_date are required' 
      }, { status: 400 });
    }

    // Get unit and compound info to verify permissions
    const { data: unit } = await supabase
      .from('community_units')
      .select(`
        id,
        compound_id,
        unit_number,
        compounds (
          id,
          developer_id,
          compound_manager_user_id,
          name
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

    const canCreateFee = hasAdminAccess ||
      userRoles?.some((role: UserRole) => 
        (role.role === 'developer' && role.developer_id === unit.compounds.developer_id) ||
        (role.role === 'compound_manager' && unit.compounds.compound_manager_user_id === user.id)
      );

    if (!canCreateFee) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to create fees for this unit' 
      }, { status: 403 });
    }

    // Validate fee type
    const validFeeTypes = [
      'maintenance', 'utilities', 'parking', 'security', 'cleaning', 
      'amenity', 'special_assessment', 'late_fee', 'other'
    ];

    if (!validFeeTypes.includes(fee_type)) {
      return NextResponse.json({ 
        error: `Invalid fee type. Must be one of: ${validFeeTypes.join(', ')}` 
      }, { status: 400 });
    }

    // Validate amount
    const feeAmount = parseFloat(amount);
    if (isNaN(feeAmount) || feeAmount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be a positive number' 
      }, { status: 400 });
    }

    // Validate due date
    const dueDateObj = new Date(due_date);
    if (isNaN(dueDateObj.getTime())) {
      return NextResponse.json({ 
        error: 'Invalid due date format' 
      }, { status: 400 });
    }

    // Create fee record
    const { data: fee, error: feeError } = await supabase
      .from('community_fees')
      .insert({
        unit_id,
        fee_type,
        description: description || `${fee_type.charAt(0).toUpperCase() + fee_type.slice(1)} fee`,
        amount: feeAmount,
        currency: currency || 'EGP',
        due_date,
        status: 'outstanding',
        paid_amount: 0,
        late_fee_amount: 0,
        discount_amount: 0,
        recurring_schedule: recurring_schedule || null,
        notes
      })
      .select(`
        id,
        unit_id,
        fee_type,
        description,
        amount,
        currency,
        due_date,
        status,
        paid_amount,
        recurring_schedule,
        notes,
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

    if (feeError) {
      console.error('Fee creation error:', feeError);
      return NextResponse.json({ error: 'Failed to create community fee' }, { status: 500 });
    }

    // TODO: Send notification to resident about new fee
    // TODO: If recurring, schedule future fee generation

    return NextResponse.json({
      success: true,
      fee,
      message: 'Community fee created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
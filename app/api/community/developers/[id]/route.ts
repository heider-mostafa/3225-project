import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const developerId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get developer details
    const { data: developer, error } = await supabase
      .from('community_developers')
      .select(`
        id,
        company_name,
        commercial_registration,
        logo_url,
        contact_person_name,
        contact_phone,
        contact_email,
        company_address,
        subscription_tier,
        subscription_status,
        monthly_fee,
        whitelabel_config,
        api_credentials,
        created_at,
        updated_at
      `)
      .eq('id', developerId)
      .single();

    if (error || !developer) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    // Check user access permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const hasDeveloperAccess = hasAdminAccess || 
      userRoles?.some((role: UserRole) => role.role === 'developer' && role.developer_id === developerId);

    if (!hasDeveloperAccess) {
      // Return limited public info for non-authorized users
      return NextResponse.json({
        success: true,
        developer: {
          id: developer.id,
          company_name: developer.company_name,
          logo_url: developer.logo_url,
          contact_phone: developer.contact_phone,
          contact_email: developer.contact_email
        }
      });
    }

    // Get detailed statistics for authorized users
    const stats = await Promise.all([
      // Get compounds count and details
      supabase
        .from('compounds')
        .select('id, name, total_units, city, is_active', { count: 'exact' })
        .eq('developer_id', developerId),
      
      // Get total units across all compounds
      supabase
        .from('community_units')
        .select('id', { count: 'exact' })
        .eq('compounds.developer_id', developerId),
      
      // Get total residents across all compounds
      supabase
        .from('compound_residents')
        .select('id', { count: 'exact' })
        .eq('community_units.compounds.developer_id', developerId)
        .eq('is_active', true),
      
      // Get recent announcements
      supabase
        .from('community_announcements')
        .select('id, title, announcement_type, priority, created_at, compounds(name)')
        .eq('compounds.developer_id', developerId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(5),
        
      // Get service requests summary
      supabase
        .from('community_service_requests')
        .select('id, status', { count: 'exact' })
        .eq('community_units.compounds.developer_id', developerId),
        
      // Get community fees summary
      supabase
        .from('community_fees')
        .select('amount, status')
        .eq('community_units.compounds.developer_id', developerId)
    ]);

    const [
      compoundsResult,
      unitsResult,
      residentsResult,
      announcementsResult,
      serviceRequestsResult,
      feesResult
    ] = stats;

    // Process service requests by status
    const serviceRequestsByStatus = serviceRequestsResult.data?.reduce((acc: any, request: any) => {
      acc[request.status] = (acc[request.status] || 0) + 1;
      return acc;
    }, {}) || {};

    // Process fees by status
    const totalOutstandingFees = feesResult.data?.reduce((sum: number, fee: any) => 
      fee.status === 'outstanding' || fee.status === 'overdue' ? sum + fee.amount : sum, 0
    ) || 0;

    const totalPaidFees = feesResult.data?.reduce((sum: number, fee: any) => 
      fee.status === 'paid' ? sum + fee.amount : sum, 0
    ) || 0;

    // Calculate occupancy rate
    const totalUnits = unitsResult.count || 0;
    const totalResidents = residentsResult.count || 0;
    const occupancyRate = totalUnits > 0 ? ((totalResidents / totalUnits) * 100).toFixed(1) : '0';

    const detailedStats = {
      compounds: {
        total: compoundsResult.count || 0,
        active: compoundsResult.data?.filter((c: any) => c.is_active).length || 0,
        recent: compoundsResult.data?.slice(0, 5) || []
      },
      units: {
        total: totalUnits,
        total_capacity: compoundsResult.data?.reduce((sum: number, compound: any) => 
          sum + (compound.total_units || 0), 0
        ) || 0
      },
      residents: {
        total: totalResidents,
        occupancy_rate: occupancyRate
      },
      announcements: {
        recent: announcementsResult.data || []
      },
      service_requests: {
        by_status: serviceRequestsByStatus,
        total: serviceRequestsResult.count || 0
      },
      finances: {
        outstanding_fees: totalOutstandingFees,
        paid_fees: totalPaidFees,
        monthly_subscription: developer.monthly_fee
      }
    };

    // Hide sensitive info for non-admin users
    const responseData = {
      ...developer,
      stats: detailedStats
    };

    if (!hasAdminAccess) {
      delete responseData.api_credentials;
      delete responseData.commercial_registration;
      delete responseData.monthly_fee;
    }

    return NextResponse.json({
      success: true,
      developer: responseData
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
    const developerId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get existing developer to verify permissions
    const { data: existingDeveloper } = await supabase
      .from('community_developers')
      .select('id')
      .eq('id', developerId)
      .single();

    if (!existingDeveloper) {
      return NextResponse.json({ error: 'Developer not found' }, { status: 404 });
    }

    // Check permissions
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isDeveloperUser = userRoles?.some((role: UserRole) => 
      role.role === 'developer' && role.developer_id === developerId
    );

    if (!hasAdminAccess && !isDeveloperUser) {
      return NextResponse.json({ 
        error: 'Insufficient permissions to update this developer' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      company_name,
      logo_url,
      contact_person_name,
      contact_phone,
      contact_email,
      company_address,
      subscription_tier,
      subscription_status,
      monthly_fee,
      whitelabel_config,
      api_credentials
    } = body;

    // Build update object based on permissions
    const updateData: any = { updated_at: new Date().toISOString() };

    // Fields that developers and admins can update
    if (company_name !== undefined) updateData.company_name = company_name;
    if (logo_url !== undefined) updateData.logo_url = logo_url;
    if (contact_person_name !== undefined) updateData.contact_person_name = contact_person_name;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (company_address !== undefined) updateData.company_address = company_address;
    if (whitelabel_config !== undefined) updateData.whitelabel_config = whitelabel_config;

    // Fields only admins can update
    if (hasAdminAccess) {
      if (subscription_tier !== undefined) updateData.subscription_tier = subscription_tier;
      if (subscription_status !== undefined) updateData.subscription_status = subscription_status;
      if (monthly_fee !== undefined) updateData.monthly_fee = parseFloat(monthly_fee);
      if (api_credentials !== undefined) updateData.api_credentials = api_credentials;
    }

    // Check for email conflicts if updating
    if (updateData.contact_email) {
      const { data: conflictingDeveloper } = await supabase
        .from('community_developers')
        .select('id')
        .eq('contact_email', updateData.contact_email)
        .neq('id', developerId)
        .single();

      if (conflictingDeveloper) {
        return NextResponse.json({ 
          error: 'A developer with this email address already exists' 
        }, { status: 409 });
      }
    }

    // Validate subscription tier if provided
    if (updateData.subscription_tier) {
      const validTiers = ['starter', 'growth', 'enterprise'];
      if (!validTiers.includes(updateData.subscription_tier)) {
        return NextResponse.json({ 
          error: `Invalid subscription tier. Must be one of: ${validTiers.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Validate subscription status if provided
    if (updateData.subscription_status) {
      const validStatuses = ['active', 'suspended', 'cancelled'];
      if (!validStatuses.includes(updateData.subscription_status)) {
        return NextResponse.json({ 
          error: `Invalid subscription status. Must be one of: ${validStatuses.join(', ')}` 
        }, { status: 400 });
      }
    }

    // Update developer
    const { data: updatedDeveloper, error: updateError } = await supabase
      .from('community_developers')
      .update(updateData)
      .eq('id', developerId)
      .select(`
        id,
        company_name,
        commercial_registration,
        logo_url,
        contact_person_name,
        contact_phone,
        contact_email,
        company_address,
        subscription_tier,
        subscription_status,
        monthly_fee,
        whitelabel_config,
        created_at,
        updated_at
      `)
      .single();

    if (updateError) {
      console.error('Developer update error:', updateError);
      return NextResponse.json({ error: 'Failed to update developer' }, { status: 500 });
    }

    // Hide sensitive info for non-admin users
    if (!hasAdminAccess) {
      delete updatedDeveloper.commercial_registration;
      delete updatedDeveloper.monthly_fee;
    }

    return NextResponse.json({
      success: true,
      developer: updatedDeveloper,
      message: 'Developer updated successfully'
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
    const developerId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Only super admins can delete developers
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isSuperAdmin = userRoles?.some((role: UserRole) => role.role === 'super_admin');

    if (!isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Only super administrators can delete developer organizations' 
      }, { status: 403 });
    }

    // Check if developer has active compounds
    const { data: activeCompounds, count } = await supabase
      .from('compounds')
      .select('id', { count: 'exact' })
      .eq('developer_id', developerId)
      .eq('is_active', true);

    if (count && count > 0) {
      return NextResponse.json({ 
        error: `Cannot delete developer with ${count} active compound(s). Please deactivate all compounds first.` 
      }, { status: 400 });
    }

    // Soft delete by changing subscription status
    const { data: deletedDeveloper, error: deleteError } = await supabase
      .from('community_developers')
      .update({ 
        subscription_status: 'cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', developerId)
      .select('id, company_name')
      .single();

    if (deleteError) {
      console.error('Developer deletion error:', deleteError);
      return NextResponse.json({ error: 'Failed to delete developer' }, { status: 500 });
    }

    // Deactivate all user roles associated with this developer
    const { error: roleDeactivationError } = await supabase
      .from('user_roles')
      .update({ 
        is_active: false,
        revoked_at: new Date().toISOString()
      })
      .eq('developer_id', developerId);

    if (roleDeactivationError) {
      console.error('Role deactivation error:', roleDeactivationError);
    }

    return NextResponse.json({
      success: true,
      message: `Developer organization "${deletedDeveloper?.company_name}" has been cancelled`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
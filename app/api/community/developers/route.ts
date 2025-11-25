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
      .select('role, developer_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const isDeveloper = userRoles?.some((role: UserRole) => role.role === 'developer');

    let query = supabase
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
        created_at,
        updated_at
      `, { count: 'exact' });

    // Apply access control
    if (!hasAdminAccess) {
      if (isDeveloper) {
        // Developers can only see their own organization
        const developerIds = userRoles
          .filter((role: UserRole) => role.role === 'developer')
          .map((role: UserRole) => role.developer_id)
          .filter(Boolean);
        
        if (developerIds.length === 0) {
          return NextResponse.json({ developers: [] });
        }
        
        query = query.in('id', developerIds);
      } else {
        // Non-developers can see basic info only (for compound selection, etc.)
        query = query.select(`
          id,
          company_name,
          logo_url,
          contact_phone,
          contact_email
        `);
      }
    }

    // Apply filters
    const companyName = searchParams.get('company_name');
    const subscriptionTier = searchParams.get('subscription_tier');
    const subscriptionStatus = searchParams.get('subscription_status');
    const city = searchParams.get('city');

    if (companyName) {
      query = query.ilike('company_name', `%${companyName}%`);
    }

    if (subscriptionTier) {
      query = query.eq('subscription_tier', subscriptionTier);
    }

    if (subscriptionStatus) {
      query = query.eq('subscription_status', subscriptionStatus);
    }

    if (city) {
      query = query.ilike('company_address', `%${city}%`);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'company_name';
    const sortOrder = searchParams.get('sort_order') === 'desc' ? { ascending: false } : { ascending: true };

    switch (sortBy) {
      case 'company_name':
        query = query.order('company_name', sortOrder);
        break;
      case 'subscription_tier':
        query = query.order('subscription_tier', sortOrder);
        break;
      case 'monthly_fee':
        query = query.order('monthly_fee', sortOrder);
        break;
      case 'created_at':
        query = query.order('created_at', sortOrder);
        break;
      default:
        query = query.order('company_name', { ascending: true });
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    query = query.range(from, to);

    // Execute query
    const { data: developers, error, count } = await query;

    if (error) {
      console.error('Developers fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch developers' }, { status: 500 });
    }

    // Get additional statistics for each developer (admin view only)
    const developersWithStats = hasAdminAccess ? await Promise.all(
      (developers || []).map(async (developer: any) => {
        // Get compound count
        const { count: compoundCount } = await supabase
          .from('compounds')
          .select('id', { count: 'exact' })
          .eq('developer_id', developer.id)
          .eq('is_active', true);

        // Get total units across all compounds
        const { data: compoundUnits } = await supabase
          .from('compounds')
          .select('total_units')
          .eq('developer_id', developer.id)
          .eq('is_active', true);

        const totalUnits = compoundUnits?.reduce((sum: number, compound: any) => 
          sum + (compound.total_units || 0), 0
        ) || 0;

        return {
          ...developer,
          stats: {
            compound_count: compoundCount,
            total_units: totalUnits
          }
        };
      })
    ) : developers;

    return NextResponse.json({
      success: true,
      developers: developersWithStats || [],
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

    // Only super admins can create developer organizations
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isSuperAdmin = userRoles?.some((role: UserRole) => role.role === 'super_admin');

    if (!isSuperAdmin) {
      return NextResponse.json({ 
        error: 'Only super administrators can create developer organizations' 
      }, { status: 403 });
    }

    const body = await request.json();
    const {
      company_name,
      commercial_registration,
      logo_url,
      contact_person_name,
      contact_phone,
      contact_email,
      company_address,
      subscription_tier,
      monthly_fee,
      whitelabel_config,
      developer_user_id // User to assign developer role to
    } = body;

    // Validate required fields
    if (!company_name || !commercial_registration || !contact_person_name || !contact_phone || !contact_email) {
      return NextResponse.json({ 
        error: 'company_name, commercial_registration, contact_person_name, contact_phone, and contact_email are required' 
      }, { status: 400 });
    }

    // Check for duplicate commercial registration
    const { data: existingDeveloper } = await supabase
      .from('community_developers')
      .select('id')
      .eq('commercial_registration', commercial_registration)
      .single();

    if (existingDeveloper) {
      return NextResponse.json({ 
        error: 'A developer with this commercial registration already exists' 
      }, { status: 409 });
    }

    // Check for duplicate email
    const { data: existingEmail } = await supabase
      .from('community_developers')
      .select('id')
      .eq('contact_email', contact_email)
      .single();

    if (existingEmail) {
      return NextResponse.json({ 
        error: 'A developer with this email address already exists' 
      }, { status: 409 });
    }

    // Validate subscription tier
    const validTiers = ['starter', 'growth', 'enterprise'];
    const tier = subscription_tier || 'starter';
    
    if (!validTiers.includes(tier)) {
      return NextResponse.json({ 
        error: `Invalid subscription tier. Must be one of: ${validTiers.join(', ')}` 
      }, { status: 400 });
    }

    // Set default monthly fee based on tier
    let defaultMonthlyFee = 2000.00; // starter
    if (tier === 'growth') defaultMonthlyFee = 5000.00;
    if (tier === 'enterprise') defaultMonthlyFee = 10000.00;

    const finalMonthlyFee = monthly_fee !== undefined ? parseFloat(monthly_fee) : defaultMonthlyFee;

    // Create developer organization
    const { data: developer, error: developerError } = await supabase
      .from('community_developers')
      .insert({
        company_name,
        commercial_registration,
        logo_url,
        contact_person_name,
        contact_phone,
        contact_email,
        company_address,
        subscription_tier: tier,
        subscription_status: 'active',
        monthly_fee: finalMonthlyFee,
        whitelabel_config: whitelabel_config || {},
        api_credentials: {} // Will be populated later if needed
      })
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

    if (developerError) {
      console.error('Developer creation error:', developerError);
      return NextResponse.json({ error: 'Failed to create developer organization' }, { status: 500 });
    }

    // Assign developer role to specified user if provided
    if (developer_user_id) {
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: developer_user_id,
          role: 'developer',
          developer_id: developer.id,
          is_active: true,
          assigned_at: new Date().toISOString(),
          assigned_by: user.id
        });

      if (roleError) {
        console.error('Developer role assignment error:', roleError);
        // Don't fail the main operation, but log the error
      }
    }

    return NextResponse.json({
      success: true,
      developer,
      message: 'Developer organization created successfully'
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
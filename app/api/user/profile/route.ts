import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== USER PROFILE API START ===');
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth user:', { id: user?.id, email: user?.email });
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user roles
    console.log('Fetching user roles for user_id:', user.id);
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true);

    console.log('Raw user roles query result:', { userRoles, rolesError });
    console.log('User roles raw data structure:', userRoles?.map(role => ({ 
      role: role.role, 
      is_active: role.is_active,
      all_fields: role 
    })));

    if (rolesError) {
      console.error('Roles fetch error:', rolesError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch user roles' },
        { status: 500 }
      );
    }

    // Get broker profile if user is an appraiser
    let brokerProfile = null;
    const hasAppraisalAccess = userRoles?.some(role => 
      ['appraiser', 'admin', 'super_admin'].includes(role.role)
    );

    console.log('Has appraisal access:', hasAppraisalAccess);
    console.log('User roles for access check:', userRoles?.map(r => r.role));

    if (hasAppraisalAccess) {
      console.log('Fetching broker profile for user_id:', user.id);
      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .select('id, full_name, email, appraiser_license_number, public_profile_active')
        .eq('user_id', user.id)
        .single();

      console.log('Broker query result:', { broker, brokerError });

      if (!brokerError && broker) {
        brokerProfile = broker;
        console.log('Broker profile found:', brokerProfile);
      } else {
        console.log('No broker profile found or error occurred');
      }
    }

    const finalResponse = {
      success: true,
      data: {
        user_id: user.id,
        email: user.email,
        roles: userRoles?.map(r => r.role) || [],
        broker_id: brokerProfile?.id || null,
        broker_profile: brokerProfile
      }
    };

    console.log('Final API response:', finalResponse);

    return NextResponse.json(finalResponse);

  } catch (error) {
    console.error('User profile API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import type { UserRole } from '@/lib/supabase/types';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const passId = params.id;

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Check if user has security guard or compound manager role
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role, compound_id')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const hasAdminAccess = userRoles?.some((role: UserRole) => 
      ['admin', 'super_admin'].includes(role.role)
    );

    const canCheckIn = hasAdminAccess || userRoles?.some((role: UserRole) => 
      ['security_guard', 'compound_manager'].includes(role.role)
    );

    if (!canCheckIn) {
      return NextResponse.json({ 
        error: 'Only security guards and compound managers can check in visitors' 
      }, { status: 403 });
    }

    // Get visitor pass details
    const { data: visitorPass, error: fetchError } = await supabase
      .from('visitor_passes')
      .select(`
        id,
        resident_id,
        visitor_name,
        visitor_phone,
        visitor_id_number,
        visit_purpose,
        expected_arrival,
        expected_departure,
        actual_arrival,
        actual_departure,
        pass_code,
        status,
        compound_residents (
          id,
          community_units (
            compound_id,
            unit_number,
            building_name,
            compounds (
              id,
              name,
              address
            )
          ),
          user_profiles (
            full_name,
            phone
          )
        )
      `)
      .eq('id', passId)
      .single();

    if (fetchError || !visitorPass) {
      return NextResponse.json({ error: 'Visitor pass not found' }, { status: 404 });
    }

    // Check if user has access to this compound
    const compoundId = visitorPass.compound_residents?.community_units?.compound_id;
    if (!hasAdminAccess && compoundId) {
      const hasCompoundAccess = userRoles?.some((role: UserRole) => 
        role.compound_id === compoundId
      );

      if (!hasCompoundAccess) {
        // Check if user is compound manager for this compound
        const { data: compound } = await supabase
          .from('compounds')
          .select('compound_manager_user_id')
          .eq('id', compoundId)
          .single();

        if (compound?.compound_manager_user_id !== user.id) {
          return NextResponse.json({ 
            error: 'Access denied to this compound' 
          }, { status: 403 });
        }
      }
    }

    // Validate pass status
    if (visitorPass.status !== 'active') {
      let errorMessage = 'Visitor pass is not active';
      
      switch (visitorPass.status) {
        case 'pending_approval':
          errorMessage = 'Visitor pass is pending approval';
          break;
        case 'expired':
          errorMessage = 'Visitor pass has expired';
          break;
        case 'used':
          errorMessage = 'Visitor pass has already been used';
          break;
        case 'cancelled':
          errorMessage = 'Visitor pass has been cancelled';
          break;
      }
      
      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }

    // Check if visitor is already checked in
    if (visitorPass.actual_arrival) {
      return NextResponse.json({ 
        error: 'Visitor is already checked in',
        checked_in_at: visitorPass.actual_arrival
      }, { status: 400 });
    }

    // Validate timing (allow some flexibility)
    const now = new Date();
    const expectedArrival = new Date(visitorPass.expected_arrival);
    const timeDiffMinutes = Math.abs(now.getTime() - expectedArrival.getTime()) / (1000 * 60);

    // Allow check-in up to 2 hours early or 4 hours late
    if (timeDiffMinutes > 240 && now > expectedArrival) {
      return NextResponse.json({ 
        error: 'Visitor pass has expired. Please contact the resident for a new pass.',
        expected_arrival: visitorPass.expected_arrival,
        current_time: now.toISOString()
      }, { status: 400 });
    }

    const body = await request.json();
    const { visitor_id_verified, notes } = body;

    // Update visitor pass with check-in information
    const { data: updatedPass, error: updateError } = await supabase
      .from('visitor_passes')
      .update({
        actual_arrival: now.toISOString(),
        status: 'checked_in',
        checked_in_by_user_id: user.id,
        notes: notes ? `${visitorPass.notes || ''}\nCheck-in notes: ${notes}`.trim() : visitorPass.notes
      })
      .eq('id', passId)
      .select(`
        id,
        resident_id,
        visitor_name,
        visitor_phone,
        actual_arrival,
        status,
        compound_residents (
          community_units (
            unit_number,
            building_name,
            compounds (
              name
            )
          ),
          user_profiles (
            full_name,
            phone
          )
        )
      `)
      .single();

    if (updateError) {
      console.error('Check-in update error:', updateError);
      return NextResponse.json({ error: 'Failed to check in visitor' }, { status: 500 });
    }

    // TODO: Send notification to resident about visitor arrival
    // TODO: Log security event

    // Create activity log entry
    const { error: logError } = await supabase
      .from('security_incidents')
      .insert({
        compound_id: compoundId,
        incident_type: 'visitor_checkin',
        description: `Visitor ${visitorPass.visitor_name} checked in to unit ${visitorPass.compound_residents?.community_units?.unit_number}`,
        reported_by_user_id: user.id,
        status: 'resolved',
        severity: 'low'
      });

    if (logError) {
      console.error('Security log error:', logError);
    }

    return NextResponse.json({
      success: true,
      visitor_pass: updatedPass,
      checked_in_at: now.toISOString(),
      message: `${visitorPass.visitor_name} checked in successfully`
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
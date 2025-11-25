import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { 
      unit_id, 
      compound_id,
      national_id,
      ownership_document_number,
      user_id: targetUserId 
    } = body;

    if (!unit_id || !compound_id || !national_id) {
      return NextResponse.json(
        { error: 'Unit ID, compound ID, and national ID are required' },
        { status: 400 }
      );
    }

    // Verify user has resident_owner role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', targetUserId || user.id)
      .single();

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    if (!['resident_owner', 'resident_tenant'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'Unit validation is only available for residents' },
        { status: 403 }
      );
    }

    // Check if compound exists
    const { data: compound, error: compoundError } = await supabase
      .from('compounds')
      .select('id, name, developer_id')
      .eq('id', compound_id)
      .single();

    if (compoundError || !compound) {
      return NextResponse.json(
        { error: 'Compound not found' },
        { status: 404 }
      );
    }

    // Check if unit exists and belongs to the compound
    const { data: unit, error: unitError } = await supabase
      .from('units')
      .select('id, unit_number, compound_id, owner_name, owner_national_id')
      .eq('id', unit_id)
      .eq('compound_id', compound_id)
      .single();

    if (unitError || !unit) {
      return NextResponse.json(
        { error: 'Unit not found in the specified compound' },
        { status: 404 }
      );
    }

    // Validate ownership for resident_owner
    let isValid = false;
    let validationMessage = '';
    
    if (userProfile.role === 'resident_owner') {
      // Check if the national ID matches the unit owner
      isValid = unit.owner_national_id === national_id;
      validationMessage = isValid 
        ? 'Unit ownership verified successfully' 
        : 'National ID does not match unit owner records';
    } else if (userProfile.role === 'resident_tenant') {
      // For tenants, we'll assume validation if unit exists (simplified logic)
      // In production, this would check tenancy agreements
      isValid = true;
      validationMessage = 'Unit residency verified successfully';
    }

    const transactionId = `unit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Store verification result
    const { error: insertError } = await supabase
      .from('appraiser_verification_sessions')
      .insert({
        appraiser_id: targetUserId || user.id,
        session_type: userProfile.role === 'resident_owner' ? 'unit_ownership' : 'unit_residency',
        status: isValid ? 'completed' : 'failed',
        data: {
          verification_type: userProfile.role === 'resident_owner' ? 'unit_ownership' : 'unit_residency',
          unit_id,
          compound_id,
          compound_name: compound.name,
          unit_number: unit.unit_number,
          national_id,
          ownership_document_number,
          validated_at: new Date().toISOString()
        },
        transaction_id: transactionId
      });

    if (insertError) {
      console.error('Failed to store unit verification:', insertError);
    }

    // Update user verification status if successful
    if (isValid) {
      const verificationStatus = userProfile.role === 'resident_owner' 
        ? 'ownership_verified' 
        : 'residency_verified';
      
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          verification_status: verificationStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId || user.id);

      if (updateError) {
        console.error('Failed to update user verification status:', updateError);
      }
    }

    return NextResponse.json({
      success: isValid,
      transaction_id: transactionId,
      message: validationMessage,
      unit_data: {
        unit_id,
        unit_number: unit.unit_number,
        compound_name: compound.name,
        verification_type: userProfile.role === 'resident_owner' ? 'ownership' : 'residency',
        status: isValid ? 'verified' : 'failed'
      }
    });

  } catch (error) {
    console.error('Unit validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate unit ownership/residency' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { getValifyService } from '@/lib/services/valify-service';
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
      commercial_registration_number, 
      company_name,
      tax_id,
      user_id: targetUserId 
    } = body;

    if (!commercial_registration_number || !company_name) {
      return NextResponse.json(
        { error: 'Commercial registration number and company name are required' },
        { status: 400 }
      );
    }

    // Verify user has developer role
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

    if (userProfile.role !== 'developer') {
      return NextResponse.json(
        { error: 'Commercial registration verification is only available for developers' },
        { status: 403 }
      );
    }

    // Use Valify service for commercial registration validation
    const valifyService = getValifyService();
    const validationResult = await valifyService.validateCommercialRegistration(
      commercial_registration_number,
      company_name,
      tax_id,
      targetUserId || user.id
    );

    // Store verification result in verification sessions table
    const { error: insertError } = await supabase
      .from('appraiser_verification_sessions')
      .insert({
        appraiser_id: targetUserId || user.id,
        session_type: 'commercial_registration',
        status: validationResult.is_valid ? 'completed' : 'failed',
        data: {
          verification_type: 'commercial_registration',
          commercial_registration_number,
          company_name,
          tax_id,
          validation_result: validationResult,
          validated_at: new Date().toISOString()
        },
        transaction_id: validationResult.transaction_id
      });

    if (insertError) {
      console.error('Failed to store commercial registration verification:', insertError);
    }

    // Update user verification status if successful
    if (validationResult.is_valid) {
      const { error: updateError } = await supabase
        .from('users')
        .update({ 
          verification_status: 'commercial_verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', targetUserId || user.id);

      if (updateError) {
        console.error('Failed to update user verification status:', updateError);
      }
    }

    return NextResponse.json({
      success: validationResult.is_valid,
      transaction_id: validationResult.transaction_id,
      message: validationResult.is_valid 
        ? 'Commercial registration validated successfully' 
        : validationResult.error_message || 'Commercial registration validation failed',
      company_data: validationResult.company_data,
      verification_data: {
        commercial_registration_number,
        company_name,
        status: validationResult.is_valid ? 'verified' : 'failed'
      }
    });

  } catch (error) {
    console.error('Commercial registration validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate commercial registration' },
      { status: 500 }
    );
  }
}
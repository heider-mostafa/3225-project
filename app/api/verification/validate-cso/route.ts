import { NextRequest, NextResponse } from 'next/server';
import { valifyService } from '@/lib/services/valify-service';
import { createClient } from '@/utils/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Get user session
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appraiser_id, nid, first_name, full_name, serial_number, expiration, bundle_session_id } = body;

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    // Verify appraiser belongs to the authenticated user
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, national_id, full_name, verification_status')
      .eq('id', appraiser_id)
      .eq('user_id', user.id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get document data from previous OCR step if not provided
    const { data: documentData } = await supabase
      .from('appraiser_identity_documents')
      .select('extracted_data')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const personalData = {
      nid: nid || documentData?.extracted_data?.national_id || appraiser.national_id,
      first_name: first_name || documentData?.extracted_data?.first_name,
      full_name: full_name || documentData?.extracted_data?.full_name || appraiser.full_name,
      serial_number: serial_number || documentData?.extracted_data?.serial_number,
      expiration: expiration || documentData?.extracted_data?.expiry_date,
      bundle_session_id: bundle_session_id
    };

    // Validate National ID with CSO
    const csoResponse = await valifyService.validateNationalIDWithCSO(
      personalData,
      appraiser_id
    );

    // Store CSO validation session
    const { error: insertError } = await supabase
      .from('appraiser_verification_sessions')
      .upsert({
        appraiser_id: appraiser_id,
        session_type: 'cso_validation',
        transaction_id: csoResponse.transaction_id,
        status: csoResponse.result.isValid ? 'completed' : 'failed',
        data: {
          personal_data: personalData,
          validation_result: csoResponse,
          service_type: 'cso_validation',
          trials_remaining: csoResponse.trials_remaining
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'appraiser_id,session_type'
      });

    if (insertError) {
      console.error('Failed to store CSO validation session:', insertError);
    }

    // If validation successful, update appraiser CSO verification status
    if (csoResponse.result.isValid) {
      const { error: appraiserUpdateError } = await supabase
        .from('brokers')
        .update({
          cso_validated: true,
          verification_status: 'cso_verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', appraiser_id);

      if (appraiserUpdateError) {
        console.error('Failed to update appraiser CSO status:', appraiserUpdateError);
      }
    }

    return NextResponse.json({
      success: csoResponse.result.isValid,
      transaction_id: csoResponse.transaction_id,
      trials_remaining: csoResponse.trials_remaining,
      result: csoResponse.result,
      message: csoResponse.result.isValid 
        ? 'National ID validated successfully with CSO' 
        : `CSO validation failed: ${csoResponse.result.errorMessage}`
    });

  } catch (error) {
    console.error('CSO validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate with CSO' },
      { status: 500 }
    );
  }
}
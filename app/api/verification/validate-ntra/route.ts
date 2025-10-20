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
    const { appraiser_id, phone_number, nid, bundle_session_id } = body;

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    // Verify appraiser belongs to the authenticated user
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, national_id, phone, verification_status')
      .eq('id', appraiser_id)
      .eq('user_id', user.id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get phone number and National ID from previous steps if not provided
    let phoneToValidate = phone_number || appraiser.phone;
    let nationalIdToValidate = nid || appraiser.national_id;

    // Try to get data from recent phone OTP session if phone not provided
    if (!phoneToValidate) {
      const { data: phoneSession } = await supabase
        .from('appraiser_verification_sessions')
        .select('data')
        .eq('appraiser_id', appraiser_id)
        .eq('session_type', 'phone_otp')
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      phoneToValidate = phoneSession?.data?.phone_number;
    }

    // Try to get National ID from document data if not provided
    if (!nationalIdToValidate) {
      const { data: documentData } = await supabase
        .from('appraiser_identity_documents')
        .select('extracted_data')
        .eq('appraiser_id', appraiser_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      nationalIdToValidate = documentData?.extracted_data?.national_id;
    }

    if (!phoneToValidate || !nationalIdToValidate) {
      return NextResponse.json(
        { error: 'Phone number and National ID are required for NTRA validation' },
        { status: 400 }
      );
    }

    // Validate phone with NTRA
    const ntraResponse = await valifyService.validatePhoneWithNTRA(
      phoneToValidate,
      nationalIdToValidate,
      appraiser_id,
      bundle_session_id
    );

    // Store NTRA validation session
    const { error: insertError } = await supabase
      .from('appraiser_verification_sessions')
      .upsert({
        appraiser_id: appraiser_id,
        session_type: 'ntra_validation',
        transaction_id: ntraResponse.transaction_id,
        status: ntraResponse.result.isMatched ? 'completed' : 'failed',
        data: {
          phone_number: phoneToValidate,
          national_id: nationalIdToValidate,
          validation_result: ntraResponse,
          service_type: 'ntra_validation',
          trials_remaining: ntraResponse.trials_remaining,
          bundle_session_id: bundle_session_id
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'appraiser_id,session_type'
      });

    if (insertError) {
      console.error('Failed to store NTRA validation session:', insertError);
    }

    // If validation successful, update appraiser NTRA verification status
    if (ntraResponse.result.isMatched) {
      const { error: appraiserUpdateError } = await supabase
        .from('brokers')
        .update({
          ntra_validated: true,
          verification_status: 'ntra_verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', appraiser_id);

      if (appraiserUpdateError) {
        console.error('Failed to update appraiser NTRA status:', appraiserUpdateError);
      }
    }

    return NextResponse.json({
      success: ntraResponse.result.isMatched,
      transaction_id: ntraResponse.transaction_id,
      trials_remaining: ntraResponse.trials_remaining,
      result: ntraResponse.result,
      message: ntraResponse.result.isMatched 
        ? 'Phone number validated successfully with NTRA' 
        : 'Phone number does not match National ID in NTRA records'
    });

  } catch (error) {
    console.error('NTRA validation error:', error);
    return NextResponse.json(
      { error: 'Failed to validate with NTRA' },
      { status: 500 }
    );
  }
}
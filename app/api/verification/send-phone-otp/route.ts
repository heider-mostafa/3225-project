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
    const { phone_number, appraiser_id } = body;

    if (!phone_number || !appraiser_id) {
      return NextResponse.json(
        { error: 'Phone number and appraiser ID are required' },
        { status: 400 }
      );
    }

    // Validate Egyptian phone number format
    const egyptianPhoneRegex = /^(\+20|0020|20)?1[0-9]{9}$/;
    if (!egyptianPhoneRegex.test(phone_number)) {
      return NextResponse.json(
        { error: 'Invalid Egyptian phone number format' },
        { status: 400 }
      );
    }

    // Verify appraiser belongs to the authenticated user
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, phone, verification_status')
      .eq('id', appraiser_id)
      .eq('user_id', user.id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found or unauthorized' },
        { status: 404 }
      );
    }

    // Send phone OTP via Valify
    const otpResponse = await valifyService.sendPhoneOTP(phone_number, appraiser_id);

    // Store OTP session in database
    const { error: insertError } = await supabase
      .from('appraiser_verification_sessions')
      .upsert({
        appraiser_id: appraiser_id,
        session_type: 'phone_otp',
        transaction_id: otpResponse.transaction_id,
        status: 'pending',
        data: {
          phone_number: phone_number,
          trials_remaining: otpResponse.trials_remaining,
          service_type: 'phone_otp_send'
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'appraiser_id,session_type'
      });

    if (insertError) {
      console.error('Failed to store OTP session:', insertError);
    }

    return NextResponse.json({
      success: true,
      transaction_id: otpResponse.transaction_id,
      trials_remaining: otpResponse.trials_remaining,
      message: 'OTP sent successfully to phone number'
    });

  } catch (error) {
    console.error('Send phone OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send phone OTP' },
      { status: 500 }
    );
  }
}
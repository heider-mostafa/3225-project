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
    const { otp, transaction_id, appraiser_id } = body;

    if (!otp || !transaction_id || !appraiser_id) {
      return NextResponse.json(
        { error: 'OTP, transaction ID, and appraiser ID are required' },
        { status: 400 }
      );
    }

    // Validate OTP format (6 digits)
    if (!/^\d{6}$/.test(otp)) {
      return NextResponse.json(
        { error: 'OTP must be 6 digits' },
        { status: 400 }
      );
    }

    // Verify appraiser belongs to the authenticated user
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, email, verification_status')
      .eq('id', appraiser_id)
      .eq('user_id', user.id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found or unauthorized' },
        { status: 404 }
      );
    }

    // Get OTP session from database
    const { data: session, error: sessionError } = await supabase
      .from('appraiser_verification_sessions')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('session_type', 'email_otp')
      .eq('transaction_id', transaction_id)
      .single();

    if (sessionError || !session) {
      return NextResponse.json(
        { error: 'Invalid or expired OTP session' },
        { status: 400 }
      );
    }

    // Verify email OTP via Valify
    const verificationResponse = await valifyService.verifyEmailOTP(
      otp, 
      transaction_id, 
      appraiser_id
    );

    // Update session status
    const { error: updateError } = await supabase
      .from('appraiser_verification_sessions')
      .update({
        status: verificationResponse.verified ? 'completed' : 'failed',
        data: {
          ...session.data,
          verification_result: verificationResponse,
          service_type: 'email_otp_verify'
        },
        updated_at: new Date().toISOString()
      })
      .eq('id', session.id);

    if (updateError) {
      console.error('Failed to update email OTP session:', updateError);
    }

    // If verification successful, update appraiser email verification status
    if (verificationResponse.verified) {
      const { error: appraiserUpdateError } = await supabase
        .from('brokers')
        .update({
          email: session.data.email,
          email_verified: true,
          verification_status: 'email_verified',
          updated_at: new Date().toISOString()
        })
        .eq('id', appraiser_id);

      if (appraiserUpdateError) {
        console.error('Failed to update appraiser email status:', appraiserUpdateError);
      }
    }

    return NextResponse.json({
      success: verificationResponse.verified,
      verified: verificationResponse.verified,
      message: verificationResponse.verified 
        ? 'Email address verified successfully' 
        : 'Invalid OTP code'
    });

  } catch (error) {
    console.error('Verify email OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to verify email OTP' },
      { status: 500 }
    );
  }
}
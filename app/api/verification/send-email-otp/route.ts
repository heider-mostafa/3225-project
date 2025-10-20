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
    const { email, appraiser_id } = body;

    if (!email || !appraiser_id) {
      return NextResponse.json(
        { error: 'Email and appraiser ID are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
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

    // Send email OTP via Valify
    const otpResponse = await valifyService.sendEmailOTP(email, appraiser_id);

    // Store OTP session in database
    const { error: insertError } = await supabase
      .from('appraiser_verification_sessions')
      .upsert({
        appraiser_id: appraiser_id,
        session_type: 'email_otp',
        transaction_id: otpResponse.transaction_id,
        status: 'pending',
        data: {
          email: email,
          trials_remaining: otpResponse.trials_remaining,
          service_type: 'email_otp_send'
        },
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'appraiser_id,session_type'
      });

    if (insertError) {
      console.error('Failed to store email OTP session:', insertError);
    }

    return NextResponse.json({
      success: true,
      transaction_id: otpResponse.transaction_id,
      trials_remaining: otpResponse.trials_remaining,
      message: 'OTP sent successfully to email address'
    });

  } catch (error) {
    console.error('Send email OTP error:', error);
    return NextResponse.json(
      { error: 'Failed to send email OTP' },
      { status: 500 }
    );
  }
}
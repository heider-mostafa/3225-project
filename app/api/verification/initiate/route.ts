import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/**
 * POST /api/verification/initiate
 * Initiate a new verification session for an appraiser
 */
export async function POST(request: Request) {
  try {
    const { appraiser_id } = await request.json();

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    );

    // Check if appraiser exists
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, user_id, full_name, valify_status')
      .eq('id', appraiser_id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    // Check if there's already an active verification session
    const { data: existingSession, error: sessionError } = await supabase
      .from('appraiser_verification_sessions')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('session_status', 'started')
      .maybeSingle();

    if (sessionError) {
      console.error('Error checking existing session:', sessionError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    let session;

    if (existingSession) {
      // Return existing session
      session = existingSession;
    } else {
      // Create new verification session
      const { data: newSession, error: createError } = await supabase
        .from('appraiser_verification_sessions')
        .insert({
          appraiser_id,
          session_status: 'started',
          current_step: 'document_upload',
        })
        .select()
        .single();

      if (createError) {
        console.error('Error creating verification session:', createError);
        return NextResponse.json(
          { error: 'Failed to create verification session' },
          { status: 500 }
        );
      }

      session = newSession;

      // Update appraiser status to in_progress
      await supabase
        .from('brokers')
        .update({ valify_status: 'in_progress' })
        .eq('id', appraiser_id);
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        appraiser_id: session.appraiser_id,
        session_status: session.session_status,
        current_step: session.current_step,
        created_at: session.created_at,
      },
      appraiser: {
        id: appraiser.id,
        full_name: appraiser.full_name,
        current_status: appraiser.valify_status,
      },
    });

  } catch (error) {
    console.error('Verification initiation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verification/initiate?appraiser_id=xxx
 * Get current verification session status
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    );

    // Get current verification session
    const { data: session, error: sessionError } = await supabase
      .from('appraiser_verification_sessions')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching verification session:', sessionError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Get appraiser details
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, full_name, valify_status, valify_score, valify_completed_at')
      .eq('id', appraiser_id)
      .single();

    if (appraiserError) {
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    // Get verification logs for detailed status
    const { data: verificationLogs, error: logsError } = await supabase
      .from('appraiser_verification_logs')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching verification logs:', logsError);
    }

    return NextResponse.json({
      success: true,
      session,
      appraiser: {
        id: appraiser.id,
        full_name: appraiser.full_name,
        valify_status: appraiser.valify_status,
        valify_score: appraiser.valify_score,
        valify_completed_at: appraiser.valify_completed_at,
      },
      verification_logs: verificationLogs || [],
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
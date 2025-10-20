import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import valifyService from '@/lib/services/valify-service';

/**
 * POST /api/verification/webhook
 * Handle Valify webhook callbacks for verification status updates
 */
export async function POST(request: Request) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-valify-signature') || '';

    // Verify webhook signature
    if (!valifyService.verifyWebhookSignature(body, signature)) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    const webhookData = JSON.parse(body);
    console.log('Received Valify webhook:', webhookData);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    );

    // Find the verification log entry by transaction ID
    const { data: verificationLog, error: logError } = await supabase
      .from('appraiser_verification_logs')
      .select('*')
      .eq('transaction_id', webhookData.transaction_id)
      .single();

    if (logError || !verificationLog) {
      console.error('Verification log not found for transaction:', webhookData.transaction_id);
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }

    const appraiser_id = verificationLog.appraiser_id;

    // Update verification log with webhook data
    await supabase
      .from('appraiser_verification_logs')
      .update({
        status: webhookData.status,
        details: {
          ...verificationLog.details,
          webhook_data: webhookData,
          webhook_received_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', verificationLog.id);

    // Get current appraiser verification status
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, valify_status, valify_score')
      .eq('id', appraiser_id)
      .single();

    if (appraiserError || !appraiser) {
      console.error('Appraiser not found:', appraiser_id);
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    // Get all verification logs for this appraiser to recalculate overall status
    const { data: allLogs, error: allLogsError } = await supabase
      .from('appraiser_verification_logs')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false });

    if (allLogsError) {
      console.error('Error fetching all logs:', allLogsError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Recalculate overall verification status
    const verificationResults = {
      document: null,
      liveness: null,
      face_match: null,
      sanction_check: null,
    };

    allLogs?.forEach(log => {
      switch (log.verification_type) {
        case 'document':
          if (!verificationResults.document || log.created_at > verificationResults.document.created_at) {
            verificationResults.document = log;
          }
          break;
        case 'liveness':
          if (!verificationResults.liveness || log.created_at > verificationResults.liveness.created_at) {
            verificationResults.liveness = log;
          }
          break;
        case 'face_match':
          if (!verificationResults.face_match || log.created_at > verificationResults.face_match.created_at) {
            verificationResults.face_match = log;
          }
          break;
        case 'sanction_check':
          if (!verificationResults.sanction_check || log.created_at > verificationResults.sanction_check.created_at) {
            verificationResults.sanction_check = log;
          }
          break;
      }
    });

    // Calculate new overall score and status
    let newOverallScore = 0;
    let newStatus = 'in_progress';
    let completedSteps = 0;
    let failedSteps = 0;

    Object.values(verificationResults).forEach(result => {
      if (result) {
        if (result.status === 'success') {
          completedSteps++;
          if (result.score) {
            newOverallScore += result.score;
          }
        } else if (result.status === 'failed') {
          failedSteps++;
        }
      }
    });

    // Determine new status
    if (failedSteps > 0) {
      newStatus = 'failed';
    } else if (completedSteps >= 3) { // document, liveness, and at least one other check
      if (newOverallScore >= 270) { // Rough calculation for 90% average
        newStatus = 'verified';
      } else if (newOverallScore >= 210) { // 70% average
        newStatus = 'manual_review';
      } else {
        newStatus = 'failed';
      }
    }

    // Update appraiser status if it has changed
    if (newStatus !== appraiser.valify_status) {
      await supabase
        .from('brokers')
        .update({
          valify_status: newStatus,
          valify_score: Math.round(newOverallScore / completedSteps) || null,
          valify_completed_at: newStatus === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appraiser_id);

      // Update verification session
      await supabase
        .from('appraiser_verification_sessions')
        .update({
          session_status: newStatus === 'verified' ? 'completed' : newStatus,
          current_step: newStatus === 'verified' ? 'completed' : 'review',
          overall_score: Math.round(newOverallScore / completedSteps) || null,
          completed_at: newStatus === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('appraiser_id', appraiser_id);

      console.log(`Updated appraiser ${appraiser_id} status to ${newStatus}`);
    }

    // Process the webhook callback
    await valifyService.processWebhookCallback(webhookData);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      transaction_id: webhookData.transaction_id,
      appraiser_id,
      updated_status: newStatus,
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verification/webhook
 * Health check endpoint for webhook
 */
export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Valify webhook endpoint is active',
    timestamp: new Date().toISOString(),
  });
}
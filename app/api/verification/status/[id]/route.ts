import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import valifyService from '@/lib/services/valify-service';

/**
 * GET /api/verification/status/[id]
 * Get verification status for an appraiser or transaction
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'appraiser'; // 'appraiser' or 'transaction'
    const id = params.id;

    if (!id) {
      return NextResponse.json(
        { error: 'ID parameter is required' },
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

    if (type === 'transaction') {
      // Get status from Valify API using transaction ID
      try {
        const valifyStatus = await valifyService.getVerificationStatus(id);
        return NextResponse.json({
          success: true,
          type: 'transaction',
          transaction_id: id,
          valify_status: valifyStatus,
        });
      } catch (error: any) {
        return NextResponse.json(
          { error: `Failed to get transaction status: ${error.message}` },
          { status: 500 }
        );
      }
    }

    // Default: Get appraiser verification status
    const appraiser_id = id;

    // Get appraiser details
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select(`
        id,
        user_id,
        full_name,
        email,
        valify_status,
        valify_score,
        valify_completed_at,
        identity_document_url,
        selfie_url,
        standardized_headshot_url,
        created_at,
        updated_at
      `)
      .eq('id', appraiser_id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    // Get verification session
    const { data: session, error: sessionError } = await supabase
      .from('appraiser_verification_sessions')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error('Error fetching verification session:', sessionError);
    }

    // Get verification logs
    const { data: logs, error: logsError } = await supabase
      .from('appraiser_verification_logs')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false });

    if (logsError) {
      console.error('Error fetching verification logs:', logsError);
    }

    // Get identity documents
    const { data: documents, error: documentsError } = await supabase
      .from('appraiser_identity_documents')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false });

    if (documentsError) {
      console.error('Error fetching documents:', documentsError);
    }

    // Build verification details from logs
    const verificationDetails = {
      document_verification: null,
      selfie_verification: null,
      face_match_result: null,
      sanction_check: null,
    };

    if (logs) {
      logs.forEach(log => {
        switch (log.verification_type) {
          case 'document':
            if (!verificationDetails.document_verification || log.created_at > verificationDetails.document_verification.created_at) {
              verificationDetails.document_verification = {
                status: log.status,
                confidence_score: log.score,
                transaction_id: log.transaction_id,
                details: log.details,
                created_at: log.created_at,
              };
            }
            break;
          case 'liveness':
            if (!verificationDetails.selfie_verification || log.created_at > verificationDetails.selfie_verification.created_at) {
              verificationDetails.selfie_verification = {
                status: log.status,
                liveness_score: log.score,
                transaction_id: log.transaction_id,
                details: log.details,
                created_at: log.created_at,
              };
            }
            break;
          case 'face_match':
            if (!verificationDetails.face_match_result || log.created_at > verificationDetails.face_match_result.created_at) {
              verificationDetails.face_match_result = {
                status: log.status,
                match_score: log.score,
                transaction_id: log.transaction_id,
                details: log.details,
                created_at: log.created_at,
              };
            }
            break;
          case 'sanction_check':
            if (!verificationDetails.sanction_check || log.created_at > verificationDetails.sanction_check.created_at) {
              verificationDetails.sanction_check = {
                status: log.status,
                transaction_id: log.transaction_id,
                details: log.details,
                created_at: log.created_at,
              };
            }
            break;
        }
      });
    }

    return NextResponse.json({
      success: true,
      appraiser: {
        id: appraiser.id,
        full_name: appraiser.full_name,
        email: appraiser.email,
        overall_status: appraiser.valify_status,
        valify_score: appraiser.valify_score,
        completed_at: appraiser.valify_completed_at,
        created_at: appraiser.created_at,
        updated_at: appraiser.updated_at,
      },
      verification_session: session,
      verification_details: verificationDetails,
      documents: documents || [],
      verification_logs: logs || [],
      files: {
        identity_document_url: appraiser.identity_document_url,
        selfie_url: appraiser.selfie_url,
        standardized_headshot_url: appraiser.standardized_headshot_url,
      },
    });

  } catch (error) {
    console.error('Get verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/verification/status/[id]
 * Update verification status (for admin/manual review)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { status, score, notes, reviewer_id } = await request.json();
    const appraiser_id = params.id;

    if (!status || !appraiser_id) {
      return NextResponse.json(
        { error: 'Status and appraiser ID are required' },
        { status: 400 }
      );
    }

    const validStatuses = ['pending', 'in_progress', 'verified', 'failed', 'manual_review'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
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

    // Update appraiser verification status
    const { data: updatedAppraiser, error: updateError } = await supabase
      .from('brokers')
      .update({
        valify_status: status,
        valify_score: score || null,
        valify_completed_at: status === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', appraiser_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating appraiser status:', updateError);
      return NextResponse.json(
        { error: 'Failed to update verification status' },
        { status: 500 }
      );
    }

    // Update verification session
    const { error: sessionError } = await supabase
      .from('appraiser_verification_sessions')
      .update({
        session_status: status === 'verified' ? 'completed' : status === 'failed' ? 'failed' : 'selfie_uploaded',
        current_step: status === 'verified' ? 'completed' : 'review',
        overall_score: score || null,
        verification_notes: notes || null,
        completed_at: status === 'verified' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('appraiser_id', appraiser_id);

    if (sessionError) {
      console.error('Error updating verification session:', sessionError);
    }

    // Log the manual status update
    await supabase
      .from('appraiser_verification_logs')
      .insert({
        appraiser_id,
        valify_verification_id: `manual_${Date.now()}`,
        verification_type: 'manual_review',
        status: status,
        score: score || 0,
        details: {
          action: 'manual_status_update',
          reviewer_id,
          notes,
          previous_status: updatedAppraiser.valify_status,
          timestamp: new Date().toISOString(),
        },
      });

    return NextResponse.json({
      success: true,
      appraiser: {
        id: updatedAppraiser.id,
        full_name: updatedAppraiser.full_name,
        valify_status: updatedAppraiser.valify_status,
        valify_score: updatedAppraiser.valify_score,
        valify_completed_at: updatedAppraiser.valify_completed_at,
      },
      message: `Verification status updated to ${status}`,
    });

  } catch (error) {
    console.error('Update verification status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
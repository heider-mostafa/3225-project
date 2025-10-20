import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { PortfolioSyncService } from '@/lib/services/portfolio-sync-service';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const appraisal_id = params.id;

    if (!appraisal_id) {
      return NextResponse.json(
        { error: 'Appraisal ID is required' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    console.log('🔍 Fetching appraisal:', appraisal_id);
    
    // First, verify the appraisal exists and get appraiser info
    const { data: appraisal, error: fetchError } = await supabase
      .from('property_appraisals')
      .select('id, appraiser_id, status, client_name, property_id')
      .eq('id', appraisal_id)
      .single();
    
    console.log('📋 Appraisal data:', appraisal);
    console.log('❌ Fetch error:', fetchError);

    if (fetchError || !appraisal) {
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      );
    }

    // Check if already completed
    if (appraisal.status === 'completed') {
      return NextResponse.json(
        { error: 'Appraisal is already completed' },
        { status: 400 }
      );
    }

    console.log('🔄 Updating appraisal status to completed');
    
    // Update appraisal status to completed
    const { error: updateError } = await supabase
      .from('property_appraisals')
      .update({ 
        status: 'completed'
      })
      .eq('id', appraisal_id);

    console.log('🔄 Update error:', updateError);

    if (updateError) {
      console.error('Error completing appraisal:', updateError);
      return NextResponse.json(
        { error: 'Failed to complete appraisal', details: updateError.message },
        { status: 500 }
      );
    }

    // Auto-trigger portfolio sync for this appraiser
    try {
      console.log('🎯 Triggering portfolio sync after appraisal completion');
      console.log('Appraiser ID:', appraisal.appraiser_id);
      console.log('Completed Appraisal ID:', appraisal_id);
      
      await PortfolioSyncService.fullSync(appraisal.appraiser_id, supabase);
      console.log('✅ Portfolio sync completed successfully');
    } catch (syncError) {
      console.error('⚠️ Portfolio sync failed, but appraisal was still completed:', syncError);
      // Don't fail the request if sync fails - appraisal completion is more important
    }

    return NextResponse.json({
      success: true,
      message: 'Appraisal completed successfully',
      data: {
        id: appraisal_id,
        status: 'completed',
        appraiser_id: appraisal.appraiser_id,
        property_id: appraisal.property_id,
        client_name: appraisal.client_name
      }
    });

  } catch (error) {
    console.error('Complete appraisal error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { PortfolioSyncService } from '@/lib/services/portfolio-sync-service';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { appraiser_id } = await request.json();

    if (!appraiser_id) {
      return NextResponse.json(
        { success: false, error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    // Verify user has access to this appraiser profile
    const { data: brokerData, error: brokerError } = await supabase
      .from('brokers')
      .select('id, user_id')
      .eq('id', appraiser_id)
      .single();

    if (brokerError || !brokerData) {
      return NextResponse.json(
        { success: false, error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    // Check if user owns this appraiser profile or is admin
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );
    
    const isOwner = brokerData.user_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      );
    }

    // Clean up any existing portfolio items first to avoid duplicates
    console.log('🧹 Cleaning up existing portfolio items first...');
    const { data: existingItems, error: existingError } = await supabase
      .from('appraiser_portfolio')
      .select('id, source_appraisal_id, title')
      .eq('appraiser_id', appraiser_id);
    
    console.log('🧹 Found existing portfolio items:', existingItems?.length || 0);
    console.log('🧹 Existing items:', existingItems);
    
    if (existingItems && existingItems.length > 0) {
      console.log('🗑️ Deleting existing portfolio items to prevent duplicates...');
      const { error: deleteError } = await supabase
        .from('appraiser_portfolio')
        .delete()
        .eq('appraiser_id', appraiser_id);
      
      if (deleteError) {
        console.error('❌ Error deleting existing portfolio items:', deleteError);
      } else {
        console.log('✅ Successfully deleted existing portfolio items');
      }
    }

    // Perform full portfolio sync
    console.log('Starting full portfolio sync for appraiser:', appraiser_id);
    await PortfolioSyncService.fullSync(appraiser_id, supabase);
    console.log('Portfolio sync completed successfully');

    // Check if any portfolio items were actually created
    const { data: portfolioCheck, error: portfolioCheckError } = await supabase
      .from('appraiser_portfolio')
      .select('id')
      .eq('appraiser_id', appraiser_id);
    
    console.log('Portfolio items found after sync:', portfolioCheck?.length || 0);
    console.log('Portfolio check error:', portfolioCheckError);
    
    // Also check how many appraisals this appraiser has total
    const { data: totalAppraisals } = await supabase
      .from('property_appraisals')
      .select('id, status')
      .eq('appraiser_id', appraiser_id);
    
    console.log('Total appraisals for this appraiser:', totalAppraisals?.length || 0);
    console.log('Appraisal statuses:', totalAppraisals?.map(a => a.status));

    return NextResponse.json({
      success: true,
      message: 'Portfolio synced successfully',
      portfolio_items_count: portfolioCheck?.length || 0,
      debug_info: {
        total_appraisals: totalAppraisals?.length || 0,
        appraisal_statuses: totalAppraisals?.map(a => a.status) || []
      }
    });

  } catch (error) {
    console.error('Portfolio sync API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
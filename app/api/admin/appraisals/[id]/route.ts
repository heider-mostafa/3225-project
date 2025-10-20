// Admin Individual Appraisal API
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const appraisalId = resolvedParams.id;

    const supabase = await createServerSupabaseClient();

    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userRole } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .in('role', ['admin', 'super_admin'])
      .single();

    if (!userRole) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Get appraisal data with related information
    const { data: appraisal, error: appraisalError } = await supabase
      .from('property_appraisals')
      .select(`
        id,
        appraiser_id,
        client_name,
        market_value_estimate,
        appraisal_date,
        status,
        appraisal_reference_number,
        form_data,
        created_at,
        properties:property_id (
          property_type,
          address,
          city
        ),
        brokers:appraiser_id (
          full_name,
          email
        )
      `)
      .eq('id', appraisalId)
      .single();

    if (appraisalError || !appraisal) {
      return NextResponse.json(
        { error: 'Appraisal not found' },
        { status: 404 }
      );
    }

    // Track admin preview access
    try {
      await supabase
        .from('admin_report_access')
        .insert({
          admin_user_id: user.id,
          appraisal_id: appraisalId,
          action_type: 'preview',
          metadata: {
            appraisal_reference: appraisal.appraisal_reference_number
          }
        });
    } catch (logError) {
      console.error('Failed to log admin preview access:', logError);
      // Don't fail the request if logging fails
    }

    // Get download statistics using new tracking system
    const { data: newDownloads } = await supabase
      .from('report_downloads')
      .select(`
        payment_amount,
        downloaded_at,
        report_type,
        user_id
      `)
      .eq('appraisal_id', appraisalId)
      .order('downloaded_at', { ascending: false });

    let downloadCount = 0;
    let totalRevenue = 0;
    let recentDownloads: any[] = [];

    if (newDownloads && newDownloads.length > 0) {
      // Get user emails from user_profiles table
      const userIds = [...new Set(newDownloads.map(d => d.user_id).filter(Boolean))];
      const { data: userProfiles } = await supabase
        .from('user_profiles')
        .select('user_id, full_name, email')
        .in('user_id', userIds);

      const userEmailMap = userProfiles?.reduce((acc: { [key: string]: string }, profile: any) => {
        acc[profile.user_id] = profile.email || profile.full_name || 'Unknown User';
        return acc;
      }, {}) || {};

      // Use new tracking system data
      downloadCount = newDownloads.length;
      totalRevenue = newDownloads.reduce((sum, download) => sum + (download.payment_amount || 0), 0);
      recentDownloads = newDownloads.slice(0, 5).map((download: any) => ({
        user_email: userEmailMap[download.user_id] || 'Unknown',
        download_date: download.downloaded_at,
        amount_paid: download.payment_amount,
        report_type: download.report_type
      }));
    } else {
      // Fallback to legacy payment tracking
      const { data: legacyDownloads } = await supabase
        .from('appraisal_payments')
        .select(`
          appraisal_id,
          amount_egp,
          status,
          payer_email,
          payment_date,
          metadata
        `)
        .eq('appraisal_id', appraisalId)
        .eq('payment_category', 'report_generation')
        .eq('status', 'paid')
        .order('payment_date', { ascending: false });

      downloadCount = legacyDownloads?.length || 0;
      totalRevenue = legacyDownloads?.reduce((sum, download) => sum + (download.amount_egp || 0), 0) || 0;
      recentDownloads = legacyDownloads?.slice(0, 5).map(download => ({
        user_email: download.payer_email,
        download_date: download.payment_date,
        amount_paid: download.amount_egp,
        report_type: download.metadata?.report_type || 'standard'
      })) || [];
    }

    // Handle properties data - it might be an array or object
    const propertyData = Array.isArray(appraisal.properties) ? appraisal.properties[0] : appraisal.properties;
    
    // Extract property address from form_data or properties
    const propertyAddress = appraisal.form_data?.property_address || 
                           appraisal.form_data?.property_address_english ||
                           appraisal.form_data?.property_address_arabic ||
                           propertyData?.address || 
                           `Property in ${propertyData?.city || 'Unknown Area'}`;

    // Handle brokers data - it might be an array or object
    const brokerData = Array.isArray(appraisal.brokers) ? appraisal.brokers[0] : appraisal.brokers;

    // Format the response
    const formattedAppraisal = {
      id: appraisal.id,
      appraiser_name: brokerData?.full_name || 'Unknown Appraiser',
      appraiser_email: brokerData?.email || '',
      client_name: appraisal.client_name || 'N/A',
      property_address: propertyAddress,
      property_type: propertyData?.property_type || appraisal.form_data?.property_type || 'Unknown',
      area: propertyData?.city || appraisal.form_data?.city_name || appraisal.form_data?.area || 'Unknown Area',
      market_value_estimate: appraisal.market_value_estimate || 0,
      appraisal_date: appraisal.appraisal_date || appraisal.created_at,
      status: appraisal.status || 'pending',
      appraisal_reference_number: appraisal.appraisal_reference_number || '',
      form_data: appraisal.form_data,
      created_at: appraisal.created_at,
      download_count: downloadCount,
      total_revenue: totalRevenue,
      recent_downloads: recentDownloads
    };

    return NextResponse.json({
      success: true,
      appraisal: formattedAppraisal
    });

  } catch (error) {
    console.error('Admin appraisal preview API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
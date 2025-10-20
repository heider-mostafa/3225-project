// Admin Appraisals Management API
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🏛️ Admin Appraisals API - Starting request');
    const supabase = await createServerSupabaseClient();

    // Get current user and verify admin access
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('👤 Admin Appraisals API - User check:', { 
      hasUser: !!user, 
      userId: user?.id, 
      email: user?.email, 
      authError: authError?.message 
    });
    
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

    console.log('🔐 Admin Appraisals API - Role check:', { 
      userRole: userRole?.role, 
      isAdmin: !!userRole 
    });

    if (!userRole) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }

    // Fetch all appraisals with related data
    console.log('📊 Admin Appraisals API - Fetching appraisals...');
    const { data: appraisals, error: appraisalsError } = await supabase
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
      .order('created_at', { ascending: false });

    console.log('📋 Admin Appraisals API - Query result:', { 
      error: appraisalsError?.message, 
      appraisalsCount: appraisals?.length,
      firstAppraisal: appraisals?.[0] ? {
        id: appraisals[0].id,
        status: appraisals[0].status,
        client_name: appraisals[0].client_name,
        hasProperties: !!appraisals[0].properties,
        hasBrokers: !!appraisals[0].brokers
      } : null
    });

    if (appraisalsError) {
      console.error('❌ Admin Appraisals API - Database error:', appraisalsError);
      return NextResponse.json(
        { error: 'Failed to fetch appraisals' },
        { status: 500 }
      );
    }

    // Get download statistics using the new tracking service
    const appraisalIds = appraisals?.map(a => a.id) || [];
    console.log('📈 Admin Appraisals API - Processing download stats for', appraisalIds.length, 'appraisals');
    console.log('📋 Admin Appraisals API - Appraisal IDs:', appraisalIds);
    
    interface DownloadStats {
      [key: string]: {
        download_count: number;
        total_revenue: number;
        recent_downloads: Array<{
          user_email: string;
          download_date: string;
          amount_paid: number;
          report_type: string;
        }>;
      };
    }
    
    let downloadStats: DownloadStats = {};
    if (appraisalIds.length > 0) {
      // Try using the new download tracking system first
      const { data: newDownloads } = await supabase
        .from('report_downloads')
        .select(`
          appraisal_id,
          payment_amount,
          downloaded_at,
          report_type,
          user_id
        `)
        .in('appraisal_id', appraisalIds);

      console.log('💾 Admin Appraisals API - New downloads query result:', { 
        newDownloadsCount: newDownloads?.length || 0,
        firstDownload: newDownloads?.[0] 
      });

      if (newDownloads && newDownloads.length > 0) {
        // Get user emails from user_profiles table
        const userIds = [...new Set(newDownloads.map(d => d.user_id).filter(Boolean))];
        const { data: userProfiles } = await supabase
          .from('user_profiles')
          .select('user_id, full_name, email')
          .in('user_id', userIds);

        console.log('👥 Admin Appraisals API - User profiles query result:', { 
          userProfilesCount: userProfiles?.length || 0,
          userIds: userIds 
        });

        const userEmailMap = userProfiles?.reduce((acc: { [key: string]: string }, profile: any) => {
          acc[profile.user_id] = profile.email || profile.full_name || 'Unknown User';
          return acc;
        }, {}) || {};

        console.log('📊 Admin Appraisals API - Processing new tracking data for', newDownloads.length, 'downloads');

        // Use new tracking system data
        downloadStats = newDownloads.reduce((acc: DownloadStats, download: any) => {
          const appraisalId = download.appraisal_id;
          if (!acc[appraisalId]) {
            acc[appraisalId] = {
              download_count: 0,
              total_revenue: 0,
              recent_downloads: []
            };
          }
          
          acc[appraisalId].download_count += 1;
          acc[appraisalId].total_revenue += download.payment_amount || 0;
          acc[appraisalId].recent_downloads.push({
            user_email: userEmailMap[download.user_id] || 'Unknown',
            download_date: download.downloaded_at,
            amount_paid: download.payment_amount,
            report_type: download.report_type
          });
          
          return acc;
        }, {});
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
          .in('appraisal_id', appraisalIds)
          .eq('payment_category', 'report_generation')
          .eq('status', 'paid');

        downloadStats = legacyDownloads?.reduce((acc: DownloadStats, download) => {
          const appraisalId = download.appraisal_id;
          if (!acc[appraisalId]) {
            acc[appraisalId] = {
              download_count: 0,
              total_revenue: 0,
              recent_downloads: []
            };
          }
          
          acc[appraisalId].download_count += 1;
          acc[appraisalId].total_revenue += download.amount_egp || 0;
          acc[appraisalId].recent_downloads.push({
            user_email: download.payer_email,
            download_date: download.payment_date,
            amount_paid: download.amount_egp,
            report_type: download.metadata?.report_type || 'standard'
          });
          
          return acc;
        }, {}) || {};
      }
    }

    console.log('🔄 Admin Appraisals API - Starting data formatting for', appraisals?.length || 0, 'appraisals');

    // Format appraisals data
    const formattedAppraisals = appraisals?.map((appraisal, index) => {
      const stats = downloadStats[appraisal.id] || {
        download_count: 0,
        total_revenue: 0,
        recent_downloads: []
      };

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

      if (index === 0) {
        console.log('📋 Admin Appraisals API - First appraisal formatting sample:', {
          id: appraisal.id,
          hasPropertyData: !!propertyData,
          hasBrokerData: !!brokerData,
          propertyAddress: propertyAddress,
          brokerName: brokerData?.full_name,
          downloadStats: stats
        });
      }

      return {
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
        download_count: stats.download_count,
        total_revenue: stats.total_revenue,
        recent_downloads: stats.recent_downloads.slice(0, 5) // Latest 5 downloads
      };
    }) || [];

    console.log('✅ Admin Appraisals API - Final formatted data:', { 
      formattedAppraisalsCount: formattedAppraisals.length,
      firstAppraisalSample: formattedAppraisals[0] ? {
        id: formattedAppraisals[0].id,
        appraiser_name: formattedAppraisals[0].appraiser_name,
        client_name: formattedAppraisals[0].client_name,
        status: formattedAppraisals[0].status
      } : null
    });

    // Calculate summary statistics
    const stats = {
      total_appraisals: formattedAppraisals.length,
      completed_appraisals: formattedAppraisals.filter(a => a.status === 'completed').length,
      pending_appraisals: formattedAppraisals.filter(a => a.status === 'pending').length,
      total_downloads: formattedAppraisals.reduce((sum, a) => sum + a.download_count, 0),
      total_revenue: formattedAppraisals.reduce((sum, a) => sum + a.total_revenue, 0)
    };

    console.log('🎯 Admin Appraisals API - Final response stats:', stats);

    console.log('🚀 Admin Appraisals API - About to send response...');
    
    try {
      const response = {
        success: true,
        appraisals: formattedAppraisals,
        stats
      };
      
      console.log('✅ Admin Appraisals API - Response prepared successfully');
      console.log('📤 Admin Appraisals API - Response size check:', {
        appraisalsLength: response.appraisals?.length,
        statsKeys: Object.keys(response.stats || {}),
        firstAppraisalKeys: response.appraisals?.[0] ? Object.keys(response.appraisals[0]) : []
      });
      
      return NextResponse.json(response);
    } catch (responseError) {
      console.error('❌ Admin Appraisals API - Error creating response:', responseError);
      return NextResponse.json(
        { 
          error: 'Failed to create response',
          details: responseError instanceof Error ? responseError.message : 'Unknown response error'
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Admin appraisals API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
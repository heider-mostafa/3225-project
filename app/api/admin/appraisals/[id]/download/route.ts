// Admin Appraisal Report Download API (No Payment Required)
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const appraisalId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'standard';

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

    // Get appraisal data
    const { data: appraisal, error: appraisalError } = await supabase
      .from('property_appraisals')
      .select(`
        *,
        brokers:appraiser_id (
          full_name,
          email,
          phone
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

    // Generate PDF report (admin version includes all data)
    const reportData = await generateAdminReport(appraisal, reportType);

    // Track admin download using tracking service
    try {
      await supabase
        .from('admin_report_access')
        .insert({
          admin_user_id: user.id,
          appraisal_id: appraisalId,
          action_type: 'download',
          metadata: {
            report_type: reportType,
            appraisal_reference: appraisal.appraisal_reference_number
          }
        });
      
      // Also log to general admin activity log
      await supabase
        .from('admin_activity_log')
        .insert({
          admin_user_id: user.id,
          action: 'download_appraisal_report',
          resource_type: 'appraisal',
          resource_id: appraisalId,
          details: {
            report_type: reportType,
            appraisal_reference: appraisal.appraisal_reference_number
          }
        });
    } catch (logError) {
      console.error('Failed to log admin activity:', logError);
      // Don't fail the download if logging fails
    }

    // Return PDF as blob
    const headers = new Headers();
    headers.set('Content-Type', 'application/pdf');
    headers.set('Content-Disposition', `attachment; filename="admin-appraisal-${appraisalId}-${reportType}.pdf"`);

    return new Response(reportData.buffer, {
      status: 200,
      headers
    });

  } catch (error) {
    console.error('Admin download error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Generate comprehensive admin report (includes sensitive data)
async function generateAdminReport(appraisal: any, reportType: string) {
  // This would integrate with your existing PDF generation service
  // For now, return a mock PDF buffer
  
  const reportContent = {
    title: `Admin ${reportType.toUpperCase()} Appraisal Report`,
    appraisal_id: appraisal.id,
    reference_number: appraisal.appraisal_reference_number,
    appraiser: {
      name: appraisal.brokers?.full_name,
      email: appraisal.brokers?.email,
      phone: appraisal.brokers?.phone
    },
    property: {
      type: appraisal.property_type,
      area: appraisal.area,
      address: appraisal.form_data?.property_address,
      details: appraisal.form_data
    },
    valuation: {
      market_value: appraisal.market_value_estimate,
      appraisal_date: appraisal.appraisal_date,
      methodology: appraisal.form_data?.valuation_method
    },
    client: {
      name: appraisal.client_name,
      // Admin reports include full client data
      contact: appraisal.form_data?.client_contact,
      requirements: appraisal.form_data?.client_requirements
    },
    admin_notes: {
      created_at: appraisal.created_at,
      updated_at: appraisal.updated_at,
      status: appraisal.status,
      internal_notes: appraisal.form_data?.internal_notes
    }
  };

  // Mock PDF generation - replace with actual PDF service
  const pdfBuffer = Buffer.from(`
    PDF CONTENT FOR ADMIN REPORT
    ================================
    
    ${JSON.stringify(reportContent, null, 2)}
    
    ================================
    Generated for admin user at ${new Date().toISOString()}
  `);

  return {
    buffer: pdfBuffer,
    filename: `admin-appraisal-${appraisal.id}-${reportType}.pdf`,
    contentType: 'application/pdf'
  };
}
import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isServerUserAdmin } from '@/lib/auth/admin';

// GET /api/appraisers/certifications - Get certifications
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');
    const verification_status = searchParams.get('verification_status');
    const active_only = searchParams.get('active_only') === 'true';

    const supabase = await createServerSupabaseClient();

    // Build query
    let query = supabase
      .from('appraiser_certifications')
      .select(`
        id,
        appraiser_id,
        certification_name,
        issuing_authority,
        certification_number,
        issue_date,
        expiry_date,
        is_active,
        verification_status,
        certificate_image_url,
        description,
        created_at,
        updated_at
      `);

    // Apply filters
    if (appraiser_id) {
      query = query.eq('appraiser_id', appraiser_id);
    }

    if (verification_status) {
      query = query.eq('verification_status', verification_status);
    }

    if (active_only) {
      query = query.eq('is_active', true);
      // Also filter out expired certifications
      const currentDate = new Date().toISOString().split('T')[0];
      query = query.or(`expiry_date.is.null,expiry_date.gte.${currentDate}`);
    }

    // Order by issue date (most recent first)
    query = query.order('issue_date', { ascending: false });

    const { data: certifications, error } = await query;

    if (error) {
      console.error('Error fetching certifications:', error);
      return NextResponse.json({ 
        error: 'Failed to fetch certifications' 
      }, { status: 500 });
    }

    // If specific appraiser, also get summary stats
    let summary = null;
    if (appraiser_id) {
      const total = certifications?.length || 0;
      const verified = certifications?.filter(c => c.verification_status === 'verified').length || 0;
      const active = certifications?.filter(c => c.is_active).length || 0;
      const expiringSoon = certifications?.filter(c => {
        if (!c.expiry_date) return false;
        const expiryDate = new Date(c.expiry_date);
        const warningDate = new Date();
        warningDate.setMonth(warningDate.getMonth() + 3); // 3 months warning
        return expiryDate <= warningDate;
      }).length || 0;

      summary = {
        total,
        verified,
        active,
        expiring_soon: expiringSoon
      };
    }

    return NextResponse.json({
      success: true,
      data: {
        certifications: certifications || [],
        summary
      }
    });

  } catch (error) {
    console.error('Unexpected error in GET certifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/appraisers/certifications - Create new certification
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      appraiser_id,
      certification_name,
      issuing_authority,
      certification_number,
      issue_date,
      expiry_date,
      certificate_image_url,
      description
    } = body;

    // Validate required fields
    if (!certification_name || !issuing_authority) {
      return NextResponse.json({
        error: 'Certification name and issuing authority are required'
      }, { status: 400 });
    }

    // Validate date formats
    if (issue_date && !/^\d{4}-\d{2}-\d{2}$/.test(issue_date)) {
      return NextResponse.json({
        error: 'Invalid issue date format. Use YYYY-MM-DD'
      }, { status: 400 });
    }

    if (expiry_date && !/^\d{4}-\d{2}-\d{2}$/.test(expiry_date)) {
      return NextResponse.json({
        error: 'Invalid expiry date format. Use YYYY-MM-DD'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Determine target appraiser ID
    let targetAppraiserId: string;
    const isAdmin = await isServerUserAdmin();

    if (isAdmin && appraiser_id) {
      // Admin can manage any appraiser
      targetAppraiserId = appraiser_id;
      
      // Verify appraiser exists
      const { data: appraiser, error: appraiserError } = await supabase
        .from('brokers')
        .select('id, full_name')
        .eq('id', targetAppraiserId)
        .eq('is_active', true)
        .single();

      if (appraiserError || !appraiser) {
        return NextResponse.json({
          error: 'Appraiser not found'
        }, { status: 404 });
      }
    } else {
      // Regular user - must be the appraiser owner
      const { data: broker, error: brokerError } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single();

      if (brokerError || !broker) {
        return NextResponse.json({
          error: 'Appraiser profile not found. Only the appraiser can manage certifications.'
        }, { status: 404 });
      }

      targetAppraiserId = broker.id;
    }

    // Check for duplicate certification
    const { data: existingCert } = await supabase
      .from('appraiser_certifications')
      .select('id')
      .eq('appraiser_id', targetAppraiserId)
      .eq('certification_name', certification_name)
      .eq('issuing_authority', issuing_authority)
      .eq('is_active', true)
      .single();

    if (existingCert) {
      return NextResponse.json({
        error: 'This certification already exists for this appraiser'
      }, { status: 409 });
    }

    // Create certification
    const certificationData = {
      appraiser_id: targetAppraiserId,
      certification_name,
      issuing_authority,
      certification_number,
      issue_date,
      expiry_date,
      certificate_image_url,
      description,
      is_active: true,
      verification_status: 'pending' // Always starts as pending
    };

    const { data: newCertification, error: insertError } = await supabase
      .from('appraiser_certifications')
      .insert(certificationData)
      .select()
      .single();

    if (insertError) {
      console.error('Error creating certification:', insertError);
      return NextResponse.json({ 
        error: 'Failed to create certification: ' + insertError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Certification created successfully. It will be verified by admin.',
      data: newCertification
    });

  } catch (error) {
    console.error('Unexpected error in POST certification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/appraisers/certifications - Update certification
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const {
      certification_id,
      certification_name,
      issuing_authority,
      certification_number,
      issue_date,
      expiry_date,
      certificate_image_url,
      description,
      is_active,
      verification_status
    } = body;

    if (!certification_id) {
      return NextResponse.json({
        error: 'Certification ID is required'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get certification details
    const { data: certification, error: certError } = await supabase
      .from('appraiser_certifications')
      .select('appraiser_id, verification_status')
      .eq('id', certification_id)
      .single();

    if (certError || !certification) {
      return NextResponse.json({
        error: 'Certification not found'
      }, { status: 404 });
    }

    // Check permissions
    const isAdmin = await isServerUserAdmin();
    let canUpdate = false;
    
    if (isAdmin) {
      // Admin can update any field
      canUpdate = true;
    } else {
      // Check if user is the appraiser owner
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', certification.appraiser_id)
        .single();
      
      if (broker) {
        canUpdate = true;
        // Non-admin users cannot change verification status
        if (verification_status !== undefined && verification_status !== certification.verification_status) {
          return NextResponse.json({
            error: 'Only admins can change verification status'
          }, { status: 403 });
        }
      }
    }

    if (!canUpdate) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Build update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    if (certification_name !== undefined) updateData.certification_name = certification_name;
    if (issuing_authority !== undefined) updateData.issuing_authority = issuing_authority;
    if (certification_number !== undefined) updateData.certification_number = certification_number;
    if (issue_date !== undefined) updateData.issue_date = issue_date;
    if (expiry_date !== undefined) updateData.expiry_date = expiry_date;
    if (certificate_image_url !== undefined) updateData.certificate_image_url = certificate_image_url;
    if (description !== undefined) updateData.description = description;
    if (is_active !== undefined) updateData.is_active = is_active;
    
    // Only admin can change verification status
    if (isAdmin && verification_status !== undefined) {
      updateData.verification_status = verification_status;
    }

    const { data: updatedCertification, error: updateError } = await supabase
      .from('appraiser_certifications')
      .update(updateData)
      .eq('id', certification_id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating certification:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update certification: ' + updateError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Certification updated successfully',
      data: updatedCertification
    });

  } catch (error) {
    console.error('Unexpected error in PUT certification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/appraisers/certifications - Soft delete certification
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const certification_id = searchParams.get('certification_id');

    if (!certification_id) {
      return NextResponse.json({
        error: 'Certification ID is required'
      }, { status: 400 });
    }

    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get certification details
    const { data: certification, error: certError } = await supabase
      .from('appraiser_certifications')
      .select('appraiser_id')
      .eq('id', certification_id)
      .single();

    if (certError || !certification) {
      return NextResponse.json({
        error: 'Certification not found'
      }, { status: 404 });
    }

    // Check permissions
    const isAdmin = await isServerUserAdmin();
    let canDelete = false;
    
    if (isAdmin) {
      canDelete = true;
    } else {
      // Check if user is the appraiser owner
      const { data: broker } = await supabase
        .from('brokers')
        .select('id')
        .eq('user_id', user.id)
        .eq('id', certification.appraiser_id)
        .single();
      
      canDelete = !!broker;
    }

    if (!canDelete) {
      return NextResponse.json({
        error: 'Insufficient permissions'
      }, { status: 403 });
    }

    // Soft delete (mark as inactive)
    const { error: deleteError } = await supabase
      .from('appraiser_certifications')
      .update({ 
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', certification_id);

    if (deleteError) {
      console.error('Error deleting certification:', deleteError);
      return NextResponse.json({ 
        error: 'Failed to delete certification: ' + deleteError.message 
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Certification deleted successfully'
    });

  } catch (error) {
    console.error('Unexpected error in DELETE certification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
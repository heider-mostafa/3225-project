import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { appraisalImageUploader } from '@/lib/services/appraisal-image-uploader';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const appraisalId = params.id;

    // Get the appraisal with its extracted images
    const { data: appraisal, error: appraisalError } = await supabase
      .from('property_appraisals')
      .select(`
        *,
        properties:property_id (
          id,
          title
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

    // Check if user has permission to this appraisal
    const { data: userRoles } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('is_active', true);

    const isAdmin = userRoles?.some(role => 
      ['admin', 'super_admin'].includes(role.role)
    );

    // Check if user is the appraiser who created this appraisal
    const { data: brokerData } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    const isOwner = brokerData && appraisal.appraiser_id === brokerData.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Check if there are extracted images to upload
    const extractedImages = appraisal.form_data?.extracted_images;
    if (!extractedImages || extractedImages.length === 0) {
      return NextResponse.json(
        { error: 'No extracted images found in this appraisal' },
        { status: 400 }
      );
    }

    console.log(`🖼️ Uploading ${extractedImages.length} extracted images for property ${appraisal.property_id}`);

    // Transform extracted images to the format expected by the uploader
    const imagesToUpload = extractedImages.map((img: any) => ({
      base64: img.data || img.base64,
      mimeType: img.mimeType || `image/${img.format || 'png'}`,
      filename: img.filename || `extracted_${Date.now()}.png`,
      category: img.category || 'appraisal_extracted',
      page: img.page
    }));

    // Upload images using the appraisal image uploader
    const uploadResult = await appraisalImageUploader.uploadExtractedImagesWithProgress(
      appraisal.property_id,
      imagesToUpload,
      (progress) => {
        console.log(`Upload progress: ${progress.completed}/${progress.total} - ${progress.currentImage}`);
      }
    );

    if (!uploadResult.success && uploadResult.errors.length > 0) {
      console.error('Image upload errors:', uploadResult.errors);
      return NextResponse.json(
        { 
          error: 'Some images failed to upload',
          uploadResult
        },
        { status: 500 }
      );
    }

    // Mark the appraisal as having uploaded images
    const { error: updateError } = await supabase
      .from('property_appraisals')
      .update({
        form_data: {
          ...appraisal.form_data,
          images_uploaded: true,
          images_uploaded_at: new Date().toISOString(),
          uploaded_images_count: uploadResult.uploadedImages.length
        }
      })
      .eq('id', appraisalId);

    if (updateError) {
      console.error('Failed to update appraisal with upload status:', updateError);
    }

    console.log(`✅ Successfully uploaded ${uploadResult.uploadedImages.length} images to property storage`);

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${uploadResult.uploadedImages.length} images`,
      uploadResult: {
        uploaded: uploadResult.uploadedImages,
        errors: uploadResult.errors,
        total: extractedImages.length
      }
    });

  } catch (error) {
    console.error('Server error in image upload:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
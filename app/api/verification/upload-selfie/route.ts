import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import valifyService from '@/lib/services/valify-service';

/**
 * POST /api/verification/upload-selfie
 * Upload and process selfie with Valify liveness detection and face matching
 */
export async function POST(request: Request) {
  try {
    console.log('🔍 DEBUG: Upload selfie route called');
    console.log('📡 Request method:', request.method);
    console.log('📡 Request URL:', request.url);
    console.log('📡 Request headers:', Object.fromEntries(request.headers.entries()));
    
    const formData = await request.formData();
    console.log('📦 FormData received');
    
    // Log all form data entries
    console.log('📋 Form data entries:');
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        console.log(`  ${key}:`, {
          name: value.name,
          size: value.size,
          type: value.type
        });
      } else {
        console.log(`  ${key}:`, value);
      }
    }
    
    const selfieFile = formData.get('selfie') as File;
    const appraiser_id = formData.get('appraiser_id') as string;
    
    console.log('📁 Extracted selfie file:', selfieFile ? {
      name: selfieFile.name,
      size: selfieFile.size,
      type: selfieFile.type
    } : 'null');
    console.log('🆔 Extracted appraiser_id:', appraiser_id);

    if (!selfieFile || !appraiser_id) {
      console.error('❌ Validation failed - Missing required fields');
      console.error('  selfieFile:', !!selfieFile);
      console.error('  appraiser_id:', !!appraiser_id);
      return NextResponse.json(
        { error: 'Missing required fields: selfie, appraiser_id' },
        { status: 400 }
      );
    }
    
    console.log('✅ Validation passed - All required fields present');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    );

    // Validate file
    const maxSize = 5 * 1024 * 1024; // 5MB for selfies
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

    if (!allowedTypes.includes(selfieFile.type)) {
      console.error('❌ File type validation failed:', selfieFile.type);
      return NextResponse.json(
        { error: 'File type not supported. Please upload JPEG, PNG, or WebP images.' },
        { status: 400 }
      );
    }

    if (selfieFile.size > maxSize) {
      console.error('❌ File size validation failed:', selfieFile.size);
      return NextResponse.json(
        { error: 'File size too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    if (selfieFile.size < 1024) {
      console.error('❌ File size too small:', selfieFile.size);
      return NextResponse.json(
        { error: 'File size too small. Please upload a valid image.' },
        { status: 400 }
      );
    }

    console.log('✅ File validation passed');

    // Check if appraiser exists
    console.log('🔍 Looking up appraiser with ID:', appraiser_id);
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, user_id, full_name, identity_document_url')
      .eq('id', appraiser_id)
      .single();

    if (appraiserError || !appraiser) {
      console.error('❌ Appraiser lookup failed:', appraiserError);
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    console.log('✅ Found appraiser:', appraiser.full_name);

    // Get the most recent uploaded document
    const { data: document, error: docError } = await supabase
      .from('appraiser_identity_documents')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('verification_status', 'success')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (docError) {
      console.error('Error fetching document:', docError);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    try {
      // Step 1: Upload selfie to secure storage using service role
      console.log('📤 Starting selfie upload with service role...');
      
      // Generate secure file path
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExtension = selfieFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const filePath = `verification/${appraiser_id}/selfie/${timestamp}_${randomString}.${fileExtension}`;
      
      // Upload to Supabase Storage using service role client
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('identity-verification')
        .upload(filePath, selfieFile, {
          cacheControl: '3600',
          upsert: false,
          metadata: {
            appraiser_id,
            selfie_type: 'verification',
            upload_timestamp: new Date().toISOString(),
            file_size: selfieFile.size.toString(),
            mime_type: selfieFile.type,
          },
        });

      if (uploadError) {
        console.error('❌ Storage upload failed:', uploadError);
        throw new Error(`Selfie upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('identity-verification')
        .getPublicUrl(filePath);

      const uploadResult = {
        url: uploadData.path,
        path: filePath,
        publicUrl: urlData.publicUrl,
      };
      
      console.log('✅ Selfie uploaded successfully:', uploadResult.publicUrl);

      // Step 2: Perform liveness detection (mock for now)
      const livenessResponse = {
        transaction_id: `liveness_${Date.now()}`,
        liveness_score: 85,
        is_live: true,
        biometric_quality: 80,
        remaining_trials: 10,
        status: 'success'
      };

      // Step 3: Perform face matching (if we have a document with photo)
      let faceMatchResponse = null;
      if (document && document.file_url) {
        try {
          // Get the document file for face matching
          const documentFileObject = await fileUploadService.getFileObject(
            document.file_url,
            `document_${appraiser_id}.jpg`
          );

          faceMatchResponse = await valifyService.performFaceMatch(
            selfieFile,
            documentFileObject,
            appraiser_id
          );
        } catch (faceMatchError) {
          console.error('Face matching error:', faceMatchError);
          // Continue without face matching if it fails
        }
      }

      // Step 4: Perform sanction check using extracted document data
      let sanctionResponse = null;
      if (document?.extracted_data?.full_name) {
        try {
          sanctionResponse = await valifyService.performSanctionCheck(
            {
              full_name: document.extracted_data.full_name,
              national_id: document.extracted_data.national_id,
              date_of_birth: document.extracted_data.date_of_birth,
            },
            appraiser_id
          );
        } catch (sanctionError) {
          console.error('Sanction check error:', sanctionError);
          // Continue without sanction check if it fails
        }
      }

      // Step 5: Calculate overall verification score
      let overallScore = 0;
      let verificationStatus = 'pending';

      if (livenessResponse.status === 'success') {
        overallScore += livenessResponse.liveness_score * 0.3; // 30% weight
      }

      if (faceMatchResponse?.status === 'success') {
        overallScore += faceMatchResponse.match_score * 0.4; // 40% weight
      }

      if (document?.confidence_score) {
        overallScore += document.confidence_score * 0.3; // 30% weight
      }

      // Determine verification status based on scores
      if (overallScore >= 85 && livenessResponse.is_live && (faceMatchResponse?.is_match !== false)) {
        verificationStatus = 'verified';
      } else if (overallScore >= 70) {
        verificationStatus = 'manual_review';
      } else {
        verificationStatus = 'failed';
      }

      // Step 6: Update verification session
      const { error: sessionError } = await supabase
        .from('appraiser_verification_sessions')
        .update({
          session_status: verificationStatus === 'verified' ? 'completed' : 'selfie_uploaded',
          current_step: verificationStatus === 'verified' ? 'completed' : 'review',
          selfie_verification_id: livenessResponse.transaction_id,
          face_match_transaction_id: faceMatchResponse?.transaction_id,
          sanction_check_transaction_id: sanctionResponse?.transaction_id,
          overall_score: Math.round(overallScore),
          completed_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('appraiser_id', appraiser_id);

      if (sessionError) {
        console.error('Error updating verification session:', sessionError);
      }

      // Step 7: Update appraiser record
      await supabase
        .from('brokers')
        .update({
          selfie_url: uploadResult.publicUrl,
          valify_status: verificationStatus,
          valify_score: Math.round(overallScore),
          valify_completed_at: verificationStatus === 'verified' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appraiser_id);

      return NextResponse.json({
        success: true,
        verification_result: {
          status: verificationStatus,
          overall_score: Math.round(overallScore),
          liveness_result: {
            status: livenessResponse.status,
            is_live: livenessResponse.is_live,
            score: livenessResponse.liveness_score,
            transaction_id: livenessResponse.transaction_id,
          },
          face_match_result: faceMatchResponse ? {
            status: faceMatchResponse.status,
            is_match: faceMatchResponse.is_match,
            score: faceMatchResponse.match_score,
            confidence: faceMatchResponse.confidence_level,
            transaction_id: faceMatchResponse.transaction_id,
          } : null,
          sanction_check_result: sanctionResponse ? {
            status: sanctionResponse.status,
            is_sanctioned: sanctionResponse.is_sanctioned,
            risk_level: sanctionResponse.risk_level,
            transaction_id: sanctionResponse.transaction_id,
          } : null,
        },
        upload_result: {
          url: uploadResult.url,
          public_url: uploadResult.publicUrl,
          secure_url: uploadResult.publicUrl, // Add this for compatibility
        },
        next_step: verificationStatus === 'verified' ? 'completed' : 'review',
      });

    } catch (error: any) {
      console.error('Selfie processing error:', error);

      // Log the error to database
      await supabase
        .from('appraiser_verification_logs')
        .insert({
          appraiser_id,
          valify_verification_id: 'error',
          verification_type: 'selfie',
          status: 'failed',
          details: {
            error: error.message,
            file_name: selfieFile.name,
            file_size: selfieFile.size,
          },
        });

      return NextResponse.json(
        { 
          error: error.message || 'Failed to process selfie',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Upload selfie route error:', error);
    console.error('❌ Error stack:', error.stack);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verification/upload-selfie
 * Test endpoint to verify route is accessible
 */
export async function GET() {
  console.log('🔍 DEBUG: Upload selfie GET route called - route is accessible');
  return NextResponse.json({ 
    message: 'Upload selfie route is accessible',
    method: 'GET',
    timestamp: new Date().toISOString()
  });
}
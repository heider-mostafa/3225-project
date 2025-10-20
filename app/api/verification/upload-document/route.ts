import { NextResponse } from 'next/server';
import { createServiceServerClient } from '@/lib/supabase/server';
import valifyService from '@/lib/services/valify-service';
import fileUploadService from '@/lib/services/file-upload-service';

/**
 * POST /api/verification/upload-document
 * Upload and process identity document with Valify OCR
 */
export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('document') as File;
    const appraiser_id = formData.get('appraiser_id') as string;
    const document_type = formData.get('document_type') as 'national_id' | 'passport';

    if (!file || !appraiser_id || !document_type) {
      return NextResponse.json(
        { error: 'Missing required fields: document, appraiser_id, document_type' },
        { status: 400 }
      );
    }

    // Create Supabase service client
    const supabase = createServiceServerClient();

    // Check if file upload service is available
    if (!fileUploadService) {
      return NextResponse.json(
        { error: 'File upload service not configured' },
        { status: 500 }
      );
    }

    // Validate file
    const validation = fileUploadService.validateFile(file, 'document');
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if appraiser exists
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, user_id, full_name')
      .eq('id', appraiser_id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    try {
      // Step 1: Upload document to secure storage
      const uploadResult = await fileUploadService.uploadIdentityDocument(
        file,
        appraiser_id,
        document_type
      );

      // Step 2: Process document with Valify OCR
      let ocrResponse;
      if (document_type === 'national_id') {
        ocrResponse = await valifyService.processEgyptianNationalID(file, appraiser_id);
      } else {
        ocrResponse = await valifyService.processEgyptianPassport(file, appraiser_id);
      }

      // Step 3: Store document details in database
      const { data: documentRecord, error: documentError } = await supabase
        .from('appraiser_identity_documents')
        .insert({
          appraiser_id,
          document_type,
          document_number: ocrResponse.extracted_data?.national_id || ocrResponse.extracted_data?.passport_number,
          extracted_data: ocrResponse.extracted_data,
          verification_status: ocrResponse.status,
          file_url: uploadResult.publicUrl,
          valify_transaction_id: ocrResponse.transaction_id,
          confidence_score: ocrResponse.confidence_score,
        })
        .select()
        .single();

      if (documentError) {
        console.error('Error storing document record:', documentError);
        return NextResponse.json(
          { error: 'Failed to store document information' },
          { status: 500 }
        );
      }

      // Step 4: Update verification session
      const { error: sessionError } = await supabase
        .from('appraiser_verification_sessions')
        .update({
          session_status: 'document_uploaded',
          current_step: 'selfie_capture',
          document_verification_id: ocrResponse.transaction_id,
          updated_at: new Date().toISOString(),
        })
        .eq('appraiser_id', appraiser_id)
        .eq('session_status', 'started');

      if (sessionError) {
        console.error('Error updating verification session:', sessionError);
      }

      // Step 5: Update appraiser document URL
      await supabase
        .from('brokers')
        .update({ 
          identity_document_url: uploadResult.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', appraiser_id);

      return NextResponse.json({
        success: true,
        document: {
          id: documentRecord.id,
          document_type,
          verification_status: ocrResponse.status,
          confidence_score: ocrResponse.confidence_score,
          transaction_id: ocrResponse.transaction_id,
        },
        ocr_result: {
          status: ocrResponse.status,
          extracted_data: ocrResponse.extracted_data,
          confidence_score: ocrResponse.confidence_score,
          transaction_id: ocrResponse.transaction_id,
        },
        upload_result: {
          url: uploadResult.url,
          public_url: uploadResult.publicUrl,
        },
        next_step: 'selfie_capture',
      });

    } catch (error: any) {
      console.error('Document processing error:', error);

      // Log the error to database
      await supabase
        .from('appraiser_verification_logs')
        .insert({
          appraiser_id,
          valify_verification_id: 'error',
          verification_type: 'document',
          status: 'failed',
          details: {
            error: error.message,
            document_type,
            file_name: file.name,
            file_size: file.size,
          },
        });

      return NextResponse.json(
        { 
          error: error.message || 'Failed to process document',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Upload document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/verification/upload-document?appraiser_id=xxx
 * Get uploaded documents for an appraiser
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
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

    // Get all documents for the appraiser
    const { data: documents, error } = await supabase
      .from('appraiser_identity_documents')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      documents: documents || [],
    });

  } catch (error) {
    console.error('Get documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
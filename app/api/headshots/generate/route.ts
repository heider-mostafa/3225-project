import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import replicateHeadshotService from '@/lib/services/openai-headshot-service';

/**
 * POST /api/headshots/generate
 * Generate professional headshot using Replicate FLUX.1 Kontext Pro
 * Enhanced with 2025 vision capabilities for precise facial feature preservation
 */
export async function POST(request: Request) {
  try {
    const { 
      appraiser_id, 
      original_image_url, 
      style_preferences 
    } = await request.json();

    if (!appraiser_id || !original_image_url) {
      return NextResponse.json(
        { error: 'Missing required fields: appraiser_id, original_image_url' },
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

    // Verify appraiser exists
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
      // Generate professional headshot using Replicate FLUX.1 Kontext Pro
      const generationResult = await replicateHeadshotService.generateProfessionalHeadshot(
        original_image_url,
        appraiser_id,
        style_preferences || {}
      );

      if (!generationResult.success) {
        throw new Error(generationResult.error || 'Headshot generation failed');
      }

      // Download the generated image and upload to our storage
      const headshotFilename = `headshot_${appraiser_id}_${Date.now()}.jpg`;
      const headshotFile = await replicateHeadshotService.downloadHeadshotAsFile(
        generationResult.headshot_url!,
        headshotFilename
      );

      // Upload to our secure storage using SERVICE_ROLE permissions
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 15);
      const filePath = `generated/${appraiser_id}/headshot/${timestamp}_${randomSuffix}.jpg`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('public-headshots')
        .upload(filePath, headshotFile, {
          cacheControl: '86400',
          upsert: true,
          metadata: {
            appraiser_id,
            upload_timestamp: new Date().toISOString(),
            file_size: headshotFile.size.toString(),
            mime_type: headshotFile.type,
            is_generated_headshot: 'true',
          },
        });

      if (uploadError) {
        console.error('Headshot upload error:', uploadError);
        throw new Error(`Generated headshot upload failed: ${uploadError.message}`);
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('public-headshots')
        .getPublicUrl(filePath);

      const uploadResult = {
        url: uploadData.path,
        path: filePath,
        publicUrl: urlData.publicUrl,
      };

      // Log the generation activity
      await supabase
        .from('appraiser_verification_logs')
        .insert({
          appraiser_id,
          valify_verification_id: 'headshot_generation',
          verification_type: 'headshot_generation',
          status: 'success',
          score: 100,
          details: {
            openai_result: generationResult,
            style_preferences: style_preferences || {},
            upload_result: uploadResult,
            generated_at: new Date().toISOString(),
          },
        });

      return NextResponse.json({
        success: true,
        headshot: {
          url: uploadResult.publicUrl,
          path: uploadResult.path,
          filename: headshotFilename,
        },
        generation_details: {
          revised_prompt: generationResult.revised_prompt,
          cost_estimate: generationResult.cost_estimate,
          generation_time: generationResult.generation_time,
          style_applied: style_preferences || {},
        },
        message: 'Professional headshot generated successfully',
      });

    } catch (error: any) {
      console.error('Headshot generation error:', error);

      // Log the error
      await supabase
        .from('appraiser_verification_logs')
        .insert({
          appraiser_id,
          valify_verification_id: 'headshot_generation_error',
          verification_type: 'headshot_generation',
          status: 'failed',
          score: 0,
          details: {
            error: error.message,
            style_preferences: style_preferences || {},
            timestamp: new Date().toISOString(),
          },
        });

      return NextResponse.json(
        { 
          error: error.message || 'Failed to generate professional headshot',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('Generate headshot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/headshots/generate?appraiser_id=xxx
 * Get headshot generation history for an appraiser
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

    // Get headshot generation history
    const { data: generationHistory, error } = await supabase
      .from('appraiser_verification_logs')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .eq('verification_type', 'headshot_generation')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching headshot history:', error);
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      );
    }

    // Get current headshot URL from appraiser profile
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('standardized_headshot_url')
      .eq('id', appraiser_id)
      .single();

    if (appraiserError) {
      console.error('Error fetching appraiser:', appraiserError);
    }

    return NextResponse.json({
      success: true,
      current_headshot_url: appraiser?.standardized_headshot_url,
      generation_history: generationHistory || [],
      total_generations: generationHistory?.length || 0,
    });

  } catch (error) {
    console.error('Get headshot history error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
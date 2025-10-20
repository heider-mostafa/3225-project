import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const appraiser_id = formData.get('appraiser_id') as string;

    if (!file || !appraiser_id) {
      return NextResponse.json(
        { error: 'Missing file or appraiser_id' },
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

    // Generate secure file path
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 15);
    const filePath = `verification/${appraiser_id}/headshot/${timestamp}_${randomSuffix}.jpg`;

    // Upload to Supabase Storage with SERVICE_ROLE permissions
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('public-headshots')
      .upload(filePath, file, {
        cacheControl: '86400',
        upsert: true,
        metadata: {
          appraiser_id,
          upload_timestamp: new Date().toISOString(),
          file_size: file.size.toString(),
          mime_type: file.type,
          is_standardized: 'true',
        },
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('public-headshots')
      .getPublicUrl(filePath);

    // Update appraiser profile with new headshot URL
    const { error: updateError } = await supabase
      .from('brokers')
      .update({ standardized_headshot_url: urlData.publicUrl })
      .eq('id', appraiser_id);

    if (updateError) {
      console.error('Profile update error:', updateError);
      return NextResponse.json(
        { error: `Profile update failed: ${updateError.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadData.path,
      path: filePath,
      publicUrl: urlData.publicUrl,
    });

  } catch (error: any) {
    console.error('Upload headshot API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
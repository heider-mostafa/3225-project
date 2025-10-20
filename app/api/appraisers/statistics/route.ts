import { createClient } from '@/utils/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');

    if (!appraiser_id) {
      return NextResponse.json(
        { success: false, error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    // Get property statistics for the appraiser
    const { data: statistics, error } = await supabase
      .from('appraiser_property_statistics')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('properties_appraised', { ascending: false });

    if (error) {
      console.error('Statistics fetch error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: statistics || []
    });

  } catch (error) {
    console.error('Statistics API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { appraiser_id, property_statistics } = await request.json();

    if (!appraiser_id || !property_statistics) {
      return NextResponse.json(
        { success: false, error: 'Appraiser ID and statistics are required' },
        { status: 400 }
      );
    }

    // Upsert statistics (update if exists, insert if not)
    const { data, error } = await supabase
      .from('appraiser_property_statistics')
      .upsert(property_statistics, {
        onConflict: 'appraiser_id,property_type'
      })
      .select();

    if (error) {
      console.error('Statistics upsert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Updated statistics for ${property_statistics.length} property types`
    });

  } catch (error) {
    console.error('Statistics update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
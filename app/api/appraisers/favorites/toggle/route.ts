import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// POST - Toggle favorite status for an appraiser
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { appraiser_id, notes } = body;

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    // Verify appraiser exists and is active
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, full_name, public_profile_active, is_active')
      .eq('id', appraiser_id)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found' },
        { status: 404 }
      );
    }

    if (!appraiser.public_profile_active || !appraiser.is_active) {
      return NextResponse.json(
        { error: 'Appraiser profile is not available' },
        { status: 400 }
      );
    }

    // Use the database function to toggle favorite status
    const { data: result, error: toggleError } = await supabase
      .rpc('toggle_appraiser_favorite', {
        p_appraiser_id: appraiser_id,
        p_notes: notes || null,
        p_user_id: user.id
      });

    if (toggleError) {
      console.error('Error toggling favorite:', toggleError);
      return NextResponse.json(
        { error: 'Failed to toggle favorite', details: toggleError.message },
        { status: 500 }
      );
    }

    const action = result.action;
    const isNowFavorited = result.is_favorited;

    return NextResponse.json({
      message: `Appraiser ${action} ${action === 'added' ? 'to' : 'from'} favorites`,
      action: action,
      is_favorited: isNowFavorited,
      appraiser_name: appraiser.full_name,
      favorite_id: result.favorite_id
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
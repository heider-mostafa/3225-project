import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// GET - Get user's favorite appraisers
export async function GET(request: NextRequest) {
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

    // Get user's favorite appraisers using the database function
    const { data: favorites, error } = await supabase
      .rpc('get_user_favorite_appraisers', { p_user_id: user.id });

    if (error) {
      console.error('Error fetching favorites:', error);
      return NextResponse.json(
        { error: 'Failed to fetch favorites', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      favorites: favorites || [],
      total: favorites?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST - Add appraiser to favorites
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

    // Add to favorites
    const { data: favorite, error: favoriteError } = await supabase
      .from('appraiser_favorites')
      .insert({
        user_id: user.id,
        appraiser_id: appraiser_id,
        notes: notes || null
      })
      .select()
      .single();

    if (favoriteError) {
      // Check if it's a duplicate
      if (favoriteError.code === '23505') {
        return NextResponse.json(
          { error: 'Appraiser is already in your favorites' },
          { status: 409 }
        );
      }
      
      console.error('Error adding favorite:', favoriteError);
      return NextResponse.json(
        { error: 'Failed to add favorite', details: favoriteError.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'Appraiser added to favorites',
      favorite: favorite,
      appraiser_name: appraiser.full_name
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT - Update favorite notes
export async function PUT(request: NextRequest) {
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

    // Update favorite notes
    const { data: favorite, error: updateError } = await supabase
      .from('appraiser_favorites')
      .update({ notes: notes, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('appraiser_id', appraiser_id)
      .select()
      .single();

    if (updateError || !favorite) {
      return NextResponse.json(
        { error: 'Favorite not found or update failed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Favorite notes updated',
      favorite: favorite
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
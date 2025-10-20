import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

// DELETE - Remove appraiser from favorites
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const appraiser_id = params.id;

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    // Remove from favorites
    const { data: deletedFavorite, error: deleteError } = await supabase
      .from('appraiser_favorites')
      .delete()
      .eq('user_id', user.id)
      .eq('appraiser_id', appraiser_id)
      .select()
      .single();

    if (deleteError || !deletedFavorite) {
      return NextResponse.json(
        { error: 'Favorite not found or already removed' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'Appraiser removed from favorites',
      removed_favorite: deletedFavorite
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET - Check if appraiser is favorited and get favorite details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const appraiser_id = params.id;

    if (!appraiser_id) {
      return NextResponse.json(
        { error: 'Appraiser ID is required' },
        { status: 400 }
      );
    }

    // Check if favorited
    const { data: favorite, error } = await supabase
      .from('appraiser_favorites')
      .select('*')
      .eq('user_id', user.id)
      .eq('appraiser_id', appraiser_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Error checking favorite status:', error);
      return NextResponse.json(
        { error: 'Failed to check favorite status' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      is_favorited: !!favorite,
      favorite: favorite || null
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
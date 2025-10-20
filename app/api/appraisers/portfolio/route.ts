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

    // Get portfolio items for the appraiser
    const { data: portfolioItems, error: portfolioError } = await supabase
      .from('appraiser_portfolio')
      .select('*')
      .eq('appraiser_id', appraiser_id)
      .order('completion_date', { ascending: false });

    if (portfolioError) {
      console.error('Portfolio fetch error:', portfolioError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch portfolio' },
        { status: 500 }
      );
    }

    // Get property statistics
    const { data: statistics, error: statsError } = await supabase
      .from('appraiser_property_statistics')
      .select('*')
      .eq('appraiser_id', appraiser_id);

    if (statsError) {
      console.error('Statistics fetch error:', statsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch statistics' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        portfolio_items: portfolioItems || [],
        property_statistics: statistics || []
      }
    });

  } catch (error) {
    console.error('Portfolio API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const { appraiser_id, portfolio_items } = await request.json();

    if (!appraiser_id || !portfolio_items) {
      return NextResponse.json(
        { success: false, error: 'Appraiser ID and portfolio items are required' },
        { status: 400 }
      );
    }

    // Insert portfolio items
    const { data, error } = await supabase
      .from('appraiser_portfolio')
      .insert(portfolio_items)
      .select();

    if (error) {
      console.error('Portfolio insert error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to add portfolio items' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data,
      message: `Added ${portfolio_items.length} portfolio items`
    });

  } catch (error) {
    console.error('Portfolio creation error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient();
    const { item_id, ...updateData } = await request.json();

    if (!item_id) {
      return NextResponse.json(
        { success: false, error: 'Portfolio item ID is required' },
        { status: 400 }
      );
    }

    // Update portfolio item
    const { data, error } = await supabase
      .from('appraiser_portfolio')
      .update(updateData)
      .eq('id', item_id)
      .select()
      .single();

    if (error) {
      console.error('Portfolio update error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update portfolio item' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: data
    });

  } catch (error) {
    console.error('Portfolio update error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
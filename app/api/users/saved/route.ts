import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's saved properties with property details
    const { data: savedProperties, error } = await supabase
      .from('saved_properties')
      .select(`
        id,
        property_id,
        created_at,
        properties (
          id,
          title,
          price,
          bedrooms,
          bathrooms,
          square_meters,
          address,
          city,
          state,
          property_type,
          status,
          property_photos (
            id,
            url,
            is_primary,
            order_index
          )
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching saved properties:', error);
      return NextResponse.json({ error: 'Failed to fetch saved properties' }, { status: 500 });
    }

    return NextResponse.json({ savedProperties: savedProperties || [] });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Check if property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', propertyId)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Save property for user (upsert to handle duplicates)
    const { data: savedProperty, error } = await supabase
      .from('saved_properties')
      .upsert({
        user_id: user.id,
        property_id: propertyId
      }, {
        onConflict: 'user_id,property_id'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving property:', error);
      return NextResponse.json({ error: 'Failed to save property' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: 'Property saved successfully',
      savedProperty 
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { propertyId } = await request.json();

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Remove saved property
    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .eq('user_id', user.id)
      .eq('property_id', propertyId);

    if (error) {
      console.error('Error removing saved property:', error);
      return NextResponse.json({ error: 'Failed to remove saved property' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Property removed from saved list' });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
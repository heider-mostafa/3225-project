import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if property is already saved to avoid duplicate error
    const { data: existing } = await supabase
      .from('saved_properties')
      .select('id')
      .eq('user_id', user.id)
      .eq('property_id', params.id)
      .single();

    if (existing) {
      return NextResponse.json({ 
        success: true, 
        message: 'Property already saved' 
      });
    }

    // Verify the property exists
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id')
      .eq('id', params.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Save the property
    const { error } = await supabase
      .from('saved_properties')
      .insert({
        user_id: user.id,
        property_id: params.id,
      });

    if (error) {
      console.error('Supabase error saving property:', error);
      return NextResponse.json(
        { error: 'Failed to save property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabaseClient();

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Remove the saved property
    const { error } = await supabase
      .from('saved_properties')
      .delete()
      .match({
        user_id: user.id,
        property_id: params.id,
      });

    if (error) {
      console.error('Supabase error removing saved property:', error);
      return NextResponse.json(
        { error: 'Failed to remove saved property', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error removing saved property:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const { full_name, email, phone, user_id, auto_created } = await request.json();

    if (!full_name || !email || !user_id) {
      return NextResponse.json(
        { error: 'Full name, email, and user_id are required' },
        { status: 400 }
      );
    }

    // Use service role to bypass RLS for creating appraiser profiles
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined }, // Don't use cookies with service role
        },
      }
    );

    // Create broker record for the appraiser
    const { data: broker, error } = await supabase
      .from('brokers')
      .insert({
        full_name,
        email,
        phone,
        user_id,
        is_active: true,
        public_profile_active: false, // Will be activated after verification
        profile_headline: `Property Appraiser`,
        valify_status: 'pending', // Initialize Valify status
        role: 'appraiser', // Explicitly mark as appraiser
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating appraiser broker record:', error);
      return NextResponse.json(
        { error: 'Failed to create appraiser profile: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Appraiser profile created successfully',
      appraiser: broker
    });

  } catch (error) {
    console.error('Error in POST /api/appraisers:', error);
    return NextResponse.json(
      { error: 'Failed to create appraiser profile' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get() { return undefined },
        },
      }
    );

    let query = supabase
      .from('brokers')
      .select('*')
      .eq('is_active', true)
      .eq('role', 'appraiser'); // Only get appraisers

    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: appraisers, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching appraisers:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appraisers: ' + error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ appraisers });

  } catch (error) {
    console.error('Error in GET /api/appraisers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch appraisers' },
      { status: 500 }
    );
  }
}
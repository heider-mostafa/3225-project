import { createServerSupabaseClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient();

    // Test 1: Get all properties
    const { data: allProperties, error: allError } = await supabase
      .from('properties')
      .select('id, title, city, property_type, bedrooms, status')
      .limit(10);

    if (allError) {
      console.error('Error fetching all properties:', allError);
      return NextResponse.json({ error: 'Failed to fetch properties', details: allError }, { status: 500 });
    }

    // Test 2: Get New Cairo properties specifically
    const { data: newCairoProperties, error: newCairoError } = await supabase
      .from('properties')
      .select('id, title, city, property_type, bedrooms, status')
      .eq('city', 'New Cairo');

    if (newCairoError) {
      console.error('Error fetching New Cairo properties:', newCairoError);
    }

    // Test 3: Get villa properties
    const { data: villaProperties, error: villaError } = await supabase
      .from('properties')
      .select('id, title, city, property_type, bedrooms, status')
      .eq('property_type', 'villa');

    if (villaError) {
      console.error('Error fetching villa properties:', villaError);
    }

    return NextResponse.json({
      totalProperties: allProperties?.length || 0,
      allProperties: allProperties || [],
      newCairoProperties: newCairoProperties || [],
      villaProperties: villaProperties || [],
      newCairoCount: newCairoProperties?.length || 0,
      villaCount: villaProperties?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
// SIMPLIFIED API ROUTE FOR TESTING
// Replace your app/api/properties/route.ts temporarily with this

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('=== API DEBUG START ===');
    
    // Test 1: Check environment variables
    console.log('ENV check:', {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      urlLength: process.env.NEXT_PUBLIC_SUPABASE_URL?.length,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
    });

    // Test 2: Try to create Supabase client
    let supabase;
    try {
      console.log('Creating Supabase client...');
      supabase = await createServerSupabaseClient();
      console.log('✅ Supabase client created successfully');
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError);
      return NextResponse.json({ 
        error: 'Failed to create Supabase client',
        details: clientError.message 
      }, { status: 500 });
    }

    // Test 3: Try simple query first
    console.log('Testing simple properties query...');
    try {
      const { data: testData, error: testError } = await supabase
        .from('properties')
        .select('id, title, city, status')
        .limit(5);

      if (testError) {
        console.error('❌ Simple query failed:', testError);
        return NextResponse.json({ 
          error: 'Database query failed',
          details: testError.message 
        }, { status: 500 });
      }

      console.log('✅ Simple query succeeded, found:', testData?.length, 'properties');

      // Test 4: Try query with photos
      console.log('Testing query with photos...');
      const { data: properties, error, count } = await supabase
        .from('properties')
        .select(`
          *,
          property_photos (
            id,
            url,
            is_primary,
            order_index
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('❌ Full query failed:', error);
        return NextResponse.json({ 
          error: 'Database query with photos failed',
          details: error.message 
        }, { status: 500 });
      }

      console.log('✅ Full query succeeded, found:', properties?.length, 'properties with total count:', count);

      // Return successful response
      return NextResponse.json({
        success: true,
        properties: properties || [],
        pagination: {
          page: 1,
          limit: 10,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / 10)
        },
        debug: {
          propertiesFound: properties?.length || 0,
          totalCount: count || 0,
          firstProperty: properties?.[0] ? {
            id: properties[0].id,
            title: properties[0].title,
            city: properties[0].city,
            status: properties[0].status
          } : null
        }
      });

    } catch (queryError) {
      console.error('❌ Query exception:', queryError);
      return NextResponse.json({ 
        error: 'Query exception',
        details: queryError.message 
      }, { status: 500 });
    }

  } catch (error) {
    console.error('❌ API route exception:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
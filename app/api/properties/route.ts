import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isServerUserAdmin, logAdminActivity, ADMIN_PERMISSIONS } from '@/lib/auth/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Filtering parameters
    const city = searchParams.get('city');
    const compound = searchParams.get('compound');
    const propertyType = searchParams.get('property_type');
    const minBedrooms = searchParams.get('min_bedrooms');
    const maxBedrooms = searchParams.get('max_bedrooms');
    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const exclude = searchParams.get('exclude'); // Property ID to exclude

    // Build query
    let query = supabase
      .from('properties')
      .select(`
        *,
        property_photos (
          id,
          url,
          is_primary,
          order_index
        )
      `, { count: 'exact' });

    // Apply filters
    if (city) {
      query = query.eq('city', city);
    }
    if (compound) {
      query = query.eq('compound', compound);
    }
    if (propertyType) {
      query = query.eq('property_type', propertyType);
    }
    if (minBedrooms) {
      query = query.gte('bedrooms', parseInt(minBedrooms));
    }
    if (maxBedrooms) {
      query = query.lte('bedrooms', parseInt(maxBedrooms));
    }
    if (minPrice) {
      query = query.gte('price', parseFloat(minPrice));
    }
    if (maxPrice) {
      query = query.lte('price', parseFloat(maxPrice));
    }
    if (exclude) {
      query = query.neq('id', exclude);
    }

    // Execute query
    const { data: properties, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching properties:', error);
      return NextResponse.json({ error: 'Failed to fetch properties' }, { status: 500 });
    }

    return NextResponse.json({
      properties: properties || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = await createServerSupabaseClient();

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin permissions for property creation
    const isAdmin = await isServerUserAdmin(cookieStore);
    if (!isAdmin) {
      return NextResponse.json({ 
        error: 'Admin privileges required to create properties' 
      }, { status: 403 });
    }

    const propertyData = await request.json();
    
    const { data: property, error } = await supabase
      .from('properties')
      .insert([propertyData])
      .select()
      .single();

    if (error) {
      console.error('Error creating property:', error);
      return NextResponse.json({ error: 'Failed to create property' }, { status: 500 });
    }

    // Log admin activity
    await logAdminActivity(
      'property_created',
      'property',
      property.id,
      {
        title: property.title,
        address: property.address,
        city: property.city,
        state: property.state,
        property_type: property.property_type,
        price: property.price
      },
      request
    );

    return NextResponse.json(property, { status: 201 });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isServerUserAdmin, logAdminActivity, ADMIN_PERMISSIONS } from '@/lib/auth/admin';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { propertyService } from '@/lib/services/property-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse pagination parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50); // Cap at 50 for performance
    
    // Parse filtering parameters
    const filters = {
      city: searchParams.get('city') || undefined,
      compound: searchParams.get('compound') || undefined,
      property_type: searchParams.get('property_type') || undefined,
      min_bedrooms: searchParams.get('min_bedrooms') ? parseInt(searchParams.get('min_bedrooms')!) : undefined,
      max_bedrooms: searchParams.get('max_bedrooms') ? parseInt(searchParams.get('max_bedrooms')!) : undefined,
      min_price: searchParams.get('min_price') ? parseFloat(searchParams.get('min_price')!) : undefined,
      max_price: searchParams.get('max_price') ? parseFloat(searchParams.get('max_price')!) : undefined,
      exclude: searchParams.get('exclude') || undefined,
      has_virtual_tour: searchParams.get('has_virtual_tour') === 'true' ? true : undefined,
    };

    // Determine query context based on request
    const requestContext = searchParams.get('context') || 'listing';
    const context = {
      type: requestContext as 'listing' | 'search' | 'detail',
      includePhotos: true,
      includeAppraisals: requestContext === 'search' || requestContext === 'detail'
    };

    // Use optimized PropertyService
    const startTime = Date.now();
    const result = await propertyService.getProperties(filters, context, { page, limit });
    const totalTime = Date.now() - startTime;

    return NextResponse.json({
      ...result,
      performance: {
        ...result.performance,
        totalTime,
        context: context.type
      }
    });

  } catch (error) {
    console.error('❌ Properties API error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to fetch properties',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
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
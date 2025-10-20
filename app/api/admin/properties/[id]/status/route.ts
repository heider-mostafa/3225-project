import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { isServerUserAdmin, logAdminActivity } from '@/lib/auth/admin';
import { cookies } from 'next/headers';

// Valid property statuses based on your database analysis
const VALID_STATUSES = [
  'active',
  'available', 
  'for_sale',
  'for_rent',
  'pending',
  'sold',
  'rented',
  'draft',
  'inactive'
] as const;

type PropertyStatus = typeof VALID_STATUSES[number];

// PUT /api/admin/properties/[id]/status - Update property status
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();
    const { status } = await request.json();

    // Validate status
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ 
        error: 'Invalid status',
        validStatuses: VALID_STATUSES 
      }, { status: 400 });
    }

    // Get current property for logging
    const { data: currentProperty, error: fetchError } = await supabase
      .from('properties')
      .select('title, status')
      .eq('id', params.id)
      .single();

    if (fetchError || !currentProperty) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    // Update property status
    const { data: updatedProperty, error: updateError } = await supabase
      .from('properties')
      .update({ 
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select('id, title, status, updated_at')
      .single();

    if (updateError) {
      console.error('Error updating property status:', updateError);
      return NextResponse.json({ 
        error: 'Failed to update property status',
        details: updateError.message 
      }, { status: 500 });
    }

    // Log admin activity
    await logAdminActivity(
      'property_updated',
      'property',
      params.id,
      {
        action: 'status_changed',
        propertyTitle: currentProperty.title,
        oldStatus: currentProperty.status,
        newStatus: status,
        timestamp: new Date().toISOString()
      }
    );


    return NextResponse.json({
      success: true,
      property: updatedProperty,
      message: `Property status updated to "${status}"`
    });

  } catch (error) {
    console.error('Unexpected error updating property status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/properties/[id]/status - Get property status info
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = await cookies();
    
    // Check admin permissions
    const isAdmin = await isServerUserAdmin(cookieStore);
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const supabase = await createServerSupabaseClient();

    const { data: property, error } = await supabase
      .from('properties')
      .select('id, title, status, updated_at')
      .eq('id', params.id)
      .single();

    if (error || !property) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    return NextResponse.json({
      property,
      validStatuses: VALID_STATUSES,
      statusCounts: await getStatusCounts(supabase)
    });

  } catch (error) {
    console.error('Unexpected error fetching property status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function getStatusCounts(supabase: any) {
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('status')
      .not('status', 'is', null);

    if (error) {
      console.error('Error fetching status counts:', error);
      return {};
    }

    return data.reduce((acc: any, item: any) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  } catch (error) {
    console.error('Error calculating status counts:', error);
    return {};
  }
}
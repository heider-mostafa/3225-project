import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get broker profile for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found. Please contact admin.' 
      }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const priority = searchParams.get('priority') || '';
    const sortBy = searchParams.get('sortBy') || 'created_at';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const offset = (page - 1) * limit;

    // Build query to get inquiries for properties where this broker is assigned
    let query = supabase
      .from('inquiries')
      .select(`
        *,
        properties!inner (
          id,
          title,
          address,
          city,
          price,
          property_photos (
            url,
            is_primary
          ),
          property_brokers!inner (
            broker_id,
            is_primary
          )
        )
      `, { count: 'exact' })
      .eq('properties.property_brokers.broker_id', broker.id)
      .eq('properties.property_brokers.is_active', true);

    // Apply search filter
    if (search) {
      query = query.or(`message.ilike.%${search}%,name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }
    if (priority) {
      query = query.eq('priority', priority);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: inquiries, error, count } = await query;

    if (error) {
      console.error('Error fetching broker inquiries:', error);
      return NextResponse.json({ error: 'Failed to fetch inquiries' }, { status: 500 });
    }

    // Transform the data to remove the nested property_brokers
    const transformedInquiries = inquiries?.map(inquiry => ({
      ...inquiry,
      properties: {
        ...inquiry.properties,
        property_brokers: undefined // Remove the property_brokers from the response
      }
    }));

    // Get inquiry statistics for this broker
    const { data: allBrokerInquiries } = await supabase
      .from('inquiries')
      .select(`
        status,
        priority,
        properties!inner (
          property_brokers!inner (
            broker_id
          )
        )
      `)
      .eq('properties.property_brokers.broker_id', broker.id)
      .eq('properties.property_brokers.is_active', true);

    const inquiryStats = {
      total: count || 0,
      new: allBrokerInquiries?.filter(i => i.status === 'new').length || 0,
      contacted: allBrokerInquiries?.filter(i => i.status === 'contacted').length || 0,
      qualified: allBrokerInquiries?.filter(i => i.status === 'qualified').length || 0,
      closed: allBrokerInquiries?.filter(i => i.status === 'closed').length || 0,
      high_priority: allBrokerInquiries?.filter(i => i.priority === 'high').length || 0,
      medium_priority: allBrokerInquiries?.filter(i => i.priority === 'medium').length || 0,
      low_priority: allBrokerInquiries?.filter(i => i.priority === 'low').length || 0,
    };

    return NextResponse.json({
      success: true,
      inquiries: transformedInquiries || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      stats: inquiryStats
    });

  } catch (error) {
    console.error('Unexpected error in broker inquiries:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/broker/inquiries - Update inquiry status (brokers only)
export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient();

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get broker profile for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single();

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found. Please contact admin.' 
      }, { status: 404 });
    }

    const { action, inquiryIds, updateData } = await request.json();

    if (!action || !inquiryIds || !Array.isArray(inquiryIds)) {
      return NextResponse.json(
        { error: 'Action and inquiryIds array are required' },
        { status: 400 }
      );
    }

    // Verify that all inquiries belong to properties assigned to this broker
    const { data: validInquiries, error: validationError } = await supabase
      .from('inquiries')
      .select(`
        id,
        properties!inner (
          property_brokers!inner (
            broker_id
          )
        )
      `)
      .in('id', inquiryIds)
      .eq('properties.property_brokers.broker_id', broker.id)
      .eq('properties.property_brokers.is_active', true);

    if (validationError) {
      console.error('Error validating inquiry access:', validationError);
      return NextResponse.json({ error: 'Failed to validate inquiry access' }, { status: 500 });
    }

    const validInquiryIds = validInquiries?.map(i => i.id) || [];
    const invalidInquiryIds = inquiryIds.filter(id => !validInquiryIds.includes(id));

    if (invalidInquiryIds.length > 0) {
      return NextResponse.json({ 
        error: 'Access denied to some inquiries. You can only update inquiries for properties you are assigned to.' 
      }, { status: 403 });
    }

    let results = [];

    switch (action) {
      case 'bulk_update_status':
        if (!updateData?.status) {
          return NextResponse.json(
            { error: 'Status is required for status update' },
            { status: 400 }
          );
        }
        
        const { data: updatedInquiries, error: updateError } = await supabase
          .from('inquiries')
          .update({ 
            status: updateData.status,
            updated_at: new Date().toISOString(),
            admin_notes: updateData.admin_notes || null
          })
          .in('id', validInquiryIds)
          .select('id, status, properties(title)');

        if (updateError) {
          console.error('Error updating inquiry status:', updateError);
          return NextResponse.json(
            { error: 'Failed to update inquiry status' },
            { status: 500 }
          );
        }

        results = updatedInquiries || [];
        break;

      default:
        return NextResponse.json(
          { error: 'Unknown action: ' + action },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Inquiry updated successfully',
      results
    });

  } catch (error) {
    console.error('Unexpected error in broker inquiry update:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
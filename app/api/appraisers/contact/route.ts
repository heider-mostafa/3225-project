import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { notificationService } from '@/lib/services/notification-service';

interface ContactRequest {
  appraiser_id: string;
  property_id?: string;
  contact_type: 'general_inquiry' | 'appraisal_request' | 'property_specific';
  client_name: string;
  client_email: string;
  client_phone?: string;
  contact_preference: 'email' | 'phone' | 'whatsapp';
  message: string;
  
  // For appraisal requests
  appraisal_type?: 'purchase' | 'sale' | 'refinance' | 'insurance' | 'legal' | 'investment';
  property_type?: 'residential' | 'commercial' | 'villa' | 'land' | 'industrial';
  property_address?: string;
  property_size?: string;
  estimated_value?: string;
  urgency?: 'standard' | 'urgent' | 'flexible';
  preferred_date?: string;
  additional_requirements?: string;
  estimated_cost?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: ContactRequest = await request.json();

    const {
      appraiser_id,
      property_id,
      contact_type,
      client_name,
      client_email,
      client_phone,
      contact_preference,
      message,
      appraisal_type,
      property_type,
      property_address,
      property_size,
      estimated_value,
      urgency,
      preferred_date,
      additional_requirements,
      estimated_cost
    } = body;

    // Validate required fields
    if (!appraiser_id || !contact_type || !client_name || !client_email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: appraiser_id, contact_type, client_name, client_email, message' },
        { status: 400 }
      );
    }

    // Additional validation for appraisal requests
    if (contact_type === 'appraisal_request' && (!property_address || !property_type || !appraisal_type)) {
      return NextResponse.json(
        { error: 'Property address, property type, and appraisal type are required for appraisal requests' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(client_email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    const supabase = createRouteHandlerClient({ cookies });

    // Verify appraiser exists and is active
    const { data: appraiser, error: appraiserError } = await supabase
      .from('brokers')
      .select('id, full_name, email, phone, response_time_hours, public_profile_active, is_active')
      .eq('id', appraiser_id)
      .eq('public_profile_active', true)
      .eq('is_active', true)
      .single();

    if (appraiserError || !appraiser) {
      return NextResponse.json(
        { error: 'Appraiser not found or not available' },
        { status: 404 }
      );
    }

    // Get current user if authenticated
    const { data: { user } } = await supabase.auth.getUser();

    // Create contact request record - try both tables for compatibility
    let contactRecord;
    let insertError;

    if (contact_type === 'appraisal_request') {
      // For appraisal requests, use the existing appraisal_requests table
      const { data, error } = await supabase
        .from('appraisal_requests')
        .insert({
          appraiser_id,
          client_name,
          client_email,
          client_phone,
          contact_preference,
          appraisal_type,
          property_type,
          property_address,
          property_size,
          estimated_value,
          urgency_level: urgency || 'standard',
          preferred_date: preferred_date ? new Date(preferred_date).toISOString() : null,
          additional_requirements,
          message,
          estimated_cost,
          status: 'pending',
          created_at: new Date().toISOString()
        })
        .select()
        .single();
      
      contactRecord = data;
      insertError = error;
    } else {
      // For general inquiries, try to use appraiser_contact_requests table
      const { data, error } = await supabase
        .from('appraiser_contact_requests')
        .insert({
          appraiser_id,
          property_id,
          client_user_id: user?.id || null,
          contact_type,
          client_name,
          client_email,
          client_phone,
          message,
          preferred_contact_method: contact_preference,
          status: 'pending',
          priority: 'normal',
          source: 'profile_page',
          client_ip: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        })
        .select('id, created_at')
        .single();

      // If that table doesn't exist, fall back to appraisal_requests
      if (error && error.code === '42P01') {
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('appraisal_requests')
          .insert({
            appraiser_id,
            client_name,
            client_email,
            client_phone,
            contact_preference,
            appraisal_type: 'general',
            property_type: 'general',
            property_address: 'N/A - General Inquiry',
            message,
            urgency_level: 'standard',
            status: 'pending',
            created_at: new Date().toISOString()
          })
          .select()
          .single();
        
        contactRecord = fallbackData;
        insertError = fallbackError;
      } else {
        contactRecord = data;
        insertError = error;
      }
    }

    if (insertError) {
      console.error('Error creating contact request:', insertError);
      return NextResponse.json(
        { error: 'Failed to create contact request' },
        { status: 500 }
      );
    }

    // Calculate estimated response time
    const responseTimeHours = appraiser.response_time_hours || 24;
    const responseTimeText = responseTimeHours <= 2 ? 'within 2 hours' :
                           responseTimeHours <= 8 ? 'within 8 hours' :
                           responseTimeHours <= 24 ? 'within 24 hours' :
                           `within ${Math.ceil(responseTimeHours / 24)} days`;

    // Send notifications using the notification service
    try {
      await notificationService.notifyAppraiserNewContact({
        appraiser_name: appraiser.full_name,
        appraiser_email: appraiser.email,
        appraiser_phone: appraiser.phone,
        client_name,
        client_email,
        client_phone,
        contact_preference,
        contact_type,
        property_address: property_address || 'N/A',
        property_type: property_type || 'N/A',
        appraisal_type: appraisal_type || 'general',
        urgency: urgency || 'standard',
        message,
        request_id: contactRecord.id
      });
    } catch (emailError) {
      console.error('Failed to send appraiser notification:', emailError);
      // Don't fail the request if email fails
    }

    try {
      await notificationService.notifyClientContactConfirmation({
        client_name,
        client_email,
        client_phone,
        appraiser_name: appraiser.full_name,
        contact_type,
        property_address: property_address || 'N/A',
        estimated_response_time: responseTimeText,
        request_id: contactRecord.id
      });
    } catch (emailError) {
      console.error('Failed to send client confirmation:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      contact_id: contactRecord.id,
      estimated_response_time: responseTimeText,
      message: `Your message has been sent to ${appraiser.full_name}. You can expect a response ${responseTimeText}.`
    });

  } catch (error) {
    console.error('Contact API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}


// Get contact history for authenticated users
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appraiser_id = searchParams.get('appraiser_id');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = createRouteHandlerClient({ cookies });
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Try to get from appraisal_requests table (existing)
    let query = supabase
      .from('appraisal_requests')
      .select(`
        id,
        appraisal_type,
        property_type,
        property_address,
        message,
        status,
        urgency_level,
        created_at,
        updated_at,
        brokers!inner(id, full_name)
      `)
      .eq('client_email', user.email)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (appraiser_id) {
      query = query.eq('appraiser_id', appraiser_id);
    }

    const { data: requests, error } = await query;

    if (error) {
      console.error('Failed to fetch contact history:', error);
      return NextResponse.json(
        { error: 'Failed to fetch contact history' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      contacts: requests || [],
      pagination: {
        limit,
        offset,
        total: requests?.length || 0
      }
    });

  } catch (error) {
    console.error('Get contacts API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
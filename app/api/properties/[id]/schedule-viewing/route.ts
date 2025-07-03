import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { triggerInquiryWorkflow } from '@/lib/n8n/client';
import { supabase } from '@/lib/supabase/config';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const body = await request.json();
    const { 
      broker_id,
      client_name,
      client_email,
      client_phone,
      preferred_date,
      preferred_time,
      viewing_type = 'in_person',
      notes,
    } = body;

    // Validate required fields
    if (!broker_id || !client_name || !client_email || !client_phone || !preferred_date || !preferred_time) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields'
      }, { status: 400 });
    }

    // Validate property exists and is available
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('id, title, status')
      .eq('id', resolvedParams.id)
      .single();

    if (propertyError || !property) {
      return NextResponse.json({
        success: false,
        error: 'Property not found'
      }, { status: 404 });
    }

    // Validate broker is assigned to this property
    const { data: propertyBroker, error: brokerError } = await supabase
      .from('property_brokers')
      .select('broker_id')
      .eq('property_id', resolvedParams.id)
      .eq('broker_id', broker_id)
      .eq('is_active', true)
      .single();

    if (brokerError || !propertyBroker) {
      return NextResponse.json({
        success: false,
        error: 'Broker not assigned to this property'
      }, { status: 400 });
    }

    // Create viewing request
    const { data: viewing, error: viewingError } = await supabase
      .from('viewing_requests')
      .insert({
        property_id: resolvedParams.id,
        broker_id,
        client_name,
        client_email,
        client_phone,
        preferred_date,
        preferred_time,
        viewing_type,
        notes,
        status: 'pending',
        request_source: 'website'
      })
      .select()
      .single();

    if (viewingError) {
      console.error('Error creating viewing request:', viewingError);
      return NextResponse.json({
        success: false,
        error: 'Failed to schedule viewing'
      }, { status: 500 });
    }

    // Create notification for broker
    await supabase
      .from('notifications')
      .insert({
        recipient_id: broker_id,
        type: 'viewing_request',
        title: 'New Viewing Request',
        content: `New viewing request for ${property.title} from ${client_name}`,
        metadata: {
          propertyId: resolvedParams.id,
          viewingId: viewing.id,
          clientName: client_name,
          preferredDate: preferred_date,
          preferredTime: preferred_time
        }
      });

    // Log activity
    await supabase
      .from('activity_logs')
      .insert({
        action: 'viewing_scheduled',
        resource_type: 'property',
        resource_id: resolvedParams.id,
        details: {
          broker_id,
          client_name,
          preferred_date,
          preferred_time,
          viewing_type
        }
      });

    return NextResponse.json({
      success: true,
      viewing,
      message: 'Viewing request submitted successfully. The broker will contact you to confirm.'
    });

  } catch (error) {
    console.error('Error in schedule viewing:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
} 
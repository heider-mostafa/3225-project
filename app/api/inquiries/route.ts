import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/config';
import { triggerInquiryWorkflow } from '@/lib/n8n/client';

export async function POST(request: Request) {
  try {
    const { propertyId, name, email, phone, message } = await request.json();

    // Create inquiry in Supabase
    const { data: inquiry, error } = await supabase
      .from('inquiries')
      .insert({
        property_id: propertyId,
        name,
        email,
        phone,
        message,
        status: 'new',
        source: 'website'
      })
      .select()
      .single();

    if (error) throw error;

    // Trigger N8N workflow
    await triggerInquiryWorkflow({
      propertyId,
      name,
      email,
      phone,
      message
    });

    return NextResponse.json(inquiry);
  } catch (error) {
    console.error('Error creating inquiry:', error);
    return NextResponse.json(
      { error: 'Failed to create inquiry' },
      { status: 500 }
    );
  }
} 
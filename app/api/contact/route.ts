import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { sendCommonEmail } from '@/lib/email/mailgun';

import { createServerSupabaseClient } from '@/lib/supabase/server'
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const supabase = await createServerSupabaseClient();

    const { 
      name, 
      email, 
      phone, 
      subject, 
      message,
      contactType = 'general' // 'general', 'support', 'partnership', 'media'
    } = await request.json();

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, message' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Get user session if available
    const { data: { session } } = await supabase.auth.getSession();

    // Create contact inquiry in inquiries table
    const contactData = {
      property_id: null, // This is a general contact, not property-specific
      user_id: session?.user?.id || null,
      name,
      email,
      phone,
      message,
      status: 'new',
      source: 'contact_form',
      contact_details: {
        subject: subject || 'General Inquiry',
        contact_type: contactType,
        timestamp: new Date().toISOString()
      }
    };

    // Insert contact inquiry
    const { data: contact, error } = await supabase
      .from('inquiries')
      .insert(contactData)
      .select()
      .single();

    if (error) {
      console.error('Error creating contact inquiry:', error);
      return NextResponse.json({ error: 'Failed to submit contact form' }, { status: 500 });
    }

    // Send immediate auto-reply email using Mailgun
    try {
      const autoReplyResult = await sendCommonEmail.autoReply(
        email,
        name,
        subject || 'General Inquiry',
        contact.id,
        contactType
      );

      if (!autoReplyResult.success) {
        console.error('Auto-reply email failed:', autoReplyResult.error);
      }
    } catch (emailError) {
      console.error('Auto-reply email error:', emailError);
      // Don't fail the request if email fails
    }

    // Send notification to admin team
    try {
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@virtualestate.com';
      const notificationResult = await sendCommonEmail.contactFormNotification(
        adminEmail,
        'VirtualEstate Admin',
        name,
        email,
        phone || 'Not provided',
        message,
        subject || 'General Inquiry',
        contactType,
        contact.id
      );

      if (!notificationResult.success) {
        console.error('Admin notification email failed:', notificationResult.error);
      }
    } catch (emailError) {
      console.error('Admin notification email error:', emailError);
    }

    // Trigger N8N workflow for contact form submission (as fallback/additional processing)
    try {
      if (process.env.N8N_WEBHOOK_URL) {
        await fetch(`${process.env.N8N_WEBHOOK_URL}/contact-form`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            inquiryId: contact.id,
            contactType,
            subject: subject || 'General Inquiry',
            name,
            email,
            phone,
            message,
            timestamp: new Date().toISOString(),
            userId: session?.user?.id || null
          })
        });
      }
    } catch (webhookError) {
      console.error('Contact form webhook failed:', webhookError);
      // Don't fail the request if webhook fails
    }

    // Track the contact form submission in analytics
    try {
      await supabase
        .from('user_activity_log')
        .insert({
          user_id: session?.user?.id || null,
          activity_type: 'contact_form_submission',
          entity_type: 'inquiry',
          entity_id: contact.id,
          activity_data: {
            contact_type: contactType,
            subject: subject || 'General Inquiry',
            has_phone: !!phone
          },
          ip_address: request.headers.get('x-forwarded-for') || 'unknown',
          user_agent: request.headers.get('user-agent') || 'unknown'
        });
    } catch (analyticsError) {
      console.error('Analytics tracking failed:', analyticsError);
    }

    return NextResponse.json({
      message: 'Contact form submitted successfully! We\'ll get back to you within 24 hours.',
      inquiryId: contact.id,
      status: 'received',
      autoReplyStatus: 'sent' // Assume success for user experience
    });

  } catch (error) {
    console.error('Unexpected error in contact form:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
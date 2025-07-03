import { NextResponse } from 'next/server';
import { mailgun } from '@/lib/email/mailgun';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { createServerSupabaseClient } from '@/lib/supabase/server'
// Mailgun webhook events we want to track
interface MailgunWebhookEvent {
  'event-data': {
    event: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'complained' | 'unsubscribed' | 'failed';
    timestamp: number;
    id: string;
    'log-level': string;
    severity: string;
    recipient: string;
    message: {
      headers: {
        'message-id': string;
        to: string;
        from: string;
        subject: string;
      };
    };
    'user-variables'?: Record<string, any>;
    tags?: string[];
    url?: string; // For click events
    reason?: string; // For bounce/failure events
    description?: string;
  };
  signature: {
    timestamp: string;
    token: string;
    signature: string;
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.text();
    
    // Verify webhook signature for security
    const signature = request.headers.get('x-mailgun-signature-v2');
    const timestamp = request.headers.get('x-mailgun-timestamp');
    
    if (!signature || !timestamp) {
      console.error('Missing Mailgun signature or timestamp');
      return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
    }

    // Verify the webhook signature
    if (!mailgun.verifyWebhookSignature(body, signature, timestamp)) {
      console.error('Invalid Mailgun webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const webhookData: MailgunWebhookEvent = JSON.parse(body);
    const eventData = webhookData['event-data'];

    console.log('📧 Mailgun webhook received:', {
      event: eventData.event,
      recipient: eventData.recipient,
      messageId: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
    });

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for webhook processing
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );

    // Process different event types
    switch (eventData.event) {
      case 'delivered':
        await handleDeliveredEvent(supabase, eventData);
        break;
      
      case 'opened':
        await handleOpenedEvent(supabase, eventData);
        break;
      
      case 'clicked':
        await handleClickedEvent(supabase, eventData);
        break;
      
      case 'bounced':
        await handleBouncedEvent(supabase, eventData);
        break;
      
      case 'complained':
        await handleComplaintEvent(supabase, eventData);
        break;
      
      case 'unsubscribed':
        await handleUnsubscribeEvent(supabase, eventData);
        break;
      
      case 'failed':
        await handleFailedEvent(supabase, eventData);
        break;
      
      default:
        console.log('Unhandled Mailgun event:', eventData.event);
    }

    return NextResponse.json({ success: true, processed: eventData.event });

  } catch (error) {
    console.error('Error processing Mailgun webhook:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

async function handleDeliveredEvent(supabase: any, eventData: any) {
  try {
    // Update notification_history with delivery confirmation
    await supabase
      .from('notification_history')
      .update({
        status: 'delivered',
        metadata: {
          delivered_at: new Date(eventData.timestamp * 1000).toISOString(),
          mailgun_id: eventData.id,
        }
      })
      .eq('metadata->>mailgun_message_id', eventData.message.headers['message-id']);

    // Track email analytics
    await trackEmailEvent(supabase, {
      event_type: 'email_delivered',
      recipient: eventData.recipient,
      message_id: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
      timestamp: new Date(eventData.timestamp * 1000),
    });

  } catch (error) {
    console.error('Error handling delivered event:', error);
  }
}

async function handleOpenedEvent(supabase: any, eventData: any) {
  try {
    // Update notification_history with open tracking
    await supabase
      .from('notification_history')
      .update({
        status: 'opened',
        metadata: {
          opened_at: new Date(eventData.timestamp * 1000).toISOString(),
          mailgun_id: eventData.id,
        }
      })
      .eq('metadata->>mailgun_message_id', eventData.message.headers['message-id']);

    // Track email analytics
    await trackEmailEvent(supabase, {
      event_type: 'email_opened',
      recipient: eventData.recipient,
      message_id: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
      timestamp: new Date(eventData.timestamp * 1000),
    });

    // If this is a property-related email, track engagement
    if (eventData.tags?.includes('property') || eventData.tags?.includes('viewing')) {
      await trackPropertyEngagement(supabase, eventData, 'email_opened');
    }

  } catch (error) {
    console.error('Error handling opened event:', error);
  }
}

async function handleClickedEvent(supabase: any, eventData: any) {
  try {
    // Track email analytics
    await trackEmailEvent(supabase, {
      event_type: 'email_clicked',
      recipient: eventData.recipient,
      message_id: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
      timestamp: new Date(eventData.timestamp * 1000),
      url_clicked: eventData.url,
    });

    // If this is a property-related email, track engagement
    if (eventData.tags?.includes('property') || eventData.tags?.includes('viewing')) {
      await trackPropertyEngagement(supabase, eventData, 'email_clicked');
    }

    // Track specific link clicks for insights
    if (eventData.url) {
      await trackLinkClick(supabase, eventData);
    }

  } catch (error) {
    console.error('Error handling clicked event:', error);
  }
}

async function handleBouncedEvent(supabase: any, eventData: any) {
  try {
    // Update notification_history with bounce info
    await supabase
      .from('notification_history')
      .update({
        status: 'failed',
        metadata: {
          bounced_at: new Date(eventData.timestamp * 1000).toISOString(),
          bounce_reason: eventData.reason,
          bounce_description: eventData.description,
          mailgun_id: eventData.id,
        }
      })
      .eq('metadata->>mailgun_message_id', eventData.message.headers['message-id']);

    // Add to suppression list if hard bounce
    if (eventData.severity === 'permanent') {
      await mailgun.suppressEmail(eventData.recipient, 'bounce');
      
      // Update user email preferences to disable emails
      await supabase
        .from('user_settings')
        .update({
          email_notifications: {
            property_updates: false,
            saved_search_alerts: false,
            inquiry_responses: false,
            newsletter: false,
            marketing: false
          }
        })
        .eq('user_id', await getUserIdByEmail(supabase, eventData.recipient));
    }

    // Track email analytics
    await trackEmailEvent(supabase, {
      event_type: 'email_bounced',
      recipient: eventData.recipient,
      message_id: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
      timestamp: new Date(eventData.timestamp * 1000),
      bounce_reason: eventData.reason,
    });

  } catch (error) {
    console.error('Error handling bounced event:', error);
  }
}

async function handleComplaintEvent(supabase: any, eventData: any) {
  try {
    // Add to suppression list
    await mailgun.suppressEmail(eventData.recipient, 'complaint');
    
    // Update user email preferences to disable marketing emails
    await supabase
      .from('user_settings')
      .update({
        email_notifications: {
          marketing: false,
          newsletter: false,
        }
      })
      .eq('user_id', await getUserIdByEmail(supabase, eventData.recipient));

    // Track email analytics
    await trackEmailEvent(supabase, {
      event_type: 'email_complained',
      recipient: eventData.recipient,
      message_id: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
      timestamp: new Date(eventData.timestamp * 1000),
    });

  } catch (error) {
    console.error('Error handling complaint event:', error);
  }
}

async function handleUnsubscribeEvent(supabase: any, eventData: any) {
  try {
    // Add to suppression list
    await mailgun.suppressEmail(eventData.recipient, 'unsubscribe');
    
    // Update user email preferences
    await supabase
      .from('user_settings')
      .update({
        email_notifications: {
          property_updates: false,
          saved_search_alerts: false,
          inquiry_responses: true, // Keep important transactional emails
          newsletter: false,
          marketing: false,
        }
      })
      .eq('user_id', await getUserIdByEmail(supabase, eventData.recipient));

    // Track email analytics
    await trackEmailEvent(supabase, {
      event_type: 'email_unsubscribed',
      recipient: eventData.recipient,
      message_id: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
      timestamp: new Date(eventData.timestamp * 1000),
    });

  } catch (error) {
    console.error('Error handling unsubscribe event:', error);
  }
}

async function handleFailedEvent(supabase: any, eventData: any) {
  try {
    // Update notification_history with failure info
    await supabase
      .from('notification_history')
      .update({
        status: 'failed',
        metadata: {
          failed_at: new Date(eventData.timestamp * 1000).toISOString(),
          failure_reason: eventData.reason,
          failure_description: eventData.description,
          mailgun_id: eventData.id,
        }
      })
      .eq('metadata->>mailgun_message_id', eventData.message.headers['message-id']);

    // Track email analytics
    await trackEmailEvent(supabase, {
      event_type: 'email_failed',
      recipient: eventData.recipient,
      message_id: eventData.message.headers['message-id'],
      subject: eventData.message.headers.subject,
      tags: eventData.tags,
      timestamp: new Date(eventData.timestamp * 1000),
      failure_reason: eventData.reason,
    });

  } catch (error) {
    console.error('Error handling failed event:', error);
  }
}

async function trackEmailEvent(supabase: any, eventData: any) {
  try {
    // Insert into email_analytics table for tracking
    await supabase
      .from('email_analytics')
      .insert({
        event_type: eventData.event_type,
        recipient_email: eventData.recipient,
        message_id: eventData.message_id,
        subject: eventData.subject,
        tags: eventData.tags || [],
        timestamp: eventData.timestamp,
        metadata: {
          url_clicked: eventData.url_clicked,
          bounce_reason: eventData.bounce_reason,
          failure_reason: eventData.failure_reason,
        }
      });
  } catch (error) {
    console.error('Error tracking email event:', error);
  }
}

async function trackPropertyEngagement(supabase: any, eventData: any, engagementType: string) {
  try {
    // Extract property ID from tags or user variables if available
    const propertyId = eventData['user-variables']?.property_id || 
                     eventData.tags?.find((tag: string) => tag.startsWith('property_'))?.replace('property_', '');

    if (propertyId) {
      await supabase
        .from('property_analytics')
        .insert({
          property_id: propertyId,
          event_type: engagementType,
          event_data: {
            email_recipient: eventData.recipient,
            message_id: eventData.message.headers['message-id'],
            subject: eventData.message.headers.subject,
            url_clicked: eventData.url,
          },
          user_id: await getUserIdByEmail(supabase, eventData.recipient),
        });
    }
  } catch (error) {
    console.error('Error tracking property engagement:', error);
  }
}

async function trackLinkClick(supabase: any, eventData: any) {
  try {
    await supabase
      .from('link_analytics')
      .insert({
        url: eventData.url,
        email_recipient: eventData.recipient,
        message_id: eventData.message.headers['message-id'],
        clicked_at: new Date(eventData.timestamp * 1000),
        tags: eventData.tags || [],
        metadata: {
          subject: eventData.message.headers.subject,
          campaign: eventData.tags?.find((tag: string) => tag.startsWith('campaign_')),
        }
      });
  } catch (error) {
    console.error('Error tracking link click:', error);
  }
}

async function getUserIdByEmail(supabase: any, email: string): Promise<string | null> {
  try {
    const { data: user } = await supabase
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .single();
    
    return user?.id || null;
  } catch (error) {
    console.error('Error getting user ID by email:', error);
    return null;
  }
}

// Handle preflight requests for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
} 
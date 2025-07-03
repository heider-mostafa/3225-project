import { NextRequest, NextResponse } from 'next/server'

const MESSAGE_TEMPLATES = {
  welcome: {
    text: `Hi {{name}}! 👋

Thanks for your interest in selling your property with VirtualEstate!

I'd love to schedule a quick 5-minute call to learn more about your {{property_type}} in {{location}}.

When would be the best time to call you today? Please reply with:
1️⃣ Morning (9-12 PM)
2️⃣ Afternoon (12-5 PM) 
3️⃣ Evening (5-8 PM)

Or suggest your preferred time like "2pm" or "tomorrow 3pm"! 📱`,
    variables: ['name', 'property_type', 'location']
  },
  call_reminder: {
    text: `Hi {{name}}! 🔔

Just a friendly reminder that we have our call scheduled for {{call_time}}.

I'll be calling {{phone_number}} to discuss your {{property_type}} in {{location}}.

Looking forward to speaking with you soon! 📞`,
    variables: ['name', 'call_time', 'phone_number', 'property_type', 'location']
  },
  call_missed: {
    text: `Hi {{name}},

I tried calling you at {{call_time}} but wasn't able to reach you.

No worries! When would be a better time for our 5-minute chat about your {{property_type}}?

Please reply with your preferred time, or I can try calling again later today. 📱`,
    variables: ['name', 'call_time', 'property_type']
  },
  follow_up: {
    text: `Hi {{name}}! 

I haven't heard back from you yet about scheduling our call for your {{property_type}} in {{location}}.

If you're still interested in our FREE professional photography and 3D virtual tour service, please let me know when would be a good time to call you.

Just reply with:
1️⃣ Morning
2️⃣ Afternoon  
3️⃣ Evening

Or suggest your preferred time! 😊`,
    variables: ['name', 'property_type', 'location']
  },
  call_scheduled: {
    text: `Perfect {{name}}! ✅

I've scheduled our call for {{call_time}}.

During our brief chat, I'll learn more about your {{property_type}} and explain how we can help you sell it quickly with our free professional photography and 3D virtual tour.

Talk to you soon! 📞`,
    variables: ['name', 'call_time', 'property_type']
  },
  property_approved: {
    text: `Great news {{name}}! 🎉

Your {{property_type}} in {{location}} has been approved for our premium listing service.

I'll now arrange for our professional photographer to visit your property. You'll receive another message shortly with 3-5 available time slots to choose from.

This includes:
✅ Professional photography
✅ 3D virtual tour
✅ Premium listing placement
✅ All at NO COST to you!`,
    variables: ['name', 'property_type', 'location']
  },
  photographer_scheduling: {
    text: `{{name}}, it's time to schedule your professional photo shoot! 📸

Please choose your preferred time slot:

{{time_slots}}

Simply reply with the number of your preferred slot.

The photo shoot will take approximately 45-60 minutes and includes both regular photos and 3D virtual tour creation.

Looking forward to showcasing your beautiful {{property_type}}! 🏡`,
    variables: ['name', 'time_slots', 'property_type']
  },
  property_rejected: {
    text: `Hi {{name}},

Thank you for your interest in VirtualEstate! After reviewing your {{property_type}} in {{location}}, we've determined it doesn't match our current program requirements.

We appreciate you reaching out and encourage you to contact us again in the future.

Best regards,
VirtualEstate Team`,
    variables: ['name', 'property_type', 'location']
  },
  photographer_scheduled: {
    text: `Excellent {{name}}! 📸

Your professional photo shoot has been scheduled:

📅 Date: {{scheduled_date}}
🕐 Time: {{scheduled_time}}
👨‍💼 Photographer: {{photographer_name}}

Our photographer will contact you 30 minutes before arrival. The session will take approximately 45-60 minutes and includes:

✅ High-quality property photos
✅ 3D virtual tour creation
✅ All editing and processing

Please ensure the property is clean and well-lit. We'll send you the final photos and virtual tour within 24-48 hours!

Thank you for choosing VirtualEstate! 🏡`,
    variables: ['name', 'scheduled_date', 'scheduled_time', 'photographer_name']
  }
}

function replaceVariables(template: string, variables: Record<string, string>): string {
  let message = template
  for (const [key, value] of Object.entries(variables)) {
    message = message.replace(new RegExp(`{{${key}}}`, 'g'), value)
  }
  return message
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { to, message_type, variables, custom_message } = body

    // Validate required fields
    if (!to) {
      return NextResponse.json(
        { error: 'Recipient phone number is required' },
        { status: 400 }
      )
    }

    // Get WhatsApp credentials from environment
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID

    if (!accessToken || !phoneNumberId) {
      console.error('WhatsApp credentials missing')
      return NextResponse.json(
        { error: 'WhatsApp service not configured' },
        { status: 503 }
      )
    }

    let messageText: string

    if (custom_message) {
      messageText = custom_message
    } else if (message_type && MESSAGE_TEMPLATES[message_type as keyof typeof MESSAGE_TEMPLATES]) {
      const template = MESSAGE_TEMPLATES[message_type as keyof typeof MESSAGE_TEMPLATES]
      messageText = replaceVariables(template.text, variables || {})
    } else {
      return NextResponse.json(
        { error: 'Invalid message type or missing custom message' },
        { status: 400 }
      )
    }

    // Prepare WhatsApp API request
    const whatsappPayload = {
      messaging_product: 'whatsapp',
      to: to,
      type: 'text',
      text: {
        body: messageText
      }
    }

    // Send message via WhatsApp Business API
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(whatsappPayload)
      }
    )

    const responseData = await response.json()

    if (!response.ok) {
      console.error('WhatsApp API error:', responseData)
      return NextResponse.json(
        { 
          error: 'Failed to send WhatsApp message',
          details: responseData 
        },
        { status: response.status }
      )
    }

    // Log successful message
    console.log('WhatsApp message sent successfully:', {
      to: to,
      message_type: message_type,
      message_id: responseData.messages?.[0]?.id
    })

    return NextResponse.json({
      success: true,
      message_id: responseData.messages?.[0]?.id,
      whatsapp_id: responseData.messages?.[0]?.wamid
    })

  } catch (error) {
    console.error('WhatsApp send error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve available message templates
export async function GET() {
  return NextResponse.json({
    templates: Object.keys(MESSAGE_TEMPLATES),
    template_details: MESSAGE_TEMPLATES
  })
}
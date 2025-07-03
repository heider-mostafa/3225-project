import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Time slot mappings
const TIME_SLOTS = {
  '1': 'Morning (9-12 PM)',
  '2': 'Afternoon (12-5 PM)', 
  '3': 'Evening (5-8 PM)'
}

// Enhanced time parsing utilities
function parseTimeFromMessage(message: string): { timeSlot: string | null, scheduledTime: Date | null } {
  const normalizedMessage = message.toLowerCase().trim()
  
  // Check for standard time slot selections
  if (['1', '2', '3'].includes(normalizedMessage)) {
    const timeSlot = TIME_SLOTS[normalizedMessage as keyof typeof TIME_SLOTS]
    return { timeSlot, scheduledTime: calculateNextAvailableTime(timeSlot) }
  }
  
  // Parse specific times (e.g., "2pm", "14:00", "tomorrow 3pm")
  const timePatterns = [
    /(\d{1,2}):?(\d{2})?\s*(am|pm)/i,  // 2pm, 2:30pm, 14:30
    /(\d{1,2})\s*(am|pm)/i,            // 2pm, 2 pm
    /(morning|afternoon|evening)/i,     // morning, afternoon, evening
    /tomorrow.*(\d{1,2}):?(\d{2})?\s*(am|pm)/i, // tomorrow 2pm
    /(\d{1,2}):(\d{2})/                // 14:30 format
  ]
  
  for (const pattern of timePatterns) {
    const match = normalizedMessage.match(pattern)
    if (match) {
      const scheduledTime = parseSpecificTime(normalizedMessage)
      return { timeSlot: normalizedMessage, scheduledTime }
    }
  }
  
  return { timeSlot: null, scheduledTime: null }
}

function calculateNextAvailableTime(timeSlot: string): Date {
  const now = new Date()
  const egyptTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Cairo"}))
  
  let targetHour: number
  
  if (timeSlot.includes('Morning')) {
    targetHour = 10 // 10 AM
  } else if (timeSlot.includes('Afternoon')) {
    targetHour = 14 // 2 PM  
  } else { // Evening
    targetHour = 18 // 6 PM
  }
  
  const scheduledTime = new Date(egyptTime)
  scheduledTime.setHours(targetHour, 0, 0, 0)
  
  // If the time has passed today, schedule for tomorrow
  if (scheduledTime <= egyptTime) {
    scheduledTime.setDate(scheduledTime.getDate() + 1)
  }
  
  return scheduledTime
}

function parseSpecificTime(timeString: string): Date | null {
  const now = new Date()
  const egyptTime = new Date(now.toLocaleString("en-US", {timeZone: "Africa/Cairo"}))
  
  // Simple parsing - can be enhanced further
  const timeMatch = timeString.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i)
  if (timeMatch) {
    let hour = parseInt(timeMatch[1])
    const minute = parseInt(timeMatch[2] || '0')
    const period = timeMatch[3]?.toLowerCase()
    
    if (period === 'pm' && hour !== 12) hour += 12
    if (period === 'am' && hour === 12) hour = 0
    
    const scheduledTime = new Date(egyptTime)
    scheduledTime.setHours(hour, minute, 0, 0)
    
    // If time has passed today, schedule for tomorrow
    if (scheduledTime <= egyptTime) {
      scheduledTime.setDate(scheduledTime.getDate() + 1)
    }
    
    return scheduledTime
  }
  
  return null
}

export async function GET(request: NextRequest) {
  // WhatsApp webhook verification
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('WhatsApp webhook verified successfully')
    return new NextResponse(challenge)
  } else {
    console.error('WhatsApp webhook verification failed')
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // Log incoming webhook for debugging
    console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2))

    // Check if this is a message webhook
    if (!body.entry || !body.entry[0] || !body.entry[0].changes || !body.entry[0].changes[0]) {
      return NextResponse.json({ message: 'No message data' })
    }

    const change = body.entry[0].changes[0]
    
    if (change.field !== 'messages') {
      return NextResponse.json({ message: 'Not a message webhook' })
    }

    const messages = change.value.messages
    if (!messages || messages.length === 0) {
      return NextResponse.json({ message: 'No messages in webhook' })
    }

    const supabase = await createServerSupabaseClient()

    for (const message of messages) {
      const from = message.from
      const messageText = message.text?.body?.trim()
      const timestamp = new Date(parseInt(message.timestamp) * 1000).toISOString()

      if (!messageText) continue

      // Find the lead by WhatsApp number
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('whatsapp_number', `+${from}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (leadError || !lead) {
        console.log('No lead found for WhatsApp number:', from)
        continue
      }

      // Store the incoming message
      await supabase
        .from('whatsapp_messages')
        .insert([{
          lead_id: lead.lead_id,
          phone_number: `+${from}`,
          message_text: messageText,
          direction: 'incoming',
          message_type: 'text',
          whatsapp_message_id: message.id,
          timestamp: timestamp,
          metadata: {
            webhook_data: message
          }
        }])

      // Enhanced time processing with parsing
      const { timeSlot, scheduledTime } = parseTimeFromMessage(messageText)
      const egyptTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"}))
      
      if (timeSlot && scheduledTime) {
        // Update lead status and preferred time
        await supabase
          .from('leads')
          .update({
            status: 'time_selected',
            preferred_call_time: timeSlot,
            updated_at: new Date().toISOString(),
            metadata: {
              ...lead.metadata,
              time_selection: {
                selected_option: messageText,
                selected_time_slot: timeSlot,
                parsed_scheduled_time: scheduledTime.toISOString(),
                selection_timestamp: timestamp
              }
            }
          })
          .eq('lead_id', lead.lead_id)

        // Schedule the call in call_schedules table
        const { error: scheduleError } = await supabase
          .from('call_schedules')
          .insert([{
            lead_id: lead.lead_id,
            scheduled_time: scheduledTime.toISOString(),
            preferred_time_slot: timeSlot,
            phone_number: `+${from}`,
            call_type: 'qualification',
            status: 'scheduled',
            metadata: {
              original_message: messageText,
              egypt_timezone: egyptTime.toISOString(),
              auto_scheduled: true
            }
          }])

        if (scheduleError) {
          console.error('Failed to schedule call:', scheduleError)
        }

        // Send confirmation message with specific time
        const formattedTime = scheduledTime.toLocaleString('en-US', {
          timeZone: 'Africa/Cairo',
          dateStyle: 'short',
          timeStyle: 'short'
        })

        await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: `+${from}`,
            custom_message: `Perfect ${lead.name}! ✅\n\nI've scheduled our call for ${formattedTime} (Cairo time).\n\nDuring our brief chat, I'll learn more about your ${lead.property_type} and explain how we can help you sell it quickly with our free professional photography and 3D virtual tour.\n\nTalk to you soon! 📞`
          })
        })

        console.log(`Call scheduled for ${lead.name} at ${formattedTime}`)

      } else if (messageText.toLowerCase().includes('time') || 
                 messageText.toLowerCase().includes('schedule') ||
                 messageText.toLowerCase().includes('call') ||
                 messageText.toLowerCase().includes('tomorrow') ||
                 messageText.toLowerCase().includes('later')) {
        
        // Handle unrecognized time suggestions - ask for clarification
        await supabase
          .from('leads')
          .update({
            status: 'time_clarification_needed',
            preferred_call_time: messageText,
            updated_at: new Date().toISOString(),
            metadata: {
              ...lead.metadata,
              unclear_time_suggestion: {
                suggested_time: messageText,
                suggestion_timestamp: timestamp,
                needs_clarification: true
              }
            }
          })
          .eq('lead_id', lead.lead_id)

        // Send clarification request
        await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: `+${from}`,
            custom_message: `Thanks ${lead.name}! I'd like to call you at "${messageText}" but could you be more specific?\n\nPlease reply with:\n1️⃣ Morning (9-12 PM)\n2️⃣ Afternoon (12-5 PM)\n3️⃣ Evening (5-8 PM)\n\nOr a specific time like "2pm" or "tomorrow 3pm" 🕐`
          })
        })

      } else {
        // Handle general responses
        await supabase
          .from('leads')
          .update({
            status: 'responded',
            updated_at: new Date().toISOString(),
            metadata: {
              ...lead.metadata,
              general_response: {
                message: messageText,
                response_timestamp: timestamp
              }
            }
          })
          .eq('lead_id', lead.lead_id)

        console.log(`General response from ${lead.name}: ${messageText}`)
      }
    }

    return NextResponse.json({ message: 'Webhook processed successfully' })

  } catch (error) {
    console.error('WhatsApp webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
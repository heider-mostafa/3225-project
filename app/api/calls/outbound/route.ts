import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { OpenAI } from 'openai'

// Lead qualification conversation prompts
const QUALIFICATION_INSTRUCTIONS = `You are an expert real estate AI agent calling to qualify a property seller. Your goal is to gather essential information about their property and selling timeline in a friendly, professional conversation.

CONVERSATION FLOW:
1. Greet warmly and confirm you're speaking with the right person
2. Briefly explain why you're calling (they filled out a form)
3. Ask key qualification questions naturally
4. Build rapport and show genuine interest
5. End with clear next steps

KEY INFORMATION TO GATHER:
- Property details: exact location, size, bedrooms, bathrooms
- Property condition: renovations needed, any issues
- Motivation: why selling, how urgent
- Timeline: when they want to sell
- Price expectations: what they hope to get
- Previous attempts: have they tried selling before
- Current living situation: occupied, vacant, rental

CONVERSATION STYLE:
- Be conversational and friendly, not robotic
- Ask one question at a time
- Listen actively and ask follow-up questions
- Show genuine interest in their property
- Keep the call to 5-7 minutes maximum
- Be respectful of their time

CULTURAL NOTES:
- Adapt to Egyptian culture if applicable
- Be patient with language barriers
- Respect cultural norms around business discussions

QUALIFICATION SCORING:
Rate the lead 1-10 based on:
- Property value and condition
- Selling motivation and urgency
- Realistic timeline
- Owner cooperation and interest

CALL OUTCOMES:
- "qualified" - Strong lead, schedule photographer
- "potential" - Good lead, needs follow-up
- "unqualified" - Not a good fit for our service
- "callback" - Need to call back later

Remember: You're representing VirtualEstate, offering FREE professional photography and 3D virtual tours to help them sell faster.`

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { call_schedule_id, lead_id, force_call = false } = body

    if (!call_schedule_id && !lead_id) {
      return NextResponse.json(
        { error: 'Call schedule ID or lead ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get call schedule and lead information
    let callSchedule: any, lead: any

    if (call_schedule_id) {
      const { data: schedule, error: scheduleError } = await supabase
        .from('call_schedules')
        .select(`
          *,
          leads:lead_id (*)
        `)
        .eq('id', call_schedule_id)
        .single()

      if (scheduleError || !schedule) {
        return NextResponse.json(
          { error: 'Call schedule not found' },
          { status: 404 }
        )
      }

      callSchedule = schedule
      lead = schedule.leads
    } else {
      // Direct lead call (for manual/admin initiated calls)
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('lead_id', lead_id)
        .single()

      if (leadError || !leadData) {
        return NextResponse.json(
          { error: 'Lead not found' },
          { status: 404 }
        )
      }

      lead = leadData
    }

    // Check if call is due (unless forced)
    if (callSchedule && !force_call) {
      const scheduledTime = new Date(callSchedule.scheduled_time)
      const now = new Date()
      const timeDiff = now.getTime() - scheduledTime.getTime()
      
      // Allow calls 5 minutes early, up to 30 minutes late
      if (timeDiff < -5 * 60 * 1000 || timeDiff > 30 * 60 * 1000) {
        return NextResponse.json(
          { 
            error: 'Call is not due yet or too late',
            scheduled_time: scheduledTime.toISOString(),
            current_time: now.toISOString()
          },
          { status: 400 }
        )
      }
    }

    // Initialize OpenAI client
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })

    if (!openai) {
      return NextResponse.json(
        { error: 'OpenAI not configured' },
        { status: 500 }
      )
    }

    // Create call log entry
    const { data: callLog, error: logError } = await supabase
      .from('call_logs')
      .insert([{
        lead_id: lead.lead_id,
        call_schedule_id: callSchedule?.id || null,
        phone_number: lead.whatsapp_number,
        call_status: 'initiated',
        call_started_at: new Date().toISOString(),
        metadata: {
          lead_name: lead.name,
          property_type: lead.property_type,
          location: lead.location,
          auto_initiated: !force_call,
          call_type: 'qualification'
        }
      }])
      .select()
      .single()

    if (logError) {
      console.error('Failed to create call log:', logError)
      return NextResponse.json(
        { error: 'Failed to initialize call logging' },
        { status: 500 }
      )
    }

    // Update call schedule status if applicable
    if (callSchedule) {
      await supabase
        .from('call_schedules')
        .update({ 
          status: 'in_progress',
          updated_at: new Date().toISOString()
        })
        .eq('id', callSchedule.id)
    }

    // Update lead status
    await supabase
      .from('leads')
      .update({
        status: 'called',
        updated_at: new Date().toISOString(),
        metadata: {
          ...lead.metadata,
          latest_call: {
            call_log_id: callLog.id,
            initiated_at: new Date().toISOString(),
            call_type: 'qualification'
          }
        }
      })
      .eq('lead_id', lead.lead_id)

    // Create OpenAI Realtime session for the call
    try {
      const session = await openai.beta.realtime.sessions.create({
        model: 'gpt-4o-realtime-preview-2024-12-17',
        modalities: ['text', 'audio'],
        instructions: QUALIFICATION_INSTRUCTIONS,
        voice: 'alloy', // Professional, clear voice
        input_audio_format: 'pcm16',
        output_audio_format: 'pcm16',
        input_audio_transcription: { 
          model: 'whisper-1' 
        },
        turn_detection: {
          type: 'server_vad',
          threshold: 0.5, // Slightly higher for phone calls
          prefix_padding_ms: 500,
          silence_duration_ms: 1500 // Longer silence for phone calls
        },
        temperature: 0.6, // More controlled for professional calls
        max_response_output_tokens: 1024, // Shorter responses for phone calls
        tools: [
          {
            type: 'function',
            name: 'qualify_lead',
            description: 'Record lead qualification information gathered during the call',
            parameters: {
              type: 'object',
              properties: {
                property_details: {
                  type: 'object',
                  properties: {
                    exact_location: { type: 'string' },
                    bedrooms: { type: 'number' },
                    bathrooms: { type: 'number' },
                    size_sqm: { type: 'number' },
                    property_condition: { type: 'string' },
                    renovations_needed: { type: 'string' }
                  }
                },
                selling_motivation: {
                  type: 'object',
                  properties: {
                    reason_for_selling: { type: 'string' },
                    urgency_level: { type: 'string', enum: ['low', 'medium', 'high', 'urgent'] },
                    timeline_weeks: { type: 'number' },
                    price_expectation: { type: 'number' }
                  }
                },
                qualification_score: {
                  type: 'number',
                  description: 'Score from 1-10 based on lead quality',
                  minimum: 1,
                  maximum: 10
                },
                next_action: {
                  type: 'string',
                  enum: ['qualified', 'potential', 'unqualified', 'callback'],
                  description: 'Recommended next action'
                },
                notes: {
                  type: 'string',
                  description: 'Additional notes about the conversation'
                }
              },
              required: ['qualification_score', 'next_action']
            }
          },
          {
            type: 'function',
            name: 'end_call',
            description: 'End the call with a summary and next steps',
            parameters: {
              type: 'object',
              properties: {
                call_summary: { type: 'string' },
                promised_action: { type: 'string' },
                callback_needed: { type: 'boolean' }
              },
              required: ['call_summary']
            }
          }
        ]
      })

      // Store OpenAI session ID in call log
      await supabase
        .from('call_logs')
        .update({
          openai_session_id: session.id,
          call_status: 'connected',
          metadata: {
            ...callLog.metadata,
            openai_session_id: session.id,
            session_expires_at: session.expires_at
          }
        })
        .eq('id', callLog.id)

      console.log(`📞 Call initiated for ${lead.name} - Session: ${session.id}`)

      return NextResponse.json({
        success: true,
        call_log_id: callLog.id,
        openai_session: {
          id: session.id,
          client_secret: session.client_secret.value,
          expires_at: session.client_secret.expires_at
        },
        lead_info: {
          name: lead.name,
          phone: lead.whatsapp_number,
          property_type: lead.property_type,
          location: lead.location
        },
        message: `Call initiated for ${lead.name}`
      })

    } catch (openaiError: any) {
      console.error('OpenAI session creation failed:', openaiError)
      
      // Update call log with failure
      await supabase
        .from('call_logs')
        .update({
          call_status: 'failed',
          call_ended_at: new Date().toISOString(),
          agent_notes: `Failed to create OpenAI session: ${openaiError.message}`
        })
        .eq('id', callLog.id)

      return NextResponse.json(
        { error: 'Failed to create AI calling session', details: openaiError.message },
        { status: 500 }
      )
    }

  } catch (error) {
    console.error('Outbound calling error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check pending calls
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'due'

    const supabase = await createServerSupabaseClient()

    if (status === 'due') {
      // Get calls that are due now
      const { data: dueCalls } = await supabase
        .from('call_schedules')
        .select(`
          *,
          leads:lead_id (name, whatsapp_number, property_type, location)
        `)
        .eq('status', 'scheduled')
        .lte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })

      return NextResponse.json({
        due_calls: dueCalls || [],
        count: dueCalls?.length || 0
      })
    } else {
      // Get calls by status
      const { data: calls } = await supabase
        .from('call_logs')
        .select(`
          *,
          leads:lead_id (name, property_type, location),
          call_schedules:call_schedule_id (scheduled_time)
        `)
        .eq('call_status', status)
        .order('call_started_at', { ascending: false })
        .limit(20)

      return NextResponse.json({
        calls: calls || [],
        count: calls?.length || 0
      })
    }

  } catch (error) {
    console.error('Get calls error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
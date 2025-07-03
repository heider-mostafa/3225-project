import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { conversationAnalyzer } from '@/lib/calls/conversation-analyzer'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      session_id,
      call_log_id,
      event_type,
      transcript,
      conversation_ended,
      function_calls,
      call_duration,
      audio_data
    } = body

    if (!session_id && !call_log_id) {
      return NextResponse.json(
        { error: 'Session ID or Call Log ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Find the call log
    let callLog: any
    if (call_log_id) {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*, leads:lead_id (*)')
        .eq('id', call_log_id)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Call log not found' },
          { status: 404 }
        )
      }
      callLog = data
    } else {
      const { data, error } = await supabase
        .from('call_logs')
        .select('*, leads:lead_id (*)')
        .eq('openai_session_id', session_id)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Call log not found for session' },
          { status: 404 }
        )
      }
      callLog = data
    }

    // Handle different event types
    switch (event_type) {
      case 'conversation_started':
        await handleConversationStarted(supabase, callLog)
        break

      case 'transcript_update':
        await handleTranscriptUpdate(supabase, callLog, transcript)
        break

      case 'function_called':
        await handleFunctionCall(supabase, callLog, function_calls)
        break

      case 'conversation_ended':
        await handleConversationEnded(supabase, callLog, transcript, call_duration, request)
        break

      default:
        console.log(`Unknown event type: ${event_type}`)
    }

    return NextResponse.json({
      success: true,
      message: `Event ${event_type} processed successfully`
    })

  } catch (error) {
    console.error('Call webhook error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handleConversationStarted(supabase: any, callLog: any) {
  console.log(`📞 Conversation started for ${callLog.leads.name}`)
  
  await supabase
    .from('call_logs')
    .update({
      call_status: 'connected',
      call_started_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('id', callLog.id)
}

async function handleTranscriptUpdate(supabase: any, callLog: any, transcript: string) {
  if (!transcript) return

  // Update the transcript in real-time
  await supabase
    .from('call_logs')
    .update({
      transcript: transcript,
      updated_at: new Date().toISOString()
    })
    .eq('id', callLog.id)

  // Get quick insights for real-time monitoring
  try {
    const insights = await conversationAnalyzer.extractQuickInsights(transcript)
    
    await supabase
      .from('call_logs')
      .update({
        metadata: {
          ...callLog.metadata,
          live_insights: {
            ...insights,
            last_updated: new Date().toISOString()
          }
        }
      })
      .eq('id', callLog.id)
  } catch (error) {
    console.error('Failed to generate quick insights:', error)
  }
}

async function handleFunctionCall(supabase: any, callLog: any, functionCalls: any) {
  if (!functionCalls || functionCalls.length === 0) return

  console.log(`🔧 Function calls received for ${callLog.leads.name}:`, functionCalls)

  for (const funcCall of functionCalls) {
    if (funcCall.name === 'qualify_lead') {
      const args = funcCall.arguments

      // Update call log with qualification data
      await supabase
        .from('call_logs')
        .update({
          key_information: args,
          lead_qualification_score: args.qualification_score,
          next_action: args.next_action,
          agent_notes: args.notes,
          updated_at: new Date().toISOString()
        })
        .eq('id', callLog.id)

      // Update lead status based on qualification
      let newStatus = 'called'
      switch (args.next_action) {
        case 'qualified':
          newStatus = 'qualified'
          break
        case 'potential':
          newStatus = 'follow_up_needed'
          break
        case 'unqualified':
          newStatus = 'rejected'
          break
        case 'callback':
          newStatus = 'callback_requested'
          break
      }

      await supabase
        .from('leads')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
          metadata: {
            ...callLog.leads.metadata,
            qualification_result: {
              score: args.qualification_score,
              next_action: args.next_action,
              qualified_at: new Date().toISOString(),
              key_information: args
            }
          }
        })
        .eq('lead_id', callLog.lead_id)

    } else if (funcCall.name === 'end_call') {
      const args = funcCall.arguments

      await supabase
        .from('call_logs')
        .update({
          conversation_summary: args.call_summary,
          call_status: 'completed',
          call_ended_at: new Date().toISOString(),
          metadata: {
            ...callLog.metadata,
            end_call_data: args
          }
        })
        .eq('id', callLog.id)
    }
  }
}

async function handleConversationEnded(
  supabase: any, 
  callLog: any, 
  finalTranscript: string, 
  duration: number,
  request: NextRequest
) {
  console.log(`📞 Conversation ended for ${callLog.leads.name}`)

  try {
    // Run comprehensive conversation analysis
    const analysis = await conversationAnalyzer.analyzeConversation(
      finalTranscript, 
      callLog.leads
    )

    // Update call log with final analysis
    await supabase
      .from('call_logs')
      .update({
        call_status: 'completed',
        call_ended_at: new Date().toISOString(),
        call_duration: duration,
        transcript: finalTranscript,
        conversation_summary: analysis.summary,
        key_information: analysis.keyInformation,
        lead_qualification_score: analysis.qualificationScore,
        next_action: analysis.nextAction,
        agent_notes: `Qualification Score: ${analysis.qualificationScore}/10\n\nRed Flags: ${analysis.redFlags.join(', ') || 'None'}\n\nPositive Signals: ${analysis.positiveSignals.join(', ') || 'None'}\n\nRecommended Follow-up: ${analysis.recommendedFollowUp}`,
        updated_at: new Date().toISOString()
      })
      .eq('id', callLog.id)

    // Update lead status based on analysis
    let newStatus = 'called'
    switch (analysis.nextAction) {
      case 'qualified':
        newStatus = 'qualified'
        break
      case 'potential':
        newStatus = 'follow_up_needed'
        break
      case 'unqualified':
        newStatus = 'rejected'
        break
      case 'callback':
        newStatus = 'callback_requested'
        break
    }

    await supabase
      .from('leads')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
        metadata: {
          ...callLog.leads.metadata,
          call_analysis: {
            ...analysis,
            analyzed_at: new Date().toISOString()
          }
        }
      })
      .eq('lead_id', callLog.lead_id)

    // Update call schedule status
    if (callLog.call_schedule_id) {
      await supabase
        .from('call_schedules')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', callLog.call_schedule_id)
    }

    // Send appropriate follow-up WhatsApp message
    await sendFollowUpMessage(callLog.leads, analysis, request)

    console.log(`✅ Call analysis complete - ${callLog.leads.name} scored ${analysis.qualificationScore}/10`)

  } catch (error) {
    console.error('Conversation analysis failed:', error)
    
    // Fallback: just mark as completed
    await supabase
      .from('call_logs')
      .update({
        call_status: 'completed',
        call_ended_at: new Date().toISOString(),
        call_duration: duration,
        transcript: finalTranscript,
        agent_notes: 'Analysis failed - manual review required',
        updated_at: new Date().toISOString()
      })
      .eq('id', callLog.id)
  }
}

async function sendFollowUpMessage(lead: any, analysis: any, request: NextRequest) {
  try {
    let messageType = 'follow_up'
    let customMessage = ''

    switch (analysis.nextAction) {
      case 'qualified':
        customMessage = `Hi ${lead.name}! 😊\n\nThank you for the great conversation! I'm excited to help you sell your ${lead.property_type}.\n\nAs discussed, I'll now arrange for our professional photographer to visit your property. You'll receive another message shortly with available time slots.\n\nLooking forward to showcasing your beautiful property! 📸`
        break

      case 'potential':
        customMessage = `Hi ${lead.name}!\n\nThank you for taking the time to speak with me about your ${lead.property_type}. \n\n${analysis.recommendedFollowUp}\n\nI'll be in touch soon with next steps. Have a great day! 😊`
        break

      case 'callback':
        customMessage = `Hi ${lead.name}!\n\nThank you for speaking with me today. As discussed, I'll call you back at a better time.\n\nIn the meantime, feel free to WhatsApp me if you have any questions about our FREE professional photography and 3D virtual tour service.\n\nTalk to you soon! 📱`
        break

      case 'unqualified':
        customMessage = `Hi ${lead.name},\n\nThank you for your time today. While your ${lead.property_type} doesn't match our current program requirements, we appreciate you considering VirtualEstate.\n\nFeel free to reach out again in the future if your situation changes.\n\nBest regards! 😊`
        break
    }

    if (customMessage) {
      await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: lead.whatsapp_number,
          custom_message: customMessage
        })
      })
    }

  } catch (error) {
    console.error('Follow-up message failed:', error)
  }
}
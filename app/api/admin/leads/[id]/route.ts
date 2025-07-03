import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const leadId = params.id

    // Get lead details
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_id', leadId)
      .single()

    if (leadError) {
      console.error('Error fetching lead:', leadError)
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // Get WhatsApp messages
    const { data: whatsappMessages, error: messagesError } = await supabase
      .from('whatsapp_messages')
      .select('*')
      .eq('lead_id', leadId)
      .order('timestamp', { ascending: true })

    // Get call schedules
    const { data: callSchedules, error: schedulesError } = await supabase
      .from('call_schedules')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    // Get call logs
    const { data: callLogs, error: logsError } = await supabase
      .from('call_logs')
      .select('*')
      .eq('lead_id', leadId)
      .order('created_at', { ascending: false })

    // Get photographer assignments
    const { data: photographerAssignments, error: assignmentsError } = await supabase
      .from('photographer_assignments')
      .select(`
        *,
        photographers (
          name,
          email,
          phone,
          rating
        )
      `)
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })

    // Get AI call logs (legacy table)
    const { data: aiCallLogs, error: aiLogsError } = await supabase
      .from('ai_call_logs')
      .select('*')
      .eq('lead_id', lead.id)
      .order('start_time', { ascending: false })

    // Get followup activities
    const { data: followupActivities, error: followupError } = await supabase
      .from('followup_activities')
      .select('*')
      .eq('lead_id', lead.id)
      .order('created_at', { ascending: false })

    // Calculate automation phase completion
    const automationPhases = {
      phase1_capture: {
        completed: true,
        timestamp: lead.created_at,
        description: 'Lead captured through form submission'
      },
      phase1_whatsapp: {
        completed: whatsappMessages && whatsappMessages.some(m => m.direction === 'outgoing'),
        timestamp: whatsappMessages?.find(m => m.direction === 'outgoing')?.timestamp,
        description: 'Welcome WhatsApp message sent'
      },
      phase2_time_selection: {
        completed: whatsappMessages && whatsappMessages.some(m => m.direction === 'incoming'),
        timestamp: whatsappMessages?.find(m => m.direction === 'incoming')?.timestamp,
        description: 'User responded with time preference'
      },
      phase2_call_scheduled: {
        completed: callSchedules && callSchedules.length > 0,
        timestamp: callSchedules?.[0]?.created_at,
        description: 'AI voice call scheduled'
      },
      phase3_call_executed: {
        completed: callLogs && callLogs.length > 0,
        timestamp: callLogs?.[0]?.call_started_at,
        description: 'OpenAI voice agent called lead'
      },
      phase3_qualified: {
        completed: callLogs && callLogs.some(log => log.next_action === 'qualified'),
        timestamp: callLogs?.find(log => log.next_action === 'qualified')?.call_ended_at,
        description: 'Lead qualified through AI conversation'
      },
      phase4_property_approved: {
        completed: ['property_approved', 'photographer_assigned', 'photos_completed', 'completed'].includes(lead.status),
        timestamp: ['property_approved', 'photographer_assigned', 'photos_completed', 'completed'].includes(lead.status) ? lead.updated_at : null,
        description: 'Admin approved property for listing'
      },
      phase4_photographer_assigned: {
        completed: photographerAssignments && photographerAssignments.length > 0,
        timestamp: photographerAssignments?.[0]?.created_at,
        description: 'Photographer assigned for property shoot'
      },
      phase4_photos_completed: {
        completed: photographerAssignments && photographerAssignments.some(a => a.status === 'completed'),
        timestamp: photographerAssignments?.find(a => a.status === 'completed')?.scheduled_time,
        description: 'Property photos completed'
      }
    }

    // Calculate overall completion percentage
    const completedPhases = Object.values(automationPhases).filter(phase => phase.completed).length
    const totalPhases = Object.keys(automationPhases).length
    const completionPercentage = Math.round((completedPhases / totalPhases) * 100)

    return NextResponse.json({
      success: true,
      data: {
        lead,
        whatsappMessages: whatsappMessages || [],
        callSchedules: callSchedules || [],
        callLogs: callLogs || [],
        aiCallLogs: aiCallLogs || [],
        photographerAssignments: photographerAssignments || [],
        followupActivities: followupActivities || [],
        automationPhases,
        completion: {
          percentage: completionPercentage,
          completedPhases,
          totalPhases
        }
      }
    })

  } catch (error) {
    console.error('Error in lead details API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    const leadId = params.id
    const body = await request.json()
    const { status, notes } = body

    // Update lead status
    const { data, error } = await supabase
      .from('leads')
      .update({
        status,
        updated_at: new Date().toISOString(),
        metadata: {
          admin_status_change: {
            new_status: status,
            notes,
            changed_at: new Date().toISOString()
          }
        }
      })
      .eq('lead_id', leadId)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead status:', error)
      return NextResponse.json({ error: 'Failed to update lead status' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data: data
    })

  } catch (error) {
    console.error('Error in lead status update API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isServerUserAdmin } from '@/lib/auth/admin'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('call_logs')
      .select(`
        *,
        leads:lead_id (name, whatsapp_number, property_type, location, status),
        call_schedules:call_schedule_id (scheduled_time, preferred_time_slot)
      `)
      .order('call_started_at', { ascending: false })
      .limit(limit)

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    if (status) {
      query = query.eq('call_status', status)
    }

    const { data: callLogs, error } = await query

    if (error) {
      console.error('Failed to fetch call logs:', error)
      return NextResponse.json(
        { error: 'Failed to fetch call logs' },
        { status: 500 }
      )
    }

    // Format the logs with additional computed fields
    const formattedLogs = callLogs?.map(log => ({
      ...log,
      call_duration_seconds: log.call_duration,
      call_duration_formatted: log.call_duration ? formatDuration(log.call_duration) : null,
      started_at_formatted: log.call_started_at ? 
        new Date(log.call_started_at).toLocaleString('en-US', {
          timeZone: 'Africa/Cairo',
          dateStyle: 'short',
          timeStyle: 'medium'
        }) : null,
      ended_at_formatted: log.call_ended_at ? 
        new Date(log.call_ended_at).toLocaleString('en-US', {
          timeZone: 'Africa/Cairo',
          dateStyle: 'short',
          timeStyle: 'medium'
        }) : null
    }))

    return NextResponse.json({
      call_logs: formattedLogs,
      total_count: formattedLogs?.length || 0
    })

  } catch (error) {
    console.error('Call logs fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      call_log_id, 
      transcript, 
      conversation_summary, 
      key_information,
      qualification_score,
      next_action,
      agent_notes,
      call_duration,
      call_status = 'completed'
    } = body

    if (!call_log_id) {
      return NextResponse.json(
        { error: 'Call log ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // Get existing call log
    const { data: existingLog, error: fetchError } = await supabase
      .from('call_logs')
      .select('*, leads:lead_id (*)')
      .eq('id', call_log_id)
      .single()

    if (fetchError || !existingLog) {
      return NextResponse.json(
        { error: 'Call log not found' },
        { status: 404 }
      )
    }

    // Update call log with conversation data
    const updateData: any = {
      call_ended_at: new Date().toISOString(),
      call_status: call_status,
      updated_at: new Date().toISOString()
    }

    if (transcript) updateData.transcript = transcript
    if (conversation_summary) updateData.conversation_summary = conversation_summary
    if (key_information) updateData.key_information = key_information
    if (qualification_score) updateData.lead_qualification_score = qualification_score
    if (next_action) updateData.next_action = next_action
    if (agent_notes) updateData.agent_notes = agent_notes
    if (call_duration) updateData.call_duration = call_duration

    const { data: updatedLog, error: updateError } = await supabase
      .from('call_logs')
      .update(updateData)
      .eq('id', call_log_id)
      .select()
      .single()

    if (updateError) {
      console.error('Failed to update call log:', updateError)
      return NextResponse.json(
        { error: 'Failed to update call log' },
        { status: 500 }
      )
    }

    // Update lead status based on call outcome
    if (next_action) {
      let newLeadStatus = 'called'
      
      switch (next_action) {
        case 'qualified':
          newLeadStatus = 'qualified'
          break
        case 'potential':
          newLeadStatus = 'follow_up_needed'
          break
        case 'unqualified':
          newLeadStatus = 'rejected'
          break
        case 'callback':
          newLeadStatus = 'callback_requested'
          break
      }

      await supabase
        .from('leads')
        .update({
          status: newLeadStatus,
          updated_at: new Date().toISOString(),
          metadata: {
            ...existingLog.leads.metadata,
            latest_call_outcome: {
              call_log_id: call_log_id,
              qualification_score: qualification_score,
              next_action: next_action,
              call_completed_at: new Date().toISOString()
            }
          }
        })
        .eq('lead_id', existingLog.lead_id)

      // Send appropriate WhatsApp follow-up message
      if (next_action === 'qualified') {
        try {
          await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: existingLog.leads.whatsapp_number,
              custom_message: `Hi ${existingLog.leads.name}! 😊\n\nThank you for the great conversation! I'm excited to help you sell your ${existingLog.leads.property_type}.\n\nAs discussed, I'll now arrange for our professional photographer to visit your property. You'll receive another message shortly with available time slots.\n\nLooking forward to showcasing your beautiful property! 📸`
            })
          })
        } catch (whatsappError) {
          console.error('WhatsApp follow-up failed:', whatsappError)
        }
      }
    }

    // Update call schedule status if applicable
    if (existingLog.call_schedule_id) {
      const scheduleStatus = call_status === 'completed' ? 'completed' : 
                           call_status === 'failed' ? 'failed' : 'completed'
      
      await supabase
        .from('call_schedules')
        .update({ 
          status: scheduleStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingLog.call_schedule_id)
    }

    console.log(`Call completed for ${existingLog.leads.name} - Outcome: ${next_action}`)

    return NextResponse.json({
      success: true,
      call_log: updatedLog,
      lead_status_updated: !!next_action,
      message: 'Call log updated successfully'
    })

  } catch (error) {
    console.error('Call log update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { call_log_id, admin_notes, manual_qualification_score, override_next_action } = body

    // Validate admin access
    const supabase = await createServerSupabaseClient()
    const isAdmin = await isServerUserAdmin()
    
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Unauthorized: Admin access required' },
        { status: 403 }
      )
    }

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (admin_notes) {
      updateData.agent_notes = updateData.agent_notes ? 
        `${updateData.agent_notes}\n\n[ADMIN UPDATE]: ${admin_notes}` : 
        `[ADMIN UPDATE]: ${admin_notes}`
    }

    if (manual_qualification_score) {
      updateData.lead_qualification_score = manual_qualification_score
    }

    if (override_next_action) {
      updateData.next_action = override_next_action
    }

    const { data: updatedLog, error } = await supabase
      .from('call_logs')
      .update(updateData)
      .eq('id', call_log_id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update call log:', error)
      return NextResponse.json(
        { error: 'Failed to update call log' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      call_log: updatedLog,
      message: 'Call log updated by admin'
    })

  } catch (error) {
    console.error('Admin call log update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  
  if (minutes === 0) {
    return `${remainingSeconds}s`
  } else if (minutes < 60) {
    return `${minutes}m ${remainingSeconds}s`
  } else {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return `${hours}h ${remainingMinutes}m`
  }
}
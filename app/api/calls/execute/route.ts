import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// This endpoint will be called by a scheduler (cron job, admin trigger, or automation)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      schedule_id, 
      batch_execute = false, 
      max_calls = 5,
      force_execute = false 
    } = body

    const supabase = await createServerSupabaseClient()

    if (schedule_id) {
      // Execute a specific scheduled call
      return await executeSingleCall(supabase, schedule_id, force_execute, request)
    } else if (batch_execute) {
      // Execute multiple due calls
      return await executeBatchCalls(supabase, max_calls, request)
    } else {
      return NextResponse.json(
        { error: 'Either schedule_id or batch_execute must be specified' },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Call execution error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check what calls are ready to execute
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const preview = searchParams.get('preview') === 'true'

    const supabase = await createServerSupabaseClient()

    // Get calls that are due for execution
    const { data: dueCalls, error } = await supabase
      .from('call_schedules')
      .select(`
        *,
        leads:lead_id (name, whatsapp_number, property_type, location, status)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true })

    if (error) {
      console.error('Failed to fetch due calls:', error)
      return NextResponse.json(
        { error: 'Failed to fetch due calls' },
        { status: 500 }
      )
    }

    // Format the response
    const formattedCalls = dueCalls?.map(call => ({
      ...call,
      scheduled_time_formatted: new Date(call.scheduled_time).toLocaleString('en-US', {
        timeZone: 'Africa/Cairo',
        dateStyle: 'short',
        timeStyle: 'medium'
      }),
      minutes_overdue: Math.max(0, Math.floor(
        (new Date().getTime() - new Date(call.scheduled_time).getTime()) / (1000 * 60)
      )),
      can_execute: true
    }))

    if (preview) {
      return NextResponse.json({
        due_calls: formattedCalls || [],
        total_due: formattedCalls?.length || 0,
        ready_to_execute: formattedCalls?.length || 0,
        preview_mode: true
      })
    }

    return NextResponse.json({
      due_calls: formattedCalls || [],
      total_due: formattedCalls?.length || 0,
      execution_summary: {
        immediate: formattedCalls?.filter(c => c.minutes_overdue <= 5).length || 0,
        overdue: formattedCalls?.filter(c => c.minutes_overdue > 5).length || 0,
        total: formattedCalls?.length || 0
      }
    })

  } catch (error) {
    console.error('Due calls fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function executeSingleCall(
  supabase: any, 
  scheduleId: string, 
  forceExecute: boolean, 
  request: NextRequest
) {
  try {
    // Get the call schedule
    const { data: callSchedule, error: scheduleError } = await supabase
      .from('call_schedules')
      .select(`
        *,
        leads:lead_id (*)
      `)
      .eq('id', scheduleId)
      .single()

    if (scheduleError || !callSchedule) {
      return NextResponse.json(
        { error: 'Call schedule not found' },
        { status: 404 }
      )
    }

    // Check if call is due
    const scheduledTime = new Date(callSchedule.scheduled_time)
    const now = new Date()
    const timeDiff = now.getTime() - scheduledTime.getTime()
    
    if (!forceExecute && (timeDiff < -5 * 60 * 1000 || timeDiff > 30 * 60 * 1000)) {
      return NextResponse.json(
        { 
          error: 'Call is not due',
          scheduled_time: scheduledTime.toISOString(),
          current_time: now.toISOString(),
          minutes_difference: Math.floor(timeDiff / (1000 * 60))
        },
        { status: 400 }
      )
    }

    // Initiate the outbound call
    const callResponse = await fetch(`${request.nextUrl.origin}/api/calls/outbound`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        call_schedule_id: scheduleId,
        force_call: forceExecute
      })
    })

    const callResult = await callResponse.json()

    if (!callResponse.ok) {
      return NextResponse.json(
        { 
          error: 'Failed to initiate call',
          details: callResult
        },
        { status: callResponse.status }
      )
    }

    // Send reminder WhatsApp message before the call
    try {
      await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: callSchedule.leads.whatsapp_number,
          message_type: 'call_reminder',
          variables: {
            name: callSchedule.leads.name,
            call_time: 'now',
            phone_number: callSchedule.leads.whatsapp_number,
            property_type: callSchedule.leads.property_type,
            location: callSchedule.leads.location
          }
        })
      })
    } catch (whatsappError) {
      console.error('WhatsApp reminder failed:', whatsappError)
    }

    return NextResponse.json({
      success: true,
      call_initiated: true,
      call_log_id: callResult.call_log_id,
      lead_name: callSchedule.leads.name,
      phone_number: callSchedule.leads.whatsapp_number,
      message: `Call initiated for ${callSchedule.leads.name}`
    })

  } catch (error) {
    console.error('Single call execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute call' },
      { status: 500 }
    )
  }
}

async function executeBatchCalls(
  supabase: any, 
  maxCalls: number, 
  request: NextRequest
) {
  try {
    // Get due calls
    const { data: dueCalls, error } = await supabase
      .from('call_schedules')
      .select(`
        *,
        leads:lead_id (*)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_time', new Date().toISOString())
      .order('scheduled_time', { ascending: true })
      .limit(maxCalls)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch due calls' },
        { status: 500 }
      )
    }

    if (!dueCalls || dueCalls.length === 0) {
      return NextResponse.json({
        success: true,
        calls_executed: 0,
        message: 'No calls due for execution'
      })
    }

    // Execute calls with delay between them
    const results = []
    for (let i = 0; i < dueCalls.length; i++) {
      const call = dueCalls[i]
      
      try {
        const result = await executeSingleCall(supabase, call.id, false, request)
        results.push({
          schedule_id: call.id,
          lead_name: call.leads.name,
          success: result.status === 200,
          result: await result.json()
        })

        // Wait 10 seconds between calls to avoid overwhelming the system
        if (i < dueCalls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 10000))
        }

      } catch (error) {
        results.push({
          schedule_id: call.id,
          lead_name: call.leads.name,
          success: false,
          error: error.message
        })
      }
    }

    const successCount = results.filter(r => r.success).length
    const failureCount = results.length - successCount

    return NextResponse.json({
      success: true,
      calls_executed: results.length,
      successful_calls: successCount,
      failed_calls: failureCount,
      results: results,
      message: `Executed ${results.length} calls: ${successCount} successful, ${failureCount} failed`
    })

  } catch (error) {
    console.error('Batch call execution error:', error)
    return NextResponse.json(
      { error: 'Failed to execute batch calls' },
      { status: 500 }
    )
  }
}
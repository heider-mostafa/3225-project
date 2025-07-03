import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { isServerUserAdmin } from '@/lib/auth/admin'

// Egypt timezone utilities
function getEgyptTime(): Date {
  return new Date(new Date().toLocaleString("en-US", {timeZone: "Africa/Cairo"}))
}

function parseTimeSlotToDateTime(timeSlot: string, preferredDate?: Date): Date {
  const baseDate = preferredDate || getEgyptTime()
  const targetDate = new Date(baseDate)
  
  let targetHour: number
  
  if (timeSlot.toLowerCase().includes('morning')) {
    targetHour = 10 // 10 AM
  } else if (timeSlot.toLowerCase().includes('afternoon')) {
    targetHour = 14 // 2 PM  
  } else if (timeSlot.toLowerCase().includes('evening')) {
    targetHour = 18 // 6 PM
  } else {
    // Try to parse specific time from timeSlot
    const timeMatch = timeSlot.match(/(\d{1,2}):?(\d{2})?\s*(am|pm)/i)
    if (timeMatch) {
      let hour = parseInt(timeMatch[1])
      const minute = parseInt(timeMatch[2] || '0')
      const period = timeMatch[3]?.toLowerCase()
      
      if (period === 'pm' && hour !== 12) hour += 12
      if (period === 'am' && hour === 12) hour = 0
      
      targetDate.setHours(hour, minute, 0, 0)
      return targetDate
    } else {
      targetHour = 14 // Default to 2 PM
    }
  }
  
  targetDate.setHours(targetHour, 0, 0, 0)
  
  // If the time has passed today, schedule for tomorrow
  if (targetDate <= getEgyptTime()) {
    targetDate.setDate(targetDate.getDate() + 1)
  }
  
  return targetDate
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { 
      lead_id, 
      preferred_time_slot, 
      specific_time, 
      call_type = 'qualification',
      admin_scheduled = false 
    } = body

    // Validate required fields
    if (!lead_id || (!preferred_time_slot && !specific_time)) {
      return NextResponse.json(
        { error: 'Lead ID and time information are required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabaseClient()

    // If admin scheduled, verify admin access
    if (admin_scheduled) {
      const isAdmin = await isServerUserAdmin()
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'Unauthorized: Admin access required for manual scheduling' },
          { status: 403 }
        )
      }
    }

    // Get lead information
    const { data: lead, error: leadError } = await supabase
      .from('leads')
      .select('*')
      .eq('lead_id', lead_id)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead not found' },
        { status: 404 }
      )
    }

    // Calculate scheduled time
    let scheduledTime: Date
    let timeSlotUsed: string

    if (specific_time) {
      scheduledTime = new Date(specific_time)
      timeSlotUsed = specific_time
    } else {
      scheduledTime = parseTimeSlotToDateTime(preferred_time_slot)
      timeSlotUsed = preferred_time_slot
    }

    // Check for existing scheduled calls for this lead
    const { data: existingCalls } = await supabase
      .from('call_schedules')
      .select('*')
      .eq('lead_id', lead_id)
      .in('status', ['scheduled', 'in_progress'])

    // Cancel existing calls if any
    if (existingCalls && existingCalls.length > 0) {
      await supabase
        .from('call_schedules')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('lead_id', lead_id)
        .in('status', ['scheduled', 'in_progress'])
    }

    // Create new call schedule
    const { data: callSchedule, error: scheduleError } = await supabase
      .from('call_schedules')
      .insert([{
        lead_id: lead_id,
        scheduled_time: scheduledTime.toISOString(),
        preferred_time_slot: timeSlotUsed,
        phone_number: lead.whatsapp_number,
        call_type: call_type,
        status: 'scheduled',
        metadata: {
          admin_scheduled: admin_scheduled,
          scheduled_by: admin_scheduled ? 'admin' : 'auto',
          lead_name: lead.name,
          property_type: lead.property_type,
          location: lead.location,
          egypt_timezone: getEgyptTime().toISOString()
        }
      }])
      .select()
      .single()

    if (scheduleError) {
      console.error('Failed to create call schedule:', scheduleError)
      return NextResponse.json(
        { error: 'Failed to schedule call' },
        { status: 500 }
      )
    }

    // Update lead status
    const newStatus = admin_scheduled ? 'call_scheduled_admin' : 'call_scheduled'
    await supabase
      .from('leads')
      .update({
        status: newStatus,
        preferred_call_time: timeSlotUsed,
        updated_at: new Date().toISOString(),
        metadata: {
          ...lead.metadata,
          latest_call_schedule: {
            schedule_id: callSchedule.id,
            scheduled_time: scheduledTime.toISOString(),
            call_type: call_type,
            scheduled_by: admin_scheduled ? 'admin' : 'auto'
          }
        }
      })
      .eq('lead_id', lead_id)

    // Format time for response
    const formattedTime = scheduledTime.toLocaleString('en-US', {
      timeZone: 'Africa/Cairo',
      dateStyle: 'full',
      timeStyle: 'short'
    })

    // Send WhatsApp confirmation if not admin scheduled
    if (!admin_scheduled) {
      try {
        await fetch(`${request.nextUrl.origin}/api/whatsapp/send`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: lead.whatsapp_number,
            custom_message: `Great ${lead.name}! ✅\n\nYour call has been confirmed for ${formattedTime}.\n\nI'll call you at ${lead.whatsapp_number} to discuss your ${lead.property_type} in ${lead.location}.\n\nLooking forward to speaking with you! 📞`
          })
        })
      } catch (whatsappError) {
        console.error('WhatsApp confirmation failed:', whatsappError)
      }
    }

    return NextResponse.json({
      success: true,
      call_schedule: callSchedule,
      scheduled_time: scheduledTime.toISOString(),
      formatted_time: formattedTime,
      message: `Call scheduled successfully for ${formattedTime}`
    })

  } catch (error) {
    console.error('Call scheduling error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')
    const status = searchParams.get('status') || 'scheduled'

    const supabase = await createServerSupabaseClient()

    let query = supabase
      .from('call_schedules')
      .select(`
        *,
        leads:lead_id (
          name,
          whatsapp_number,
          property_type,
          location
        )
      `)
      .eq('status', status)
      .order('scheduled_time', { ascending: true })

    if (leadId) {
      query = query.eq('lead_id', leadId)
    }

    const { data: callSchedules, error } = await query

    if (error) {
      console.error('Failed to fetch call schedules:', error)
      return NextResponse.json(
        { error: 'Failed to fetch call schedules' },
        { status: 500 }
      )
    }

    // Format times for Egypt timezone
    const formattedSchedules = callSchedules?.map(schedule => ({
      ...schedule,
      formatted_time: new Date(schedule.scheduled_time).toLocaleString('en-US', {
        timeZone: 'Africa/Cairo',
        dateStyle: 'full',
        timeStyle: 'short'
      }),
      time_until_call: Math.max(0, new Date(schedule.scheduled_time).getTime() - Date.now()),
      is_due: new Date(schedule.scheduled_time) <= new Date()
    }))

    return NextResponse.json({
      call_schedules: formattedSchedules,
      total_count: formattedSchedules?.length || 0,
      due_now: formattedSchedules?.filter(s => s.is_due).length || 0
    })

  } catch (error) {
    console.error('Call schedule fetch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { schedule_id, status, reschedule_time, notes } = body

    // Validate admin access for manual updates
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

    if (status) updateData.status = status
    if (reschedule_time) updateData.scheduled_time = new Date(reschedule_time).toISOString()
    if (notes) updateData.metadata = { notes }

    const { data: updatedSchedule, error } = await supabase
      .from('call_schedules')
      .update(updateData)
      .eq('id', schedule_id)
      .select()
      .single()

    if (error) {
      console.error('Failed to update call schedule:', error)
      return NextResponse.json(
        { error: 'Failed to update call schedule' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      call_schedule: updatedSchedule,
      message: 'Call schedule updated successfully'
    })

  } catch (error) {
    console.error('Call schedule update error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
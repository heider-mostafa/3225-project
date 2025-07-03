import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/broker/blocked-times - Get broker's blocked times
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get broker ID for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found. Please contact admin.' 
      }, { status: 404 })
    }

    // Build query based on parameters
    let query = supabase
      .from('broker_blocked_times')
      .select('*')
      .eq('broker_id', broker.id)
      .order('start_datetime', { ascending: true })

    if (startDate && endDate) {
      query = query
        .gte('start_datetime', startDate)
        .lte('end_datetime', endDate)
    } else {
      // Default to next 90 days
      const today = new Date().toISOString()
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 90)
      query = query
        .gte('start_datetime', today)
        .lte('end_datetime', futureDate.toISOString())
    }

    const { data: blockedTimes, error } = await query

    if (error) {
      console.error('Error fetching blocked times:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch blocked times' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      blockedTimes: blockedTimes || []
    })

  } catch (error) {
    console.error('Unexpected error in get blocked times:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/broker/blocked-times - Create new blocked time period
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    
    const {
      start_datetime,
      end_datetime,
      reason = '',
      block_type = 'personal',
      is_recurring = false,
      recurring_pattern = null,
      recurring_until = null
    } = body

    // Validate required fields
    if (!start_datetime || !end_datetime) {
      return NextResponse.json({
        error: 'start_datetime and end_datetime are required'
      }, { status: 400 })
    }

    // Validate datetime format (ISO 8601)
    const startDate = new Date(start_datetime)
    const endDate = new Date(end_datetime)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({
        error: 'Invalid datetime format. Use ISO 8601 format (YYYY-MM-DDTHH:MM:SSZ)'
      }, { status: 400 })
    }

    // Check that end_datetime is after start_datetime
    if (endDate <= startDate) {
      return NextResponse.json({
        error: 'End datetime must be after start datetime'
      }, { status: 400 })
    }

    // Check that start is not in the past (allow current hour)
    const now = new Date()
    now.setMinutes(0, 0, 0) // Allow blocking current hour
    
    if (startDate < now) {
      return NextResponse.json({
        error: 'Cannot create blocked time in the past'
      }, { status: 400 })
    }

    const supabase = await createServerSupabaseClient()

    // Check authentication
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    if (sessionError || !session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get broker ID for current user
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('is_active', true)
      .single()

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker profile not found' 
      }, { status: 404 })
    }

    // Check for overlapping blocked times
    const { data: conflicts, error: conflictError } = await supabase
      .from('broker_blocked_times')
      .select('id, start_datetime, end_datetime, reason')
      .eq('broker_id', broker.id)
      .or(`start_datetime.lt.${end_datetime},end_datetime.gt.${start_datetime}`)

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json({ 
        error: 'Failed to validate blocked time' 
      }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        error: 'Time period conflicts with existing blocked time',
        conflicts: conflicts
      }, { status: 409 })
    }

    // Create blocked time record
    const blockedTimeData = {
      broker_id: broker.id,
      start_datetime,
      end_datetime,
      reason,
      block_type,
      is_recurring,
      recurring_pattern,
      recurring_until,
      created_by: session.user.id
    }

    const { data: newBlockedTime, error: insertError } = await supabase
      .from('broker_blocked_times')
      .insert(blockedTimeData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating blocked time:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create blocked time: ' + insertError.message 
      }, { status: 500 })
    }

    // Handle recurring patterns
    if (is_recurring && recurring_pattern && recurring_until) {
      await handleRecurringBlockedTime(
        supabase,
        broker.id,
        blockedTimeData,
        recurring_pattern,
        recurring_until,
        session.user.id
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Blocked time created successfully',
      blockedTime: newBlockedTime
    })

  } catch (error) {
    console.error('Unexpected error in create blocked time:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to handle recurring blocked times
async function handleRecurringBlockedTime(
  supabase: any,
  brokerId: string,
  baseData: any,
  pattern: string,
  until: string,
  createdBy: string
) {
  const recurringBlocks = []
  const startDate = new Date(baseData.start_datetime)
  const endDate = new Date(baseData.end_datetime)
  const untilDate = new Date(until)
  const duration = endDate.getTime() - startDate.getTime()
  
  let currentDate = new Date(startDate)
  
  while (currentDate <= untilDate) {
    if (pattern === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7)
    } else if (pattern === 'monthly') {
      currentDate.setMonth(currentDate.getMonth() + 1)
    } else if (pattern === 'daily') {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    if (currentDate <= untilDate) {
      const newEndDate = new Date(currentDate.getTime() + duration)
      
      recurringBlocks.push({
        broker_id: brokerId,
        start_datetime: currentDate.toISOString(),
        end_datetime: newEndDate.toISOString(),
        reason: baseData.reason,
        block_type: baseData.block_type,
        is_recurring: false, // Prevent infinite recursion
        recurring_pattern: null,
        recurring_until: null,
        created_by: createdBy
      })
    }
  }
  
  if (recurringBlocks.length > 0) {
    await supabase
      .from('broker_blocked_times')
      .insert(recurringBlocks)
  }
} 
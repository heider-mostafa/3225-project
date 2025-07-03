import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// GET /api/broker/availability - Get broker's availability
export async function GET(request: Request) {
  try {
    const cookieStore = await cookies()
    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')
    const startDate = searchParams.get('start_date')
    const endDate = searchParams.get('end_date')
    
    // Create Supabase client with anon key for user operations
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
      .from('broker_availability')
      .select('*')
      .eq('broker_id', broker.id)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (date) {
      query = query.eq('date', date)
    } else if (startDate && endDate) {
      query = query.gte('date', startDate).lte('date', endDate)
    } else {
      // Default to next 30 days
      const today = new Date().toISOString().split('T')[0]
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      query = query.gte('date', today).lte('date', futureDate.toISOString().split('T')[0])
    }

    const { data: availability, error } = await query

    if (error) {
      console.error('Error fetching availability:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch availability' 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      availability: availability || []
    })

  } catch (error) {
    console.error('Unexpected error in get broker availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/broker/availability - Create new availability slot
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    
    const {
      date,
      start_time,
      end_time,
      max_bookings = 1,
      slot_duration_minutes = 60,
      break_between_slots = 15,
      booking_type = 'property_viewing',
      notes = '',
      recurring_pattern = 'none',
      recurring_until = null
    } = body

    // Validate required fields
    if (!date || !start_time || !end_time) {
      return NextResponse.json({
        error: 'Date, start_time, and end_time are required'
      }, { status: 400 })
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(date)) {
      return NextResponse.json({
        error: 'Invalid date format. Use YYYY-MM-DD'
      }, { status: 400 })
    }

    // Validate time format
    const timeRegex = /^\d{2}:\d{2}$/
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      return NextResponse.json({
        error: 'Invalid time format. Use HH:MM'
      }, { status: 400 })
    }

    // Check that end_time is after start_time
    if (start_time >= end_time) {
      return NextResponse.json({
        error: 'End time must be after start time'
      }, { status: 400 })
    }

    // Check that date is not in the past
    const selectedDate = new Date(date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    if (selectedDate < today) {
      return NextResponse.json({
        error: 'Cannot create availability in the past'
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

    // Check for existing availability conflicts
    const { data: conflicts, error: conflictError } = await supabase
      .from('broker_availability')
      .select('id, start_time, end_time')
      .eq('broker_id', broker.id)
      .eq('date', date)
      .or(`start_time.lt.${end_time},end_time.gt.${start_time}`)

    if (conflictError) {
      console.error('Error checking conflicts:', conflictError)
      return NextResponse.json({ 
        error: 'Failed to validate availability' 
      }, { status: 500 })
    }

    if (conflicts && conflicts.length > 0) {
      return NextResponse.json({
        error: 'Time slot conflicts with existing availability',
        conflicts: conflicts
      }, { status: 409 })
    }

    // Create availability record
    const availabilityData = {
      broker_id: broker.id,
      date,
      start_time,
      end_time,
      max_bookings,
      current_bookings: 0,
      slot_duration_minutes,
      break_between_slots,
      booking_type,
      notes,
      recurring_pattern,
      recurring_until,
      is_available: true
    }

    const { data: newAvailability, error: insertError } = await supabase
      .from('broker_availability')
      .insert(availabilityData)
      .select()
      .single()

    if (insertError) {
      console.error('Error creating availability:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create availability: ' + insertError.message 
      }, { status: 500 })
    }

    // Handle recurring patterns
    if (recurring_pattern !== 'none' && recurring_until) {
      await handleRecurringAvailability(
        supabase,
        broker.id,
        availabilityData,
        recurring_pattern,
        recurring_until
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Availability created successfully',
      availability: newAvailability
    })

  } catch (error) {
    console.error('Unexpected error in create availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Helper function to handle recurring availability
async function handleRecurringAvailability(
  supabase: any,
  brokerId: string,
  baseData: any,
  pattern: string,
  until: string
) {
  const recurringSlots = []
  const startDate = new Date(baseData.date)
  const endDate = new Date(until)
  
  let currentDate = new Date(startDate)
  
  while (currentDate <= endDate) {
    if (pattern === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7)
    } else if (pattern === 'daily') {
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    if (currentDate <= endDate) {
      recurringSlots.push({
        ...baseData,
        date: currentDate.toISOString().split('T')[0],
        recurring_pattern: 'none' // Prevent infinite recursion
      })
    }
  }
  
  if (recurringSlots.length > 0) {
    await supabase
      .from('broker_availability')
      .insert(recurringSlots)
  }
} 
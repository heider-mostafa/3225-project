import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

import { createServerSupabaseClient } from '@/lib/supabase/server'
// POST /api/admin/broker-availability - Create availability slots for any broker (admin only)
export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
    const body = await request.json()
    
    const {
      broker_id,
      date,
      start_time,
      end_time,
      max_bookings = 4,
      slot_duration_minutes = 60,
      booking_type = 'property_viewing',
      notes = ''
    } = body

    // Validate required fields
    if (!broker_id || !date || !start_time || !end_time) {
      return NextResponse.json({
        error: 'broker_id, date, start_time, and end_time are required'
      }, { status: 400 })
    }

    // Use service role for admin operations
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Verify broker exists
    const { data: broker, error: brokerError } = await supabase
      .from('brokers')
      .select('id, full_name')
      .eq('id', broker_id)
      .eq('is_active', true)
      .single()

    if (brokerError || !broker) {
      return NextResponse.json({ 
        error: 'Broker not found' 
      }, { status: 404 })
    }

    // Create availability slot
    const { data: availability, error } = await supabase
      .from('broker_availability')
      .insert({
        broker_id,
        date,
        start_time,
        end_time,
        max_bookings,
        current_bookings: 0,
        slot_duration_minutes,
        booking_type,
        notes,
        is_available: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating availability:', error)
      return NextResponse.json({ 
        error: 'Failed to create availability: ' + error.message 
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Availability created for ${broker.full_name}`,
      availability
    })

  } catch (error) {
    console.error('Unexpected error in create broker availability:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
} 